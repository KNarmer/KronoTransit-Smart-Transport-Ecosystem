import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { TAGLINE } from '../routes.js';
import PcbHero from '../components/PcbHero.jsx';
import Journey from '../components/Journey.jsx';
import Witnesses from '../components/Witnesses.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';
import { Rig, Hang, Peek, Bench } from '../components/Rig.jsx';
import Telemetry from '../components/Telemetry.jsx';
import InAction from '../components/InAction.jsx';

const PodViewer = lazy(() => import('../components/PodViewer.jsx'));

export default function Overview() {
  const [ready, setReady] = useState(false);
  const [part, setPart] = useState(null);
  const api = useRef(null);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <>
      <section className="ov-hero">
        <Rig
          className="rig-ov-dk" from="left"
          viewBox="0 0 620 520"
          boards={[{ id: 'dk', x: 300, y: 330, w: 520, rot: 14 }]}
          wires={[
            { from: [190, 230], c1: [120, 200], c2: [40, 260], to: [-40, 250], color: 'red' },
            { from: [200, 250], c1: [130, 250], c2: [50, 320], to: [-40, 320], color: 'black' },
            { from: [215, 275], c1: [150, 310], c2: [60, 400], to: [-40, 400], color: 'yellow' },
            { from: [235, 300], c1: [170, 360], c2: [90, 470], to: [-40, 480], color: 'blue' },
            { from: [260, 330], c1: [210, 420], c2: [140, 520], to: [60, 560], color: 'green' },
          ]}
          led={[402, 410]}
        />
        <div className="ov-hero-copy">
          <motion.p className="hero-k mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease }}>Student-built · biomedical engineering</motion.p>
          <motion.h1 className="display" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
            {TAGLINE.replace('.', '')}<span className="dot">.</span>
          </motion.h1>
          <motion.p className="hero-lede" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease, delay: 0.15 }}>
            A sealed pod that rides with a blood or tissue sample, watches it the whole way, and tells the lab if it’s still good.
          </motion.p>
          <div className="hero-links">
            <Link to="/pod" className="go go-strong">Take it apart <span>→</span></Link>
            <Link to="/lab-reports" className="go">See a lab report <span>→</span></Link>
          </div>
          <Link to="/why" className="hero-fact">
            <b>46–68%</b><span>of lab errors happen before the sample is ever tested. Why that matters</span><i aria-hidden="true">→</i>
          </Link>
        </div>

        <figure className="scope">
          <span className="crop tl" /><span className="crop tr" /><span className="crop bl" /><span className="crop br" />
          <figcaption className="scope-cap mono"><b>Fig. 1</b> The prototype, pulled apart · every board and wire</figcaption>
          <motion.div className="scope-view" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.8, ease }}>
            <Suspense fallback={null}><PodViewer apiRef={api} onReady={onReady} onHover={setPart} startExploded autoRotate /></Suspense>
          </motion.div>
          {!ready && <p className="scope-load mono">Unpacking the pod…</p>}
          <div className="scope-foot">
            <div className="scope-read" aria-live="polite"><span className="mono">Part</span><b>{part || 'Hover over the model'}</b></div>
            <button className="ctl" onClick={() => api.current?.reset()}>Reset view</button>
          </div>
        </figure>
      </section>

      <Telemetry />
      <PcbHero />

      <section className="section journey-wrap">
        <div className="wrap"><Reveal><Kicker>Theatre → histology</Kicker><h2 className="h2">Ward to lab, every second on record.</h2></Reveal></div>
        <Journey />
      </section>

      <section className="wrap section wit-wrap t-center">
        <Reveal className="sec-intro">
          <Kicker>Sensor fusion</Kicker>
          <h2 className="h2">Shake it. Bake it. Open it. Fly it.</h2>
          <p className="body">Pick an event. Watch all five react.</p>
        </Reveal>
        <Witnesses />
      </section>

      <section className="wrap section t-right">
        <Reveal className="sec-intro"><Kicker>Live subsystems</Kicker><h2 className="h2">Switch it on. Watch each subsystem work.</h2></Reveal>
        <InAction />
      </section>

      <section className="wrap section student">
        <Reveal>
          <p className="student-line">Designed, wired and coded by high school students.</p>
          <p className="student-sub">A student research project, not a product. Nothing is for sale and no pilots are planned.</p>
          <div className="hero-links center">
            <Link className="go go-strong" to="/grants">Back the bench build <span>→</span></Link>
            <Link className="go" to="/why">Why it matters <span>→</span></Link>
            <Link className="go" to="/engineering">See the engineering <span>→</span></Link>
          </div>
        </Reveal>
      </section>
      <Bench ids={['lsm6', 'bme', 'pi', 'as7341', 'rtc']} />
    </>
  );
}
