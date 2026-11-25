import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { Arrow } from '../components/Icons.jsx';
import { Rig, hw, drop } from '../components/Rig.jsx';
import { PAGES } from '../pages.js';

const PodViewer = lazy(() => import('../components/PodViewer.jsx'));

const minute = [
  ['A pod rides with the sample.', 'A sealed, insulated carrier goes with a tube of blood or a biopsy from the ward to the lab.'],
  ['It writes down the whole trip.', 'Core and ambient temperature, every knock up to ±400 g, leaks, the indicator colour, and which vial it carried.'],
  ['It can’t be quietly edited.', 'Each entry is chained to the last and signed in hardware. Change a line and the chain breaks.'],
  ['The lab gets a verdict.', 'On the dock, the pod hands over a standard health record: green, amber or red, before anyone runs a test.'],
];

const tray = [
  ['dk', 'nRF5340 DK', 'Brain', 'Dual-core Arm, Bluetooth, hardware crypto for signing the log'],
  ['h3lis', 'H3LIS331', 'Impact', '±100/200/400 g accelerometer for drops and tube slams'],
  ['lsm6', 'LSM6DSOX', 'Motion', '6-axis IMU that wakes the pod on handling'],
  ['bme', 'BME688', 'Air', 'Gas sensor watching for preservative leaks and decay'],
  ['as7341', 'AS7341', 'Colour', '10-channel light sensor reading the cartridge indicator'],
  ['core', 'MAX31865 ×2', 'Temperature', 'Precision amplifiers for the core and ambient PT1000 probes'],
  ['nfc', 'ST25R3916B', 'Identity', 'NFC reader that knows which cartridge is inside'],
  ['pi', 'Pi Zero 2 W', 'KronoDock', 'Receives the signed log and turns it into a FHIR record'],
];

export default function Overview() {
  const [ready, setReady] = useState(false);
  const [part, setPart] = useState(null);
  const ctl = useRef(null);
  const onReady = useCallback(() => setReady(true), []);
  const onHover = useCallback((l) => setPart(l), []);

  return (
    <>
      <section className="ov-hero">
        <Rig
          className="rig-ov-dk"
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
          <p className="chip"><i className="chip-dot" /> Kit B · build week 3 of 6</p>
          <motion.h1 className="d1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            A suitcase for blood that can’t lie.
          </motion.h1>
          <p className="lead">
            KronoTransit is a sealed pod that travels with a lab specimen and keeps a signed, tamper-proof record of the trip. When it docks, the lab knows whether the sample is still good, before anyone runs a test.
          </p>
          <div className="ctas">
            <Link className="btn btn-lime" to="/pod">Explore the pod <span className="btn-i"><Arrow /></span></Link>
            <Link className="btn btn-line" to="/problem">Why it matters</Link>
          </div>
        </div>

        <figure className="scope">
          <span className="crop tl" /><span className="crop tr" /><span className="crop bl" /><span className="crop br" />
          <figcaption className="scope-cap mono"><b>Fig. 1</b> Kit B alpha pod, pulled apart · 158 parts · true scale</figcaption>
          <motion.div className="scope-view" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.8, ease }}>
            <Suspense fallback={null}><PodViewer onReady={onReady} onHover={onHover} controlsRef={ctl} /></Suspense>
          </motion.div>
          {!ready && <p className="scope-load mono">Loading model · 2 MB</p>}
          <div className="scope-foot">
            <div className="readout" aria-live="polite">
              <span className="mono">Part</span>
              <b>{part || 'Hover over the model'}</b>
            </div>
            <div className="scope-tools">
              <span className="mono scope-hint">Drag to turn</span>
              <button className="btn btn-sm" onClick={() => ctl.current?.reset?.()}>Reset view</button>
            </div>
          </div>
        </figure>
      </section>

      <section className="wrap ov-min">
        <Rig
          className="rig-ov-vine"
          viewBox="0 0 360 900"
          wires={drop([150, 166, 182, 198, 214], { top: -30, to: 610, sway: 70, colors: ['red', 'black', 'yellow', 'green', 'blue'], spread: 2.4 })}
          boards={[{ id: 'bme', x: 182, y: 720, w: 300, rot: -8 }]}
        />
        <div className="ov-min-head">
          <span className="label">In one minute</span>
          <h2 className="d2">Four sentences.<br />That’s the whole idea.</h2>
        </div>
        <ol className="ov-min-list">
          {minute.map(([h, p], i) => (
            <li key={h}>
              <span className="ov-min-n">0{i + 1}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap tray">
        <div className="tray-head">
          <h2 className="d2">What’s inside.</h2>
          <p className="body">Real boards, rendered from the build model. Every one of these is on the parts list, ordered, and wired by hand.</p>
        </div>
        <ul className="tray-grid">
          {tray.map(([id, name, role, what]) => (
            <li key={id} className="tray-item">
              <div className="tray-img"><img src={hw(id)} alt="" loading="lazy" decoding="async" /></div>
              <span className="label">{role}</span>
              <h3>{name}</h3>
              <p>{what}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap chapters">
        <h2 className="label">Chapters</h2>
        <ul>
          {PAGES.slice(1).map((p) => (
            <li key={p.path}>
              <Link to={p.path} className="chapter">
                <span className="chapter-n">{p.n}</span>
                <span className="chapter-t">{p.label}</span>
                <span className="chapter-b">{p.blurb}</span>
                <span className="chapter-a"><Arrow size={18} /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
