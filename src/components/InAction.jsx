// Inside, in action: power the pod on, then pick a subsystem. It lights up in 3D and a live
// diagram shows what it's doing. All values are illustrative.
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';

const PodViewer = lazy(() => import('./PodViewer.jsx'));

const SUBS = [
  { id: 'sense', name: 'Cartridge well', verb: 'Sensing', match: /Cartridge|cradle|AS7341|BME688|LSM6|H3LIS|ST25R|Reed|PT1000 element · CORE|white LED|vent/i,
    text: 'Four sensors crowd around the vial. Every few seconds they sample it — impacts wake them instantly.' },
  { id: 'thermo', name: 'Backbone', verb: 'Thermometry', match: /Perma-Proto #2|MAX31865|PCF8523|Ambient|PT1000 element · AMB/i,
    text: 'Two platinum probes: one on the glass, one in the air. The gap between them is what matters.' },
  { id: 'brain', name: 'Base tray', verb: 'Edge AI', match: /nRF5340|LiPo|bq24074|MAX17048|MiniBoost|Perma-Proto #1/i,
    text: 'The model weighs every witness. When the score drops, it samples faster — a feedback loop.' },
  { id: 'light', name: 'Lid', verb: 'Signalling', match: /^Lid|gasket|RGB|Status-LED/i,
    text: 'A light pipe carries the verdict to the outside. Anyone holding the pod can read it.' },
  { id: 'dock', name: 'KronoDock', verb: 'Hand-off', match: /KronoDock|Raspberry|Perma-Proto #3|dock half|RXEF110/i,
    text: 'Frames stream to the dock. Each one is checked against the last before the report is released.' },
];

function useTick(ms = 120) {
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT((x) => x + 1), ms); return () => clearInterval(id); }, [ms]);
  return t;
}

