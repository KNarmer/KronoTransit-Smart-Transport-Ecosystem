#include "max31865_rtd.h"
#include <string.h>

static max31865_config_t s_config[RTD_CHANNEL_COUNT];
static bool s_initialized[RTD_CHANNEL_COUNT];

/* Reused SPI transport shim pattern — see bme688_driver.c's i2c equivalent. */
static int spi_transfer(uint8_t cs_pin, const uint8_t *tx, uint8_t *rx, uint16_t len) {
#if defined(TARGET_STM32H7)
    /* TODO: HAL_GPIO_WritePin(cs_port, cs_pin, RESET); HAL_SPI_TransmitReceive(...); set */
    (void)cs_pin; (void)tx; (void)rx; (void)len;
    return 0;
#elif defined(TARGET_NRF5340)
    /* TODO: nrfx_spim_xfer with per-channel CS toggled in software (GPIO). */
    (void)cs_pin; (void)tx; (void)rx; (void)len;
    return 0;
#else
    (void)cs_pin; (void)tx; (void)rx; (void)len;
    return -1;
#endif
}

int max31865_init(rtd_channel_t channel, const max31865_config_t *config) {
    if (channel >= RTD_CHANNEL_COUNT || !config) return -1;

    s_config[channel] = *config;

    /* TODO: write the Configuration Register (0x80) to set:
     *  - V_BIAS on
     *  - conversion mode: auto (continuous) for real-time PQI feeding
     *  - 2/3/4-wire mode per config->wire_3_mode
     *  - 50/60Hz filter select
     * Then clear any fault register bits (0x82, write 0x00 with bit D1=1
     * to clear faults). */
    uint8_t cfg_write[2] = {0x80, 0xC2};
    if (spi_transfer(s_config[channel].spi_cs_pin, cfg_write, NULL, sizeof(cfg_write)) != 0) {
        return -2;
    }

    s_initialized[channel] = true;
    return 0;
}

int max31865_read(rtd_channel_t channel, max31865_reading_t *out_reading) {
    if (channel >= RTD_CHANNEL_COUNT || !out_reading || !s_initialized[channel]) return -1;

    uint8_t tx[3] = {0x01 /* RTD MSB reg, read */, 0x00, 0x00};
    uint8_t rx[3] = {0};
    if (spi_transfer(s_config[channel].spi_cs_pin, tx, rx, sizeof(tx)) != 0) {
        return -2;
    }

    uint16_t raw_rtd = ((uint16_t)rx[1] << 8 | rx[2]) >> 1; /* 15-bit RTD value, LSB is fault flag */
    bool fault_flag = (rx[2] & 0x01) != 0;

    /* Callendar-Van Dusen conversion (simplified linear approximation for
     * the 0-100C physiological/cold-chain range this system operates in;
     * swap for the full quadratic solve if wider range accuracy is
     * needed). Reference resistance and RTD nominal (100 or 1000 ohm)
     * come from s_config[channel]. */
    float r_rtd = ((float)raw_rtd / 32768.0f) * s_config[channel].reference_resistor_ohm;
    float r_nominal = (float)s_config[channel].rtd_type;
    const float alpha = 0.00385f; /* IEC 60751 standard RTD temp coefficient */
    out_reading->temperature_c = (r_rtd - r_nominal) / (alpha * r_nominal);

    out_reading->fault = fault_flag;
    out_reading->fault_code = fault_flag ? rx[0] : 0;

    return 0;
}

float max31865_core_ambient_differential(const max31865_reading_t *core,
                                          const max31865_reading_t *ambient) {
    if (!core || !ambient) return 0.0f;
    return core->temperature_c - ambient->temperature_c;
}
