#include "telemetry.h"
#include <string.h>

void telemetry_build_feature_vector(const cv_raw_sensor_snapshot_t *snapshot,
                                     float thermal_integral_accum,
                                     float shock_event_count_accum,
                                     const as7341_baseline_t *optical_baseline,
                                     pqi_feature_vector_t *out_features) {
    if (!snapshot || !out_features) return;

    out_features->thermal_integral = thermal_integral_accum;
    out_features->shock_peak_g = lsm6dsox_accel_magnitude(&snapshot->imu);
    out_features->shock_event_count = shock_event_count_accum;

    /* A single-sample VOC slope is meaningless; main.c's sampling loop is
     * expected to maintain a short rolling window of bme688_reading_t
     * and pass bme688_compute_voc_slope()'s result in here instead. This
     * placeholder keeps the struct populated for a first cold-start
     * sample where no window yet exists. */
    out_features->voc_slope = 0.0f;

    out_features->spectral_delta = as7341_spectral_delta(optical_baseline, &snapshot->optical);
    out_features->core_ambient_diff =
        max31865_core_ambient_differential(&snapshot->rtd_core, &snapshot->rtd_ambient);
}

void telemetry_build_frame(const cv_raw_sensor_snapshot_t *snapshot,
                           const pqi_inference_result_t *pqi_result,
                           uint32_t timestamp_ms,
                           telemetry_frame_t *out_frame) {
    if (!snapshot || !pqi_result || !out_frame) return;

    memset(out_frame, 0, sizeof(*out_frame));
    out_frame->timestamp_ms = timestamp_ms;
    out_frame->temp_core_c = snapshot->rtd_core.temperature_c;
    out_frame->temp_ambient_c = snapshot->rtd_ambient.temperature_c;
    out_frame->voc_gas_resistance_ohm = snapshot->voc.gas_resistance_ohm;

    for (int i = 0; i < 10; i++) {
        out_frame->optical_channels[i] = snapshot->optical.channel[i];
    }

    out_frame->peak_g_force = lsm6dsox_accel_magnitude(&snapshot->imu);
    out_frame->running_pqi = pqi_result->pqi_score;
    /* prev_block_hash is populated by flash_ringbuffer_append() itself. */
}
