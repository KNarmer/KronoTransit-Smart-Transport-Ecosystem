/*
 * sensor_processing.h
 * -----------------------------------------------------------------------
 * Lightweight, dependency-free implementation of the Pre-Analytical
 * Quality Index (PQI) suitable for a Cortex-M4F running on an Arduino
 * Nano 33 BLE Sense. This mirrors the structure of the production
 * TinyML model (firmware/core-mcu/tinyml/) but uses hand-tuned weights
 * and simple running statistics instead of a trained INT8 network, so
 * the Conrad Challenge demo does not depend on having training data
 * before the video is filmed.
 *
 * PQI(t) = 1.0 - ( w1*thermalIntegral + w2*shockSum + w3*vocSlope(unused on MVP)
 *                  + w4*colorDelta )
 *
 * The MVP omits VOC sensing (no MOX gas sensor on the BOM) — w3 is kept
 * at zero here and is reintroduced in the production firmware once the
 * BME688 is integrated.
 * -----------------------------------------------------------------------
 */

#ifndef CHRONOVERITY_SENSOR_PROCESSING_H
#define CHRONOVERITY_SENSOR_PROCESSING_H

#include <Arduino.h>

namespace ChronoVerity {

enum class Status : uint8_t { VIABLE, WARNING, BREACHED };

struct SensorFrame {
  uint32_t timestampMs;
  float temperatureC;
  float accelMagnitudeG;   // magnitude of the 3-axis accel vector, in g
  uint16_t colorR, colorG, colorB, colorClear;
};

struct SessionState {
  bool baselineCaptured = false;
  float baselineTempC = 0.0f;
  float baselineColorR = 0.0f, baselineColorG = 0.0f, baselineColorB = 0.0f;
  float thermalIntegral = 0.0f;   // running ∫ΔT dt, degree-seconds above envelope
  float shockAccumulator = 0.0f;  // running ΣG_impact for events above threshold
  uint32_t lastUpdateMs = 0;
  bool incidentLogged = false;
};

struct ScoreResult {
  float pqi;
  float colorDelta;
  Status status;
};

// Weights tuned for demo sensitivity, not clinically validated.
constexpr float W_THERMAL = 0.015f;   // per degree-second above envelope
constexpr float W_SHOCK   = 0.08f;    // per g-unit above the 2.0G quiet-baseline
constexpr float W_COLOR   = 0.004f;   // per unit of Euclidean RGB drift

constexpr float TEMP_ENVELOPE_C = 4.0f;     // cold-chain holding baseline, adjust for tissue vs. liquid workflow
constexpr float SHOCK_THRESHOLD_G = 2.0f;   // accel magnitude above which motion counts as a "shock" event
constexpr float PQI_WARNING_THRESHOLD = 0.85f;
constexpr float PQI_BREACH_THRESHOLD  = 0.70f;

void initSession(SessionState& session);
ScoreResult updateAndScore(SessionState& session, const SensorFrame& frame);
const char* statusToString(Status status);

}  // namespace ChronoVerity

#endif  // CHRONOVERITY_SENSOR_PROCESSING_H
