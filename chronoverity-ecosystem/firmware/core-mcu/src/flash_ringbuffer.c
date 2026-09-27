#include "flash_ringbuffer.h"
#include <string.h>

#define MAX_FRAMES (FLASH_CAPACITY_BYTES / FRAME_SIZE_BYTES)

static uint32_t s_write_index = 0;
static uint32_t s_frame_count = 0;
static uint8_t  s_last_hash[HASH_SIZE_BYTES];

/* TODO: replace with a real SHA-256 implementation (e.g. mbedTLS's
 * mbedtls_sha256(), already available if the target links mbedTLS for
 * its mTLS FHIR sync, or a small standalone implementation for
 * flash-constrained targets that don't need full mbedTLS). */
static void sha256(const uint8_t *data, uint32_t len, uint8_t out_digest[HASH_SIZE_BYTES]) {
    memset(out_digest, 0, HASH_SIZE_BYTES);
    for (uint32_t i = 0; i < len; i++) {
        out_digest[i % HASH_SIZE_BYTES] ^= data[i]; /* placeholder mixing, NOT cryptographically secure */
    }
}

/* TODO: platform NOR flash driver (QSPI on STM32H7 / QSPI on nRF5340)
 * implementing page program / sector erase / read at byte offset. */
static int flash_write_bytes(uint32_t offset, const uint8_t *data, uint32_t len) {
    (void)offset; (void)data; (void)len;
    return 0;
}
static int flash_read_bytes(uint32_t offset, uint8_t *out_data, uint32_t len) {
    (void)offset; (void)out_data; (void)len;
    return 0;
}

int flash_ringbuffer_init(void) {
    s_write_index = 0;
    s_frame_count = 0;
    memset(s_last_hash, 0, sizeof(s_last_hash));
    /* TODO: scan flash for the last valid frame (via hash-chain
     * continuity) to resume s_write_index/s_frame_count after a reboot,
     * rather than assuming a blank device. */
    return 0;
}

int flash_ringbuffer_append(telemetry_frame_t *frame) {
    if (!frame) return -1;

    memcpy(frame->prev_block_hash, s_last_hash, HASH_SIZE_BYTES);

    uint32_t offset = (s_write_index % MAX_FRAMES) * FRAME_SIZE_BYTES;
    if (flash_write_bytes(offset, (const uint8_t *)frame, sizeof(*frame)) != 0) {
        return -2;
    }

    sha256((const uint8_t *)frame, sizeof(*frame), s_last_hash);

    s_write_index++;
    if (s_frame_count < MAX_FRAMES) s_frame_count++;

    return 0;
}

int flash_ringbuffer_read_frame(uint32_t index, telemetry_frame_t *out_frame) {
    if (!out_frame || index >= s_frame_count) return -1;
    uint32_t offset = (index % MAX_FRAMES) * FRAME_SIZE_BYTES;
    return flash_read_bytes(offset, (uint8_t *)out_frame, sizeof(*out_frame));
}

uint32_t flash_ringbuffer_frame_count(void) {
    return s_frame_count;
}

bool flash_ringbuffer_verify_chain(void) {
    uint8_t running_hash[HASH_SIZE_BYTES];
    memset(running_hash, 0, sizeof(running_hash));

    for (uint32_t i = 0; i < s_frame_count; i++) {
        telemetry_frame_t frame;
        if (flash_ringbuffer_read_frame(i, &frame) != 0) return false;

        if (memcmp(frame.prev_block_hash, running_hash, HASH_SIZE_BYTES) != 0) {
            return false; /* chain broken — possible tamper */
        }
        sha256((const uint8_t *)&frame, sizeof(frame), running_hash);
    }
    return true;
}

int flash_ringbuffer_erase_confirmed_range(uint32_t start_index, uint32_t end_index) {
    if (start_index > end_index || end_index >= s_frame_count) return -1;
    /* TODO: sector-erase the corresponding flash region once the dock
     * daemon's cryptographic upload confirmation has been verified
     * (never erase speculatively — see middleware/dock-daemon/). */
    return 0;
}
