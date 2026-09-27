/*
 * stiffness_actuator_driver.h — Semi-active mount stiffness adjustment
 * -----------------------------------------------------------------------
 * IMPORTANT PHYSICS NOTE (read before touching the control logic):
 * A pneumatic-tube shock impulse lasts tens of milliseconds. No
 * practical actuator (servo, solenoid) can sense, decide, and move
 * within that window — by the time a reaction fired, the shock event
 * would already be over. This module does NOT attempt to counter
 * individual shocks in real time. That job belongs entirely to the
 * passive viscoelastic foam / Sorbothane mount underneath the
 * cartridge, which absorbs shocks the instant they happen with zero
 * latency because it requires no sensing or decision at all.
 *
 * What this module DOES do: semi-active suspension, in the same sense
 * automotive adjustable dampers use it — adjusting the mount's BASELINE
 * stiffness over a slow timescale (every evaluation_interval_ms, on the
 * order of seconds), based on the recent vibration environment. A
 * small servo or solenoid changes the preload tension on the mount's
 * spring/air-bladder between a small number of discrete presets:
 *
 *   SOFT   — best isolation from continuous low-amplitude vibration
 *            (van engine, pneumatic tube blower hum) when the recent
 *            environment has been calm. A soft mount under-damps large
 *            shocks, so it's the wrong choice on a rough leg.
 *   FIRM   — more constrained travel, reducing the risk of the mount
 *            "bottoming out" against its internal travel limit during
 *            a rough leg (which would transmit a hard mechanical stop
 *            straight to the specimen — worse than just being firm).
 *
 * This is a real, established control category (semi-active damping)
 * applied on a timescale where servo/solenoid response time is not a
 * problem, which is the whole reason it's physically viable where
 * shock-cancellation is not.
 * -----------------------------------------------------------------------
 */

#ifndef CV_STIFFNESS_ACTUATOR_DRIVER_H
#define CV_STIFFNESS_ACTUATOR_DRIVER_H

#include <stdint.h>
#include <stdbool.h>

typedef enum {
    MOUNT_STIFFNESS_SOFT = 0,
    MOUNT_STIFFNESS_MEDIUM,
    MOUNT_STIFFNESS_FIRM
} mount_stiffness_t;

typedef struct {
    uint8_t  servo_pwm_pin;           /* standard 50Hz hobby-servo PWM signal */
    uint32_t evaluation_interval_ms;  /* how often to re-evaluate, e.g. 30000 (30s) */

    /* Thresholds on the rolling window's stats (see
     * stiffness_actuator_update_window() below) that trigger a step up
     * or down in stiffness preset. Two-threshold hysteresis (rather
     * than one) prevents the mount from oscillating between presets
     * when the shock rate sits right at a boundary. */
    float shock_rate_firm_threshold_per_min;   /* events/min above this => step toward FIRM */
    float shock_rate_soft_threshold_per_min;   /* events/min below this => step toward SOFT */
    float peak_g_firm_override;                /* a single event this large forces FIRM immediately */
} stiffness_actuator_config_t;

typedef struct {
    /* Rolling window accumulators — fed by
     * stiffness_actuator_update_window() every sensor sample, evaluated
     * by stiffness_actuator_evaluate() every evaluation_interval_ms. */
    uint32_t window_shock_event_count;
    float    window_peak_g;
    uint32_t window_start_ms;
    uint32_t last_evaluation_ms;

    mount_stiffness_t current_preset;
} stiffness_actuator_state_t;

int  stiffness_actuator_init(const stiffness_actuator_config_t *config,
                              stiffness_actuator_state_t *state);

/* Call every sensor sample cycle with that cycle's shock event count
 * (from lsm6dsox_driver.h's shock event queue) and the peak |a|
 * observed, to accumulate this evaluation window's statistics. */
void stiffness_actuator_update_window(stiffness_actuator_state_t *state,
                                       uint32_t new_shock_events, float peak_g_this_sample);

/*
 * Call every sensor sample cycle; internally no-ops unless
 * evaluation_interval_ms has elapsed since the last evaluation, at
 * which point it decides whether to step the preset up, down, or hold,
 * resets the window accumulators, and (if changed) commands the servo.
 * Returns the resulting preset (unchanged if no re-evaluation happened
 * this call).
 */
mount_stiffness_t stiffness_actuator_evaluate(stiffness_actuator_state_t *state,
                                               const stiffness_actuator_config_t *config,
                                               uint32_t now_ms);

void stiffness_actuator_set_preset(const stiffness_actuator_config_t *config,
                                    mount_stiffness_t preset);

const char *mount_stiffness_to_string(mount_stiffness_t preset);

#endif /* CV_STIFFNESS_ACTUATOR_DRIVER_H */