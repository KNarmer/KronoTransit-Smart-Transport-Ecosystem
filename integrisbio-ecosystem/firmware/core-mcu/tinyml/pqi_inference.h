/*
 * pqi_inference.h — TensorFlow Lite for Microcontrollers wrapper
 * -----------------------------------------------------------------------
 * Loads pqi_model_int8.tflite (produced by edge-ai/quantization/) and
 * runs it against a 60-second rolling feature window to produce the
 * real-time Pre-Analytical Quality Index. This replaces the hand-tuned
 * scoring used in firmware/mvp-arduino/sensor_processing.cpp once a
 * trained model is available.
 * -----------------------------------------------------------------------
 */

#ifndef CV_PQI_INFERENCE_H
#define CV_PQI_INFERENCE_H

#include <stdint.h>
#include <stdbool.h>

/* Must match edge-ai/training/train_pqi_model.py's FEATURE_NAMES order. */
typedef struct {
    float thermal_integral;      /* ∫ΔT(t)dt over the window, degree-seconds */
    float shock_peak_g;          /* max |a| observed in the window */
    float shock_event_count;     /* number of >2G threshold crossings in the window */
    float voc_slope;             /* d[gas_resistance]/dt, ohms/sec */
    float spectral_delta;        /* Euclidean distance from AS7341 baseline */
    float core_ambient_diff;     /* MAX31865 core-vs-ambient temperature differential */
} pqi_feature_vector_t;

typedef enum {
    PQI_STATUS_VIABLE = 0,
    PQI_STATUS_WARNING = 1,
    PQI_STATUS_BREACHED = 2
} pqi_status_t;

typedef struct {
    float pqi_score;         /* 0.0 - 1.0 */
    pqi_status_t status;
    uint32_t inference_time_us;
} pqi_inference_result_t;

/*
 * Allocates the TFLite Micro interpreter and its tensor arena
 * (recommended arena size: 24-32 KB for this model's topology — see
 * edge-ai/training/train_pqi_model.py's model summary for exact tensor
 * sizes after quantization).
 */
int pqi_inference_init(void);

int pqi_inference_run(const pqi_feature_vector_t *features, pqi_inference_result_t *out_result);

void pqi_inference_deinit(void);

#endif /* CV_PQI_INFERENCE_H */
