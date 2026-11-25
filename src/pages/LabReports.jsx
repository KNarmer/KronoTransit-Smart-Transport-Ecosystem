import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';
import { SCENARIOS, BAND } from '../data/scenarios.js';
import Report from '../components/Report.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';
import { Hang, Peek } from '../components/Rig.jsx';

const fhir = (sc) => JSON.stringify({
  resourceType: 'Observation',
  status: 'final',
  code: { text: 'Specimen transport conditions' },
  specimen: { reference: `Specimen/KT-DEMO-${sc.id === 'A' ? '0001' : '0002'}` },
  device: { display: 'KronoTransit pod alpha-01' },
  component: [
    { code: { text: 'Mean kinetic temperature' }, valueQuantity: { value: +sc.sum.mkt.toFixed(2), unit: 'Cel' } },
    { code: { text: `Time outside ${BAND[0]}–${BAND[1]} °C` }, valueString: sc.sum.outside },
    { code: { text: 'Peak impact' }, valueQuantity: { value: sc.sum.peakG, unit: 'g' } },
    { code: { text: 'Chain of custody' }, valueString: 'verified' },
    { code: { text: 'Transport verdict' }, valueString: sc.sum.status },
  ],
}, null, 2);

export default function LabReports() {
  const [id, setId] = useState('B');
  const sc = SCENARIOS.find((s) => s.id === id);

  return (
    <>
      <section className="wrap lead-block">
        <Hang id="as7341" className="rig-lead" colors={['green', 'white', 'red', 'black']} rot={-8} />
        <Hang id="rtc" className="rig-lead2" colors={['yellow', 'black', 'blue']} len={220} w={200} rot={9} />
        <Kicker>Lab Reports</Kicker>
        <h1 className="h1">What the lab sees when the pod docks.</h1>
        <p className="lede">A verdict first, then the evidence. Drag across the timeline, or try to tamper with the log.</p>
        <p className="flag mono">Illustrative demo data · not bench measurements · no clinical validation yet</p>
      </section>

      <section className="wrap scen">
        <div className="scen-pick" role="tablist" aria-label="Scenario">
          {SCENARIOS.map((s) => (
            <button key={s.id} role="tab" aria-selected={s.id === id} className={`scen-a ${s.id === id ? 'on' : ''}`} onClick={() => setId(s.id)}>
              <span className="mono">Scenario {s.id}</span>
              <b>{s.name}</b>
              <small>{s.blurb}</small>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.45, ease }}>
            <Report sc={sc} />
          </motion.div>
        </AnimatePresence>
      </section>

      <section className="wrap section rep-more">
        <Peek id="pi" side="left" className="rig-rep" rot={10} colors={['red', 'black', 'green']} />
        <details className="more">
          <summary>How to read this report</summary>
          <dl className="defs">
            <div><dt>Status</dt><dd>Set by the receiving lab’s own rules. Demo rule: never outside 2–8 °C → VERIFIED; up to 10 min → WARNING; longer → EXCURSION.</dd></div>
            <div><dt>Mean kinetic temperature</dt><dd>One temperature with the same overall effect as the whole wobbly trace (ΔH = 83.144 kJ/mol).</dd></div>
            <div><dt>Recovery</dt><dd>No heater or cooler; coming back into the band is the insulation and cold packs working.</dd></div>
          </dl>
        </details>
        <details className="more">
          <summary>What lands in the hospital system (FHIR)</summary>
          <pre className="code"><code>{fhir(sc)}</code></pre>
        </details>
      </section>
    </>
  );
}
