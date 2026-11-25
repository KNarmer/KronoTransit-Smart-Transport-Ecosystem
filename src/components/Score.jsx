import { useEffect, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ease } from '../motion.js';

// Illustrative only: made-up weights, not the on-device model. Combined stress costs more than any single factor.
function computeScore({ t, g, v, c }) {
  const nt = t / 60, ng = Math.max(0, g - 10) / 40, nv = v / 100, nc = c / 100;
  const base = 0.3 * nt + 0.25 * ng + 0.25 * nv + 0.2 * nc;
  const joint = 0.5 * (nt * nv + nt * nc + ng * nc);
  return Math.round(Math.max(0, Math.min(1, 1 - (base + joint))) * 100);
}

const presets = {
  'Clean run': { t: 0, g: 6, v: 0, c: 4 },
  'Slammed in a tube': { t: 0, g: 39, v: 0, c: 6 },
  'Left on a loading dock': { t: 40, g: 4, v: 45, c: 55 },
};

const fields = [
  ['t', 'Time above safe temperature', 60, 'min'],
  ['g', 'Hardest impact', 50, 'g'],
  ['v', 'Gas at the vent', 100, '%'],
  ['c', 'Indicator colour change', 100, '%'],
];

export default function Score() {
  const [vals, setVals] = useState(presets['Clean run']);
  const score = useMemo(() => computeScore(vals), [vals]);
  const mv = useMotionValue(score);
  const shown = useTransform(mv, (x) => Math.round(x));
  const dash = useTransform(mv, (x) => `${(x / 100) * 283} 283`);
  useEffect(() => {
    const c = animate(mv, score, { duration: 0.35, ease });
    return () => c.stop();
  }, [score, mv]);

  const state = score >= 85 ? ['Green · run the test', 'ok'] : score >= 70 ? ['Amber · review first', 'warn'] : ['Red · recollect', 'bad'];

  return (
    <div className="embed">
      <div className="score">
        <div className="score-controls">
          <div className="presets">
            {Object.keys(presets).map((k) => (
              <button key={k} className="preset" onClick={() => setVals(presets[k])}>{k}</button>
            ))}
          </div>
          {fields.map(([k, label, max, unit]) => (
            <label key={k} className="slider">
              <span className="slider-top"><span>{label}</span><b>{vals[k]} {unit}</b></span>
              <input type="range" min="0" max={max} value={vals[k]} style={{ '--p': `${(vals[k] / max) * 100}%` }}
                onChange={(e) => setVals((s) => ({ ...s, [k]: +e.target.value }))} />
            </label>
          ))}
          <p className="fine">Demo only. Weights are illustrative, not the trained on-device model.</p>
        </div>

        <div className={`score-out is-${state[1]}`} aria-live="polite">
          <svg viewBox="0 0 100 100" className="ring" aria-hidden="true">
            <circle cx="50" cy="50" r="45" className="ring-bg" />
            <motion.circle cx="50" cy="50" r="45" className="ring-fg" style={{ strokeDasharray: dash }} />
          </svg>
          <div className="score-num"><motion.span>{shown}</motion.span><small>/ 100</small></div>
          <div className="score-state"><i className="led" />{state[0]}</div>
        </div>
      </div>
    </div>
  );
}
