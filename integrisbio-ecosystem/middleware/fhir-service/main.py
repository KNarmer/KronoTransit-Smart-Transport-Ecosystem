"""
main.py — IntegrisBio FHIR R4 Transformation Service
-------------------------------------------------------------------------
Receives verified telemetry batches from middleware/dock-daemon/, builds
a FHIR Bundle (Specimen, Observation, DiagnosticReport flag) via
transform.py, and forwards it to the hospital's LIS/EHR endpoint
(Epic Beaker or Cerner Millennium) over mTLS.

Run locally:
    uvicorn main:app --reload --port 8000
"""

import logging
import os
from typing import List

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from transform import build_bundle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IntegrisBio.fhir-service")

app = FastAPI(
    title="IntegrisBio FHIR Transformation Service",
    description="Converts verified ChronoCase telemetry batches into HL7 FHIR R4 bundles for LIS ingestion.",
    version="0.1.0",
)

LIS_WEBHOOK_URL = os.environ.get("CV_LIS_WEBHOOK_URL", "http://localhost:9000/fhir/Bundle")
LIS_CLIENT_CERT = os.environ.get("CV_LIS_CLIENT_CERT")  # path to mTLS client cert, if configured


class TelemetryFrame(BaseModel):
    timestampMs: int
    tempCoreC: float
    tempAmbientC: float
    vocGasResistanceOhm: float
    opticalChannels: List[int]
    peakGForce: float
    runningPqi: float
    prevBlockHash: str


class IngestRequest(BaseModel):
    carrierId: str
    frames: List[TelemetryFrame]


@app.get("/health")
def health():
    return {"status": "ok", "service": "IntegrisBio-fhir-service"}


@app.post("/ingest")
async def ingest(request: IngestRequest):
    if not request.frames:
        raise HTTPException(status_code=400, detail="Batch contained no frames.")

    frame_dicts = [f.model_dump() for f in request.frames]
    bundle = build_bundle(request.carrierId, frame_dicts)

    logger.info(
        "Built FHIR bundle for carrier %s: %d entries, min PQI %.3f",
        request.carrierId,
        len(bundle.entry),
        min(f["runningPqi"] for f in frame_dicts),
    )

    await _forward_to_lis(bundle)

    return {
        "carrierId": request.carrierId,
        "framesProcessed": len(frame_dicts),
        "bundle": bundle.model_dump(),
    }


async def _forward_to_lis(bundle) -> None:
    """POSTs the FHIR bundle to the hospital LIS webhook (Epic Beaker /
    Cerner Millennium). Uses mTLS client cert auth when configured; falls
    back to a no-op log in local/dev environments where no LIS endpoint
    is reachable, so the service remains runnable without hospital
    infrastructure attached (see middleware/lis-connectors/ for the mock
    receivers used in integration tests)."""
    if not LIS_CLIENT_CERT:
        logger.info("CV_LIS_CLIENT_CERT not set — skipping live LIS forward (dev mode).")
        return

    try:
        async with httpx.AsyncClient(cert=LIS_CLIENT_CERT, timeout=10.0) as client:
            response = await client.post(LIS_WEBHOOK_URL, json=bundle.model_dump())
            response.raise_for_status()
            logger.info("LIS accepted bundle: %s", response.status_code)
    except httpx.HTTPError as exc:
        logger.error("Failed to forward bundle to LIS at %s: %s", LIS_WEBHOOK_URL, exc)
        # Intentionally not re-raised as a 5xx to the dock daemon — the
        # bundle is still returned to the caller so the batch isn't
        # endlessly retried by the dock; a production version would push
        # failed bundles to a retry queue instead.
