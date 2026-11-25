import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { Masthead } from '../components/Shell.jsx';
import { Rig, drop, hw } from '../components/Rig.jsx';
import Sensors from '../components/Sensors.jsx';

const PodViewer = lazy(() => import('../components/PodViewer.jsx'));

// Subsystems, matched against the part names that come out of the model.
const GROUPS = [
  ['Lid', 'Seals the well; light pipe carries the status LED', /Lid|gasket/i],
  ['Cartridge well', 'The specimen and the sensors that watch it', /Cartridge|cradle|vent|AS7341|BME688|LSM6|H3LIS|ST25R|Reed|PT1000 element · CORE|white LED|Sorbothane/i],
  ['Backbone', 'Temperature amplifiers, clock and status light', /Perma-Proto #2|MAX31865|PCF8523|Ambient|PT1000 element · AMB|RGB|Status-LED/i],
  ['Base tray', 'Processor, battery and power', /nRF5340|LiPo|bq24074|MAX17048|MiniBoost|Perma-Proto #1|toggle|MCP1700|Magnetic connector · pod|Mid deck/i],
  ['Shell', '3D-printed PETG, 3 mm walls', /^Shell/i],
  ['KronoDock', 'Charges the pod and receives its log', /KronoDock|Raspberry|Perma-Proto #3|Magnetic connector · dock|RXEF110/i],
];
const HIDE = /Header pin|standoff|resistor|capacitor|PN2222|heat-set|-pin header|Wire|Kapton|Solder|Cut 1\.0A/i;

export default function Pod() {
  const [ready, setReady] = useState(false);
  const [parts, setParts] = useState([]);
  const [hover, setHover] = useState(null);
  const [sel, setSel] = useState(null);
  const ctl = useRef(null);
  const onReady = useCallback(() => setReady(true), []);
  const onHover = useCallback((l) => setHover(l), []);
  const onParts = useCallback((l) => setParts(l), []);

  const grouped = useMemo(() => GROUPS.map(([name, sub, re]) => [name, sub, parts.filter((p) => re.test(p) && !HIDE.test(p))]), [parts]);
  const shown = hover || sel;

  return (
    <>
      <Rig
        className="rig-pod-top"
        viewBox="0 0 640 760"
        wires={drop([300, 316, 332, 348, 364, 380, 396], { top: -40, to: 470, sway: 90, colors: ['blue', 'white', 'black', 'red', 'yellow', 'green', 'purple'], spread: 3 })}
        boards={[{ id: 'nfc', x: 350, y: 590, w: 330, rot: 9 }]}
      />
      <div className="wrap">
        <Masthead
          n="03"
          kicker="The pod"
          title={<>Two parts.<br />One clicks into the other.</>}
        >
          <p>Electronics in every vial would be far too expensive. So the expensive part, the pod, is reusable and does all the sensing. The part that touches the sample is a cartridge that costs under a dollar to make. Below is Kit B, the working prototype, pulled apart.</p>
        </Masthead>
      </div>

      <section className="explorer">
        <figure className="scope scope-xl">
          <span className="crop tl" /><span className="crop tr" /><span className="crop bl" /><span className="crop br" />
          <figcaption className="scope-cap mono"><b>Fig. 3</b> Explore Kit B · hover or pick a part</figcaption>
          <motion.div className="scope-view" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.8, ease }}>
            <Suspense fallback={null}><PodViewer selected={sel} onHover={onHover} onParts={onParts} onReady={onReady} autoRotate={false} controlsRef={ctl} /></Suspense>
          </motion.div>
          {!ready && <p className="scope-load mono">Loading model · 2 MB</p>}
          <div className="scope-foot">
            <div className="readout" aria-live="polite"><span className="mono">Part</span><b>{shown || 'Hover over the model'}</b></div>
            <div className="scope-tools">
              {sel && <button className="btn btn-sm" onClick={() => setSel(null)}>Clear</button>}
              <button className="btn btn-sm" onClick={() => ctl.current?.reset?.()}>Reset view</button>
            </div>
          </div>
        </figure>
        <aside className="parts" aria-label="Parts by subsystem">
          {grouped.map(([name, sub, list]) => (
            <div key={name} className="parts-g">
              <h3>{name}</h3>
              <p>{sub}</p>
              <ul>
                {list.map((l) => (
                  <li key={l}>
                    <button className={`part ${sel === l ? 'is-on' : ''} ${hover === l ? 'is-hover' : ''}`} onClick={() => setSel(sel === l ? null : l)} aria-pressed={sel === l}>{l}</button>
                  </li>
                ))}
                {!list.length && <li className="parts-wait mono">{ready ? '—' : 'loading…'}</li>}
              </ul>
            </div>
          ))}
        </aside>
      </section>

      <div className="wrap">
        <section className="sec">
          <div className="sec-label"><span className="label">3.1</span><h2 className="d3">Pod and cartridge</h2></div>
          <div className="duo">
            <article className="card">
              <div className="card-top"><span className="tag">Reusable</span><span className="mono">190 × 130 × 160 mm</span></div>
              <h3 className="d3">KronoTransit pod</h3>
              <p>A sealed, insulated carrier with every sensor, the processor, a 2,500 mAh battery and a status light. It goes back into service after each trip.</p>
              <dl className="specs">
                <div><dt>Processor</dt><dd>Nordic nRF5340, dual Arm Cortex-M33</dd></div>
                <div><dt>Insulation</dt><dd>XPS foam well + two cold packs</dd></div>
                <div><dt>Mounting</dt><dd>Cradle on four Sorbothane feet</dd></div>
                <div><dt>Cost at scale</dt><dd>≈ $135 per pod</dd></div>
              </dl>
            </article>
            <article className="card card-lime">
              <div className="card-top"><span className="tag tag-lime">Consumable</span><span className="mono">20 mL vial</span></div>
              <h3 className="d3">Verity cartridge</h3>
              <p>A clear vial with a keyed collar, an NFC tag, a magnet for the seat switch and a dry-chemistry colour disc. The pod reads it through the wall.</p>
              <dl className="specs">
                <div><dt>Holds</dt><dd>Blood, tissue, biobank samples</dd></div>
                <div><dt>Identity</dt><dd>NTAG215 tag, serialised</dd></div>
                <div><dt>Indicator</dt><dd>Changes colour with exposure</dd></div>
                <div><dt>Cost to make</dt><dd>≈ $0.85</dd></div>
              </dl>
            </article>
          </div>
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">3.2</span><h2 className="d3">Five witnesses in one box</h2></div>
          <Sensors />
        </section>

        <section className="sec dock">
          <div className="dock-img"><img src={hw('pi')} alt="Raspberry Pi Zero 2 W, the KronoDock's computer" loading="lazy" /></div>
          <div>
            <div className="sec-label"><span className="label">3.3</span><h2 className="d3">KronoDock</h2></div>
            <p className="body">At the lab the pod lands on a dock: a Raspberry Pi Zero 2 W behind a five-pin magnetic connector. The connector charges the pod at 500 mA and carries a serial link. The dock asks for the log, checks every signature, and only then lets the pod clear its memory.</p>
            <dl className="specs specs-inline">
              <div><dt>Link</dt><dd>UART: HELLO → GET_FRAMES → ACK</dd></div>
              <div><dt>Power</dt><dd>Fused 5 V, ≈ 0.55 A</dd></div>
              <div><dt>Output</dt><dd>HL7 FHIR R4 Specimen + Observation</dd></div>
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}
