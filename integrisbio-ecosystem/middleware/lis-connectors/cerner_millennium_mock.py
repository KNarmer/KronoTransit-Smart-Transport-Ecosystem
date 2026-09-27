"""
cerner_millennium_mock.py
-------------------------------------------------------------------------
Standalone mock of a Cerner Millennium FHIR Bundle webhook, mirroring
epic_beaker_mock.py's role for the second target LIS named in the
README. NOT a real Cerner integration — Cerner's actual ingestion path
runs through Millennium's FHIR R4 API with SMART-on-FHIR / OAuth2 client
credentials, provisioned per health-system deployment.

Run:
    uvicorn cerner_millennium_mock:app --port 9001
"""

import logging

from fastapi import FastAPI, Request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mock.cerner-millennium")

app = FastAPI(title="Mock Cerner Millennium LIS Endpoint")

received_bundles = []


@app.post("/fhir/Bundle")
async def receive_bundle(request: Request):
    bundle = await request.json()
    received_bundles.append(bundle)

    flagged = [
        e for e in bundle.get("entry", [])
        if e["resource"].get("resourceType") == "DiagnosticReport"
    ]
    if flagged:
        logger.warning(
            "Mock Cerner Millennium received a bundle with %d pre-analytical flag(s).",
            len(flagged),
        )
    else:
        logger.info("Mock Cerner Millennium received a clean bundle (no degradation flags).")

    return {"status": "accepted", "resourceCount": len(bundle.get("entry", []))}


@app.get("/fhir/Bundle/_history")
def history():
    return {"count": len(received_bundles), "bundles": received_bundles}
