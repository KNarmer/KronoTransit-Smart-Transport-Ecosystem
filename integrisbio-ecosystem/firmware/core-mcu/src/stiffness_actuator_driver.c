#include "stiffness_actuator_driver.h"

/* Standard hobby-servo pulse widths for a 3-preset mount (e.g. a cam
 * that tensions a spring, or a valve controlling an air bladder's
 * preload pressure). TODO: calibrate against the actual mechanism once
 * built — these are placeholder angles. */
#define SERVO_PULSE_US_SOFT   1000
#define SERVO_PULSE_US_MEDIUM 1500
#define SERVO_PULSE_US_FIRM   2000

static void platform_set_servo_pulse_us(uint8_t pin, uint16_t pulse_us) {
#if defined(TARGET_STM32H7) || defined(TARGET_NRF5340)
    /* TODO: platform PWM timer configured for a 50Hz frame with a
     * pulse_us-wide high period — identical peripheral setup to
     * tec_driver.c's PWM shim, just a different frequency/duty
     * convention (servo signals are pulse-width coded, not duty-cycle
     * coded). */
    (void)pin; (void)pulse_us;
#else
    (void)pin; (void)pulse_us;
#endif
}

int stiffness_actuator_init(const stiffness_actuator_config_t *config,
                             stiffness_actuator_state_t *state) {
    if (!config || !state) return -1;

    state->window_shock_event_count = 0;
    state->window_peak_g = 0.0f;
    state->window_start_ms = 0;
    state->last_evaluation_ms = 0;
    state->current_preset = MOUNT_STIFFNESS_MEDIUM;  /* neutral default until first evaluation */

    stiffness_actuator_set_preset(config, state->current_preset);
    return 0;
}

void stiffness_actuator_update_window(stiffness_actuator_state_t *state,
                                       uint32_t new_shock_events, float peak_g_this_sample) {
    if (!state) return;
    state->window_shock_event_count += new_shock_events;
    if (peak_g_this_sample > state->window_peak_g) {
        state->window_peak_g = peak_g_this_sample;
    }
}

mount_stiffness_t stiffness_actuator_evaluate(stiffness_actuator_state_t *state,
                                               const stiffness_actuator_config_t *config,
                                               uint32_t now_ms) {
    if (!state || !config) return MOUNT_STIFFNESS_MEDIUM;

    /* Immediate override: a single large-enough shock forces FIRM right
     * away rather than waiting for the next scheduled evaluation — the
     * shock already happened (foam absorbed it), but we don't want the
     * *next* one on a now-clearly-rough route to risk bottoming out on a
     * still-SOFT preset. */
    if (state->window_peak_g >= config->peak_g_firm_override &&
        state->current_preset != MOUNT_STIFFNESS_FIRM) {
        state->current_preset = MOUNT_STIFFNESS_FIRM;
        stiffness_actuator_set_preset(config, state->current_preset);
    }

    bool interval_elapsed =
        (state->last_evaluation_ms == 0) ||
        (now_ms - state->last_evaluation_ms >= config->evaluation_interval_ms);

    if (!interval_elapsed) {
        return state->current_preset;
    }

    uint32_t window_duration_ms = (state->window_start_ms == 0)
        ? config->evaluation_interval_ms
        : (now_ms - state->window_start_ms);
    float window_duration_min = window_duration_ms / 60000.0f;
    float shock_rate_per_min = (window_duration_min > 0.0f)
        ? state->window_shock_event_count / window_duration_min
        : 0.0f;

    mount_stiffness_t next_preset = state->current_preset;

    if (shock_rate_per_min >= config->shock_rate_firm_threshold_per_min) {
        /* Step toward FIRM, one preset at a time — avoids slamming from
         * SOFT straight to FIRM on a borderline reading. */
        if (state->current_preset == MOUNT_STIFFNESS_SOFT) next_preset = MOUNT_STIFFNESS_MEDIUM;
        else next_preset = MOUNT_STIFFNESS_FIRM;
    } else if (shock_rate_per_min <= config->shock_rate_soft_threshold_per_min) {
        if (state->current_preset == MOUNT_STIFFNESS_FIRM) next_preset = MOUNT_STIFFNESS_MEDIUM;
        else next_preset = MOUNT_STIFFNESS_SOFT;
    }
    /* Otherwise (between the two thresholds): hold current preset — this
     * is the hysteresis band preventing chatter at the boundary. */

    if (next_preset != state->current_preset) {
        state->current_preset = next_preset;
        stiffness_actuator_set_preset(config, next_preset);
    }

    /* Reset the window for the next evaluation period. */
    state->window_shock_event_count = 0;
    state->window_peak_g = 0.0f;
    state->window_start_ms = now_ms;
    state->last_evaluation_ms = now_ms;

    return state->current_preset;
}

void stiffness_actuator_set_preset(const stiffness_actuator_config_t *config,
                                    mount_stiffness_t preset) {
    if (!config) return;

    uint16_t pulse_us;
    switch (preset) {
        case MOUNT_STIFFNESS_SOFT:   pulse_us = SERVO_PULSE_US_SOFT;   break;
        case MOUNT_STIFFNESS_FIRM:   pulse_us = SERVO_PULSE_US_FIRM;   break;
        case MOUNT_STIFFNESS_MEDIUM:
        default:                      pulse_us = SERVO_PULSE_US_MEDIUM; break;
    }
    platform_set_servo_pulse_us(config->servo_pwm_pin, pulse_us);
}

const char *mount_stiffness_to_string(mount_stiffness_t preset) {
    switch (preset) {
        case MOUNT_STIFFNESS_SOFT:   return "SOFT";
        case MOUNT_STIFFNESS_MEDIUM: return "MEDIUM";
        case MOUNT_STIFFNESS_FIRM:   return "FIRM";
        default:                      return "UNKNOWN";
    }
}