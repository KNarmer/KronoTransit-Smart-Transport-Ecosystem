/*
 * IntegrisBio_MVP.ino
 * -----------------------------------------------------------------------
 * Conrad Challenge Innovation Video prototype.
 *
 * Board:      Arduino Nano 33 BLE Sense
 * Sensors:    Adafruit TCS34725 (I2C color/spectral sensor) -> Verity swatch
 *             Onboard LSM9DS1  (IMU: accel/gyro/mag)        -> shock events
 *             Onboard HTS221   (temperature/humidity)        -> thermal drift
 * Output:     Onboard RGB LED  -> GREEN / AMBER / RED viability status
 *             Serial (115200)  -> human-readable + CSV telemetry log
 *
 * This sketch is the *demonstration-scale* stand-in for the production
 * TinyML pipeline described in firmware/core-mcu/. It implements a
 * simplified, human-readable version of the PQI formula from the README
 * so the same core logic (thermal integral + shock + color delta) can be
 * shown live in the stress-test demo without requiring a trained model
 * on day one. See sensor_processing.h/.cpp for the scoring logic.
 * -----------------------------------------------------------------------
 */

#include <Wire.h>
#include <Arduino_HTS221.h>   // onboard temp/humidity
#include <Arduino_LSM9DS1.h>  // onboard IMU
#include "Adafruit_TCS34725.h"
#include "sensor_processing.h"

// ---- Onboard RGB LED pins (Nano 33 BLE Sense: active LOW) -----------------
#define LED_R LEDR
#define LED_G LEDG
#define LED_B LEDB

// ---- Color sensor instance --------------------------------------------
Adafruit_TCS34725 tcs = Adafruit_TCS34725(TCS34725_INTEGRATIONTIME_50MS,
                                           TCS34725_GAIN_4X);

// ---- Runtime state -------------------------------------------------------
IntegrisBio::SessionState session;

const uint32_t SAMPLE_INTERVAL_MS = 500;   // 2 Hz sampling, matches TinyML window cadence
uint32_t lastSampleMillis = 0;

void setStatusLed(IntegrisBio::Status status) {
  // Active-low RGB LED on the Nano 33 BLE Sense
  digitalWrite(LED_R, HIGH);
  digitalWrite(LED_G, HIGH);
  digitalWrite(LED_B, HIGH);

  switch (status) {
    case IntegrisBio::Status::VIABLE:
      digitalWrite(LED_G, LOW);           // Green
      break;
    case IntegrisBio::Status::WARNING:
      digitalWrite(LED_R, LOW);
      digitalWrite(LED_G, LOW);           // Red + Green = Amber
      break;
    case IntegrisBio::Status::BREACHED:
      digitalWrite(LED_R, LOW);           // Red
      break;
  }
}

void setup() {
  Serial.begin(115200);
  uint32_t bootWait = millis();
  while (!Serial && millis() - bootWait < 3000) {
    // wait briefly for USB serial, but don't block forever untethered
  }

  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
  pinMode(LED_B, OUTPUT);
  setStatusLed(IntegrisBio::Status::VIABLE);

  Serial.println(F("=== IntegrisBio MVP — Conrad Challenge Prototype ==="));

  if (!HTS.begin()) {
    Serial.println(F("[FATAL] HTS221 temperature sensor not found."));
    while (1) { setStatusLed(IntegrisBio::Status::BREACHED); delay(250); }
  }

  if (!IMU.begin()) {
    Serial.println(F("[FATAL] LSM9DS1 IMU not found."));
    while (1) { setStatusLed(IntegrisBio::Status::BREACHED); delay(250); }
  }

  if (!tcs.begin()) {
    Serial.println(F("[FATAL] TCS34725 color sensor not found. Check SDA/SCL wiring (A4/A5)."));
    while (1) { setStatusLed(IntegrisBio::Status::BREACHED); delay(250); }
  }

  IntegrisBio::initSession(session);
  Serial.println(F("Session initialized. Baseline capture in progress..."));
  Serial.println(F("timestamp_ms,temp_c,accel_g,color_delta,pqi,status"));
}

void loop() {
  uint32_t now = millis();
  if (now - lastSampleMillis < SAMPLE_INTERVAL_MS) {
    return;
  }
  lastSampleMillis = now;

  // ---- 1. Read raw sensors ----
  float tempC = HTS.readTemperature();

  float ax = 0, ay = 0, az = 0;
  if (IMU.accelerationAvailable()) {
    IMU.readAcceleration(ax, ay, az);
  }
  float accelMagnitudeG = sqrt(ax * ax + ay * ay + az * az);

  uint16_t r, g, b, c;
  tcs.getRawData(&r, &g, &b, &c);

  // ---- 2. Feed the scoring engine ----
  IntegrisBio::SensorFrame frame;
  frame.timestampMs = now;
  frame.temperatureC = tempC;
  frame.accelMagnitudeG = accelMagnitudeG;
  frame.colorR = r;
  frame.colorG = g;
  frame.colorB = b;
  frame.colorClear = c;

  IntegrisBio::ScoreResult result = IntegrisBio::updateAndScore(session, frame);

  // ---- 3. Drive the status LED ----
  setStatusLed(result.status);

  // ---- 4. Log CSV telemetry over serial ----
  Serial.print(now);            Serial.print(',');
  Serial.print(tempC, 2);       Serial.print(',');
  Serial.print(accelMagnitudeG, 3); Serial.print(',');
  Serial.print(result.colorDelta, 2); Serial.print(',');
  Serial.print(result.pqi, 3);  Serial.print(',');
  Serial.println(IntegrisBio::statusToString(result.status));

  if (result.status == IntegrisBio::Status::BREACHED && !session.incidentLogged) {
    Serial.println(F(">>> INCIDENT LOGGED: sample integrity breach detected. <<<"));
    session.incidentLogged = true;
  }
}
