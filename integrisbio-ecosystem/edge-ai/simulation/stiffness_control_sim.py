"""
stiffness_control_sim.py
-------------------------------------------------------------------------
Simulates firmware/core-mcu/drivers/stiffness_actuator_driver.c's
semi-active mount stiffness controller against a synthetic transit
route: a calm courier-van leg, a rough pneumatic-tube leg, then calm
again. This is NOT simulating shock cancellation (see that header's
physics note — no actuator reacts within a shock's tens-of-milliseconds
duration); it's simulating the correct thing: whether the controller
picks the right baseline stiffness preset for the recent vibration
environment, on the ~30s evaluation timescale it actually operates on.

The control logic below is a direct port of
stiffness_actuator_evaluate() — same rolling-window accumulation, same
immediate peak-G override, same two-threshold hysteresis to prevent
preset chatter at a boundary. Keep both in sync if either changes.

Usage:
    python stiffness_control_sim.py --out stiffness_route_response.png
"""

import argparse

import matplotlib.pyplot as plt
import numpy as np

# Mirrors the config passed to stiffness_actuator_init() in
# firmware/core-mcu/src/main.c's init_all_drivers().
EVALUATION_INTERVAL_S = 30.0
SHOCK_RATE_FIRM_THRESHOLD_PER_MIN = 4.0
SHOCK_RATE_SOFT_THRESHOLD_PER_MIN = 0.5
PEAK_G_FIRM_OVERRIDE = 10.0

PRESET_SOFT, PRESET_MEDIUM, PRESET_FIRM = "SOFT", "MEDIUM", "FIRM"
PRESET_RANK = {PRESET_SOFT: 0, PRESET_MEDIUM: 1, PRESET_FIRM: 2}


class StiffnessControllerState:
    """Direct port of stiffness_actuator_state_t + stiffness_actuator_evaluate()."""

    def __init__(self):
        self.window_shock_event_count = 0
        self.window_peak_g = 0.0
        self.window_start_s = 0.0
        self.last_evaluation_s = None
        self.current_preset = PRESET_MEDIUM  # neutral default, matches stiffness_actuator_init()

    def update_window(self, new_shock_events, peak_g_this_sample):
        self.window_shock_event_count += new_shock_events
        self.window_peak_g = max(self.window_peak_g, peak_g_this_sample)

    def evaluate(self, now_s):
        # Immediate override: a single large shock forces FIRM right away.
        if self.window_peak_g >= PEAK_G_FIRM_OVERRIDE and self.current_preset != PRESET_FIRM:
            self.current_preset = PRESET_FIRM

        interval_elapsed = (
            self.last_evaluation_s is None or (now_s - self.last_evaluation_s) >= EVALUATION_INTERVAL_S
        )
        if not interval_elapsed:
            return self.current_preset

        window_duration_s = EVALUATION_INTERVAL_S if self.window_start_s == 0 else (now_s - self.window_start_s)
        window_duration_min = window_duration_s / 60.0
        shock_rate_per_min = self.window_shock_event_count / window_duration_min if window_duration_min > 0 else 0.0

        next_preset = self.current_preset
        if shock_rate_per_min >= SHOCK_RATE_FIRM_THRESHOLD_PER_MIN:
            next_preset = PRESET_MEDIUM if self.current_preset == PRESET_SOFT else PRESET_FIRM
        elif shock_rate_per_min <= SHOCK_RATE_SOFT_THRESHOLD_PER_MIN:
            next_preset = PRESET_MEDIUM if self.current_preset == PRESET_FIRM else PRESET_SOFT
        # else: hold — the hysteresis band between the two thresholds.

        self.current_preset = next_preset
        self.window_shock_event_count = 0
        self.window_peak_g = 0.0
        self.window_start_s = now_s
        self.last_evaluation_s = now_s
        return self.current_preset


def generate_route(rng, duration_s, dt_s):
    """
    Synthetic route: calm (courier van) -> rough (pneumatic tube leg) ->
    calm again. Shock events are drawn from a Poisson process whose rate
    changes with the route leg, matching the "events per minute" framing
    the controller itself reasons about.
    """
    n_steps = int(duration_s / dt_s)
    t = np.arange(n_steps) * dt_s

    calm_leg_s = duration_s * 0.35
    rough_leg_s = duration_s * 0.3
    # remaining duration is the second calm leg

    shock_events = np.zeros(n_steps, dtype=int)
    peak_g = np.zeros(n_steps)
    route_leg = np.empty(n_steps, dtype=object)

    for i in range(n_steps):
        ts = t[i]
        if ts < calm_leg_s:
            leg, rate_per_s, g_low, g_high = "calm (van)", 0.1 / 60.0, 1.0, 2.5
        elif ts < calm_leg_s + rough_leg_s:
            leg, rate_per_s, g_low, g_high = "rough (pneumatic tube)", 8.0 / 60.0, 2.0, 9.0
        else:
            leg, rate_per_s, g_low, g_high = "calm (van)", 0.15 / 60.0, 1.0, 2.5

        route_leg[i] = leg
        n_events = rng.poisson(rate_per_s * dt_s)
        shock_events[i] = n_events
        if n_events > 0:
            peak_g[i] = rng.uniform(g_low, g_high)

    return t, shock_events, peak_g, route_leg


