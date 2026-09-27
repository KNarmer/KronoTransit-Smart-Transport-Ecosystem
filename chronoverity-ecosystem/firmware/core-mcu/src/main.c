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
 * -----------------------------------------------------------------------
 */

#include <stdint.h>
#include <stdbool.h>

#include "state_machine.h"
#include "flash_ringbuffer.h"
#include "telemetry.h"
#include "../tinyml/pqi_inference.h"
#include "../drivers/bme688_driver.h"
#include "../drivers/as7341_driver.h"
#include "../drivers/lsm6dsox_driver.h"
#include "../drivers/max31865_rtd.h"

/* Platform hooks implemented per-target (not in this portable source set). */
extern uint32_t cv_platform_millis(void);
extern void     cv_platform_sleep_ms(uint32_t ms);
extern bool     cv_platform_cartridge_detect(void);   /* reed switch / RFID presence */
extern bool     cv_platform_dock_detect(void);        /* pogo-pin or NFC field present */
extern void     cv_platform_set_status_led(cv_state_t state);

#define SAMPLE_PERIOD_MS 1000

static as7341_baseline_t s_optical_baseline;
static float s_thermal_integral_accum = 0.0f;
static float s_shock_event_count_accum = 0.0f;

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

int main(void) {
    init_all_drivers();

    cv_state_context_t state_ctx;
    cv_state_machine_init(&state_ctx);

    bool cartridge_present_prev = false;

    for (;;) {
        bool cartridge_present = cv_platform_cartridge_detect();
        bool docked = cv_platform_dock_detect();

        capture_optical_baseline_if_needed(cartridge_present && !cartridge_present_prev);
        cartridge_present_prev = cartridge_present;

        pqi_inference_result_t pqi_result = {0};

        if (cartridge_present) {
            cv_raw_sensor_snapshot_t snapshot;
            bme688_read(&snapshot.voc);
            as7341_read(&snapshot.optical);
            lsm6dsox_read_sample(&snapshot.imu);
            max31865_read(RTD_CHANNEL_CORE, &snapshot.rtd_core);
            max31865_read(RTD_CHANNEL_AMBIENT, &snapshot.rtd_ambient);

            /* Accumulate the running thermal/shock terms feeding the PQI
             * model — see README's PQI formula for w1/w2 terms. */
            float excess_temp = snapshot.rtd_core.temperature_c - 4.0f; /* cold-chain envelope */
            if (excess_temp > 0) {
                s_thermal_integral_accum += excess_temp * (SAMPLE_PERIOD_MS / 1000.0f);
            }
            lsm6dsox_shock_event_t shock_event;
            while (lsm6dsox_pop_shock_event(&shock_event)) {
                s_shock_event_count_accum += 1.0f;
            }

            pqi_feature_vector_t features;
            telemetry_build_feature_vector(&snapshot, s_thermal_integral_accum,
                                            s_shock_event_count_accum,
                                            &s_optical_baseline, &features);

            pqi_inference_run(&features, &pqi_result);

            telemetry_frame_t frame;
            telemetry_build_frame(&snapshot, &pqi_result, cv_platform_millis(), &frame);
            flash_ringbuffer_append(&frame);
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
