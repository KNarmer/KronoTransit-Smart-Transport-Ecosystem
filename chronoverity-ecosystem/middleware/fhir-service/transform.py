"""
transform.py
-------------------------------------------------------------------------
Transforms a batch of raw ChronoCase telemetry frames (as forwarded by
middleware/dock-daemon/) into the FHIR resources defined in
fhir_models.py, implementing the PQI-based triage rule described in the
README: samples with PQI < 0.70 are automatically flagged via a
DiagnosticReport conclusion code before any assay is run.

This module has no FastAPI/HTTP dependency so it can be unit tested in
isolation and reused by a future batch/offline reprocessing job.
"""

from datetime import datetime, timezone
from statistics import mean
from typing import List

from fhir_models import (
    CodeableConcept,
    DiagnosticReportFlag,
    FhirBundle,
    Identifier,
    Observation,
    ObservationValueQuantity,
    Specimen,
    SpecimenCondition,
    SnomedSpecimenCondition,
)

PQI_BREACH_THRESHOLD = 0.70
PQI_WARNING_THRESHOLD = 0.85


def _classify_condition(min_pqi: float, dominant_cause: str) -> SpecimenCondition:
    if min_pqi >= PQI_WARNING_THRESHOLD:
        code = SnomedSpecimenCondition.ACCEPTABLE
        display = "Specimen acceptable"
    elif dominant_cause == "thermal":
        code = SnomedSpecimenCondition.DEGRADED_THERMAL
        display = "Specimen degraded by thermal exposure"
    elif dominant_cause == "mechanical":
        code = SnomedSpecimenCondition.DEGRADED_MECHANICAL
        display = "Specimen degraded by mechanical shock"
    else:
        code = SnomedSpecimenCondition.DEGRADED_CHEMICAL
        display = "Specimen degraded by chemical/VOC exposure"

    return SpecimenCondition(
        coding=[CodeableConcept(code=code.value, display=display)],
        pqi_score=min_pqi,
    )


def _dominant_degradation_cause(frames: List[dict]) -> str:
    """Heuristic: whichever channel deviated furthest from a benign
    baseline across the batch is reported as the dominant cause, so a
    pathologist sees one actionable reason rather than a raw score."""
    max_temp_delta = max((f["tempCoreC"] - f["tempAmbientC"]) for f in frames)
    max_g = max(f["peakGForce"] for f in frames)
    min_voc = min(f["vocGasResistanceOhm"] for f in frames)

    # Normalize roughly to comparable severity units before comparing.
    thermal_severity = max(0.0, max_temp_delta - 2.0) / 5.0
    mechanical_severity = max(0.0, max_g - 2.0) / 10.0
    chemical_severity = max(0.0, (50000 - min_voc)) / 40000.0

    severities = {
        "thermal": thermal_severity,
        "mechanical": mechanical_severity,
        "chemical": chemical_severity,
    }
    return max(severities, key=severities.get)


def build_specimen_resource(carrier_id: str, frames: List[dict]) -> Specimen:
    pqi_values = [f["runningPqi"] for f in frames]
    min_pqi = min(pqi_values)
    dominant_cause = _dominant_degradation_cause(frames)

    return Specimen(
        identifier=[Identifier(value=carrier_id)],
        receivedTime=datetime.now(timezone.utc),
        condition=[_classify_condition(min_pqi, dominant_cause)],
    )


def build_observations(carrier_id: str, frames: List[dict]) -> List[Observation]:
    now = datetime.now(timezone.utc)
    core_temps = [f["tempCoreC"] for f in frames]
    g_forces = [f["peakGForce"] for f in frames]
    timestamps = [f["timestampMs"] for f in frames]
    duration_s = (max(timestamps) - min(timestamps)) / 1000.0 if len(timestamps) > 1 else 0.0

    def obs(code, display, value, unit, ucum_code):
        return Observation(
            code=CodeableConcept(code=code, display=display),
            subject_specimen_identifier=carrier_id,
            effectiveDateTime=now,
            valueQuantity=ObservationValueQuantity(value=value, unit=unit, code=ucum_code),
        )

    return [
        obs("LOCAL-TMIN", "Minimum transit temperature", min(core_temps), "Cel", "Cel"),
        obs("LOCAL-TMAX", "Maximum transit temperature", max(core_temps), "Cel", "Cel"),
        obs("LOCAL-TMEAN", "Mean transit temperature", round(mean(core_temps), 2), "Cel", "Cel"),
        obs("LOCAL-DUR", "Total transport duration", round(duration_s, 1), "s", "s"),
        obs("LOCAL-GMAX", "Maximum G-force", max(g_forces), "g", "[g]"),
        obs("LOCAL-PQI", "Final Pre-Analytical Quality Index", frames[-1]["runningPqi"], "score", "1"),
    ]


def build_diagnostic_report_flag(carrier_id: str, min_pqi: float) -> DiagnosticReportFlag | None:
    """Per the README: PQI < 0.70 auto-triages the sample for pathologist
    review before any assay runs. Returns None when no flag is warranted."""
    if min_pqi >= PQI_BREACH_THRESHOLD:
        return None

    return DiagnosticReportFlag(
        conclusionCode=[CodeableConcept(
            code="LOCAL-PREANALYTICAL-FLAG",
            display="Pre-analytical integrity check failed prior to assay",
        )],
        conclusion=(
            f"Specimen (carrier {carrier_id}) recorded a minimum PQI of "
            f"{min_pqi:.2f}, below the {PQI_BREACH_THRESHOLD} acceptability "
            f"threshold. Recommend pathologist review before proceeding."
        ),
    )


def build_bundle(carrier_id: str, frames: List[dict]) -> FhirBundle:
    specimen = build_specimen_resource(carrier_id, frames)
    observations = build_observations(carrier_id, frames)
    min_pqi = min(f["runningPqi"] for f in frames)
    flag = build_diagnostic_report_flag(carrier_id, min_pqi)

    entries = [{"resource": specimen.model_dump()}]
    entries += [{"resource": o.model_dump()} for o in observations]
    if flag:
        entries.append({"resource": flag.model_dump()})

    return FhirBundle(entry=entries)