function Sense() {
  const t = useTick(140);
  const sensors = [['Impact', 130, 70, `${(0.4 + Math.abs(Math.sin(t * 0.7)) * (t % 40 === 0 ? 30 : 1.2)).toFixed(1)} g`], ['Gas', 390, 70, `${(48 + Math.sin(t * 0.2) * 2).toFixed(1)} kΩ`],
    ['Colour', 130, 290, `Δ ${(0.6 + (t % 300) * 0.004).toFixed(2)}%`], ['Core', 390, 290, `${(4.2 + Math.sin(t * 0.05) * 0.15).toFixed(2)} °C`]];
  return (
    <svg viewBox="0 0 520 360" className="ia-svg">
      <rect x="236" y="120" width="48" height="120" rx="24" className="ia-vial" />
      <rect x="236" y="176" width="48" height="64" rx="20" className="ia-blood" />
      {sensors.map(([n, x, y, v], i) => (
        <g key={n}>
          <path d={`M260 180 L${x} ${y}`} className="ia-wire" />
          <motion.circle r="4" className="ia-dot" animate={{ cx: [260, x], cy: [180, y], opacity: [1, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.28, ease: 'easeIn' }} />
          <rect x={x - 62} y={y - 26} width="124" height="52" rx="8" className="ia-card" />
          <text x={x} y={y - 4} textAnchor="middle" className="ia-l">{n}</text>
          <text x={x} y={y + 16} textAnchor="middle" className="ia-v">{v}</text>
        </g>
      ))}
    </svg>
  );
}

function Thermo() {
  const t = useTick(90);
  const N = 60;
  const core = (k) => 4.3 + Math.sin((k + t) * 0.06) * 0.25 + (((k + t) % 220) > 150 ? ((k + t) % 220 - 150) * 0.04 : 0);
  const amb = (k) => 21 + Math.sin((k + t) * 0.03) * 1.5 + (((k + t) % 220) > 120 ? ((k + t) % 220 - 120) * 0.08 : 0);
  const y = (v) => 300 - (v / 34) * 250;
  const pts = (f) => Array.from({ length: N }, (_, k) => `${30 + k * (460 / (N - 1))},${y(f(k)).toFixed(1)}`).join(' ');
  const c = core(N - 1), a = amb(N - 1);
  return (
    <svg viewBox="0 0 520 360" className="ia-svg">
      <rect x="30" y={y(8)} width="460" height={y(2) - y(8)} className="ia-band" />
      <text x="34" y={y(8) - 6} className="ia-l">safe band 2–8 °C</text>
      <polyline points={pts(amb)} className="ia-line b" />
      <polyline points={pts(core)} className="ia-line a" />
      <line x1="490" x2="490" y1={y(a)} y2={y(c)} className="ia-delta" />
      <text x="482" y={(y(a) + y(c)) / 2} textAnchor="end" className="ia-v">Δ {(a - c).toFixed(1)} °C</text>
      <text x="30" y="335" className="ia-l">core (on the glass) <tspan className="ia-a">●</tspan>   ambient (in the air) <tspan className="ia-b">●</tspan></text>
    </svg>
  );
}

function Brain() {
  const t = useTick(110);
  const L = [[90, [80, 135, 190, 245, 300]], [220, [110, 170, 230, 290]], [330, [190]]];
  const score = (k) => 96 - Math.max(0, Math.sin((k + t) * 0.05)) * 24;
  const cur = score(0);
  const rate = cur < 85 ? 4 : 1;
  const hist = Array.from({ length: 40 }, (_, k) => `${380 + k * 3.2},${(300 - (score(k - 40) - 60) * 4).toFixed(1)}`).join(' ');
  const ins = ['temp', 'impact', 'gas', 'colour', 'identity'];
  return (
    <svg viewBox="0 0 520 360" className="ia-svg">
      {L.slice(0, -1).flatMap(([x1, ys1], li) => ys1.flatMap((a) => L[li + 1][1].map((b) => (
        <motion.line key={`${li}${a}${b}`} x1={x1} y1={a} x2={L[li + 1][0]} y2={b} className="ia-edge" animate={{ opacity: [0.1, 0.8, 0.1] }} transition={{ duration: 1.6, repeat: Infinity, delay: ((a + b) % 9) * 0.1 }} />
      ))))}
      {L.map(([x, ys], li) => ys.map((yy) => <circle key={`${li}${yy}`} cx={x} cy={yy} r={li === 2 ? 16 : 8} className={li === 2 ? 'ia-out' : 'ia-node'} />))}
      {ins.map((n, k) => <text key={n} x="72" y={L[0][1][k] + 4} textAnchor="end" className="ia-l">{n}</text>)}
      <rect x="376" y="96" width="132" height="168" rx="6" className="ia-card" />
      <line x1="376" x2="508" y1={300 - (85 - 60) * 4} y2={300 - (85 - 60) * 4} className="ia-delta" />
      <polyline points={hist} className="ia-line a" />
      <text x="380" y="40" className="ia-l">quality score</text>
      <text x="380" y="70" className={`ia-big ${cur < 85 ? 'warn' : 'ok'}`}>{cur.toFixed(0)}</text>
      <path d="M330 220 C330 330 470 330 470 310" className="ia-loop" />
      <text x="360" y="345" className="ia-l">feedback: sampling ×{rate}</text>
    </svg>
  );
}

function Light() {
  const t = useTick(1600);
  const states = [['#3ddc97', 'Green', 'All five witnesses agree'], ['#ffb547', 'Amber', 'Warm + colour drift: review first'], ['#ff5a68', 'Red', 'Lid opened: custody broken']];
  const [c, n, why] = states[t % 3];
  return (
    <svg viewBox="0 0 520 360" className="ia-svg">
      <rect x="140" y="140" width="240" height="160" rx="14" className="ia-card" />
      <rect x="120" y="110" width="280" height="34" rx="8" className="ia-card" />
      <rect x="320" y="70" width="14" height="70" className="ia-pipe" />
      <motion.circle cx="327" cy="64" r="40" fill={c} opacity="0.25" animate={{ r: [30, 46, 30] }} transition={{ duration: 1.6, repeat: Infinity }} />
      <circle cx="327" cy="64" r="12" fill={c} />
      <text x="60" y="60" className="ia-big" fill={c}>{n}</text>
      <text x="60" y="88" className="ia-l">{why}</text>
      <text x="260" y="230" textAnchor="middle" className="ia-l">sealed pod</text>
    </svg>
  );
}

function Dock() {
  const t = useTick(700);
  const n = (t % 7) + 1;
  return (
    <svg viewBox="0 0 520 360" className="ia-svg">
      {Array.from({ length: 6 }, (_, k) => {
        const on = k < n; const x = 30 + k * 80;
        return (
          <g key={k} opacity={on ? 1 : 0.18}>
            <rect x={x} y="140" width="64" height="64" rx="8" className="ia-card" />
            <text x={x + 32} y="168" textAnchor="middle" className="ia-l">frame</text>
            <text x={x + 32} y="188" textAnchor="middle" className="ia-v">{(0x3a91 + k * 0x1b7).toString(16)}</text>
            {k > 0 && <path d={`M${x - 16} 172 h16`} className="ia-wire" />}
            {on && k < n - 1 && <text x={x + 32} y="232" textAnchor="middle" className="ia-ok">✓</text>}
          </g>
        );
      })}
      <text x="30" y="110" className="ia-l">each frame carries the hash of the one before it</text>
      <text x="30" y="290" className={`ia-big ${n === 7 ? 'ok' : ''}`}>{n === 7 ? 'Report released' : 'Verifying…'}</text>
    </svg>
  );
}

const VIEW = { sense: Sense, thermo: Thermo, brain: Brain, light: Light, dock: Dock };

export default function InAction() {
  const api = useRef(null);
  const [ready, setReady] = useState(false);
  const [on, setOn] = useState(false);
  const [sel, setSel] = useState(null);
  const [seen, setSeen] = useState(() => new Set());
  const onReady = useCallback(() => setReady(true), []);
  const pick = (s) => { setSel(s.id); setSeen((x) => new Set(x).add(s.id)); api.current?.select(s.match); };
  const S = SUBS.find((s) => s.id === sel);
  const V = sel ? VIEW[sel] : null;

  return (
    <div className={`ia ${on ? 'is-on' : ''}`}>
      <div className="ia-3d">
        <Suspense fallback={null}><PodViewer apiRef={api} onReady={onReady} spin={0.6} autoRotate /></Suspense>
        {!ready && <p className="ia-wait mono">Loading pod…</p>}
      </div>

      <div className="ia-panel">
        <AnimatePresence mode="wait">
          {!on ? (
            <motion.div key="off" className="ia-off" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }}>
              <p className="mono">System idle</p>
              <button className="ia-power" onClick={() => setOn(true)} disabled={!ready}>
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                Power on
              </button>
            </motion.div>
          ) : (
            <motion.div key="on" className="ia-on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease }}>
              <div className="ia-rail" role="tablist" aria-orientation="vertical" aria-label="Subsystems">
                <p className="ia-rail-h mono">Channels · {seen.size}/5</p>
                {SUBS.map((s, i) => (
                  <button key={s.id} role="tab" aria-selected={sel === s.id} className={`ia-ch ${sel === s.id ? 'on' : ''} ${seen.has(s.id) ? 'seen' : ''}`} onClick={() => pick(s)}>
                    <i className="ia-led" aria-hidden="true" />
                    <span className="ia-ch-n">{s.name}</span>
                    <span className="ia-ch-v mono">CH{i + 1} · {s.verb}</span>
                  </button>
                ))}
              </div>
              <div className="ia-view">
                <AnimatePresence mode="wait">
                  {S ? (
                    <motion.div key={S.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.35, ease }}>
                      <V />
                      <p className="ia-text">{S.text}</p>
                    </motion.div>
                  ) : (
                    <motion.div key="pick" className="ia-pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <svg viewBox="0 0 60 24" width="60" height="24" aria-hidden="true"><path d="M58 12 H8 M16 4 L8 12 L16 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <p>Pick a channel. Five to find.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {seen.size === 5 && <p className="ia-count mono">All five channels seen.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
