#include "sensor_processing.h"
#include <math.h>

namespace ChronoVerity {

void initSession(SessionState& session) {
  session = SessionState();
}

static float colorEuclideanDelta(const SensorFrame& f, const SessionState& s) {
  float dr = (float)f.colorR - s.baselineColorR;
  float dg = (float)f.colorG - s.baselineColorG;
  float db = (float)f.colorB - s.baselineColorB;
  return sqrtf(dr * dr + dg * dg + db * db);
}

ScoreResult updateAndScore(SessionState& session, const SensorFrame& frame) {
  // --- Capture baseline on first frame ---
  if (!session.baselineCaptured) {
    session.baselineTempC = frame.temperatureC;
    session.baselineColorR = frame.colorR;
    session.baselineColorG = frame.colorG;
    session.baselineColorB = frame.colorB;
    session.lastUpdateMs = frame.timestampMs;
    session.baselineCaptured = true;
  }

  float dtSeconds = (frame.timestampMs - session.lastUpdateMs) / 1000.0f;
  if (dtSeconds < 0) dtSeconds = 0;  // guard against millis() rollover
  session.lastUpdateMs = frame.timestampMs;

  // --- Thermal integral: accumulate only the *excess* above the envelope ---
  float excessTemp = frame.temperatureC - (session.baselineTempC + TEMP_ENVELOPE_C);
  if (excessTemp > 0) {
    session.thermalIntegral += excessTemp * dtSeconds;
  }

  // --- Shock accumulator: count only meaningful impacts, not resting 1G gravity ---
  float shockExcess = frame.accelMagnitudeG - (1.0f + SHOCK_THRESHOLD_G);
  if (shockExcess > 0) {
    session.shockAccumulator += shockExcess;
  }

  // --- Color delta vs. baseline swatch reading ---
  float colorDelta = colorEuclideanDelta(frame, session);

  // --- Composite PQI ---
  float pqi = 1.0f - (W_THERMAL * session.thermalIntegral +
                       W_SHOCK * session.shockAccumulator +
                       W_COLOR * colorDelta);

  if (pqi < 0.0f) pqi = 0.0f;
  if (pqi > 1.0f) pqi = 1.0f;

  Status status;
  if (pqi >= PQI_WARNING_THRESHOLD) {
    status = Status::VIABLE;
  } else if (pqi >= PQI_BREACH_THRESHOLD) {
    status = Status::WARNING;
  } else {
    status = Status::BREACHED;
  }

  return ScoreResult{pqi, colorDelta, status};
}

const char* statusToString(Status status) {
  switch (status) {
    case Status::VIABLE:   return "VIABLE";
    case Status::WARNING:  return "WARNING";
    case Status::BREACHED: return "BREACHED";
    default:                return "UNKNOWN";
  }
}

}  // namespace ChronoVerity