def simulate(rng, duration_s, dt_s):
    controller = StiffnessControllerState()
    t, shock_events, peak_g, route_leg = generate_route(rng, duration_s, dt_s)

    presets = []
    for i in range(len(t)):
        controller.update_window(shock_events[i], peak_g[i])
        preset = controller.evaluate(t[i])
        presets.append(preset)

    return t, shock_events, peak_g, route_leg, presets


def plot_results(t, shock_events, peak_g, route_leg, presets, out_path):
    fig, (ax_route, ax_preset) = plt.subplots(2, 1, figsize=(9, 5.5), sharex=True,
                                               gridspec_kw={"height_ratios": [2, 1]})

    ax_route.scatter(t[shock_events > 0] / 60.0, peak_g[shock_events > 0],
                      s=14, color="#d9615f", label="Shock event (peak G)")
    ax_route.axhline(PEAK_G_FIRM_OVERRIDE, color="#7f8ea3", linestyle=":", linewidth=1,
                      label=f"Immediate-FIRM override ({PEAK_G_FIRM_OVERRIDE:.0f}G)")
    ax_route.set_ylabel("Peak G-force")
    ax_route.set_title("Route shock profile and mount stiffness response")
    ax_route.legend(loc="upper right", fontsize=8)
    ax_route.grid(alpha=0.25)

    # Shade the route legs for context.
    leg_changes = [0] + [i for i in range(1, len(route_leg)) if route_leg[i] != route_leg[i - 1]] + [len(route_leg) - 1]
    leg_colors = {"calm (van)": "#5fb0a8", "rough (pneumatic tube)": "#d9a441"}
    for start_i, end_i in zip(leg_changes[:-1], leg_changes[1:]):
        leg = route_leg[start_i]
        ax_route.axvspan(t[start_i] / 60.0, t[end_i] / 60.0, color=leg_colors[leg], alpha=0.08)

    preset_y = [PRESET_RANK[p] for p in presets]
    ax_preset.step(t / 60.0, preset_y, where="post", color="#2a3441", linewidth=1.8)
    ax_preset.set_yticks([0, 1, 2])
    ax_preset.set_yticklabels([PRESET_SOFT, PRESET_MEDIUM, PRESET_FIRM])
    ax_preset.set_ylabel("Mount preset")
    ax_preset.set_xlabel("Time (minutes)")
    ax_preset.grid(alpha=0.25)

    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    print(f"Saved plot to {out_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--duration-s", type=float, default=1800.0, help="Simulated route duration (default 30 min)")
    parser.add_argument("--dt-s", type=float, default=1.0)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--out", default="stiffness_route_response.png")
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)
    t, shock_events, peak_g, route_leg, presets = simulate(rng, args.duration_s, args.dt_s)

    print(f"Simulated {args.duration_s / 60.0:.0f} min route: "
          f"calm -> rough (pneumatic tube) -> calm")
    print(f"Total shock events: {int(shock_events.sum())}, peak G observed: {peak_g.max():.1f}")

    # Report the preset actually in effect during the rough leg vs. the calm legs.
    rough_mask = np.array([leg == "rough (pneumatic tube)" for leg in route_leg])
    rough_presets = [p for p, is_rough in zip(presets, rough_mask) if is_rough]
    calm_presets = [p for p, is_rough in zip(presets, rough_mask) if not is_rough]
    if rough_presets:
        firm_frac = sum(1 for p in rough_presets if p == PRESET_FIRM) / len(rough_presets)
        print(f"FIRM preset held for {firm_frac * 100:.0f}% of the rough leg")
    if calm_presets:
        soft_frac = sum(1 for p in calm_presets if p == PRESET_SOFT) / len(calm_presets)
        print(f"SOFT preset held for {soft_frac * 100:.0f}% of the combined calm legs")

    plot_results(t, shock_events, peak_g, route_leg, presets, args.out)


if __name__ == "__main__":
    main()