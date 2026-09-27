/*
 * lab_profile.h — Per-specimen lab-defined acceptability envelope
 * -----------------------------------------------------------------------
 * Motivation: a hospital lab wants different transport conditions for
 * different specimen types — a tumor resection destined for frozen
 * section wants a cold, low-vibration ride, while a fresh unfixed
 * biopsy for research wants near-body-temperature holding. Rather than
 * hardcoding one universal thermal/shock envelope (as the MVP firmware
 * and the first-pass PQI weights do), the carrier now reads a
 * LabProfile at the start of a transit leg and both (a) scores the PQI
 * against that profile's thresholds, and (b) drives the active
 * correction systems (tec_driver.h, stiffness_actuator_driver.h) toward
 * that profile's target band.
 *
 * How a profile gets selected: the Verity cartridge's passive RFID/NFC
 * tag (see README's cartridge design) encodes a specimen_type_code,
 * written during hospital accessioning. On cartridge insertion, the
 * carrier looks up the matching built-in profile
 * (lab_profile_get_default()) as a safe, always-available fallback. If
 * the dock's most recent sync included a lab-specific override
 * (lab_profile_apply_override()) — e.g. a receiving lab that wants
 * tighter tolerances than the generic default for a particular assay
 * — that override takes precedence for subsequent transits until
 * cleared.
 *
 * IMPORTANT: the numeric ranges in DEFAULT_PROFILES below are
 * illustrative placeholders for the Conrad Challenge prototype and
 * pitch narrative, not clinically validated targets. Before any real
 * specimen handling, these must come from the receiving lab's own SOPs
 * (see docs/compliance_roadmap.md, CLIA/CAP section) — this file
 * should not be treated as a source of clinical truth.
 * -----------------------------------------------------------------------
 */

#ifndef CV_LAB_PROFILE_H
#define CV_LAB_PROFILE_H

#include <stdint.h>
#include <stdbool.h>

typedef enum {
    SPECIMEN_TYPE_TUMOR_RESECTION = 0,  /* frozen-section-bound solid tissue */
    SPECIMEN_TYPE_UNFIXED_BIOPSY,       /* fresh tissue, no fixative yet applied */
    SPECIMEN_TYPE_FORMALIN_FIXED,       /* routine histology, formalin cassette */
    SPECIMEN_TYPE_BLOOD_DRAW,           /* liquid biopsy / routine blood chemistry */
    SPECIMEN_TYPE_URINE_SALIVA,         /* liquid, less shock/temperature sensitive */
    SPECIMEN_TYPE_CUSTOM,               /* profile supplied entirely by override */
    SPECIMEN_TYPE_COUNT
} specimen_type_t;

typedef struct {
    specimen_type_t specimen_type;
    const char *label;

    /* Thermal target band the active TEC correction system drives toward
     * (tec_driver.h reads target_temp_min_c/max_c directly). */
    float target_temp_min_c;
    float target_temp_max_c;

    /* Mechanical/chemical acceptability limits, feeding both the PQI
     * scoring (tinyml/pqi_inference.h) and the stiffness actuator's
     * "how rough is too rough" threshold (stiffness_actuator_driver.h). */
    float max_shock_g;
    float max_voc_slope_abs_ohm_per_s;

    /* PQI classification thresholds — a research-use sample bound for
     * incineration and a irreplaceable oncology resection may warrant
     * different WARNING/BREACHED cutoffs even given identical raw sensor
     * readings. */
    float pqi_warning_threshold;
    float pqi_breach_threshold;

    bool is_override;  /* true if this came from lab_profile_apply_override() */
} lab_profile_t;

/* Built-in, always-available defaults — used whenever no dock-delivered
 * override is active for the given specimen_type. See the file-level
 * comment above re: these being placeholders, not clinical targets. */
lab_profile_t lab_profile_get_default(specimen_type_t specimen_type);

/*
 * Called by the RFID reader integration (not shown in this portable
 * source set — mirrors the pattern of drivers/as7341_driver.h's I2C
 * shim) once the Verity cartridge's tag has been decoded into a
 * specimen_type_t.
 */
lab_profile_t lab_profile_select_for_cartridge(specimen_type_t specimen_type);

/*
 * Applied when the dock daemon's most recent sync delivered a
 * lab-specific override (see middleware/dock-daemon/ — the override
 * would arrive as part of the same handshake that pulls telemetry,
 * carried back down to the carrier rather than only uploaded from it).
 * Overrides persist across transits for the given specimen_type until
 * lab_profile_clear_override() is called or the carrier is
 * factory-reset, so a lab's tightened tolerances stick without needing
 * to be re-sent every trip.
 */
void lab_profile_apply_override(const lab_profile_t *override_profile);
void lab_profile_clear_override(specimen_type_t specimen_type);

const char *specimen_type_to_string(specimen_type_t specimen_type);

#endif /* CV_LAB_PROFILE_H */