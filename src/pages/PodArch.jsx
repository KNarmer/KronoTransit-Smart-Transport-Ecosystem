import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';
import { COMPONENTS } from '../data/components.js';
import Prov from '../components/Prov.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';
import CrossSection from '../components/CrossSection.jsx';
import { Hang, Peek } from '../components/Rig.jsx';

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
        <Hang id="nfc" className="rig-lead" colors={['blue', 'white', 'black', 'red', 'yellow']} />
        <Kicker>Pod Architecture</Kicker>
        <h1 className="h1">Seventeen subsystems in a lunch-tin-sized box.</h1>
        <p className="lede">Pick a part. The camera flies to it and everything else turns to glass.</p>
      </section>

      <section className="explore">
        <div className="explore-stage">
          <motion.div className="explore-gl" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.8, ease }}>
            <Suspense fallback={null}><PodViewer apiRef={api} onReady={onReady} onPick={onPick} onHover={setHover} /></Suspense>
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
                    <p className="hud-maker">{comp.maker}</p>
                    <p className="hud-role">{comp.role}</p>
                    <dl className="hud-dl">
                      <div><dt>Interface</dt><dd>{comp.iface}</dd></div>
                      <div><dt>Supply</dt><dd>{comp.supply[0]} <Prov k={comp.supply[1]} src={comp.ref[0]} /></dd></div>
                      <div><dt>Power</dt><dd>{comp.power[0]} <Prov k={comp.power[1]} src={comp.ref[0]} /></dd></div>
                      {comp.specs.map(([k, v, p]) => <div key={k}><dt>{k}</dt><dd>{v} <Prov k={p} src={comp.ref[0]} /></dd></div>)}
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

      <section className="wrap section xs-wrap">
        <Peek id="pp2" side="right" className="rig-xs" colors={['red', 'blue', 'yellow']} />
        <Reveal><Kicker>Cross-section</Kicker><h2 className="h2">How the layers stack.</h2></Reveal>
        <div className="xs-grid">
          <Reveal className="xs-copy">
            <p className="body">The sample sits in the middle, wrapped in foam and cold packs. The electronics live underneath, away from the cold.</p>
            <p className="note">No heater or cooler: an earlier Peltier design would have drained the battery in minutes. <Prov k="est" /></p>
          </Reveal>
          <CrossSection />
        </div>
      </section>
    </>
  );
}
