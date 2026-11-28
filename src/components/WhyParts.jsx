// Building blocks for the "Why it matters" page: pictures first, a line of text each.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';
import { Reveal, Draw } from './Bits.jsx';
import { SOURCES, MATRIX_COLS, MATRIX_ROWS, LIMITS } from '../data/why.js';

export function Cite({ id }) {
  const s = SOURCES[id];
  if (!s) return null;
  const n = Object.keys(SOURCES).indexOf(id) + 1;
  return <a className="cite" href={`#src-${id}`} title={s[0]} onClick={(e) => { e.preventDefault(); document.getElementById(`src-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>[{n}]</a>;
}

/* ---------- the route: today vs with a witness ---------- */
const ROUTE = 'M70 230 C 170 230, 210 150, 320 160 S 470 250, 590 200 S 790 130, 930 180';
const STOPS = [[70, 230, 'Theatre'], [320, 160, 'Porter'], [590, 200, 'Tube system'], [930, 180, 'Histology']];
const trace = (() => {
  let d = 'M70 70';
  for (let x = 70; x <= 930; x += 6) {
    let y = 70 + Math.sin(x / 38) * 5 + Math.sin(x / 9) * 1.5;
    if (x > 560 && x < 640) y += Math.sin(x * 1.7) * (x % 18 < 6 ? 34 : 10);
    if (x > 700 && x < 760) y -= (x - 700) * 0.25 * Math.sin((x - 700) / 19);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d;
})();

export function RouteViz() {
  const [mode, setMode] = useState('today');
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setMode((m) => (m === 'today' ? 'witness' : 'today')), 6500);
    return () => clearInterval(id);
  }, [auto]);
  const pick = (m) => { setAuto(false); setMode(m); };
  const w = mode === 'witness';
  return (
    <figure className={`route ${w ? 'is-w' : ''}`}>
      <svg viewBox="0 0 1000 300" className="route-svg" role="img" aria-label={w ? 'With the pod: a continuous record of the whole trip' : 'Today: two hand-written times and nothing in between'}>
        <path d={ROUTE} id="rt" className="rt-base" />
        <AnimatePresence>
          {w && <motion.path key="lit" d={ROUTE} className="rt-lit" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2.4, ease: 'easeInOut' }} />}
          {w && <motion.path key="tr" d={trace} className="rt-trace" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2.4, ease: 'easeInOut' }} />}
        </AnimatePresence>
        <text x="70" y="40" className="rt-k">core °C · shock g · light · lid</text>
        <path d="M70 70 H930" className="rt-flat" />
        <text x="500" y="98" textAnchor="middle" className="rt-none">no data</text>
        {[[195, 150], [455, 175], [760, 120]].map(([x, y], i) => (
          <text key={x} x={x} y={y} textAnchor="middle" className="rt-q" style={{ animationDelay: `${i * -0.8}s` }}>?</text>
        ))}
        {STOPS.map(([x, y, l], i) => (
          <g key={l}>
            <circle cx={x} cy={y} r="9" className="rt-stop" />
            <text x={x} y={y + 36} textAnchor="middle" className="rt-l">{l}</text>
            {(i === 0 || i === 3) && <text x={x} y={y - 22} textAnchor="middle" className="rt-time">{i === 0 ? '09:14' : '09:52'}</text>}
          </g>
        ))}
        <AnimatePresence>
          {w && <motion.g key="stamp" initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease, delay: 2.4 }} style={{ transformOrigin: '930px 110px' }}>
            <rect x="880" y="94" width="100" height="32" rx="6" className="rt-stamp" />
            <text x="930" y="116" textAnchor="middle" className="rt-stamp-t">PASS</text>
          </motion.g>}
        </AnimatePresence>
        <circle r="12" className="rt-pod"><animateMotion dur="6.5s" repeatCount="indefinite" rotate="0"><mpath href="#rt" /></animateMotion></circle>
        <circle r="4" className="rt-pod-led"><animateMotion dur="6.5s" repeatCount="indefinite"><mpath href="#rt" /></animateMotion></circle>
      </svg>
      <figcaption className="route-cap">
        <div className="seg" role="tablist" aria-label="Compare">
          <button role="tab" aria-selected={!w} className={!w ? 'on' : ''} onClick={() => pick('today')}>Today</button>
          <button role="tab" aria-selected={w} className={w ? 'on' : ''} onClick={() => pick('witness')}>With a witness</button>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={mode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {w ? 'Every second logged at the vial, signed when it docks.' : 'Two times on the form. 38 minutes nobody saw.'}
          </motion.p>
        </AnimatePresence>
      </figcaption>
    </figure>
  );
}

/* ---------- stakes as instruments ---------- */
const inView = { initial: 'off', whileInView: 'on', viewport: { once: true, margin: '-10% 0px' } };

function Ring() {
  const C = 2 * Math.PI * 42;
  return (
    <svg viewBox="0 0 110 110" className="ins">
      <circle cx="55" cy="55" r="42" className="ins-track" />
      <motion.circle {...inView} cx="55" cy="55" r="42" className="ins-hi" strokeDasharray={C} variants={{ off: { strokeDashoffset: C }, on: { strokeDashoffset: C * (1 - 0.68), transition: { duration: 1.6, ease } } }} transform="rotate(-90 55 55)" />
      <motion.circle {...inView} cx="55" cy="55" r="42" className="ins-lo" strokeDasharray={C} variants={{ off: { strokeDashoffset: C }, on: { strokeDashoffset: C * (1 - 0.46), transition: { duration: 1.2, ease } } }} transform="rotate(-90 55 55)" />
    </svg>
  );
}
function Clock() {
  return (
    <svg viewBox="0 0 110 110" className="ins">
      <circle cx="55" cy="55" r="42" className="ins-track" />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1="55" y1="17" x2="55" y2={i % 3 ? 21 : 25} className="ins-tick" transform={`rotate(${i * 30} 55 55)`} />)}
      <motion.circle {...inView} cx="55" cy="55" r="34" className="ins-sweep" pathLength="1" strokeDasharray="1" variants={{ off: { strokeDashoffset: 1 }, on: { strokeDashoffset: 0, transition: { duration: 2.4, ease: 'linear' } } }} transform="rotate(-90 55 55)" />
      <motion.line {...inView} x1="55" y1="55" x2="55" y2="24" className="ins-hand" style={{ originX: '55px', originY: '55px' }} variants={{ off: { rotate: 0 }, on: { rotate: 360, transition: { duration: 2.4, ease: 'linear' } } }} />
      <circle cx="55" cy="55" r="3" className="ins-pin" />
    </svg>
  );
}
function Gauge() {
  return (
    <svg viewBox="0 0 160 110" className="ins wide">
      <rect x="10" y="48" width="140" height="14" rx="7" className="ins-track-f" />
      <motion.rect {...inView} x="10" y="48" height="14" rx="7" className="ins-bad" variants={{ off: { width: 0 }, on: { width: 140 * (1500 / 1600), transition: { duration: 1.4, ease } } }} />
      <line x1={10 + 140 * (400 / 1600)} x2={10 + 140 * (400 / 1600)} y1="38" y2="72" className="ins-mark" />
      <text x={10 + 140 * (400 / 1600)} y="88" textAnchor="middle" className="ins-t">our sensor</text>
      <text x={10 + 140 * (400 / 1600)} y="32" textAnchor="middle" className="ins-t">400 g</text>
      <text x="150" y="32" textAnchor="end" className="ins-t">1,600</text>
    </svg>
  );
}
function Dots() {
  return (
    <svg viewBox="0 0 110 110" className="ins">
      {Array.from({ length: 100 }, (_, i) => {
        const lit = [13, 27, 44, 58, 71, 86].includes(i);
        return <motion.circle key={i} {...inView} cx={10 + (i % 10) * 10} cy={10 + Math.floor(i / 10) * 10} r="3.2" className={lit ? 'ins-dot hot' : 'ins-dot'} variants={{ off: { opacity: 0.2 }, on: { opacity: 1, transition: { delay: lit ? 0.8 + i * 0.006 : i * 0.006 } } }} />;
      })}
    </svg>
  );
}

const STAKES = [
  { viz: Ring, big: '46–68%', t: 'of lab errors happen before the sample reaches the analyser', src: 'plebani' },
  { viz: Clock, big: '≤ 1 h', t: 'from excision to formalin for breast tissue, recorded every time', src: 'ascoFaq' },
  { viz: Gauge, big: '≈ 1,500 g', t: 'peaks measured inside pneumatic-tube carriers', src: 'streichert' },
  { viz: Dots, big: '6%', t: 'of a million surgical cases arrived with an accessioning problem', src: 'nakhleh' },
];

export function Stakes() {
  return (
    <ul className="stakes">
      {STAKES.map(({ viz: V, big, t, src }, i) => (
        <Reveal as="li" key={big} delay={i * 0.07} className="stake">
          <V />
          <b className="stake-big">{big}</b>
          <p>{t}<Cite id={src} /></p>
        </Reveal>
      ))}
    </ul>
  );
}

/* ---------- why today's checks miss it ---------- */
function Once() {
  return (
    <svg viewBox="0 0 220 120" className="gap-art" aria-hidden="true">
      <line x1="10" y1="70" x2="210" y2="70" className="g-line" />
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={18 + i * 14} cy="70" r="4.5" className={i === 0 ? 'g-on' : 'g-off'} />)}
      <path d="M12 44 l5 5 l9 -10" className="g-tick" />
      <text x="18" y="100" textAnchor="middle" className="g-t">day 1</text>
      <motion.circle r="3" className="g-scan" animate={{ cx: [18, 200] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} cy="70" />
      <text x="200" y="100" textAnchor="end" className="g-t">trip 2,000</text>
    </svg>
  );
}
function Box() {
  return (
    <svg viewBox="0 0 220 120" className="gap-art" aria-hidden="true">
      <rect x="30" y="34" width="160" height="70" rx="6" className="g-box" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={44 + i * 17} y="46" width="10" height="44" rx="5" className="g-tube" />)}
      <motion.rect x="150" y="14" width="34" height="22" rx="4" className="g-logger" animate={{ y: [14, 10, 14] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="176" cy="25" r="2.5" className="g-led" />
    </svg>
  );
}
function Pen() {
  return (
    <svg viewBox="0 0 220 120" className="gap-art" aria-hidden="true">
      <rect x="40" y="14" width="140" height="96" rx="4" className="g-box" />
      {[34, 48, 62].map((y) => <line key={y} x1="54" x2="166" y1={y} y2={y} className="g-line" />)}
      <Draw d="M58 92 c4 -14 8 -14 10 0 m6 -12 c6 0 6 12 0 12 c-6 0 -6 -12 0 -12 m12 6 h4 m6 -6 l6 -4 v16 m10 -16 l-6 10 h10" className="g-ink" dur={2} />
      <motion.g animate={{ x: [0, 46, 0], y: [0, -2, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M62 86 l26 -30 l6 5 l-26 30 z" className="g-pen" />
      </motion.g>
    </svg>
  );
}
const GAPS = [
  [Once, 'Checked once, then trusted', 'Tube routes are validated with a logger, then assumed safe.', 'streichert'],
  [Box, 'One logger, many tubes', 'The box has a record. The specimen doesn’t.', 'temptale'],
  [Pen, 'Times by hand', 'Collection and fixation times go on the form.', 'capGuide'],
];

export function Gaps() {
  return (
    <ul className="gaps">
      {GAPS.map(([A, h, p, src], i) => (
        <Reveal as="li" key={h} delay={i * 0.08}>
          <A />
          <h3 className="h4">{h}</h3>
          <p>{p}<Cite id={src} /></p>
        </Reveal>
      ))}
    </ul>
  );
}

/* ---------- zero-click workflow ---------- */
function FlowArt({ k }) {
  if (k === 'drop') return (
    <svg viewBox="0 0 200 140" className="flow-art" aria-hidden="true">
      <rect x="50" y="60" width="100" height="70" rx="8" className="fa-pod" />
      <motion.g initial={{ y: -56 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease, delay: 0.2 }}>
        <rect x="88" y="66" width="24" height="54" rx="10" className="fa-vial" />
        <rect x="88" y="92" width="24" height="28" rx="8" className="fa-blood" />
        <rect x="84" y="63" width="32" height="8" className="fa-cap" />
      </motion.g>
      <motion.rect x="44" y="50" width="112" height="10" rx="3" className="fa-lidr" initial={{ y: -26, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease, delay: 1 }} />
      <motion.circle cx="135" cy="112" r="5" className="fa-led" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2.2, repeat: Infinity, delay: 1.5 }} />
    </svg>
  );
  if (k === 'transit') return (
    <svg viewBox="0 0 200 140" className="flow-art" aria-hidden="true">
      <motion.g animate={{ rotate: [-3, 3, -3], y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '100px', originY: '73px' }}>
        <rect x="60" y="44" width="80" height="58" rx="8" className="fa-pod" />
        <circle cx="128" cy="90" r="4" className="fa-led on" />
      </motion.g>
      <Draw d="M10 122 C40 122 50 96 70 110 S110 132 130 112 S170 98 190 120" className="fa-path" />
      <Draw d="M14 26 h22 l6 -12 l8 24 l7 -18 l5 6 h22" className="fa-trace" delay={0.3} />
      <Draw d="M108 26 h18 l4 8 l5 -14 l4 6 h55" className="fa-trace t2" delay={0.5} />
    </svg>
  );
  return (
    <svg viewBox="0 0 200 140" className="flow-art" aria-hidden="true">
      <rect x="40" y="104" width="120" height="18" rx="4" className="fa-dock" />
      <motion.rect x="60" y="48" width="80" height="56" rx="8" className="fa-pod" initial={{ y: -18 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease, delay: 0.2 }} />
      <circle cx="160" cy="34" r="20" className="fa-ok" />
      <Draw d="M150 34 l7 7 l13 -14" className="fa-tick" delay={0.9} />
    </svg>
  );
}
const FLOW = [
  ['drop', 'Drop in', 'A magnet in the cartridge wakes the pod.'],
  ['transit', 'Carry', 'By hand, cart or tube, as today.'],
  ['dock', 'Dock', 'The dock reads, scores and signs the trip.'],
];
export function ZeroClick() {
  return (
    <ol className="flow">
      {FLOW.map(([k, h, p], i) => (
        <Reveal as="li" key={k} delay={i * 0.08} className="flow-step">
          <FlowArt k={k} />
          <h3 className="h4"><span className="mono flow-n">{i + 1}</span>{h}</h3>
          <p>{p}</p>
        </Reveal>
      ))}
    </ol>
  );
}

/* ---------- comparison, in symbols ---------- */
const SYM = ['No', 'Partly', 'Yes'];
function Sym({ v, note }) {
  return <span className={`sym s${v}`} title={note} tabIndex={0}><i aria-hidden="true" /><span className="sr">{SYM[v]}: {note}</span></span>;
}
export function Matrix() {
  return (
    <div className="mx-scroll">
      <table className="mx">
        <thead>
          <tr>
            <th scope="col"><span className="sr">Feature</span></th>
            {MATRIX_COLS.map((c) => (
              <th scope="col" key={c.k} className={c.us ? 'us' : ''}>
                <b>{c.us ? <>Krono<wbr />Transit</> : c.h}</b>
                <small>{c.eg}{c.src && <Cite id={c.src} />}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MATRIX_ROWS.map(([row, cells]) => (
            <tr key={row}>
              <th scope="row">{row}</th>
              {MATRIX_COLS.map((c) => <td key={c.k} className={c.us ? 'us' : ''}><Sym v={cells[c.k][0]} note={cells[c.k][1]} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mx-key mono"><span><Sym v={2} note="Yes" /> yes</span><span><Sym v={1} note="Partly" /> partly</span><span><Sym v={0} note="No" /> no</span><span className="muted">Hover a symbol for detail · also <Cite id="tracie" /> <Cite id="tubesense" /></span></p>
    </div>
  );
}

export function Limits() {
  return (
    <ul className="limits">
      {LIMITS.map(([h, p], i) => (
        <Reveal as="li" key={h} delay={i * 0.05}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5 L15 15 M15 5 L5 15" /></svg>
          <b>{h}</b><span>{p}</span>
        </Reveal>
      ))}
    </ul>
  );
}

const NEXT = [
  ['now', 'Now', 'Bench validation', 'Reference thermometer, drop, heat and tube runs.'],
  ['next', 'If funded', 'Custom hardware', 'One PCB, a printed enclosure, ten pods.'],
  ['future', 'Future direction', 'Clinical study', 'Not planned. Would need a hospital partner and ethics review.'],
];
export function Next() {
  return (
    <ol className="next">
      {NEXT.map(([k, tag, h, p], i) => (
        <Reveal as="li" key={k} delay={i * 0.08} className={`next-${k}`}>
          <span className="next-dot" aria-hidden="true" />
          <span className="mono next-tag">{tag}</span>
          <h3 className="h4">{h}</h3>
          <p>{p}{k === 'future' && <Cite id="cfr" />}</p>
        </Reveal>
      ))}
    </ol>
  );
}

export function Sources() {
  return (
    <ol className="srcs">
      {Object.entries(SOURCES).map(([k, [t, u]]) => (
        <li key={k} id={`src-${k}`}><a href={u} target="_blank" rel="noreferrer">{t}</a></li>
      ))}
    </ol>
  );
}
