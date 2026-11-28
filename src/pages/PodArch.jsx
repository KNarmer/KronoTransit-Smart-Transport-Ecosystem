import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';
import { COMPONENTS } from '../data/components.js';
import Prov from '../components/Prov.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';
import CrossSection from '../components/CrossSection.jsx';
import { Hang, Bench } from '../components/Rig.jsx';

const PodViewer = lazy(() => import('../components/PodViewer.jsx'));
const GROUPS = ['Cartridge well', 'Backbone', 'Base tray', 'Shell', 'KronoDock'];

export default function PodArch() {
  const api = useRef(null);
  const [ready, setReady] = useState(false);
  const [labels, setLabels] = useState([]);
  const [sel, setSel] = useState(null); // component id or { label }
  const [hover, setHover] = useState(null);
  const [exploded, setExploded] = useState(false);

  const comp = typeof sel === 'string' ? COMPONENTS.find((c) => c.id === sel) : null;
  const available = useMemo(() => new Set(COMPONENTS.filter((c) => labels.some((l) => c.match.test(l))).map((c) => c.id)), [labels]);

  const choose = (c) => {
    if (sel === c.id) { setSel(null); api.current?.select(null); return; }
    setSel(c.id);
    api.current?.select(c.match);
  };
  const onPick = useCallback((label) => {
    if (!label) { setSel(null); api.current?.select(null); return; }
    const c = COMPONENTS.find((x) => x.match.test(label));
    if (c) { setSel(c.id); api.current?.select(c.match); }
    else { setSel({ label }); api.current?.select(label); }
  }, []);
  const onReady = useCallback((l) => { setLabels(l); setReady(true); }, []);
  const toggle = () => { const v = !exploded; setExploded(v); api.current?.setExplode(v ? 1 : 0); };
  const reset = () => { setSel(null); api.current?.reset(); };

  return (
    <>
      <section className="wrap lead-block">
        <Kicker>Pod Architecture</Kicker>
        <h1 className="h1">Seventeen subsystems in a lunch-tin-sized box.</h1>
        <p className="lede">Pick a part. The camera flies to it and everything else turns to glass.</p>
      </section>

      <section className="explore">
        <div className="explore-stage">
          <motion.div className="explore-gl" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.8, ease }}>
            <Suspense fallback={null}><PodViewer apiRef={api} onReady={onReady} onPick={onPick} onHover={setHover} zoom /></Suspense>
          </motion.div>
          {!ready && <p className="explore-wait mono">Loading model · 164 parts</p>}
          <div className="explore-ctl">
            <button className="ctl" onClick={toggle} aria-pressed={exploded}>{exploded ? 'Assemble' : 'Pull apart'}</button>
            <button className="ctl" onClick={reset}>Reset view</button>
            <span className="mono explore-hint">Drag to rotate · scroll to zoom · click a part</span>
          </div>
          <div className="explore-hover mono" aria-live="polite">{hover ? `› ${hover}` : ''}</div>

          <AnimatePresence>
            {sel && (
              <motion.aside key={comp ? comp.id : sel.label} className="hud" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8, transition: { duration: 0.15 } }} transition={{ duration: 0.35, ease }}>
                {comp ? (
                  <>
                    <p className="hud-k mono">{comp.group} · {comp.board}</p>
                    <h3>{comp.name}</h3>
                                        <p className="hud-role">{comp.role}</p>
                    <dl className="hud-dl">
                      <div><dt>Interface</dt><dd>{comp.iface}</dd></div>
                      {comp.specs.slice(0, 2).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                    </dl>
                    {comp.ref[1] && <a className="hud-ref" href={comp.ref[1]} target="_blank" rel="noreferrer">Source: {comp.ref[0]} ↗</a>}
                  </>
                ) : (
                  <><p className="hud-k mono">Part</p><h3>{sel.label}</h3><p className="hud-role">A supporting part of the assembly.</p></>
                )}
                <button className="hud-x" onClick={reset} aria-label="Close">×</button>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        <nav className="tree" aria-label="Components">
          {GROUPS.map((g) => (
            <div key={g} className="tree-g">
              <p className="tree-h mono">{g}</p>
              <ul>
                {COMPONENTS.filter((c) => c.group === g).map((c) => (
                  <li key={c.id}>
                    <button className={`tree-a ${sel === c.id ? 'on' : ''}`} onClick={() => choose(c)} disabled={ready && !available.has(c.id)} aria-pressed={sel === c.id}>
                      <span>{c.name}</span><small>{c.board}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </section>
      <section className="wrap section xs-wrap t-right">
        <Reveal className="sec-intro"><Kicker>Section A–A</Kicker><h2 className="h2">Foam, vial, sensors, battery. In that order.</h2></Reveal>
        <div className="xs-full">
          <CrossSection />
        </div>
      </section>
      <Bench ids={['core', 'nfc', 'boost', 'gauge']} />
    </>
  );
}
