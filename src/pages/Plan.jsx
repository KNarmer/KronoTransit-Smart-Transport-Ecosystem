import { Masthead } from '../components/Shell.jsx';
import { Rig, drop } from '../components/Rig.jsx';
import { REPO } from '../pages.js';
import { Arrow } from '../components/Icons.jsx';

const steps = [
  ['Lead with tube validation', 'Pneumatic-tube forces change route by route and after maintenance. A few pods per hospital, run as a recurring audit. No cartridge, no hospital IT, no specimen-level claim: the fastest path to a paying lab.'],
  ['Expand to high-value specimens', 'Frozen sections, oncology tissue, clinical-trial and biobank shipments justify a $3–4.50 cartridge. Routine blood tubes don’t.'],
  ['Sell to the lab, not supply chain', 'Lab quality managers and directors own inspection readiness. They’re the buyer.'],
  ['Price as a service', 'Monthly per pod, from the operating budget. No capital committee.'],
];

const cogs = [
  ['Moulded enclosure, gasket, light pipe, dock pins', 26], ['4-layer PCB + assembly', 18], ['Final test + calibration', 15],
  ['2 × MAX31865 + PT1000 probes', 14.8], ['nRF5340', 12.5], ['Battery, charger, fuel gauge', 8], ['Insulation + phase-change insert', 8],
  ['BME688', 6.2], ['High-g accelerometer', 6], ['Regulators, passives, LEDs', 6], ['NFC front-end + antenna', 5], ['AS7341', 4.5],
  ['LSM6DSOX', 2.9], ['64 MB flash', 1.1], ['Secure element', 1],
];

const phases = [
  ['0', 'Activation', '$0', 'Conrad Lean Canvas', 'done'],
  ['1', 'Conrad demo', '≈ $710', 'Kit A, entry fee, filament', 'done'],
  ['2', 'Alpha pod (Kit B)', '≈ $503', 'Full sensor set on breakout boards, dock, cartridges', 'now'],
  ['3', 'Engineering validation', '$8–10k', 'Two PCB spins, enclosure prototypes, 10 pods', 'next'],
  ['4', 'Hospital pilot', '$40–80k', 'Regulatory consultant, 20 pods, integration', 'next'],
];

const dates = [['Dec 20, 2026', 'Kit B working'], ['Jan 7, 2027', 'Innovation Stage closes'], ['Feb 26, 2027', 'Finalists announced'], ['Apr 21–24, 2027', 'Innovation Summit, Houston']];

export default function Plan() {
  const maxC = Math.max(...cogs.map((c) => c[1]));
  return (
    <>
      <Rig
        className="rig-plan"
        viewBox="0 0 560 760"
        wires={[
          ...drop([200, 214, 228, 242, 256], { top: -40, to: 420, sway: 80, colors: ['red', 'black', 'white', 'green', 'yellow'], spread: 2.4 }),
        ]}
        boards={[
          { id: 'magDock', x: 228, y: 490, w: 280, rot: 6 },
          { id: 'gauge', x: 400, y: 650, w: 200, rot: -14 },
        ]}
      />
      <div className="wrap">
        <Masthead n="06" kicker="The plan" title={<>Start with<br />the tubes.</>}
          aside={<div className="stat-big"><b>≈ $50M</b><span>a year in the US, bottom-up: 1,000 hospitals with surgical pathology × 20 pods × $85/month, plus tissue cartridges.</span></div>}>
          <p>The first customer doesn’t need cartridges or hospital IT. Hospitals already have to re-validate their tube systems, and today they do it with phones and guesswork. That’s the way in.</p>
        </Masthead>

        <section className="sec">
          <div className="sec-label"><span className="label">6.1</span><h2 className="d3">Go to market</h2></div>
          <ol className="gtm">
            {steps.map(([h, p], i) => <li key={h}><span className="gtm-n">{i + 1}</span><h3>{h}</h3><p>{p}</p></li>)}
          </ol>
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">6.2</span><h2 className="d3">The numbers</h2></div>
          <div className="figs">
            <div><b>$75–95</b><span>per pod per month</span><p>Device-as-a-service: pods, docks, firmware, recalibration, lab-system connectors.</p></div>
            <div><b>≈ 2 mo</b><span>hardware payback</span><p>At a production cost near $135 per pod.</p></div>
            <div><b>$3–4.50</b><span>per cartridge</span><p>≈ $0.85 to make: shell $0.45, NFC inlay $0.25, membrane $0.15.</p></div>
            <div><b>9,257</b><span>US hospital labs</span><p>CMS CLIA database, September 2026.</p></div>
          </div>
        </section>

        <section className="sec split">
          <div>
            <div className="sec-label"><span className="label">6.3</span><h2 className="d3">What a production pod costs</h2></div>
            <p className="body">Custom PCB, about 1,000 units. Total ≈ $135.</p>
            <p className="note">Estimates from the Nov 24 project summary.</p>
          </div>
          <ul className="cogs">
            {cogs.map(([n, v]) => (
              <li key={n}><span>{n}</span><i><em style={{ width: `${(v / maxC) * 100}%` }} /></i><b>${v % 1 ? v.toFixed(2) : v}</b></li>
            ))}
          </ul>
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">6.4</span><h2 className="d3">Phases</h2></div>
          <ol className="phases2">
            {phases.map(([n, name, cost, what, s]) => (
              <li key={n} className={`is-${s}`}>
                <span className="mono">Phase {n}</span>
                <h3>{name}</h3>
                <b>{cost}</b>
                <p>{what}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec split">
          <div>
            <div className="sec-label"><span className="label">6.5</span><h2 className="d3">Regulatory path</h2></div>
            <p className="body">A specimen transport container is FDA Class I and 510(k)-exempt (21 CFR 864.3250). Software that marks a specimen “degraded” may need its own determination, which we’ll get in writing. Cartridges that touch formalin need ISO 10993 biocompatibility testing.</p>
          </div>
          <div>
            <div className="sec-label"><span className="label">6.6</span><h2 className="d3">Dates</h2></div>
            <ul className="dates">{dates.map(([d, t]) => <li key={d}><span className="mono">{d}</span><b>{t}</b></li>)}</ul>
          </div>
        </section>

        <section className="sec closer">
          <h2 className="d1">Every object should be able to testify about its own past.</h2>
          <div className="ctas">
            <a className="btn btn-lime" href={REPO} target="_blank" rel="noreferrer">Read the full spec <span className="btn-i"><Arrow /></span></a>
          </div>
        </section>
      </div>
    </>
  );
}
