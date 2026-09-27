"""
fhir_models.py
-------------------------------------------------------------------------
Pydantic models for the subset of HL7 FHIR R4 resources ChronoVerity
produces, per the README's "Clinical Systems Integration" section:

  - Specimen             (container ID -> Specimen.identifier)
  - Specimen.condition   (PQI score + SNOMED CT acceptability code)
  - Observation           (min/max temp, transport duration, max G-force)

These are intentionally a practical subset of the full FHIR R4 Specimen
and Observation resource shapes — enough to round-trip through Epic
Beaker / Cerner Millennium's Specimen ingestion APIs — not a complete
FHIR resource server implementation.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class SnomedSpecimenCondition(str, Enum):
    ACCEPTABLE = "SNOMED:434711009"          # "Specimen acceptable"
    DEGRADED_THERMAL = "SNOMED:LOCAL-DEGT"   # local code: degraded by thermal exposure
    DEGRADED_MECHANICAL = "SNOMED:LOCAL-DEGM"  # local code: degraded by mechanical shock
    DEGRADED_CHEMICAL = "SNOMED:LOCAL-DEGC"  # local code: degraded by VOC/off-gassing


class CodeableConcept(BaseModel):
    system: str = "http://snomed.info/sct"
    code: str
    display: str


class Identifier(BaseModel):
    system: str = "urn:chronoverity:carrier-serial"
    value: str


class SpecimenCondition(BaseModel):
    coding: List[CodeableConcept]
    pqi_score: float = Field(ge=0.0, le=1.0)


class Specimen(BaseModel):
    resourceType: str = "Specimen"
    identifier: List[Identifier]
    accessionIdentifier: Optional[Identifier] = None
    type: Optional[CodeableConcept] = None
    receivedTime: datetime
    condition: List[SpecimenCondition]


class ObservationValueQuantity(BaseModel):
    value: float
    unit: str
    system: str = "http://unitsofmeasure.org"
    code: str


class Observation(BaseModel):
    resourceType: str = "Observation"
    status: str = "final"
    code: CodeableConcept
    subject_specimen_identifier: str
    effectiveDateTime: datetime
    valueQuantity: ObservationValueQuantity


class DiagnosticReportFlag(BaseModel):
    resourceType: str = "DiagnosticReport"
    status: str = "preliminary"
    conclusionCode: List[CodeableConcept]
    conclusion: str


class FhirBundle(BaseModel):
    resourceType: str = "Bundle"
    type: str = "collection"
    entry: List[dict]
