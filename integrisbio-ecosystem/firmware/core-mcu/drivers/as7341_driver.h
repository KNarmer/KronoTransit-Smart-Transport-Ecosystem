/*
 * as7341_driver.h — AMS AS7341 11-channel spectral sensor driver
 * -----------------------------------------------------------------------
 * Purpose in IntegrisBio: non-destructive optical monitoring of the
 * Verity cartridge's colorimetric swatch through the vial wall, and
 * turbidity/submersion checks for liquid and solid specimens respectively.
 * Feeds the ΔColor_Verity term of the PQI formula.
 * -----------------------------------------------------------------------
 */

#ifndef CV_AS7341_DRIVER_H
#define CV_AS7341_DRIVER_H

#include <stdint.h>
#include <stdbool.h>

#define AS7341_I2C_ADDR 0x39
#define AS7341_NUM_CHANNELS 10  /* 8 spectral (415-680nm) + Clear + NIR */

typedef struct {
    uint16_t channel[AS7341_NUM_CHANNELS];  /* raw ADC counts per channel */
    uint16_t integration_time_ms;
    uint8_t  gain_setting;
} as7341_reading_t;

typedef struct {
    float baseline[AS7341_NUM_CHANNELS];
    bool  baseline_captured;
} as7341_baseline_t;

int  as7341_init(uint16_t integration_time_ms, uint8_t gain_setting);
int  as7341_read(as7341_reading_t *out_reading);

/* Captures the first stable reading as the reference swatch color. */
void as7341_capture_baseline(as7341_baseline_t *baseline, const as7341_reading_t *reading);

/*
 * Returns the Euclidean spectral distance between the current reading
 * and the captured baseline — this is the ΔColor_Verity term feeding
 * directly into the PQI formula in tinyml/pqi_inference.c.
 */
float as7341_spectral_delta(const as7341_baseline_t *baseline, const as7341_reading_t *reading);

/*
 * Turbidity heuristic for liquid specimens: ratio of Clear channel to the
 * mean of the visible-band channels. A falling ratio over time indicates
 * increasing turbidity (hemolysis / clotting).
 */
float as7341_turbidity_index(const as7341_reading_t *reading);

#endif /* CV_AS7341_DRIVER_H */
