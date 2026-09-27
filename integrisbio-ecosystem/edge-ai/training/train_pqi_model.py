"""
train_pqi_model.py
-------------------------------------------------------------------------
Trains a small fully-connected classifier that maps a 60-second sensor
feature window to a viability class (VIABLE / WARNING / BREACHED), which
is then quantized to INT8 by edge-ai/quantization/quantize_to_int8.py for
deployment as firmware/core-mcu/tinyml's pqi_model_int8.tflite.

The feature order here MUST match:
  - firmware/core-mcu/tinyml/pqi_inference.h's pqi_feature_vector_t
  - edge-ai/datasets/generate_synthetic_dataset.py's FEATURE_NAMES

Usage:
    python train_pqi_model.py --data ../datasets/synthetic_pqi_dataset.csv \
                               --out pqi_model.h5
"""

import argparse

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow.keras import layers, models

FEATURE_NAMES = [
    "thermal_integral",
    "shock_peak_g",
    "shock_event_count",
    "voc_slope",
    "spectral_delta",
    "core_ambient_diff",
]
LABEL_MAP = {"VIABLE": 0, "WARNING": 1, "BREACHED": 2}


def build_model(input_dim: int) -> tf.keras.Model:
    """
    Deliberately tiny: this must fit a 24-32KB tensor arena on a
    Cortex-M33/M7 with room to spare for the rest of the firmware's RAM
    budget (flash ring buffer, sensor driver buffers, BLE stack, etc.).
    """
    model = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(16, activation="relu"),
        layers.Dense(8, activation="relu"),
        layers.Dense(len(LABEL_MAP), activation="softmax"),
    ])
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def representative_dataset_gen(x_train: np.ndarray):
    """Generator required by the INT8 post-training quantization step in
    quantize_to_int8.py — kept here so both scripts stay in sync on how
    the representative sample set is drawn."""
    for i in range(min(300, len(x_train))):
        yield [x_train[i : i + 1].astype(np.float32)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", required=True, help="Path to a CSV from generate_synthetic_dataset.py")
    parser.add_argument("--out", default="pqi_model.h5")
    parser.add_argument("--epochs", type=int, default=30)
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    x = df[FEATURE_NAMES].values.astype(np.float32)
    y = df["label"].map(LABEL_MAP).values.astype(np.int32)

    scaler = StandardScaler()
    x_scaled = scaler.fit_transform(x)

    x_train, x_test, y_train, y_test = train_test_split(
        x_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    model = build_model(input_dim=len(FEATURE_NAMES))
    model.summary()

    history = model.fit(
        x_train, y_train,
        validation_data=(x_test, y_test),
        epochs=args.epochs,
        batch_size=64,
        verbose=2,
    )

    test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
    print(f"\nTest accuracy: {test_acc:.4f} | Test loss: {test_loss:.4f}")

    model.save(args.out)
    np.save("feature_scaler_mean.npy", scaler.mean_)
    np.save("feature_scaler_scale.npy", scaler.scale_)
    print(f"Saved model to {args.out} and scaler stats for on-device feature normalization.")


if __name__ == "__main__":
    main()
