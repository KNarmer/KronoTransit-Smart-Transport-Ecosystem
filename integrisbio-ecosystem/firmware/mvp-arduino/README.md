# firmware/mvp-arduino

Conrad Challenge Innovation Video prototype firmware.

## Hardware

| Component | Model | Notes |
|---|---|---|
| Microcontroller | Arduino Nano 33 BLE Sense | Onboard IMU (LSM9DS1) + temp/humidity (HTS221) |
| Color sensor | Adafruit TCS34725 | Reads the Verity colorimetric swatch |
| Enclosure | Custom 3D-printed PETG, 2-piece | See `hardware/cad/` |

### Wiring

| TCS34725 Pin | Nano 33 BLE Sense Pin |
|---|---|
| `SDA` | `A4` |
| `SCL` | `A5` |
| `VIN` | `3.3V` |
| `GND` | `GND` |

## Dependencies (Arduino Library Manager)

- `Arduino_HTS221`
- `Arduino_LSM9DS1`
- `Adafruit_TCS34725` (and its dependency `Adafruit_BusIO`)

## Build & Flash

1. Install the **Arduino Mbed OS Nano Boards** board package (Tools → Board → Boards Manager).
2. Install the three libraries above via Tools → Manage Libraries.
3. Open `ChronoVerity_MVP.ino`, select **Arduino Nano 33 BLE**, and select the correct serial port.
4. Upload, then open the Serial Monitor at **115200 baud** to view live CSV telemetry:
   `timestamp_ms,temp_c,accel_g,color_delta,pqi,status`

## What this firmware demonstrates

This is a simplified, hand-tuned stand-in for the production TinyML model described in
`firmware/core-mcu/tinyml/`. It implements the same PQI structure (thermal integral + shock
accumulation + color delta) using running sums instead of a trained INT8 neural network, so the
Innovation Video's stress-test scene (heat or drop → LED shifts from green to red) can be filmed
without first collecting a training dataset. The full model, trained on synthetic + collected
sensor data, lives in `edge-ai/` and is what production firmware in `firmware/core-mcu/` will run.
