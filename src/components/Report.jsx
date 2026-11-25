// A transport report as a receiving lab would see it. Demonstration data only.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BAND } from '../data/scenarios.js';
import { DecryptReveal } from './canvasui/DecryptReveal.tsx';

const W = 1000, PADL = 54, PADR = 10;
const ROWS = [
  { key: 'temp', label: 'Temperature', unit: '°C', h: 150, lo: 0, hi: 36, series: [['core', 'Core (vial)', 'a'], ['amb', 'Ambient', 'b']], band: BAND },
  { key: 'g', label: 'Impact', unit: 'g', h: 90, lo: 0, hi: 40, series: [['g', 'Peak g', 'a']], bars: true },
  { key: 'rh', label: 'Humidity', unit: '%RH', h: 80, lo: 30, hi: 60, series: [['rh', 'Humidity', 'a']] },
  { key: 'hpa', label: 'Pressure', unit: 'hPa', h: 70, lo: 1008, hi: 1017, series: [['hpa', 'Pressure', 'b']] },
  { key: 'tilt', label: 'Orientation', unit: '° tilt', h: 80, lo: 0, hi: 40, series: [['tilt', 'Tilt from upright', 'a']] },
  { key: 'ind', label: 'Indicator', unit: 'Δ %', h: 80, lo: 0, hi: 10, series: [['ind', 'Colour shift', 'a']] },
];
const GAP = 22;
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function chain(events) {
  let prev = '0'.repeat(64); const out = [];
  for (const e of events) { const h = await sha256(prev + JSON.stringify([e.at, e.k, e.t])); out.push(h); prev = h; }
  return out;
}

