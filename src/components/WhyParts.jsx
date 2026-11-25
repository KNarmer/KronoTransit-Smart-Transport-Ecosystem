// Building blocks for the "Why it matters" page (and the stakes banner on the overview).
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { Reveal, Draw } from './Bits.jsx';
import Prov from './Prov.jsx';
import { SOURCES, STAKES, FLOW, MATRIX_COLS, MATRIX_ROWS, ECON, ROADMAP } from '../data/why.js';

export function Cite({ id }) {
  const s = SOURCES[id];
  if (!s) return null;
  const n = Object.keys(SOURCES).indexOf(id) + 1;
  return <a className="cite" href={`#src-${id}`} title={s[0]} onClick={(e) => { e.preventDefault(); document.getElementById(`src-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>[{n}]</a>;
}

// Full-bleed band of sourced numbers. `compact` is the overview version with a link through.
export function StakesBanner({ compact = false }) {
  const list = compact ? STAKES.slice(0, 3) : STAKES;
  return (
    <section className={`stakes ${compact ? 'stakes-compact' : ''}`} aria-labelledby={compact ? 'stakes-h-c' : 'stakes-h'}>
      <div className="wrap">
        <div className="stakes-head">
          <p className="stakes-k mono">Clinical & financial stakes · why now</p>
          <h2 id={compact ? 'stakes-h-c' : 'stakes-h'} className="h3">The sample is the one thing in a hospital that travels without a witness.</h2>
        </div>
        <ul className={`stakes-grid n${list.length}`}>
          {list.map((s, i) => (
            <Reveal as="li" key={s.big} delay={i * 0.06}>
              <b className="stakes-big">{s.big}</b>
              <p>{s.label} <Prov k={s.k} src={SOURCES[s.src][0]} />{!compact && <Cite id={s.src} />}</p>
            </Reveal>
          ))}
        </ul>
        {compact && <Link to="/why" className="go go-strong stakes-go">Why it matters: the full case <span>→</span></Link>}
      </div>
    </section>
  );
}

// Three-step workflow, each with a small line drawing.
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
      <motion.circle cx="135" cy="112" r="5" className="fa-led" initial={{ opacity: 0.15 }} whileInView={{ opacity: [0.15, 1, 0.4, 1] }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 1.5 }} />
    </svg>
  );
  if (k === 'transit') return (
    <svg viewBox="0 0 200 140" className="flow-art" aria-hidden="true">
      <rect x="60" y="44" width="80" height="58" rx="8" className="fa-pod" />
      <Draw d="M10 122 C40 122 50 96 70 110 S110 132 130 112 S170 98 190 120" className="fa-path" />
      <Draw d="M14 26 h22 l6 -12 l8 24 l7 -18 l5 6 h22" className="fa-trace" delay={0.3} />
      <Draw d="M108 26 h18 l4 8 l5 -14 l4 6 h55" className="fa-trace t2" delay={0.5} />
      <circle cx="128" cy="90" r="4" className="fa-led on" />
    </svg>
  );
  return (
    <svg viewBox="0 0 200 140" className="flow-art" aria-hidden="true">
      <rect x="40" y="104" width="120" height="18" rx="4" className="fa-dock" />
      <rect x="60" y="48" width="80" height="56" rx="8" className="fa-pod" />
      <circle cx="160" cy="34" r="20" className="fa-ok" />
      <Draw d="M150 34 l7 7 l13 -14" className="fa-tick" delay={0.4} />
      <Draw d="M100 104 V96" className="fa-pin" />
    </svg>
  );
}

export function ZeroClick() {
  return (
    <ol className="flow">
      {FLOW.map((s, i) => (
        <Reveal as="li" key={s.k} delay={i * 0.08} className="flow-step">
          <FlowArt k={s.k} />
          <p className="flow-n mono">Step {s.n}</p>
          <h3 className="h3">{s.h}</h3>
          <dl>
            <div><dt className="mono">Staff</dt><dd>{s.staff}</dd></div>
            <div><dt className="mono">Pod</dt><dd>{s.pod}</dd></div>
          </dl>
        </Reveal>
      ))}
    </ol>
  );
}

// Competitive landscape: a table on wide screens, one card per column on phones.
export function Matrix() {
  return (
    <>
      <div className="mx-scroll">
        <table className="mx">
          <thead>
            <tr>
              <th scope="col"><span className="sr">Criterion</span></th>
              {MATRIX_COLS.map((c) => (
                <th scope="col" key={c.k} className={c.us ? 'us' : ''}>
                  <b>{c.h}</b>
                  <small>{c.eg}{c.src && <> <Cite id={c.src} /></>}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map(([row, cells]) => (
              <tr key={row}>
                <th scope="row">{row}</th>
                {MATRIX_COLS.map((c) => <td key={c.k} className={c.us ? 'us' : ''}>{cells[c.k]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mx-cards">
        {MATRIX_COLS.map((c) => (
          <section key={c.k} className={`mx-card ${c.us ? 'us' : ''}`} aria-label={c.h}>
            <h3 className="h4">{c.h}</h3>
            <p className="mx-eg">{c.eg}{c.src && <> <Cite id={c.src} /></>}</p>
            <dl>
              {MATRIX_ROWS.map(([row, cells]) => <div key={row}><dt className="mono">{row}</dt><dd>{cells[c.k]}</dd></div>)}
            </dl>
          </section>
        ))}
      </div>
      <p className="mx-more note">Sample-transport monitors in detail: Roche navify <Cite id="navify" />, Greiner Tracie <Cite id="tracie" />, SmartTube <Cite id="smarttube" />, TubeSense <Cite id="tubesense" />. Couriers: MedSpeed <Cite id="medspeed" />. Loggers: TempTale <Cite id="temptale" />.</p>
    </>
  );
}

// Razor-and-blade economics: three tiers with target gross-margin bars.
export function RazorBlade() {
  return (
    <div className="econ">
      {ECON.map((e, i) => (
        <Reveal key={e.k} delay={i * 0.08} className={`econ-tier econ-${e.k}`}>
          <p className="econ-tag mono">{e.tag}</p>
          <h3 className="h3">{e.h}</h3>
          <dl className="econ-dl">
            <div><dt className="mono">Price</dt><dd>{e.price} <Prov k="est" /></dd></div>
            <div><dt className="mono">Cost</dt><dd>{e.cost} <Prov k="est" /></dd></div>
          </dl>
          <div className="econ-m">
            {e.margin ? (
              <>
                <span className="mono">Target gross margin</span>
                <span className="econ-track"><motion.i initial={{ width: 0 }} whileInView={{ width: `${e.margin[1]}%` }} viewport={{ once: true }} transition={{ duration: 1, ease, delay: 0.2 + i * 0.1 }} /></span>
                <b>{e.margin[0] === e.margin[1] ? `${e.margin[0]}%+` : `${e.margin[0]}–${e.margin[1]}%`}</b>
              </>
            ) : (
              <>
                <span className="mono">Payback</span>
                <span className="econ-track"><motion.i className="pay" initial={{ width: 0 }} whileInView={{ width: '14%' }} viewport={{ once: true }} transition={{ duration: 1, ease, delay: 0.2 }} /></span>
                <b>&lt; 2 mo</b>
              </>
            )}
          </div>
          <p className="econ-role">{e.role}{e.payback && <> {e.payback}.</>}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function Roadmap() {
  return (
    <ol className="road">
      {ROADMAP.map((s, i) => (
        <Reveal as="li" key={s.stage} delay={i * 0.08} className={`road-st ${s.now ? 'now' : ''}`}>
          <div className="road-dot" aria-hidden="true" />
          <p className="road-k mono">{s.stage}{s.now && <span className="road-now">Current</span>}</p>
          <h3 className="h3">{s.h}</h3>
          <p className="road-cost mono">{s.cost} <Prov k={s.k} /></p>
          <ul>{s.items.map((t) => <li key={t}>{t}</li>)}</ul>
          <p className="road-exit">{s.exit}{s.src && <> <Cite id={s.src} /></>}</p>
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
