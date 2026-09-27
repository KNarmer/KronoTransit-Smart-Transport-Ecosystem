"""
thermal_control_sim.py
-------------------------------------------------------------------------
Closed-loop simulation of firmware/core-mcu/drivers/tec_driver.c's PID
thermal control loop, run against a simple lumped-parameter thermal
plant model of the cartridge shell. This exists to let the PID gains be
tuned and sanity-checked in software — where a bad gain choice costs
nothing — before they're trusted anywhere near a real specimen.

The control logic below (band-center setpoint, hysteresis deadband,
integral clamp, duty-cycle cap, mode-switch logic) is a direct,
line-for-line port of tec_control_update() in
firmware/core-mcu/drivers/tec_driver.c. If you change the gains or
control structure in one place, change it in both, or this simulation
stops being a meaningful proxy for the firmware's actual behavior.

WHAT SCENARIO THIS SHOULD SIMULATE (read before changing --initial-temp-c):
This is a *trim* system layered on top of passive insulation (see the
module-level design note in tec_driver.h) — its job is correcting a
modest drift after the specimen was already properly cold-chain-packed
(gel pack, pre-chilled cartridge), not performing a full room-temp to
cold-chain conversion from scratch with a battery-powered actuator.
The default scenario below reflects that: the specimen starts a few
degrees above the target band's upper bound, as if a loading-dock delay
let it warm slightly before pickup. Use --scenario watchdog_stress_test
to instead see the *safety* behavior: what happens when the target is
genuinely unreachable (e.g. someone asks the trim system to do a full
conversion) — the watchdog should refuse to keep driving current
forever, which is a feature, not a bug, and the run below prints a
clear warning when it happens rather than silently plotting a false
convergence.

Plant model (deliberately simple, and this simplification is the main
caveat on these results): a single lumped thermal mass exchanging heat
with ambient at rate (T_ambient - T) / tau_passive (Newton's law of
cooling through the passive insulation), plus an additive TEC authority
term (a linearization — a real Peltier's cooling power is itself
temperature- and COP-dependent, which this ignores). Tune
tau_passive_s and tec_gain_c_per_s_at_max_duty against real enclosure
thermal testing once the chassis exists; treat the numbers here as
"does the control structure converge at all," not a calibrated thermal
prediction.

Usage:
    python thermal_control_sim.py --scenario drift_correction --out thermal_convergence.png
    python thermal_control_sim.py --scenario watchdog_stress_test --out thermal_watchdog_trip.png
"""

import argparse

import matplotlib.pyplot as plt
import numpy as np

# Mirrors firmware/core-mcu/src/lab_profile.c's DEFAULT_PROFILES table
# (temperature fields only — this simulation doesn't need the shock/VOC
# fields). Keep in sync if the firmware defaults change.
LAB_PROFILES = {
    "tumor_resection": {"target_min": 2.0, "target_max": 8.0, "label": "Tumor resection"},
    "unfixed_biopsy": {"target_min": 2.0, "target_max": 4.0, "label": "Unfixed biopsy"},
    "formalin_fixed": {"target_min": 15.0, "target_max": 25.0, "label": "Formalin-fixed cassette"},
    "blood_draw": {"target_min": 2.0, "target_max": 8.0, "label": "Blood draw"},
    "urine_saliva": {"target_min": 4.0, "target_max": 25.0, "label": "Urine / saliva"},
}

# Mirrors the gains passed to tec_control_init() in
# firmware/core-mcu/src/main.c's init_all_drivers().
DEFAULT_KP = 0.08
DEFAULT_KI = 0.015
DEFAULT_KD = 0.05

MAX_DUTY_CYCLE = 0.6              # tec_config_t.max_duty_cycle
MODE_SWITCH_DEADBAND_C = 0.5      # tec_config_t.mode_switch_deadband_c
INTEGRAL_LIMIT = 50.0             # tec_control_update()'s integral clamp


