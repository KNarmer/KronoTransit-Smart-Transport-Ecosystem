import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';
import { SCENARIOS, BAND } from '../data/scenarios.js';
import Report from '../components/Report.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';

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
        <Kicker>Lab Reports</Kicker>
        <h1 className="h1">What the lab receives when the pod docks.</h1>
        <p className="lede">A transport report is written for the person who has to decide whether to run the test. It leads with a verdict, then shows the evidence: every reading on one timeline, every deviation with its time, and a chain of custody that can’t be quietly edited.</p>
        <p className="flag mono">[Illustrative demonstration data] These reports are generated from simple models to show format and content. They are not bench measurements, and the system has no clinical validation yet. Real bench logs will be published here as they are recorded.</p>
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

      <section className="wrap section rep-notes">
        <Reveal className="rep-col">
          <Kicker>How to read it</Kicker>
          <dl className="defs">
            <div><dt>Viability status</dt><dd>Set by rules the receiving lab chooses. In this demo: never outside the band → VERIFIED; up to 10 minutes outside → WARNING; longer → EXCURSION.</dd></div>
            <div><dt>Mean kinetic temperature</dt><dd>A single temperature that has the same cumulative effect as the whole fluctuating trace, computed from the core probe with ΔH = 83.144 kJ/mol. Brief spikes count for more than their duration suggests.</dd></div>
            <div><dt>Recovery</dt><dd>The pod has no heater or cooler. When it returns to the band, that’s the insulated well and cold packs doing their job, and the report says so.</dd></div>
            <div><dt>Edge AI verdict</dt><dd>The on-board model’s running quality score is shown as a flag, never as a replacement for the lab’s own judgement.</dd></div>
          </dl>
        </Reveal>
        <Reveal className="rep-col" delay={0.05}>
          <Kicker>Into the lab system</Kicker>
          <p className="body">The same summary is sent as a standard HL7 FHIR R4 Observation linked to the Specimen, so it lands in the lab’s existing system instead of another portal.</p>
          <pre className="code" aria-label="Example FHIR Observation"><code>{fhir(sc)}</code></pre>
        </Reveal>
      </section>
    </>
  );
}
