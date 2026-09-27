/*
 * main.c — ChronoCase production firmware entry point
 * -----------------------------------------------------------------------
 * Target: Nordic nRF5340 or STM32H7 (select via build flag TARGET_NRF5340
 * / TARGET_STM32H7, see ../CMakeLists.txt).
 *
 * This is the Phase II / clinical-scale firmware described in the
 * README's "Engineering Roadmap." It supersedes firmware/mvp-arduino/
 * once the full sensor suite (BME688 VOC, AS7341 optical, LSM6DSOX IMU,
 * dual MAX31865 RTDs) and the trained TinyML model are integrated.
 *
 * Active correction (added on top of pure sensing/alerting): on
 * cartridge insertion, a LabProfile is selected from the cartridge's
 * RFID-encoded specimen type (lab_profile.h) and drives two closed
 * loops for the remainder of the transit leg:
 *   - tec_driver.h:                a Peltier trim system nudging
 *     cartridge-shell temperature back toward the profile's target band
 *   - stiffness_actuator_driver.h: a semi-active mount that adjusts
 *     baseline stiffness every ~30s based on the recent shock
 *     environment (NOT a per-shock response — see that header's
 *     physics note on why individual shocks are handled by passive
 *     foam instead)
 * -----------------------------------------------------------------------
 */

#include <stdint.h>
#include <stdbool.h>

#include "state_machine.h"
#include "flash_ringbuffer.h"
#include "telemetry.h"
#include "lab_profile.h"
#include "../tinyml/pqi_inference.h"
#include "../drivers/bme688_driver.h"
#include "../drivers/as7341_driver.h"
#include "../drivers/lsm6dsox_driver.h"
#include "../drivers/max31865_rtd.h"
#include "../drivers/tec_driver.h"
#include "../drivers/stiffness_actuator_driver.h"

/* Platform hooks implemented per-target (not in this portable source set). */
extern uint32_t cv_platform_millis(void);
extern void     cv_platform_sleep_ms(uint32_t ms);
extern bool     cv_platform_cartridge_detect(void);   /* reed switch / RFID presence */
extern bool     cv_platform_dock_detect(void);        /* pogo-pin or NFC field present */
extern void     cv_platform_set_status_led(cv_state_t state);

/* Reads the Verity cartridge's passive RFID/NFC tag and decodes its
 * encoded specimen_type_code — mirrors the sensor drivers' shim
 * pattern (a real NFC reader IC, e.g. an ST25R3916, sits behind this).
 * Called once on cartridge insertion to select the active LabProfile. */
extern specimen_type_t cv_platform_read_cartridge_specimen_type(void);

#define SAMPLE_PERIOD_MS 1000

static as7341_baseline_t s_optical_baseline;
static float s_thermal_integral_accum = 0.0f;
static float s_shock_event_count_accum = 0.0f;

/* Active correction state — set once per cartridge insertion, driven
 * every sample cycle thereafter. */
static lab_profile_t s_active_profile;

static tec_config_t s_tec_config;
static tec_control_state_t s_tec_state;

static stiffness_actuator_config_t s_stiffness_config;
static stiffness_actuator_state_t  s_stiffness_state;

static void init_all_drivers(void) {
    bme688_config_t voc_cfg = {
        .i2c_address = BME688_I2C_ADDR_PRIMARY,
        .heater_temp_c = 320,
        .heater_duration_ms = 150,
        .duty_cycle_hz = 0.2f, /* one heater pulse every 5s to conserve battery */
    };
    bme688_init(&voc_cfg);

    as7341_init(50 /* ms integration */, 4 /* mid gain */);

    lsm6dsox_init();
    lsm6dsox_configure_fsm_wake(LSM6DSOX_WAKE_THRESHOLD_G);

    max31865_config_t core_cfg = {
        .rtd_type = RTD_TYPE_PT1000, .reference_resistor_ohm = 4300.0f,
        .spi_cs_pin = 0, .wire_3_mode = false,
    };
    max31865_init(RTD_CHANNEL_CORE, &core_cfg);

    max31865_config_t ambient_cfg = core_cfg;
    ambient_cfg.spi_cs_pin = 1;
    max31865_init(RTD_CHANNEL_AMBIENT, &ambient_cfg);

    /* TEC thermal trim — see tec_driver.h for the max_duty_cycle safety
     * rationale (never drive the Peltier near its rated spec) and the
     * deadband rationale (prevent heat/cool mode chatter). PID gains are
     * first-pass starting points; edge-ai/simulation/thermal_control_sim.py
     * tunes these against a simulated thermal plant before real bring-up. */
    s_tec_config = (tec_config_t){
        .pwm_pin = 10, .direction_pin_a = 11, .direction_pin_b = 12,
        .max_duty_cycle = 0.6f,
        .mode_switch_deadband_c = 0.5f,
    };
    tec_init(&s_tec_config);
    tec_control_init(&s_tec_state, /*kp=*/0.08f, /*ki=*/0.015f, /*kd=*/0.05f);

    /* Semi-active stiffness mount — thresholds are first-pass placeholders
     * pending real shock-profile data from a built chassis; see
     * stiffness_actuator_driver.h's physics note on why this operates on
     * a 30s timescale rather than per-shock. */
    s_stiffness_config = (stiffness_actuator_config_t){
        .servo_pwm_pin = 13,
        .evaluation_interval_ms = 30000,
        .shock_rate_firm_threshold_per_min = 4.0f,
        .shock_rate_soft_threshold_per_min = 0.5f,
        .peak_g_firm_override = 10.0f,  /* pneumatic-tube-grade event, per README's shock threshold */
    };
    stiffness_actuator_init(&s_stiffness_config, &s_stiffness_state);

    flash_ringbuffer_init();
    pqi_inference_init();
}

