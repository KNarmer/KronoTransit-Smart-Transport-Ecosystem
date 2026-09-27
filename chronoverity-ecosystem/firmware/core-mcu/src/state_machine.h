/*
 * state_machine.h — Top-level ChronoCase carrier state machine
 * -----------------------------------------------------------------------
 *           ┌──────────┐   cartridge inserted   ┌──────────────┐
 *           │   IDLE   ├───────────────────────►│  MONITORING  │
 *           └──────────┘                        └──────┬───────┘
 *                ▲                                     │ PQI < breach
 *                │ dock sync complete                   ▼ threshold
 *           ┌──────────┐   docked (pogo/NFC)      ┌──────────────┐
 *           │ SYNCING  │◄─────────────────────────┤   DEGRADED   │
 *           └──────────┘                          └──────────────┘
 * -----------------------------------------------------------------------
 */

#ifndef CV_STATE_MACHINE_H
#define CV_STATE_MACHINE_H

#include <stdint.h>
#include <stdbool.h>
#include "../tinyml/pqi_inference.h"

typedef enum {
    CV_STATE_IDLE = 0,        /* no cartridge inserted; low-power standby */
    CV_STATE_MONITORING,      /* cartridge in place; active sensing + logging */
    CV_STATE_DEGRADED,        /* PQI breached threshold; alert latched */
    CV_STATE_SYNCING          /* docked; uploading telemetry to the receiving bay */
} cv_state_t;

typedef struct {
    cv_state_t current_state;
    uint32_t   state_entry_timestamp_ms;
    bool       incident_latched;
    pqi_inference_result_t last_result;
} cv_state_context_t;

void cv_state_machine_init(cv_state_context_t *ctx);

/*
 * Call once per sensor sample cycle (nominally every 1-5s, driven by the
 * FSM wake interrupt from the IMU or a periodic RTC tick, whichever
 * fires first — see lsm6dsox_driver.h's low-power wake configuration).
 */
void cv_state_machine_tick(cv_state_context_t *ctx, bool cartridge_present, bool docked,
                            const pqi_inference_result_t *pqi_result);

const char *cv_state_to_string(cv_state_t state);

#endif /* CV_STATE_MACHINE_H */
