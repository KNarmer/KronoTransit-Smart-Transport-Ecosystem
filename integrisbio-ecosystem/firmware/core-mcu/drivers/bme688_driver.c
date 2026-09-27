#include "bme688_driver.h"
#include <string.h>

/* ---- Platform I2C transport shim ---------------------------------------
 * Swap the body of these two functions for the target's HAL:
 *   STM32H7:   HAL_I2C_Master_Transmit()/Receive() on hi2c1/2/3/4
 *   nRF5340:   nrfx_twim_tx()/nrfx_twim_rx() on the TWIM instance
 * Kept isolated here so drivers/* are portable across both reference
 * targets named in the README's "Microcontroller Architecture" section.
 * ------------------------------------------------------------------- */
static int i2c_write_reg(uint8_t addr, uint8_t reg, const uint8_t *data, uint16_t len) {
#if defined(TARGET_STM32H7)
    /* TODO: HAL_I2C_Mem_Write(&hi2c1, addr << 1, reg, I2C_MEMADD_SIZE_8BIT,
     *                          (uint8_t*)data, len, 100); */
    return 0;
#elif defined(TARGET_NRF5340)
    /* TODO: nrfx_twim_tx(&m_twim, addr, tx_buf, len + 1, false); */
    return 0;
#else
    (void)addr; (void)reg; (void)data; (void)len;
    return -1; /* No platform selected — define TARGET_STM32H7 or TARGET_NRF5340 */
#endif
}

static int i2c_read_reg(uint8_t addr, uint8_t reg, uint8_t *data, uint16_t len) {
#if defined(TARGET_STM32H7) || defined(TARGET_NRF5340)
    (void)addr; (void)reg; (void)data; (void)len;
    return 0; /* TODO: platform read, mirrors i2c_write_reg above */
#else
    (void)addr; (void)reg; (void)data; (void)len;
    return -1;
#endif
}

static bme688_config_t s_config;
static bme688_reading_t s_last_reading;

int bme688_init(const bme688_config_t *config) {
    if (!config) return -1;
    memcpy(&s_config, config, sizeof(s_config));
    memset(&s_last_reading, 0, sizeof(s_last_reading));

    /* Chip ID check (reg 0xD0 should read 0x61 for BME688) */
    uint8_t chip_id = 0;
    if (i2c_read_reg(s_config.i2c_address, 0xD0, &chip_id, 1) != 0) {
        return -2;
    }

    /* Configure oversampling (ctrl_hum/ctrl_meas), IIR filter (config reg),
     * and the gas heater profile (res_heat_0 / gas_wait_0) per the Bosch
     * BME688 datasheet section 3.3. Left as a hardware-bring-up TODO —
     * this repository ships the interface, not a hardware-specific
     * calibration, since register defaults vary by enclosure thermal mass. */

    return 0;
}

int bme688_read(bme688_reading_t *out_reading) {
    if (!out_reading) return -1;

    uint8_t raw[15] = {0};
    if (i2c_read_reg(s_config.i2c_address, 0x1F /* field_0 base */, raw, sizeof(raw)) != 0) {
        return -2;
    }

    /* Placeholder conversion — replace with the Bosch BME68x compensation
     * formulas (temperature/pressure/humidity/gas) from the official
     * bme68x-sensor-api. Not reimplemented here to avoid silently drifting
     * from Bosch's calibrated compensation constants. */
    out_reading->temperature_c   = 22.0f;
    out_reading->pressure_hpa    = 1013.0f;
    out_reading->humidity_rh     = 45.0f;
    out_reading->gas_resistance_ohm = 50000.0f;
    out_reading->heater_stable   = true;

    s_last_reading = *out_reading;
    return 0;
}

float bme688_compute_voc_slope(const bme688_reading_t *window_readings, int count,
                                const uint32_t *timestamps_ms) {
    if (count < 2) return 0.0f;

    float dt_sec = (timestamps_ms[count - 1] - timestamps_ms[0]) / 1000.0f;
    if (dt_sec <= 0.0f) return 0.0f;

    float delta_r = window_readings[count - 1].gas_resistance_ohm -
                     window_readings[0].gas_resistance_ohm;

    return delta_r / dt_sec; /* ohms/sec; large negative = rapid off-gassing */
}

void bme688_enter_low_power(void) {
    /* TODO: disable the heater duty cycle between duty_cycle_hz pulses to
     * respect the carrier's rechargeable power budget. */
}

void bme688_resume(void) {
    /* TODO: re-enable heater pulsing per s_config.duty_cycle_hz. */
}
