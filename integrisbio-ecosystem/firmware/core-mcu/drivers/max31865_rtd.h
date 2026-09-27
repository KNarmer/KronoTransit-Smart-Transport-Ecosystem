/*
 * max31865_rtd.h — Dual MAX31865 RTD-to-digital converter driver
 * -----------------------------------------------------------------------
 * Purpose in IntegrisBio: redundant, high-precision thermal sensing.
 * One PT100/PT1000 probe sits at the vial-sleeve interface (core temp),
 * the second at the outer chassis (ambient temp). The differential
 * between the two distinguishes true core thermal compromise from
 * benign surface warming (e.g., carrier left briefly in direct sun),
 * feeding the ΔT(t) integral term of the PQI formula.
 *
 * Two independent MAX31865 devices, each on its own SPI chip-select.
 * -----------------------------------------------------------------------
 */

#ifndef CV_MAX31865_RTD_H
#define CV_MAX31865_RTD_H

#include <stdint.h>
#include <stdbool.h>

typedef enum {
    RTD_CHANNEL_CORE = 0,     /* vial-sleeve interface probe */
    RTD_CHANNEL_AMBIENT = 1,  /* outer chassis probe */
    RTD_CHANNEL_COUNT
} rtd_channel_t;

typedef enum {
    RTD_TYPE_PT100  = 100,
    RTD_TYPE_PT1000 = 1000
} rtd_type_t;

typedef struct {
    rtd_type_t rtd_type;
    float reference_resistor_ohm;  /* 430 ohm for PT100, 4300 ohm for PT1000 boards */
    uint8_t spi_cs_pin;
    bool wire_3_mode;              /* false = 2/4-wire, true = 3-wire compensation */
} max31865_config_t;

typedef struct {
    float temperature_c;
    bool  fault;
    uint8_t fault_code;   /* raw MAX31865 fault register, if fault == true */
} max31865_reading_t;

int  max31865_init(rtd_channel_t channel, const max31865_config_t *config);
int  max31865_read(rtd_channel_t channel, max31865_reading_t *out_reading);

/*
 * Returns core_temp - ambient_temp. A rising positive differential with
 * a falling ambient reading indicates the carrier is compensating for
 * external cold rather than true internal thermal compromise, and vice
 * versa — this disambiguation is the whole point of running both probes.
 */
float max31865_core_ambient_differential(const max31865_reading_t *core,
                                          const max31865_reading_t *ambient);

#endif /* CV_MAX31865_RTD_H */
