#include "as7341_driver.h"
#include <math.h>
#include <string.h>

/* See bme688_driver.c for the platform I2C shim pattern reused here. */
extern int cv_i2c_write(uint8_t addr, const uint8_t *data, uint16_t len);
extern int cv_i2c_read(uint8_t addr, uint8_t *data, uint16_t len);

static uint16_t s_integration_time_ms;
static uint8_t  s_gain_setting;

int as7341_init(uint16_t integration_time_ms, uint8_t gain_setting) {
    s_integration_time_ms = integration_time_ms;
    s_gain_setting = gain_setting;

    /* TODO: write ATIME/ASTEP registers to set integration_time_ms, and
     * CFG1.AGAIN to set gain_setting per the AS7341 datasheet. Enable
     * SMUX config for the 10-channel readout (F1-F8 + Clear + NIR). */
    return 0;
}

int as7341_read(as7341_reading_t *out_reading) {
    if (!out_reading) return -1;

    /* TODO: trigger a spectral measurement (SP_EN), poll for AVALID, then
     * burst-read the 10 channel result registers (CH0_DATA .. CH9_DATA). */
    memset(out_reading->channel, 0, sizeof(out_reading->channel));
    out_reading->integration_time_ms = s_integration_time_ms;
    out_reading->gain_setting = s_gain_setting;

    return 0;
}

void as7341_capture_baseline(as7341_baseline_t *baseline, const as7341_reading_t *reading) {
    if (!baseline || !reading) return;
    for (int i = 0; i < AS7341_NUM_CHANNELS; i++) {
        baseline->baseline[i] = (float)reading->channel[i];
    }
    baseline->baseline_captured = true;
}

float as7341_spectral_delta(const as7341_baseline_t *baseline, const as7341_reading_t *reading) {
    if (!baseline || !reading || !baseline->baseline_captured) return 0.0f;

    float sum_sq = 0.0f;
    for (int i = 0; i < AS7341_NUM_CHANNELS; i++) {
        float d = (float)reading->channel[i] - baseline->baseline[i];
        sum_sq += d * d;
    }
    return sqrtf(sum_sq);
}

float as7341_turbidity_index(const as7341_reading_t *reading) {
    if (!reading) return 0.0f;

    /* Channels 0-7 are the visible spectral bands (415-680nm); channel 8
     * is Clear, channel 9 is NIR. A dropping Clear/visible-mean ratio
     * indicates rising turbidity (scattering from hemolysis/clotting). */
    float visible_sum = 0.0f;
    for (int i = 0; i < 8; i++) {
        visible_sum += (float)reading->channel[i];
    }
    float visible_mean = visible_sum / 8.0f;
    float clear = (float)reading->channel[8];

    if (visible_mean <= 0.0f) return 0.0f;
    return clear / visible_mean;
}
