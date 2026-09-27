/*
 * telemetry.h — Assembles a telemetry_frame_t from live driver readings
 * -----------------------------------------------------------------------
 * Thin glue layer between drivers/* and flash_ringbuffer.h so main.c's
 * sensor loop stays readable. Also builds the pqi_feature_vector_t
 * consumed by tinyml/pqi_inference.h.
 * -----------------------------------------------------------------------
 */

#ifndef CV_TELEMETRY_H
#define CV_TELEMETRY_H

#include "flash_ringbuffer.h"
#include "../tinyml/pqi_inference.h"
#include "../drivers/bme688_driver.h"
#include "../drivers/as7341_driver.h"
#include "../drivers/lsm6dsox_driver.h"
#include "../drivers/max31865_rtd.h"

typedef struct {
    bme688_reading_t     voc;
    as7341_reading_t     optical;
    lsm6dsox_sample_t     imu;
    max31865_reading_t   rtd_core;
    max31865_reading_t   rtd_ambient;
} cv_raw_sensor_snapshot_t;

/*
 * Builds the 60-second rolling feature vector expected by the TinyML
 * model from a snapshot plus the session's running accumulators
 * (thermal integral, shock accumulator) — mirrors the feature set
 * defined in edge-ai/training/train_pqi_model.py's FEATURE_NAMES.
 */
void telemetry_build_feature_vector(const cv_raw_sensor_snapshot_t *snapshot,
                                     float thermal_integral_accum,
                                     float shock_event_count_accum,
                                     const as7341_baseline_t *optical_baseline,
                                     pqi_feature_vector_t *out_features);

/* Packs a snapshot + PQI result into a fixed-size frame ready for
 * flash_ringbuffer_append(). */
void telemetry_build_frame(const cv_raw_sensor_snapshot_t *snapshot,
                           const pqi_inference_result_t *pqi_result,
                           uint32_t timestamp_ms,
                           telemetry_frame_t *out_frame);

#endif /* CV_TELEMETRY_H */
