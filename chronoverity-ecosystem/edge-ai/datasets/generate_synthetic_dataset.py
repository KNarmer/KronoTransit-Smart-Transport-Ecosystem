"""
generate_synthetic_dataset.py
-------------------------------------------------------------------------
Generates a synthetic labeled dataset of ChronoVerity sensor windows for
training the PQI TinyML model, since real fleet telemetry does not exist
yet at the Conrad Challenge prototype stage.

Each row is one 60-second feature window (matching
edge-ai/training/train_pqi_model.py's FEATURE_NAMES and
firmware/core-mcu/tinyml/pqi_inference.h's pqi_feature_vector_t), labeled
VIABLE / WARNING / BREACHED according to physically-motivated rules
rather than pure noise, so the trained model reflects real degradation
physics (thermal + shock + off-gassing + spectral shift) instead of
memorizing arbitrary synthetic patterns.

Usage:
    python generate_synthetic_dataset.py --rows 20000 --out synthetic_pqi_dataset.csv
"""

import argparse
import csv
import random

FEATURE_NAMES = [
    "thermal_integral",     # degree-seconds above the cold-chain envelope
    "shock_peak_g",          # max |a| observed in the window
    "shock_event_count",     # number of >2G threshold crossings
    "voc_slope",             # ohms/sec, gas resistance rate of change
    "spectral_delta",        # Euclidean distance from AS7341 baseline
    "core_ambient_diff",     # MAX31865 core-vs-ambient temp differential (C)
]

LABELS = ["VIABLE", "WARNING", "BREACHED"]


def sample_row(rng: random.Random):
    # Most windows are quiet transit: near-zero everything.
    profile = rng.choices(
        ["quiet", "thermal_event", "shock_event", "voc_leak", "compound_failure"],
        weights=[0.55, 0.15, 0.15, 0.10, 0.05],
    )[0]

    thermal_integral = 0.0
    shock_peak_g = 1.0 + rng.uniform(0, 0.3)  # resting gravity + sensor noise
    shock_event_count = 0.0
    voc_slope = rng.uniform(-5, 5)  # baseline sensor drift, ohms/sec
    spectral_delta = rng.uniform(0, 8)  # baseline optical noise
    core_ambient_diff = rng.uniform(-1.0, 1.0)

    if profile == "thermal_event":
        thermal_integral = rng.uniform(20, 400)
        core_ambient_diff = rng.uniform(1.5, 6.0)
    elif profile == "shock_event":
        shock_peak_g = rng.uniform(3.0, 15.0)
        shock_event_count = rng.uniform(1, 6)
    elif profile == "voc_leak":
        voc_slope = rng.uniform(-800, -100)  # rapid resistance drop = off-gassing
        spectral_delta = rng.uniform(10, 60)
    elif profile == "compound_failure":
        thermal_integral = rng.uniform(200, 900)
        shock_peak_g = rng.uniform(8.0, 20.0)
        shock_event_count = rng.uniform(2, 10)
        voc_slope = rng.uniform(-1000, -300)
        spectral_delta = rng.uniform(30, 100)
        core_ambient_diff = rng.uniform(4.0, 10.0)

    # Label rule mirrors the README's PQI formula intent: isolated mild
    # signals stay VIABLE; compounding signals escalate to WARNING/BREACHED.
    severity = (
        0.015 * thermal_integral
        + 0.08 * shock_peak_g * shock_event_count
        + 0.02 * abs(voc_slope)
        + 0.004 * spectral_delta
    )
    pqi = max(0.0, 1.0 - severity / 10.0)

    if pqi >= 0.85:
        label = "VIABLE"
    elif pqi >= 0.70:
        label = "WARNING"
    else:
        label = "BREACHED"

    return {
        "thermal_integral": round(thermal_integral, 3),
        "shock_peak_g": round(shock_peak_g, 3),
        "shock_event_count": round(shock_event_count, 3),
        "voc_slope": round(voc_slope, 3),
        "spectral_delta": round(spectral_delta, 3),
        "core_ambient_diff": round(core_ambient_diff, 3),
        "pqi_reference": round(pqi, 4),
        "label": label,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=20000)
    parser.add_argument("--out", type=str, default="synthetic_pqi_dataset.csv")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    rng = random.Random(args.seed)

    with open(args.out, "w", newline="") as f:
        writer = csv.DictWriter(
            f, fieldnames=FEATURE_NAMES + ["pqi_reference", "label"]
        )
        writer.writeheader()
        for _ in range(args.rows):
            writer.writerow(sample_row(rng))

    print(f"Wrote {args.rows} synthetic rows to {args.out}")


if __name__ == "__main__":
    main()
