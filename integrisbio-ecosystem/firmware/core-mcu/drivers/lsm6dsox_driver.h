/*
 * lsm6dsox_driver.h — ST LSM6DSOX 6-axis IMU driver
 * -----------------------------------------------------------------------
 * Purpose in IntegrisBio: detect pneumatic-tube acceleration spikes
 * (>10G) and accidental drops. Uses the LSM6DSOX's onboard Finite State
 * Machine (FSM) to generate a hardware interrupt only on events above
 * threshold, so the host MCU can stay in a low-power sleep state between
 * shocks instead of continuously polling the accelerometer.
 * -----------------------------------------------------------------------
 */

#ifndef CV_LSM6DSOX_DRIVER_H
#define CV_LSM6DSOX_DRIVER_H

#include <stdint.h>
#include <stdbool.h>

#define LSM6DSOX_I2C_ADDR 0x6A
#define LSM6DSOX_WAKE_THRESHOLD_G 2.0f     /* FSM interrupt fires above this */
#define LSM6DSOX_SHOCK_LOG_THRESHOLD_G 10.0f /* pneumatic-tube-grade event */

typedef struct {
    float accel_g[3];   /* x, y, z in g */
    float gyro_dps[3];  /* x, y, z in degrees/sec */
    uint32_t timestamp_ms;
} lsm6dsox_sample_t;

typedef struct {
    float peak_g;
    uint32_t event_timestamp_ms;
    uint32_t duration_ms;
} lsm6dsox_shock_event_t;

int  lsm6dsox_init(void);

/*
 * Loads a Finite State Machine program into the sensor so that impacts
 * above LSM6DSOX_WAKE_THRESHOLD_G assert the INT1 pin and wake the host
 * MCU via EXTI/GPIOTE, without the host having to poll continuously.
 */
int  lsm6dsox_configure_fsm_wake(float threshold_g);

int  lsm6dsox_read_sample(lsm6dsox_sample_t *out_sample);

/* Call from the INT1 ISR context (deferred to main loop, not run in the ISR itself). */
bool lsm6dsox_pop_shock_event(lsm6dsox_shock_event_t *out_event);

float lsm6dsox_accel_magnitude(const lsm6dsox_sample_t *sample);

#endif /* CV_LSM6DSOX_DRIVER_H */
