# docs/compliance_roadmap.md

## CAP / CLIA Compliance Roadmap

This document tracks the regulatory and quality-system work needed to move IntegrisBio from a
Conrad Challenge prototype to a clinically deployable device. It is a planning artifact, not a
compliance claim — none of the items below are complete, and nothing in this repository has been
validated, verified, or cleared for clinical use.

### 1. Regulatory Pathway

- [ ] Determine FDA device classification (likely Class I or II, as an accessory to specimen
      collection/transport rather than a diagnostic device itself — pending a formal
      classification request).
- [ ] Evaluate whether a 510(k) premarket notification is required, or whether the device
      qualifies for General Wellness / accessory exemptions.
- [ ] Engage a regulatory consultant before any clinical pilot, even at a single friendly site.

### 2. CLIA / CAP Laboratory Standards

- [ ] Map the PQI acceptability thresholds (0.70 / 0.85) against CAP's pre-analytical
      specimen-integrity checklist items (e.g., GEN.40, GEN.41 series) so the device's automated
      triage is defensible in a CAP inspection.
- [ ] Validate that automated FHIR `DiagnosticReport` flags do not bypass any required manual
      technologist sign-off step in the receiving lab's SOPs — the device should augment, not
      replace, existing accessioning review.
- [ ] Establish a documented calibration and preventive-maintenance schedule for the RTD, VOC, and
      optical sensors (ties into the DaaS "automated bi-annual recalibration" commitment in the
      README's business model section).

### 3. Data Privacy & Security

- [ ] HIPAA risk assessment for the cloud telemetry path (`cloud-platform/`), specifically the
      WebSocket fleet stream and any patient-linked accession IDs visible to the pathologist role.
- [ ] Confirm the RBAC redaction implemented in `cloud-platform/api/main.py` (`_redact_for_role`)
      meets minimum-necessary-use requirements before any real patient data flows through it.
- [ ] mTLS certificate management plan for the LIS webhook integrations
      (`middleware/fhir-service/main.py`'s `_forward_to_lis`), including rotation policy.
- [ ] Formal review of the flash ring-buffer's hash-chain design
      (`firmware/core-mcu/src/flash_ringbuffer.c`) against the hospital's chain-of-custody
      requirements — replace the placeholder XOR-based digest with a real SHA-256 implementation
      (e.g., mbedTLS) before any pilot.

### 4. Biocompatibility & Materials

- [ ] Biocompatibility testing (ISO 10993) for any cartridge material in direct contact with
      tissue or liquid specimens.
- [ ] Confirm the colorimetric dry-chemistry swatch does not interact with or contaminate the
      specimen in a way that affects downstream assay results.

### 5. Verification & Validation (V&V)

- [ ] Sensor accuracy validation against reference instruments (calibrated thermocouples for the
      RTDs, a certified colorimeter for the AS7341 spectral readings).
- [ ] TinyML model validation: the PQI classifier currently trains only on synthetic data
      (`edge-ai/datasets/generate_synthetic_dataset.py`) and must be retrained and revalidated
      against real sensor data collected from controlled degradation experiments before any
      clinical claim is made about its accuracy.
- [ ] Shock/drop testing against real pneumatic tube system profiles, not just the Conrad
      Challenge stress-test demo.

### 6. Status

This roadmap reflects the Phase II / Phase III engineering vision referenced in the top-level
README and is intended for internal planning and judge Q&A during the Conrad Challenge Innovation
Summit. It should be revisited and expanded substantially before any real specimen handling.
