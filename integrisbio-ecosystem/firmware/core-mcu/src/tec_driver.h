/*
 * tec_driver.h — Thermoelectric (Peltier) active thermal correction
 * -----------------------------------------------------------------------
 * Hardware: a single TEC1-12706-class Peltier module, heavily
 * underdriven (PWM'd to a few watts, never near its 12V/6A rating),
 * driven through an H-bridge (e.g. an L298N/TB6612FNG-class driver) so
 * the same module can both heat and cool depending on current
 * direction. Mounted against a small aluminum plate that contacts the
 * Verity cartridge shell — NOT the specimen chamber directly — with a
 * heatsink+fan on the opposite face dumping waste heat/cold to the
 * carrier's internal air. This keeps the specimen thermally isolated
 * from the actuator itself; only the cartridge shell sees the trim.
 *
 * Control philosophy: this is a *trim* system on top of passive
 * insulation (closed-cell foam / optional PCM insert), not a
 * primary climate-control system — running a TEC continuously would
 * drain the carrier's battery quickly. The controller below only
 * drives current when the RTD reading has left the LabProfile's target
 * band, and duty cycle is capped well below 100% as an additional
 * safety/power margin.
 *
 * Uses a standard PID loop (the target Cortex-M4F/M33 cores have
 * hardware FPUs, so floating-point PID is cheap here) rather than pure
 * bang-bang, since PID gives smoother duty cycling — less mechanical
 * wear on the H-bridge reldriving and less battery drain from
 * unnecessary full-power pulses. A hysteresis deadband is layered on
 * top of the PID output specifically to prevent rapid heat/cool mode
 * flips, since reversing current direction on a TEC while it still has
 * thermal momentum in the other direction wastes energy fighting itself.
 * -----------------------------------------------------------------------
 */

#ifndef CV_TEC_DRIVER_H
#define CV_TEC_DRIVER_H

#include <stdint.h>
#include <stdbool.h>
#include "lab_profile.h"

typedef enum {
    TEC_MODE_OFF = 0,
    TEC_MODE_HEATING,
    TEC_MODE_COOLING
} tec_mode_t;

typedef struct {
    uint8_t pwm_pin;            /* PWM magnitude control */
    uint8_t direction_pin_a;     /* H-bridge IN1 */
    uint8_t direction_pin_b;     /* H-bridge IN2 */
    float   max_duty_cycle;      /* safety cap, e.g. 0.6 — never drive the TEC near its rated spec */
    float   mode_switch_deadband_c; /* +/- band around target center where TEC stays OFF, preventing rapid heat/cool flapping */
} tec_config_t;

typedef struct {
    /* PID gains — starting points for a first bring-up; tune against the
     * carrier's actual thermal mass once the enclosure is built. See
     * edge-ai/simulation/thermal_control_sim.py, which uses these same
     * default gains against a simulated thermal plant so they can be
     * tuned in software before risking a real specimen. */
    float kp, ki, kd;

    float integral_accum;
    float prev_error_c;
    uint32_t prev_update_ms;

    tec_mode_t current_mode;
    float current_duty_cycle;

    /* Safety watchdog: if the TEC has been at max duty cycle for longer
     * than this and temperature still hasn't moved toward the band,
     * shut off rather than cook the battery or the cartridge shell
     * chasing an unreachable target (e.g. carrier left in direct sun,
     * or a hardware fault). */
    uint32_t max_duty_watchdog_ms;
    uint32_t time_at_max_duty_ms;
    bool     watchdog_tripped;
} tec_control_state_t;

int  tec_init(const tec_config_t *config);

void tec_control_init(tec_control_state_t *state, float kp, float ki, float kd);

/*
 * Call once per sensor sample cycle. `current_temp_c` should be the
 * cartridge-shell-side RTD reading (RTD_CHANNEL_CORE from
 * drivers/max31865_rtd.h), and `profile` the active LabProfile for the
 * cartridge currently inserted. Internally computes the band's center
 * as its PID setpoint and only actuates once the reading has left
 * [target_temp_min_c, target_temp_max_c].
 */
void tec_control_update(tec_control_state_t *state, const tec_config_t *config,
                         float current_temp_c, const lab_profile_t *profile,
                         uint32_t now_ms);

/* Immediately de-energizes the H-bridge. Called on cartridge removal,
 * on watchdog trip, or on any fault condition. */
void tec_disable(void);

#endif /* CV_TEC_DRIVER_H */