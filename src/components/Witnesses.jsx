// Five witnesses, one verdict. A live simulation of the pod's five sensor streams.
// Trigger a perturbation and watch every stream respond; the reasoning panel shows how the
// witnesses are cross-checked to separate real risk from false alarms. Illustrative values only.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';

const N = 240; // samples on screen
const STREAMS = [
  ['Temperature', 'Two PT1000 probes · core and ambient', ['core °C', 'ambient °C'], [0, 40]],
  ['Impact', 'H3LIS331 high-g + LSM6DSOX', ['peak g'], [0, 50]],
  ['Air', 'BME688 · gas resistance and pressure', ['gas (rel.)', 'pressure hPa'], [0, 1]],
  ['Light & colour', 'AS7341 · in-pod light and indicator shift', ['light (rel.)', 'indicator Δ'], [0, 1]],
  ['Identity & seal', 'NFC tag + seat switch', ['cartridge ID', 'seat'], [0, 1]],
];

const EVENTS = {
  pothole: {
    name: 'Ambulance pothole', dur: 70,
    reads: ['Temperature steady', 'Single 38 g spike', 'Air unchanged', 'No light, no colour change', 'Same cartridge, still seated'],
    hot: [0, 1, 0, 0, 0], verdict: ['ok', 'Logged, not condemned'],
    why: 'One mechanical shock with every other witness quiet. The report records the time and peak g so the lab can judge haemolysis risk; on its own it doesn’t flag the sample.',
  },
  heat: {
    name: 'Summer tarmac heat', dur: 200,
    reads: ['Ambient climbs fast; core follows slowly', 'Steady', 'Gas drifts slightly with temperature', 'Indicator begins to shift', 'Same cartridge, still seated'],
    hot: [2, 0, 1, 1, 0], verdict: ['warn', 'Amber · review before analysis'],
    why: 'Core temperature is following ambient, and the colour indicator agrees chemically. Two independent witnesses confirm real thermal exposure; risk grows with minutes above the band.',
  },
  lid: {
    name: 'Unauthorised lid opening', dur: 110,
    reads: ['Ambient step as outside air enters', 'Small handling motion', 'Humidity and pressure blip', 'Light floods a closed pod', 'Cartridge present, seat closed'],
    hot: [1, 1, 1, 2, 0], verdict: ['bad', 'Chain of custody broken'],
    why: 'Light inside a sealed pod is impossible unless it was opened. Air and temperature agree. The event is written into the signed log; the lab sees exactly when.',
  },
  altitude: {
    name: 'High-altitude pressure shift', dur: 160,
    reads: ['Steady', 'Steady', 'Pressure falls; gas baseline shifts', 'No light, no colour change', 'Same cartridge, still seated'],
    hot: [0, 0, 1, 0, 0], verdict: ['ok', 'False alarm avoided'],
    why: 'Only pressure changed, with no thermal, chemical-indicator or mechanical change. The gas reading is re-referenced to the new pressure instead of raising a leak alarm.',
  },
};

const noise = (s) => (Math.sin(s * 12.9898) * 43758.5453) % 1;

