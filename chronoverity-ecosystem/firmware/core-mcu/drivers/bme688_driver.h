/*
 * bme688_driver.h — Bosch BME688 VOC/gas sensor driver
 * -----------------------------------------------------------------------
 * Target: STM32H7 (HAL I2C) or Nordic nRF5340 (TWIM). This header is
 * HAL-agnostic; the .c file's I2C transport shim is the only part that
 * needs to change between the two target platforms (see the `#if
 * defined(TARGET_STM32H7) / TARGET_NRF5340` blocks in bme688_driver.c).
 *
 * Purpose in ChronoVerity: detect formalin off-gassing (leakage/depletion)
 * and necrotic amine release (putrescine/cadaverine) from unfixed tissue,
 * by tracking the rate of change of the sensor's gas resistance reading
 * (d[VOC]/dt term in the PQI formula).
 * -----------------------------------------------------------------------
 */

#ifndef CV_BME688_DRIVER_H
#define CV_BME688_DRIVER_H

#include <stdint.h>
#include <stdbool.h>

#define BME688_I2C_ADDR_PRIMARY   0x76
#define BME688_I2C_ADDR_SECONDARY 0x77

typedef struct {
    uint8_t  i2c_address;
    uint16_t heater_temp_c;     // target hot-plate temperature, typ. 200-400C
    uint16_t heater_duration_ms;
    float    duty_cycle_hz;     // how often the hot plate pulses, for power budget
} bme688_config_t;

typedef struct {
    float temperature_c;
    float pressure_hpa;
    float humidity_rh;
    float gas_resistance_ohm;   // higher = cleaner air; drops sharply with VOCs
    bool  heater_stable;        // false while the hot plate is still stabilizing
} bme688_reading_t;

/* Returns 0 on success, negative error code otherwise. */
int bme688_init(const bme688_config_t *config);
int bme688_read(bme688_reading_t *out_reading);

/*
 * Computes a smoothed d[gas_resistance]/dt (ohms/sec). A large negative
 * slope indicates rapid off-gassing (formalin leak or tissue decay onset).
 * `window_readings` must be time-ordered, oldest first.
 */
float bme688_compute_voc_slope(const bme688_reading_t *window_readings, int count,
                                const uint32_t *timestamps_ms);

void bme688_enter_low_power(void);
void bme688_resume(void);

#endif /* CV_BME688_DRIVER_H */
