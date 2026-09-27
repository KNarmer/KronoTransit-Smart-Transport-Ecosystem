#include "state_machine.h"
#include <string.h>

/* TODO: wire to the platform's millisecond tick source (HAL_GetTick() on
 * STM32, or app_timer/RTC on nRF5340). */
extern uint32_t cv_platform_millis(void);

static void transition(cv_state_context_t *ctx, cv_state_t next) {
    if (ctx->current_state == next) return;
    ctx->current_state = next;
    ctx->state_entry_timestamp_ms = cv_platform_millis();
}

void cv_state_machine_init(cv_state_context_t *ctx) {
    memset(ctx, 0, sizeof(*ctx));
    ctx->current_state = CV_STATE_IDLE;
}

void cv_state_machine_tick(cv_state_context_t *ctx, bool cartridge_present, bool docked,
                            const pqi_inference_result_t *pqi_result) {
    if (pqi_result) {
        ctx->last_result = *pqi_result;
    }

    switch (ctx->current_state) {
        case CV_STATE_IDLE:
            if (cartridge_present) {
                ctx->incident_latched = false;
                transition(ctx, CV_STATE_MONITORING);
            }
            break;

        case CV_STATE_MONITORING:
            if (!cartridge_present) {
                transition(ctx, CV_STATE_IDLE);
            } else if (docked) {
                transition(ctx, CV_STATE_SYNCING);
            } else if (ctx->last_result.status == PQI_STATUS_BREACHED) {
                ctx->incident_latched = true;
                transition(ctx, CV_STATE_DEGRADED);
            }
            break;

        case CV_STATE_DEGRADED:
            /* Stays latched even if PQI recovers momentarily — a
             * degradation event is a clinical fact, not something to
             * silently un-flag. Only docking or cartridge removal exits
             * this state, and the incident remains in the telemetry log
             * regardless (see flash_ringbuffer.h). */
            if (!cartridge_present) {
                transition(ctx, CV_STATE_IDLE);
            } else if (docked) {
                transition(ctx, CV_STATE_SYNCING);
            }
            break;

        case CV_STATE_SYNCING:
            if (!docked) {
                /* Sync interrupted or complete; fall back based on
                 * whether a cartridge is still present for a subsequent
                 * leg of transit. */
                transition(ctx, cartridge_present ? CV_STATE_MONITORING : CV_STATE_IDLE);
            }
            break;
    }
}

const char *cv_state_to_string(cv_state_t state) {
    switch (state) {
        case CV_STATE_IDLE:       return "IDLE";
        case CV_STATE_MONITORING: return "MONITORING";
        case CV_STATE_DEGRADED:   return "DEGRADED";
        case CV_STATE_SYNCING:    return "SYNCING";
        default:                   return "UNKNOWN";
    }
}