export default function Report({ sc }) {
  const f = sc.frames;
  const [idx, setIdx] = useState(Math.floor(f.length * 0.62));
  const [signed, setSigned] = useState([]);
  const [now, setNow] = useState([]);
  const [tamper, setTamper] = useState(false);
  const svgRef = useRef(null);

  const H = ROWS.reduce((a, r) => a + r.h + GAP, 30);
  const x = (i) => PADL + (i / (f.length - 1)) * (W - PADL - PADR);
  const layout = useMemo(() => { let y = 30; return ROWS.map((r) => { const o = { ...r, y }; y += r.h + GAP; return o; }); }, []);
  const yOf = (r, v) => r.y + r.h - ((v - r.lo) / (r.hi - r.lo)) * r.h;

  // Signed chain over the original events; recomputed chain over what the reader is shown.
  const shown = useMemo(() => sc.events.map((e) => (tamper && e.k === 'IMPACT' ? { ...e, t: 'Peak impact 3.6 g' } : e)), [sc, tamper]);
  useEffect(() => { let live = true; chain(sc.events).then((h) => live && setSigned(h)); return () => { live = false; }; }, [sc]);
  useEffect(() => { let live = true; chain(shown).then((h) => live && setNow(h)); return () => { live = false; }; }, [shown]);
  useEffect(() => { setIdx(Math.floor(f.length * 0.62)); setTamper(false); }, [sc, f.length]);

  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setIdx(Math.max(0, Math.min(f.length - 1, Math.round(((px - PADL) / (W - PADL - PADR)) * (f.length - 1)))));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight') setIdx((i) => Math.min(f.length - 1, i + (e.shiftKey ? 30 : 1)));
    if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - (e.shiftKey ? 30 : 1)));
  };
  const cur = f[idx];
  const S = sc.sum;
  const broken = now.findIndex((h, i) => signed[i] && h !== signed[i]);

  return (
    <article className="report">
      <header className="rep-head">
        <div>
          <p className="mono">Transport report · specimen KT-DEMO-{sc.id === 'A' ? '0001' : '0002'} · pod alpha-01 · dock KD-01</p>
          <p className="rep-demo mono">Illustrative demonstration data · no patient information</p>
        </div>
      </header>

      <section className={`triage t-${S.status.toLowerCase()}`} aria-label="Triage summary">
        <div className="triage-s"><span className="mono">Specimen viability</span><b>{S.status}</b></div>
        <div><span className="mono">Transit duration</span><b>{S.duration}</b></div>
        <div><span className="mono">Mean kinetic temp.</span><b>{S.mkt.toFixed(2)} °C</b></div>
        <div><span className="mono">Outside {BAND[0]}–{BAND[1]} °C</span><b>{S.outside}</b></div>
        <div><span className="mono">Peak impact</span><b>{S.peakG} g <small>at {S.peakAt}</small></b></div>
        <div><span className="mono">Seal & identity</span><b className="triage-seal">{tamper ? 'Log altered · verify failed' : 'Intact'}</b></div>
      </section>

      <div className="rep-chart">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="chart" tabIndex="0" role="img"
          aria-label={`Timeline. Cursor at ${fmt(cur.s)}: core ${cur.core} °C, ambient ${cur.amb} °C, impact ${cur.g} g. Use arrow keys to move.`}
          onPointerMove={onMove} onPointerDown={onMove} onKeyDown={onKey}>
          {/* event ticks */}
          {sc.events.map((e) => {
            const i = Math.min(f.length - 1, Math.round(e.s / 10));
            return <g key={e.at + e.k} className={`evt l-${e.lvl}`} onClick={() => setIdx(i)}><line x1={x(i)} x2={x(i)} y1="6" y2={H - 8} /><circle cx={x(i)} cy="12" r="4.5" /></g>;
          })}
          {layout.map((r) => (
            <g key={r.key}>
              <text x="0" y={r.y + 12} className="ax-l">{r.label}</text>
              <text x="0" y={r.y + 26} className="ax-u">{r.unit}</text>
              <line x1={PADL} x2={W - PADR} y1={r.y + r.h} y2={r.y + r.h} className="ax" />
              {r.band && <rect x={PADL} width={W - PADL - PADR} y={yOf(r, r.band[1])} height={yOf(r, r.band[0]) - yOf(r, r.band[1])} className="band" />}
              {r.band && <text x={W - PADR - 4} y={yOf(r, r.band[1]) - 4} className="ax-u" textAnchor="end">lab band {r.band[0]}–{r.band[1]} °C</text>}
              {r.series.map(([k, , c]) => r.bars ? (
                f.map((p, i) => p.g > 2 && <line key={i} x1={x(i)} x2={x(i)} y1={r.y + r.h} y2={yOf(r, Math.min(p.g, r.hi))} className={`bar ${p.g > 20 ? 'hot' : ''}`} />)
              ) : (
                <path key={k} className={`ln ln-${c}`} d={f.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${yOf(r, Math.max(r.lo, Math.min(r.hi, p[k]))).toFixed(1)}`).join('')} />
              ))}
            </g>
          ))}
          {/* time axis */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => { const i = Math.round(t * (f.length - 1)); return <text key={t} x={x(i)} y={H - 2} className="ax-u" textAnchor={t === 1 ? 'end' : t === 0 ? 'start' : 'middle'}>{fmt(f[i].s)}</text>; })}
          <g className="legend"><line x1={PADL + 4} x2={PADL + 22} y1={layout[0].y + 6} y2={layout[0].y + 6} className="ln ln-a" /><text x={PADL + 28} y={layout[0].y + 10} className="ax-u">core (vial)</text>
            <line x1={PADL + 110} x2={PADL + 128} y1={layout[0].y + 6} y2={layout[0].y + 6} className="ln ln-b" /><text x={PADL + 134} y={layout[0].y + 10} className="ax-u">ambient</text></g>
          {/* scrubber */}
          <line x1={x(idx)} x2={x(idx)} y1="20" y2={H - 14} className="scrub" />
          {layout.map((r) => r.series.map(([k]) => !r.bars && <circle key={r.key + k} cx={x(idx)} cy={yOf(r, Math.max(r.lo, Math.min(r.hi, cur[k])))} r="3.6" className="scrub-dot" />))}
        </svg>
        <aside className="readout" aria-live="polite">
          <p className="mono">t = {fmt(cur.s)}</p>
          <dl>
            <div><dt>Core</dt><dd className={cur.core > BAND[1] ? 'hot' : ''}>{cur.core.toFixed(2)} °C</dd></div>
            <div><dt>Ambient</dt><dd>{cur.amb.toFixed(1)} °C</dd></div>
            <div><dt>Impact</dt><dd className={cur.g > 20 ? 'hot' : ''}>{cur.g.toFixed(1)} g</dd></div>
            <div><dt>Humidity</dt><dd>{cur.rh.toFixed(1)} %RH</dd></div>
            <div><dt>Pressure</dt><dd>{cur.hpa.toFixed(1)} hPa</dd></div>
            <div><dt>Tilt</dt><dd>{cur.tilt.toFixed(0)}°</dd></div>
            <div><dt>Indicator</dt><dd>{cur.ind.toFixed(1)} %</dd></div>
          </dl>
          <p className="readout-h mono">Drag across the chart, or use ← →</p>
        </aside>
      </div>

      <section className="audit">
        <div className="audit-h">
          <h3 className="h3">Audit log</h3>
          <p className="body">Each line is chained to the last. Change one and every hash after it breaks.</p>
          <button className={`ctl ${tamper ? 'on' : ''}`} onClick={() => setTamper((v) => !v)}>{tamper ? 'Restore original log' : 'Try to edit the impact entry'}</button>
        </div>
        <DecryptReveal className="log-crypt" radius={190} cell={13} color="#5b9dff" colored={0.4} background="rgba(0,0,0,0)" passthrough={0.08} scramble={0.2} scrambleSpeed={8}>
        <table className="log">
          <thead><tr><th>Time</th><th>Source</th><th>Event</th><th>Chain</th></tr></thead>
          <tbody>
            {shown.map((e, i) => {
              const bad = broken !== -1 && i >= broken;
              return (
                <tr key={e.at + e.k} className={`l-${e.lvl} ${bad ? 'bad' : ''}`} onClick={() => setIdx(Math.min(f.length - 1, Math.round(e.s / 10)))}>
                  <td className="mono">{e.at}</td>
                  <td className="mono">{e.k}</td>
                  <td>{e.t}</td>
                  <td className="mono hash">{now[i] ? `${now[i].slice(0, 12)}…` : '…'} {bad ? <em>≠ signed</em> : signed[i] ? <i>✓</i> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </DecryptReveal>
      </section>
    </article>
  );
}
