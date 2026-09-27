#include "tec_driver.h"
#include <math.h>

/* Platform PWM/GPIO shim — same pattern as bme688_driver.c's I2C shim. */
static void platform_set_pwm_duty(uint8_t pin, float duty_0_to_1) {
#if defined(TARGET_STM32H7)
    /* TODO: __HAL_TIM_SET_COMPARE(&htimX, channel, (uint32_t)(duty_0_to_1 * period)); */
    (void)pin; (void)duty_0_to_1;
#elif defined(TARGET_NRF5340)
    /* TODO: nrfx_pwm_sequence with the duty encoded per nRF's PWM peripheral. */
    (void)pin; (void)duty_0_to_1;
#else
    (void)pin; (void)duty_0_to_1;
#endif
}

static void platform_set_direction_pins(uint8_t pin_a, uint8_t pin_b, tec_mode_t mode) {
    /* H-bridge truth table: HEATING drives current one way, COOLING the
     * other, OFF de-energizes both legs. TODO: platform GPIO writes. */
    (void)pin_a; (void)pin_b; (void)mode;
}

int tec_init(const tec_config_t *config) {
    if (!config) return -1;
    platform_set_direction_pins(config->direction_pin_a, config->direction_pin_b, TEC_MODE_OFF);
    platform_set_pwm_duty(config->pwm_pin, 0.0f);
    return 0;
}

void tec_control_init(tec_control_state_t *state, float kp, float ki, float kd) {
    state->kp = kp;
    state->ki = ki;
    state->kd = kd;
    state->integral_accum = 0.0f;
    state->prev_error_c = 0.0f;
    state->prev_update_ms = 0;
    state->current_mode = TEC_MODE_OFF;
    state->current_duty_cycle = 0.0f;
    state->max_duty_watchdog_ms = 5UL * 60UL * 1000UL; /* 5 minutes at max duty is a hardware/placement problem, not a control problem */
    state->time_at_max_duty_ms = 0;
    state->watchdog_tripped = false;
}

void tec_control_update(tec_control_state_t *state, const tec_config_t *config,
                         float current_temp_c, const lab_profile_t *profile,
                         uint32_t now_ms) {
    if (!state || !config || !profile || state->watchdog_tripped) {
        return;
    }

    float dt_s = (state->prev_update_ms == 0) ? 0.0f : (now_ms - state->prev_update_ms) / 1000.0f;
    state->prev_update_ms = now_ms;

    float band_center = (profile->target_temp_min_c + profile->target_temp_max_c) / 2.0f;

    /* Inside the band entirely: no correction needed, decay the integral
     * term so we don't carry stale windup into the next excursion. */
    if (current_temp_c >= profile->target_temp_min_c && current_temp_c <= profile->target_temp_max_c) {
        state->integral_accum *= 0.9f;
        state->current_mode = TEC_MODE_OFF;
        state->current_duty_cycle = 0.0f;
        state->time_at_max_duty_ms = 0;
        platform_set_direction_pins(config->direction_pin_a, config->direction_pin_b, TEC_MODE_OFF);
        platform_set_pwm_duty(config->pwm_pin, 0.0f);
        return;
    }

    float error_c = band_center - current_temp_c;  /* positive => too cold, need heating */

    /* Hysteresis: don't flip direction for a marginal excursion right at
     * the band edge — only correct once past the deadband beyond the
     * band, so sensor noise near the boundary can't cause H-bridge
     * chatter. */
    bool outside_deadband =
        (current_temp_c < profile->target_temp_min_c - config->mode_switch_deadband_c) ||
        (current_temp_c > profile->target_temp_max_c + config->mode_switch_deadband_c);

    if (!outside_deadband) {
        return; /* leave the last commanded state as-is inside the deadband */
    }

    state->integral_accum += error_c * dt_s;
    /* Clamp the integral term to prevent windup while the specimen slowly
     * approaches an unreachable target (e.g. ambient far outside range). */
    float integral_limit = 50.0f;
    if (state->integral_accum > integral_limit) state->integral_accum = integral_limit;
    if (state->integral_accum < -integral_limit) state->integral_accum = -integral_limit;

    float derivative = (dt_s > 0.0f) ? (error_c - state->prev_error_c) / dt_s : 0.0f;
    state->prev_error_c = error_c;

    float pid_output = state->kp * error_c + state->ki * state->integral_accum + state->kd * derivative;

    tec_mode_t mode = (pid_output >= 0.0f) ? TEC_MODE_HEATING : TEC_MODE_COOLING;
    float duty = fabsf(pid_output);
    if (duty > config->max_duty_cycle) duty = config->max_duty_cycle;

    /* Thermal-runaway watchdog: sustained max-duty operation without the
     * temperature recovering usually means the target is physically
     * unreachable at this ambient (or a hardware fault), not something
     * more PID authority would fix. */
    if (duty >= config->max_duty_cycle - 0.01f) {
        state->time_at_max_duty_ms += (uint32_t)(dt_s * 1000.0f);
        if (state->time_at_max_duty_ms > state->max_duty_watchdog_ms) {
            state->watchdog_tripped = true;
            tec_disable();
            return;
        }
    } else {
        state->time_at_max_duty_ms = 0;
    }

    state->current_mode = mode;
    state->current_duty_cycle = duty;

    platform_set_direction_pins(config->direction_pin_a, config->direction_pin_b, mode);
    platform_set_pwm_duty(config->pwm_pin, duty);
}

void tec_disable(void) {
    /* TODO: this needs the active config's pin numbers to zero the
     * correct PWM channel/direction pins; in the full firmware this is
     * called with the carrier's single global tec_config_t in scope
     * (see main.c's integration point). Left parameter-free here to
     * match the header's fault-path signature used from ISR/watchdog
     * contexts where passing config through isn't convenient. */
}