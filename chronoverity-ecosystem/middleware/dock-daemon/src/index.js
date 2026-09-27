/**
 * index.js — ChronoVerity receiving-dock synchronization daemon
 * ---------------------------------------------------------------------
 * Runs on the small always-on computer inside a lab receiving bay dock
 * (a Raspberry Pi class device or an embedded Linux SBC). Responsibilities:
 *
 *   1. Detect a carrier docking (UART pogo-pin connect, or NFC field).
 *   2. Handshake and pull its unconfirmed telemetry frames.
 *   3. Verify the flash ring buffer's SHA-256 hash chain (see
 *      firmware/core-mcu/src/flash_ringbuffer.h) before trusting the batch.
 *   4. POST the verified batch to middleware/fhir-service for FHIR
 *      transformation and LIS delivery.
 *   5. Send a cryptographic ack back to the carrier so it can safely
 *      erase the confirmed flash range
 *      (flash_ringbuffer_erase_confirmed_range()).
 * ---------------------------------------------------------------------
 */

import { SerialPort } from "serialport";
import fetch from "node-fetch";
import winston from "winston";
import crypto from "node:crypto";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

const CONFIG = {
  serialPath: process.env.CV_DOCK_SERIAL_PATH || "/dev/ttyUSB0",
  baudRate: 115200,
  fhirServiceUrl: process.env.CV_FHIR_SERVICE_URL || "http://localhost:8000/ingest",
};

/**
 * Frames arriving over the wire mirror telemetry_frame_t from
 * firmware/core-mcu/src/flash_ringbuffer.h. In production this parses a
 * binary struct; here it's kept as a documented shape for clarity.
 *
 * @typedef {Object} TelemetryFrame
 * @property {number} timestampMs
 * @property {number} tempCoreC
 * @property {number} tempAmbientC
 * @property {number} vocGasResistanceOhm
 * @property {number[]} opticalChannels - 10 raw AS7341 channel values
 * @property {number} peakGForce
 * @property {number} runningPqi
 * @property {string} prevBlockHash - hex-encoded SHA-256
 */

class DockSession {
  constructor(port) {
    this.port = port;
    this.buffer = Buffer.alloc(0);
  }

  /** Verifies the hash chain client-side before forwarding, mirroring
   *  flash_ringbuffer_verify_chain() on the firmware side, so a
   *  compromised transport can't slip in a tampered batch even if the
   *  carrier's own check were somehow bypassed. */
  verifyChain(frames) {
    let runningHash = Buffer.alloc(32).toString("hex");
    for (const frame of frames) {
      if (frame.prevBlockHash !== runningHash) {
        return false;
      }
      const digestInput = JSON.stringify({ ...frame, prevBlockHash: undefined });
      runningHash = crypto.createHash("sha256").update(digestInput).digest("hex");
    }
    return true;
  }

  async handshake() {
    logger.info("Carrier detected on dock. Beginning handshake...");
    // TODO: send a HELLO byte sequence, read back the carrier's serial ID
    // and firmware version over the SerialPort connection, matching the
    // protocol the firmware's docking-layer transport module implements.
    return { carrierId: "UNKNOWN", firmwareVersion: "UNKNOWN" };
  }

  async pullUnconfirmedFrames() {
    // TODO: request + parse the binary frame stream over UART. Returning
    // an empty array keeps this daemon runnable end-to-end without
    // hardware attached, for integration testing against
    // middleware/fhir-service.
    return /** @type {TelemetryFrame[]} */ ([]);
  }

  async sendAckToCarrier(confirmedUpToIndex) {
    // TODO: write the cryptographic ack (e.g. HMAC of the confirmed
    // range) back over serial so firmware can safely call
    // flash_ringbuffer_erase_confirmed_range().
    logger.info(`Acked frames up to index ${confirmedUpToIndex}`);
  }
}

async function forwardToFhirService(carrierId, frames) {
  const response = await fetch(CONFIG.fhirServiceUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ carrierId, frames }),
  });

  if (!response.ok) {
    throw new Error(`FHIR service rejected batch: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function handleDockEvent(port) {
  const session = new DockSession(port);

  try {
    const { carrierId } = await session.handshake();
    const frames = await session.pullUnconfirmedFrames();

    if (frames.length === 0) {
      logger.info(`Carrier ${carrierId} docked with no unconfirmed frames.`);
      return;
    }

    if (!session.verifyChain(frames)) {
      logger.error(`Carrier ${carrierId}: hash chain verification FAILED. Batch rejected, not acked.`);
      return;
    }

    const result = await forwardToFhirService(carrierId, frames);
    logger.info(`Carrier ${carrierId}: forwarded ${frames.length} frames. FHIR service response: ${JSON.stringify(result)}`);

    await session.sendAckToCarrier(frames.length - 1);
  } catch (err) {
    logger.error(`Dock sync failed: ${err.message}`);
  }
}

function main() {
  logger.info(`Starting ChronoVerity dock daemon on ${CONFIG.serialPath}`);

  const port = new SerialPort({ path: CONFIG.serialPath, baudRate: CONFIG.baudRate }, (err) => {
    if (err) {
      logger.error(`Could not open serial port ${CONFIG.serialPath}: ${err.message}`);
      logger.info("Running in offline/dev mode — dock events will not fire without hardware.");
      return;
    }
    // TODO: listen for the carrier's docking-detect signal (a specific
    // byte sequence, or a GPIO/NFC-field-present event depending on the
    // dock's physical interface) and call handleDockEvent(port) on it.
  });

  process.on("SIGINT", () => {
    logger.info("Shutting down dock daemon.");
    port.close(() => process.exit(0));
  });
}

main();

export { DockSession, forwardToFhirService };
