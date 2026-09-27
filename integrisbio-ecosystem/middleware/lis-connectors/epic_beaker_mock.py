"""
epic_beaker_mock.py
-------------------------------------------------------------------------
Standalone mock of an Epic Beaker FHIR Bundle webhook, for exercising
middleware/fhir-service/main.py's _forward_to_lis() locally without
hospital IT infrastructure. NOT a real Epic Beaker integration — Epic's
actual FHIR endpoint, auth scheme (typically OAuth2 + mTLS via Epic's
App Orchard/Interconnect), and validation rules differ per hospital
deployment and require Epic's own onboarding process.

Run:
    uvicorn epic_beaker_mock:app --port 9000
Then point the FHIR service at it:
    CV_LIS_WEBHOOK_URL=http://localhost:9000/fhir/Bundle uvicorn main:app --port 8000
"""

import logging

from fastapi import FastAPI, Request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mock.epic-beaker")

app = FastAPI(title="Mock Epic Beaker LIS Endpoint")

received_bundles = []  # in-memory store, for test assertions only


@app.post("/fhir/Bundle")
async def receive_bundle(request: Request):
    bundle = await request.json()
    received_bundles.append(bundle)

    specimen_entries = [
        e for e in bundle.get("entry", []) if e["resource"].get("resourceType") == "Specimen"
    ]
    logger.info(
        "Mock Epic Beaker received bundle with %d entries (%d Specimen resource(s)).",
        len(bundle.get("entry", [])),
        len(specimen_entries),
    )

    return {"status": "accepted", "resourceCount": len(bundle.get("entry", []))}


@app.get("/fhir/Bundle/_history")
def history():
    """Test helper: inspect everything this mock has received so far."""
    return {"count": len(received_bundles), "bundles": received_bundles}
