/*
 * flash_ringbuffer.h — SPI NOR flash wear-leveling ring buffer
 * -----------------------------------------------------------------------
 * Stores fixed-size telemetry frames (timestamp, temps, VOC, optical
 * channels, peak G-force, running PQI) with a SHA-256 hash chained across
 * blocks so the log is tamper-evident for clinical chain-of-custody —
 * a technician cannot quietly edit a past frame without breaking every
 * subsequent block's hash.
 * -----------------------------------------------------------------------
 */

#ifndef CV_FLASH_RINGBUFFER_H
#define CV_FLASH_RINGBUFFER_H

#include <stdint.h>
#include <stdbool.h>

#define FLASH_CAPACITY_BYTES   (64UL * 1024 * 1024)  /* 64MB SPI NOR, per README hardware spec */
#define FRAME_SIZE_BYTES       64
#define HASH_SIZE_BYTES        32   /* SHA-256 digest */

#pragma pack(push, 1)
typedef struct {
    uint32_t timestamp_ms;
    float    temp_core_c;
    float    temp_ambient_c;
    float    voc_gas_resistance_ohm;
    uint16_t optical_channels[10];
    float    peak_g_force;
    float    running_pqi;
    uint8_t  prev_block_hash[HASH_SIZE_BYTES];
    uint8_t  reserved[FRAME_SIZE_BYTES - 4 - 4 - 4 - 4 - 20 - 4 - 4 - HASH_SIZE_BYTES];
} telemetry_frame_t;
#pragma pack(pop)

int  flash_ringbuffer_init(void);

/*
 * Appends a frame, computing its hash over (frame fields + prev block's
 * hash) and storing that as this frame's prev_block_hash for the *next*
 * write — i.e., a standard hash chain / lightweight blockchain pattern.
 */
int  flash_ringbuffer_append(telemetry_frame_t *frame);

int  flash_ringbuffer_read_frame(uint32_t index, telemetry_frame_t *out_frame);
uint32_t flash_ringbuffer_frame_count(void);

/* Verifies the hash chain from the oldest retained frame to the newest.
 * Returns true if intact, false if any block's hash doesn't match. Used
 * by the docking daemon before accepting a batch sync (see
 * middleware/dock-daemon/). */
bool flash_ringbuffer_verify_chain(void);

/* Called only after the docking daemon has cryptographically confirmed
 * a successful upload (see README's docking-layer sync protocol). */
int  flash_ringbuffer_erase_confirmed_range(uint32_t start_index, uint32_t end_index);

#endif /* CV_FLASH_RINGBUFFER_H */
