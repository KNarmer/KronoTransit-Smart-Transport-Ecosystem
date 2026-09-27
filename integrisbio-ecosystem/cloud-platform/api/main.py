"""
main.py — IntegrisBio Cloud API
-------------------------------------------------------------------------
Backend for cloud-platform/web-dashboard/. Provides:

  - REST endpoints for fleet status and carrier history (backed today by
    an in-memory store; swap for a real database — e.g. TimescaleDB for
    the time-series telemetry — before production use).
  - A WebSocket stream for the live carrier-position/PQI feed described
    in the README's "Real-Time Global Telemetry & Web Tracking Portal"
    section.
  - Role-based access control (RBAC) scaffolding distinguishing courier
    vs. pathologist views, per HIPAA/GDPR requirements.

Run:
    uvicorn main:app --reload --port 8080
"""

import asyncio
import logging
import random
import time
from typing import Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IntegrisBio.cloud-api")

app = FastAPI(title="IntegrisBio Cloud API", version="0.1.0")


class CarrierStatus(BaseModel):
    carrier_id: str
    latitude: float
    longitude: float
    battery_pct: float
    running_pqi: float
    status: str  # VIABLE | WARNING | BREACHED


# In-memory fleet state — replace with a real datastore for production.
_fleet_state: Dict[str, CarrierStatus] = {}


class Role:
    COURIER = "courier"
    PATHOLOGIST = "pathologist"


def _redact_for_role(status: CarrierStatus, role: str) -> dict:
    """RBAC per the README: couriers see physical routing and urgent
    mechanical warnings; pathologists see the full molecular/PQI
    picture and patient-linked accession context. This mock keeps the
    redaction rule simple and centralized here rather than scattered
    across endpoints."""
    payload = status.model_dump()
    if role == Role.COURIER:
        payload.pop("running_pqi", None)
        payload["status"] = "ATTENTION_NEEDED" if status.status != "VIABLE" else "OK"
    return payload


@app.get("/health")
def health():
    return {"status": "ok", "service": "IntegrisBio-cloud-api"}


@app.get("/fleet/{role}")
def get_fleet(role: str) -> List[dict]:
    return [_redact_for_role(s, role) for s in _fleet_state.values()]


@app.get("/carrier/{carrier_id}")
def get_carrier(carrier_id: str) -> dict | None:
    status = _fleet_state.get(carrier_id)
    return status.model_dump() if status else None


@app.websocket("/ws/fleet/{role}")
async def fleet_stream(websocket: WebSocket, role: str):
    """Streams downsampled fleet telemetry every ~10s, matching the
    README's LTE-M/NB-IoT backhaul cadence for high-priority specimens."""
    await websocket.accept()
    logger.info("WebSocket client connected as role=%s", role)

    try:
        while True:
            _simulate_fleet_tick()  # replace with a real ingestion feed
            payload = [_redact_for_role(s, role) for s in _fleet_state.values()]
            await websocket.send_json({"timestamp": time.time(), "fleet": payload})
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected (role=%s)", role)


def _simulate_fleet_tick():
    """Dev-mode fleet simulator so the dashboard is demoable without live
    hardware — mirrors the shape of real carrier uplink data."""
    if not _fleet_state:
        seed_carriers = ["carrier-001", "carrier-002", "carrier-003"]
        for cid in seed_carriers:
            _fleet_state[cid] = CarrierStatus(
                carrier_id=cid,
                latitude=29.76 + random.uniform(-0.02, 0.02),   # Houston-area seed coordinates
                longitude=-95.36 + random.uniform(-0.02, 0.02),
                battery_pct=random.uniform(40, 100),
                running_pqi=random.uniform(0.75, 1.0),
                status="VIABLE",
            )
        return

    for status in _fleet_state.values():
        status.latitude += random.uniform(-0.001, 0.001)
        status.longitude += random.uniform(-0.001, 0.001)
        status.battery_pct = max(0.0, status.battery_pct - random.uniform(0, 0.5))
        status.running_pqi = max(0.0, min(1.0, status.running_pqi + random.uniform(-0.03, 0.01)))
        status.status = (
            "VIABLE" if status.running_pqi >= 0.85
            else "WARNING" if status.running_pqi >= 0.70
            else "BREACHED"
        )
