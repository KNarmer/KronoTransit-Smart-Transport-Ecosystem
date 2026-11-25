// Failure-cost & ROI calculator. Two headline sliders (volume and rejection/delay rate) plus
// editable assumptions. Every default is a design estimate; the point is the arithmetic, which
// is shown in full so a lab manager can put in their own numbers.
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Prov from './Prov.jsx';

const usd = (v) => `${v < 0 ? '−' : ''}$${Math.round(Math.abs(v)).toLocaleString('en-US')}`;
const num = (v, d = 0) => v.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

const DEFAULTS = {
  daily: 25, rate: 2,
  days: 260, preventable: 30, repeatCost: 3000,
  minutes: 2, wage: 45,
  pods: 6, sub: 85, cart: 3.75,
};

const ASSUMPTIONS = [
  ['days', 'Working days per year', 'days', 1, 365, 1, 'Specimen days; 260 is a weekday year.'],
  ['preventable', 'Share of rejections/delays a trip record would prevent', '%', 0, 100, 1, 'For example, unknown-condition samples a lab can now accept, or delays it can catch. Conservative by default.'],
  ['repeatCost', 'Cost of one repeat procedure or recollection', '$', 0, 50000, 50, 'Varies widely, from a redraw to a repeat surgical biopsy. Put in your own figure.'],
  ['minutes', 'Documentation minutes saved per specimen', 'min', 0, 30, 0.5, 'Hand-written times, transport checks and inspection prep.'],
  ['wage', 'Loaded labour cost per hour', '$', 0, 200, 1, 'Lab or nursing time, with benefits.'],
  ['pods', 'Pods in service', 'pods', 1, 500, 1, 'Each pod makes several trips a day.'],
  ['sub', 'Pod subscription per month', '$', 0, 500, 1, 'Target price range $75–95.'],
  ['cart', 'Cartridge per trip', '$', 0, 20, 0.25, 'Target price range $3.00–4.50.'],
];

export default function RoiCalculator() {
  const [v, setV] = useState(DEFAULTS);
  const set = (k) => (e) => {
    const x = parseFloat(e.target.value);
    setV((s) => ({ ...s, [k]: Number.isFinite(x) ? x : 0 }));
  };

  const r = useMemo(() => {
    const specimens = v.daily * v.days;
    const failures = specimens * (v.rate / 100);
    const avoided = failures * (v.preventable / 100);
    const repeatSave = avoided * v.repeatCost;
    const laborSave = specimens * (v.minutes / 60) * v.wage;
    const hwCost = v.pods * v.sub * 12;
    const cartCost = specimens * v.cart;
    const cost = hwCost + cartCost;
    const gross = repeatSave + laborSave;
    const net = gross - cost;
    const roi = cost > 0 ? net / cost : 0;
    const breakEven = v.repeatCost > 0 ? Math.max(0, (cost - laborSave) / v.repeatCost) : Infinity;
    return { specimens, failures, avoided, repeatSave, laborSave, hwCost, cartCost, cost, gross, net, roi, breakEven };
  }, [v]);

  const max = Math.max(r.gross, r.cost, 1);
  const bars = [
    ['Avoided repeats', r.repeatSave, 'b-save'],
    ['Documentation time', r.laborSave, 'b-save2'],
    ['Pods (subscription)', r.hwCost, 'b-cost'],
    ['Cartridges', r.cartCost, 'b-cost2'],
  ];

  return (
    <div className="roi">
      <div className="roi-in">
        <label className="roi-slide">
          <span className="roi-l">Specimens sent per day <Prov k="est" /></span>
          <b className="roi-v">{v.daily}</b>
          <input type="range" min="1" max="200" step="1" value={v.daily} onChange={set('daily')} aria-label="Specimens sent per day" />
          <span className="roi-scale mono"><span>1</span><span>200</span></span>
        </label>
        <label className="roi-slide">
          <span className="roi-l">Current rejection / delay rate <Prov k="est" /></span>
          <b className="roi-v">{num(v.rate, 1)}%</b>
          <input type="range" min="0" max="10" step="0.1" value={v.rate} onChange={set('rate')} aria-label="Current rejection or delay rate, percent" />
          <span className="roi-scale mono"><span>0%</span><span>10%</span></span>
        </label>

        <details className="more roi-more">
          <summary>Edit the assumptions</summary>
          <div className="roi-grid">
            {ASSUMPTIONS.map(([k, label, unit, min, mx, step, hint]) => (
              <label key={k} className="roi-field">
                <span>{label}</span>
                <span className="roi-input">
                  {unit === '$' && <i>$</i>}
                  <input type="number" inputMode="decimal" min={min} max={mx} step={step} value={v[k]} onChange={set(k)} />
                  {unit !== '$' && <i>{unit}</i>}
                </span>
                <small>{hint}</small>
              </label>
            ))}
          </div>
          <button className="ctl" onClick={() => setV(DEFAULTS)}>Reset to defaults</button>
        </details>
      </div>

      <div className="roi-out" aria-live="polite">
        <div className="roi-heads">
          <div><span className="mono">Avoided repeats / yr</span><b>{usd(r.repeatSave)}</b><small>{num(r.avoided, 1)} of {num(r.failures, 0)} failed trips prevented</small></div>
          <div><span className="mono">Documentation labour / yr</span><b>{usd(r.laborSave)}</b><small>{num(r.specimens * v.minutes / 60, 0)} staff hours</small></div>
          <div className={`roi-net ${r.net >= 0 ? 'pos' : 'neg'}`}><span className="mono">Net after pods + cartridges</span><b>{usd(r.net)}</b><small>{r.cost > 0 ? `ROI ${num(r.roi * 100, 0)}% · cost ${usd(r.cost)}` : '—'}</small></div>
        </div>

        <div className="roi-bars" aria-hidden="true">
          {bars.map(([l, val, cls]) => (
            <div key={l} className="roi-bar">
              <span>{l}</span>
              <span className="roi-track"><motion.i className={cls} initial={false} animate={{ width: `${(val / max) * 100}%` }} transition={{ duration: 0.45 }} /></span>
              <b>{usd(val)}</b>
            </div>
          ))}
        </div>

        <p className="roi-be">
          {Number.isFinite(r.breakEven)
            ? <>Breaks even if it prevents <b>{num(Math.ceil(r.breakEven))}</b> repeat {Math.ceil(r.breakEven) === 1 ? 'procedure' : 'procedures'} a year, out of {num(r.specimens)} specimens.</>
            : <>Set a repeat-procedure cost to see the break-even point.</>}
        </p>
        <p className="note">Illustrative model, not a measured result. All defaults are our estimates <Prov k="est" />. A pilot replaces them with your lab’s real rejection data.</p>
      </div>
    </div>
  );
}