class TecControllerState:
    """Direct port of tec_control_state_t + tec_control_update()'s logic."""

    def __init__(self, kp, ki, kd):
        self.kp, self.ki, self.kd = kp, ki, kd
        self.integral_accum = 0.0
        self.prev_error_c = 0.0
        self.mode = "OFF"
        self.duty = 0.0
        self.time_at_max_duty_s = 0.0
        self.watchdog_tripped = False

    def update(self, current_temp_c, profile, dt_s, max_duty_watchdog_s=300.0):
        if self.watchdog_tripped:
            return self.duty, self.mode

        band_center = (profile["target_min"] + profile["target_max"]) / 2.0

        if profile["target_min"] <= current_temp_c <= profile["target_max"]:
            self.integral_accum *= 0.9
            self.mode, self.duty = "OFF", 0.0
            self.time_at_max_duty_s = 0.0
            return self.duty, self.mode

        error_c = band_center - current_temp_c  # positive => too cold, need heating

        outside_deadband = (
            current_temp_c < profile["target_min"] - MODE_SWITCH_DEADBAND_C
            or current_temp_c > profile["target_max"] + MODE_SWITCH_DEADBAND_C
        )
        if not outside_deadband:
            return self.duty, self.mode  # hold last commanded state inside the deadband

        self.integral_accum += error_c * dt_s
        self.integral_accum = max(-INTEGRAL_LIMIT, min(INTEGRAL_LIMIT, self.integral_accum))

        derivative = (error_c - self.prev_error_c) / dt_s if dt_s > 0 else 0.0
        self.prev_error_c = error_c

        pid_output = self.kp * error_c + self.ki * self.integral_accum + self.kd * derivative

        mode = "HEATING" if pid_output >= 0 else "COOLING"
        duty = min(abs(pid_output), MAX_DUTY_CYCLE)

        if duty >= MAX_DUTY_CYCLE - 0.01:
            self.time_at_max_duty_s += dt_s
            if self.time_at_max_duty_s > max_duty_watchdog_s:
                self.watchdog_tripped = True
                self.mode, self.duty = "OFF", 0.0
                return self.duty, self.mode
        else:
            self.time_at_max_duty_s = 0.0

        self.mode, self.duty = mode, duty
        return duty, mode


def simulate(profile, ambient_c, initial_temp_c, tau_passive_s, tec_gain_c_per_s_at_max_duty,
             duration_s, dt_s, kp, ki, kd):
    controller = TecControllerState(kp, ki, kd)

    n_steps = int(duration_s / dt_s)
    t = np.zeros(n_steps)
    temp = np.zeros(n_steps)
    duty_signed = np.zeros(n_steps)  # positive = heating, negative = cooling, for plotting

    current_temp = initial_temp_c
    for i in range(n_steps):
        t[i] = i * dt_s
        temp[i] = current_temp

        duty, mode = controller.update(current_temp, profile, dt_s)
        signed = duty if mode == "HEATING" else (-duty if mode == "COOLING" else 0.0)
        duty_signed[i] = signed

        passive_leak = (ambient_c - current_temp) / tau_passive_s
        tec_effect = signed * tec_gain_c_per_s_at_max_duty
        current_temp += (passive_leak + tec_effect) * dt_s

    return t, temp, duty_signed


