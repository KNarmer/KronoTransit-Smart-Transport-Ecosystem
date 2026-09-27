#include "lsm6dsox_driver.h"
#include <math.h>
#include <string.h>

#define SHOCK_EVENT_QUEUE_LEN 16

static lsm6dsox_shock_event_t s_event_queue[SHOCK_EVENT_QUEUE_LEN];
static volatile uint8_t s_queue_head = 0;
static volatile uint8_t s_queue_tail = 0;

int lsm6dsox_init(void) {
    /* TODO: verify WHO_AM_I (0x6C), configure CTRL1_XL (accel ODR/scale,
     * e.g. 104 Hz / ±16g to capture pneumatic-tube spikes without
     * clipping) and CTRL2_G (gyro ODR/scale). */
    memset(s_event_queue, 0, sizeof(s_event_queue));
    s_queue_head = s_queue_tail = 0;
    return 0;
}

int lsm6dsox_configure_fsm_wake(float threshold_g) {
    /* TODO: write the FSM program (ST's Unico/MotionFX tooling generates
     * the ucf/register sequence) that:
     *   1. Computes |a| from the 3-axis accel FIFO stream.
     *   2. Compares against threshold_g.
     *   3. Asserts INT1 (MD1_CFG.INT1_FSM1) on threshold crossing.
     * This lets the host MCU stay in STOP/deep-sleep between events,
     * which matters for a carrier expected to run for a full shift on
     * battery. */
    (void)threshold_g;
    return 0;
}

int lsm6dsox_read_sample(lsm6dsox_sample_t *out_sample) {
    if (!out_sample) return -1;

    /* TODO: burst-read OUTX_L_G .. OUTZ_H_XL (12 bytes) over I2C/SPI and
     * convert raw LSB counts to physical units using the configured
     * full-scale range (e.g. ±16g -> 0.488 mg/LSB). */
    memset(out_sample->accel_g, 0, sizeof(out_sample->accel_g));
    memset(out_sample->gyro_dps, 0, sizeof(out_sample->gyro_dps));
    out_sample->accel_g[2] = 1.0f; /* resting gravity placeholder */
    out_sample->timestamp_ms = 0;  /* caller should stamp with its own tick source */

    return 0;
}

/* Called from the FSM interrupt's deferred (non-ISR) handler once a
 * threshold-crossing event has been detected and its peak/duration
 * summarized from the FIFO. */
void lsm6dsox_push_shock_event_from_isr(float peak_g, uint32_t timestamp_ms, uint32_t duration_ms) {
    uint8_t next = (s_queue_head + 1) % SHOCK_EVENT_QUEUE_LEN;
    if (next == s_queue_tail) {
        return; /* queue full — drop oldest-first policy could be added if needed */
    }
    s_event_queue[s_queue_head].peak_g = peak_g;
    s_event_queue[s_queue_head].event_timestamp_ms = timestamp_ms;
    s_event_queue[s_queue_head].duration_ms = duration_ms;
    s_queue_head = next;
}

bool lsm6dsox_pop_shock_event(lsm6dsox_shock_event_t *out_event) {
    if (s_queue_tail == s_queue_head || !out_event) {
        return false;
    }
    *out_event = s_event_queue[s_queue_tail];
    s_queue_tail = (s_queue_tail + 1) % SHOCK_EVENT_QUEUE_LEN;
    return true;
}

float lsm6dsox_accel_magnitude(const lsm6dsox_sample_t *sample) {
    if (!sample) return 0.0f;
    float x = sample->accel_g[0], y = sample->accel_g[1], z = sample->accel_g[2];
    return sqrtf(x * x + y * y + z * z);
}