export default function Witnesses() {
  const cvs = useRef([]);
  const sim = useRef({ t: 0, ev: null, evT: 0, buf: STREAMS.map((s) => s[2].map(() => new Array(N).fill(NaN))) });
  const [ev, setEv] = useState(null);

  const fire = (k) => { sim.current.ev = k; sim.current.evT = 0; setEv(k); };

  useEffect(() => {
    let raf = 0, last = performance.now(), acc = 0, colors = {};
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = { a: cs.getPropertyValue('--sig').trim(), b: cs.getPropertyValue('--sig-2').trim(), axis: cs.getPropertyValue('--rule').trim(), hot: cs.getPropertyValue('--bad').trim() };
    };
    readColors();
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const step = () => {
      const S = sim.current; S.t += 1;
      const t = S.t, e = S.ev, p = e ? S.evT / EVENTS[e].dur : 1;
      if (e) { S.evT += 1; if (S.evT > EVENTS[e].dur) { S.ev = null; } }
      const n = (k) => (noise(t * 0.37 + k) - 0.5);
      let core = 4.5 + n(1) * 0.08, amb = 21 + n(2) * 0.15, g = 0.6 + Math.abs(n(3)) * 0.8, gas = 0.5 + n(4) * 0.01, pres = 0.62 + n(5) * 0.004, light = 0.04 + Math.abs(n(6)) * 0.01, ind = 0.08, id = 1, seat = 1;
      if (e === 'pothole') { const s = S.evT; if (s >= 12 && s <= 16) g = [38.6, 21, 6, 3, 1.5][s - 12]; else if (s > 16 && s < 30) g += 1.2; }
      if (e === 'heat') { const ramp = Math.min(1, p * 1.6); amb = 21 + 13 * ramp; core = 4.5 + 4.3 * Math.max(0, p - 0.18) ** 1.2 * 1.3; gas = 0.5 + 0.06 * ramp; ind = 0.08 + 0.22 * Math.max(0, p - 0.35); }
      if (e === 'lid') { const s = S.evT; const open = s > 15 && s < 75; if (open) { light = 0.9 + n(7) * 0.04; amb = 21 + 4 * Math.min(1, (s - 15) / 30); pres = 0.62 + 0.01; gas = 0.47; } if (s > 15 && s < 22) g = 2.4; }
      if (e === 'altitude') { const k = Math.sin(Math.min(1, p) * Math.PI); pres = 0.62 - 0.25 * k; gas = 0.5 + 0.12 * k; }
      const vals = [[core, amb], [g], [gas, pres], [light, ind], [id, seat]];
      S.buf.forEach((ls, si) => ls.forEach((arr, li) => { arr.push(vals[si][li]); arr.shift(); }));
    };

    const draw = () => {
      const S = sim.current;
      cvs.current.forEach((c, si) => {
        if (!c) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = c.clientWidth, h = c.clientHeight;
        if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
        const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
        g.strokeStyle = colors.axis; g.lineWidth = 1; g.beginPath(); g.moveTo(0, h - 0.5); g.lineTo(w, h - 0.5); g.stroke();
        const [lo, hi] = STREAMS[si][3];
        S.buf[si].forEach((arr, li) => {
          g.strokeStyle = li === 0 ? colors.a : colors.b; g.lineWidth = 1.6; g.beginPath();
          let started = false;
          arr.forEach((v, i) => {
            if (Number.isNaN(v)) return;
            let yv = si === 4 ? (li === 0 ? 0.7 : 0.35) * (v ? 1 : 0.2) : (v - lo) / (hi - lo);
            if (si === 2 && li === 1) yv = v; // pressure already normalised
            const x = (i / (N - 1)) * w, y = h - 4 - Math.max(0, Math.min(1, yv)) * (h - 10);
            if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y);
          });
          g.stroke();
        });
      });
    };

    for (let i = 0; i < N; i++) step();
    const loop = (now) => {
      acc += now - last; last = now;
      if (acc > 500) acc = 66;
      while (acc > 66) { step(); acc -= 66; }
      draw();
      raf = requestAnimationFrame(loop);
    };
    if (reduce) draw(); else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); mo.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const E = ev ? EVENTS[ev] : null;

  return (
    <div className="wit">
      <div className="wit-triggers" role="group" aria-label="Simulate a transit event">
        <span className="mono">Simulate</span>
        {Object.entries(EVENTS).map(([k, e]) => (
          <button key={k} className={`trig ${ev === k ? 'on' : ''}`} onClick={() => fire(k)}>{e.name}</button>
        ))}
      </div>
      <div className="wit-grid">
        <div className="wit-streams">
          {STREAMS.map(([name, hw, legend], i) => (
            <div key={name} className={`stream ${E && E.hot[i] ? `hot${E.hot[i]}` : ''}`}>
              <div className="stream-h">
                <span className="stream-n">{String(i + 1).padStart(2, '0')}</span>
                <b>{name}</b>
                <span className="stream-hw">{hw}</span>
              </div>
              <canvas ref={(el) => (cvs.current[i] = el)} className="stream-c" aria-hidden="true" />
              <div className="stream-legend mono">{legend.map((l, k) => <span key={l} className={`lg lg${k}`}>{l}</span>)}{E && <em>{E.reads[i]}</em>}</div>
            </div>
          ))}
        </div>
        <aside className="wit-verdict" aria-live="polite">
          <p className="mono">Edge AI cross-check</p>
          <AnimatePresence mode="wait">
            {E ? (
              <motion.div key={ev} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
                <h4 className={`v v-${E.verdict[0]}`}>{E.verdict[1]}</h4>
                <p>{E.why}</p>
                <ul className="wit-vote">
                  {STREAMS.map(([name], i) => <li key={name} className={`vote h${E.hot[i]}`}><i />{name}</li>)}
                </ul>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h4 className="v v-ok">All witnesses agree</h4>
                <p>A steady, cold, quiet trip. Pick an event above to see how a single disturbance looks to five independent sensors, and why the pod doesn’t trust any one of them alone.</p>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="wit-note">Illustrative simulation. The rules shown are the design intent; the on-device model is still being trained on real labelled runs.</p>
        </aside>
      </div>
    </div>
  );
}