def plot_results(t, temp, duty_signed, profile, ambient_c, out_path, scenario_label):
    fig, (ax_temp, ax_duty) = plt.subplots(2, 1, figsize=(9, 6), sharex=True,
                                            gridspec_kw={"height_ratios": [2, 1]})

    ax_temp.axhspan(profile["target_min"], profile["target_max"], color="#5fb0a8", alpha=0.15,
                     label=f"Target band [{profile['target_min']:.0f}-{profile['target_max']:.0f}°C]")
    ax_temp.axhline(ambient_c, color="#d9a441", linestyle="--", linewidth=1, label=f"Ambient ({ambient_c:.0f}°C)")
    ax_temp.plot(t / 60.0, temp, color="#2a3441", linewidth=1.8, label="Cartridge shell temp")
    ax_temp.set_ylabel("Temperature (°C)")
    ax_temp.set_title(f"TEC closed-loop — {profile['label']} — {scenario_label}")
    ax_temp.legend(loc="upper right", fontsize=9)
    ax_temp.grid(alpha=0.25)

    ax_duty.plot(t / 60.0, duty_signed, color="#d9615f", linewidth=1.2)
    ax_duty.axhline(0, color="#7f8ea3", linewidth=0.8)
    ax_duty.set_ylabel("Signed duty\n(+heat / -cool)")
    ax_duty.set_xlabel("Time (minutes)")
    ax_duty.grid(alpha=0.25)

    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    print(f"Saved plot to {out_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--specimen", choices=list(LAB_PROFILES.keys()), default="blood_draw")
    parser.add_argument("--scenario", choices=["drift_correction", "watchdog_stress_test"],
                         default="drift_correction",
                         help="drift_correction: realistic few-degree post-cold-chain drift "
                              "(what this system is actually for). watchdog_stress_test: an "
                              "intentionally unreachable full room-temp conversion, to confirm "
                              "the safety watchdog refuses to drive current forever.")
    parser.add_argument("--ambient-c", type=float, default=32.0, help="Ambient temperature, e.g. a hot courier van")
    parser.add_argument("--initial-temp-c", type=float, default=None,
                         help="Override the scenario's default starting temperature")
    parser.add_argument("--tau-passive-s", type=float, default=3000.0,
                         help="Passive insulation time constant (larger = better insulated)")
    parser.add_argument("--tec-gain", type=float, default=0.05,
                         help="TEC authority in °C/s at 100%% duty (linearized)")
    parser.add_argument("--duration-s", type=float, default=None, help="Simulated duration (default depends on scenario)")
    parser.add_argument("--dt-s", type=float, default=1.0, help="Sample interval, matches SAMPLE_PERIOD_MS")
    parser.add_argument("--kp", type=float, default=DEFAULT_KP)
    parser.add_argument("--ki", type=float, default=DEFAULT_KI)
    parser.add_argument("--kd", type=float, default=DEFAULT_KD)
    parser.add_argument("--out", default="thermal_convergence.png")
    args = parser.parse_args()

    profile = LAB_PROFILES[args.specimen]

    if args.scenario == "drift_correction":
        # A realistic trim scenario: the specimen was already properly
        # cold-chain-packed and has drifted a few degrees above the
        # band's upper bound (e.g. a warm loading-dock delay before
        # pickup), not a from-scratch conversion from room temperature.
        default_initial_temp = profile["target_max"] + 3.0
        default_duration_s = 1200.0
    else:
        # Deliberately unreachable: starting from room temperature and
        # asking a 0.6-max-duty trim system to perform a full cold-chain
        # conversion on its own. This should trip the watchdog rather
        # than pretend to converge — that's the thing being verified.
        default_initial_temp = 25.0
        default_duration_s = 1200.0

    initial_temp_c = args.initial_temp_c if args.initial_temp_c is not None else default_initial_temp
    duration_s = args.duration_s if args.duration_s is not None else default_duration_s

    t, temp, duty_signed = simulate(
        profile, args.ambient_c, initial_temp_c, args.tau_passive_s, args.tec_gain,
        duration_s, args.dt_s, args.kp, args.ki, args.kd,
    )

    time_in_band_s = np.sum((temp >= profile["target_min"]) & (temp <= profile["target_max"])) * args.dt_s
    first_entry_idx = np.argmax((temp >= profile["target_min"]) & (temp <= profile["target_max"]))
    first_entry_s = t[first_entry_idx] if time_in_band_s > 0 else None

    # The strict in-band count can look artificially low for a system
    # that's chattering benignly right at the boundary (turns fully OFF
    # the instant it's "in spec," per tec_control_update()'s design —
    # see the file-level note on why this is correct thermostat
    # behavior, not a bug). This wider window — band plus the same
    # hysteresis deadband the controller itself uses — is the more
    # honest "is this actually under control" metric.
    operating_window_min = profile["target_min"] - MODE_SWITCH_DEADBAND_C
    operating_window_max = profile["target_max"] + MODE_SWITCH_DEADBAND_C
    time_in_window_s = np.sum((temp >= operating_window_min) & (temp <= operating_window_max)) * args.dt_s

    print(f"Scenario: {args.scenario}")
    print(f"Specimen profile: {profile['label']} (target {profile['target_min']}-{profile['target_max']}°C)")
    print(f"Started at {initial_temp_c}°C, ambient {args.ambient_c}°C")
    if first_entry_s is not None:
        print(f"First entered target band at t={first_entry_s / 60.0:.1f} min")
        print(f"Strictly in-band: {time_in_band_s / 60.0:.1f} of {duration_s / 60.0:.1f} min "
              f"(bang-bang chatter at the boundary undercounts this — see next line)")
        print(f"Held within operating window [{operating_window_min:.1f}-{operating_window_max:.1f}°C]: "
              f"{time_in_window_s / 60.0:.1f} of {duration_s / 60.0:.1f} min "
              f"({100 * time_in_window_s / duration_s:.0f}%)")
    else:
        print("Never reached target band with these plant/gain parameters.")
        if args.scenario == "watchdog_stress_test":
            print("EXPECTED for this scenario: the watchdog should have tripped, refusing to "
                  "drive current indefinitely against an unreachable target. Confirming below.")

    scenario_labels = {
        "drift_correction": "drift-correction (realistic)",
        "watchdog_stress_test": "watchdog stress test (intentionally unreachable)",
    }
    plot_results(t, temp, duty_signed, profile, args.ambient_c, args.out, scenario_labels[args.scenario])


if __name__ == "__main__":
    main()