static void capture_optical_baseline_if_needed(bool cartridge_just_inserted) {
    if (!cartridge_just_inserted) return;
    as7341_reading_t reading;
    if (as7341_read(&reading) == 0) {
        as7341_capture_baseline(&s_optical_baseline, &reading);
    }
}

static void select_lab_profile_if_needed(bool cartridge_just_inserted) {
    if (!cartridge_just_inserted) return;

    specimen_type_t specimen_type = cv_platform_read_cartridge_specimen_type();
    s_active_profile = lab_profile_select_for_cartridge(specimen_type);

    /* Fresh cartridge, fresh accumulators — a new specimen shouldn't
     * inherit the previous one's thermal/shock history. */
    s_thermal_integral_accum = 0.0f;
    s_shock_event_count_accum = 0.0f;
    tec_control_init(&s_tec_state, s_tec_state.kp, s_tec_state.ki, s_tec_state.kd);
}

int main(void) {
    init_all_drivers();

    cv_state_context_t state_ctx;
    cv_state_machine_init(&state_ctx);

    bool cartridge_present_prev = false;

    for (;;) {
        bool cartridge_present = cv_platform_cartridge_detect();
        bool docked = cv_platform_dock_detect();

        capture_optical_baseline_if_needed(cartridge_present && !cartridge_present_prev);
        select_lab_profile_if_needed(cartridge_present && !cartridge_present_prev);
        cartridge_present_prev = cartridge_present;

        pqi_inference_result_t pqi_result = {0};

        if (cartridge_present) {
            cv_raw_sensor_snapshot_t snapshot;
            bme688_read(&snapshot.voc);
            as7341_read(&snapshot.optical);
            lsm6dsox_read_sample(&snapshot.imu);
            max31865_read(RTD_CHANNEL_CORE, &snapshot.rtd_core);
            max31865_read(RTD_CHANNEL_AMBIENT, &snapshot.rtd_ambient);

            /* Accumulate the running thermal term feeding the PQI model —
             * excess is now measured against the *active LabProfile's*
             * upper bound rather than a single hardcoded envelope, so a
             * tumor resection and a formalin-fixed cassette are scored
             * against their own appropriate targets (see lab_profile.h). */
            float excess_temp = snapshot.rtd_core.temperature_c - s_active_profile.target_temp_max_c;
            if (excess_temp > 0) {
                s_thermal_integral_accum += excess_temp * (SAMPLE_PERIOD_MS / 1000.0f);
            }

            uint32_t new_shock_events_this_sample = 0;
            float peak_g_this_sample = lsm6dsox_accel_magnitude(&snapshot.imu);
            lsm6dsox_shock_event_t shock_event;
            while (lsm6dsox_pop_shock_event(&shock_event)) {
                s_shock_event_count_accum += 1.0f;
                new_shock_events_this_sample += 1;
                if (shock_event.peak_g > peak_g_this_sample) {
                    peak_g_this_sample = shock_event.peak_g;
                }
            }

            /* --- Active correction: thermal trim toward the LabProfile band --- */
            tec_control_update(&s_tec_state, &s_tec_config, snapshot.rtd_core.temperature_c,
                                &s_active_profile, cv_platform_millis());

            /* --- Active correction: semi-active mount stiffness --- */
            stiffness_actuator_update_window(&s_stiffness_state, new_shock_events_this_sample,
                                              peak_g_this_sample);
            stiffness_actuator_evaluate(&s_stiffness_state, &s_stiffness_config, cv_platform_millis());

            pqi_feature_vector_t features;
            telemetry_build_feature_vector(&snapshot, s_thermal_integral_accum,
                                            s_shock_event_count_accum,
                                            &s_optical_baseline, &features);

            pqi_inference_run(&features, &pqi_result);

            telemetry_frame_t frame;
            telemetry_build_frame(&snapshot, &pqi_result, cv_platform_millis(), &frame);
            flash_ringbuffer_append(&frame);
        } else {
            /* No specimen present — make sure the TEC isn't left driving
             * current with nothing to correct for. */
            tec_disable();
        }

        cv_state_machine_tick(&state_ctx, cartridge_present, docked, &pqi_result);
        cv_platform_set_status_led(state_ctx.current_state);

        if (docked && state_ctx.current_state == CV_STATE_SYNCING) {
            /* TODO: hand off to the docking protocol — see
             * middleware/dock-daemon/src/index.js for the host-side half
             * of this handshake. The batch sync itself (UART pogo-pin /
             * NFC transfer of unconfirmed frames, then
             * flash_ringbuffer_erase_confirmed_range() on cryptographic
             * ack) is implemented in the docking transport module, not
             * shown in this portable core loop. */
        }

        cv_platform_sleep_ms(SAMPLE_PERIOD_MS);
    }

    return 0; /* unreachable */
}