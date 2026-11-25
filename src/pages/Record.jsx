import { Masthead } from '../components/Shell.jsx';
import { Rig, drop } from '../components/Rig.jsx';
import Ledger from '../components/Ledger.jsx';
import Score from '../components/Score.jsx';
import Compare from '../components/Compare.jsx';

const chain = [
  ['Sample', 'Sensors read every few seconds; impacts wake the pod instantly.'],
  ['Frame', 'Readings pack into a fixed-size frame with a timestamp from the real-time clock.'],
  ['Chain', 'Each frame carries the SHA-256 hash of the one before it.'],
  ['Sign', 'The nRF5340’s CryptoCell signs the chain. Edit a frame and the signature fails.'],
  ['Dock', 'The dock verifies every signature before the pod is allowed to erase.'],
  ['FHIR', 'The verdict lands in the lab system as a standard Specimen + Observation.'],
];

export default function Record() {
  return (
    <>
      <Rig
        className="rig-rec"
        viewBox="0 0 560 760"
        wires={[
          ...drop([120, 134, 148, 162], { top: -40, to: 320, sway: 60, colors: ['red', 'black', 'yellow', 'blue'], spread: 2 }),
          ...drop([370, 384, 398, 412, 426], { top: -40, to: 500, sway: 70, colors: ['green', 'white', 'red', 'black', 'orange'], spread: 2 }),
        ]}
        boards={[
          { id: 'as7341', x: 145, y: 430, w: 260, rot: -9 },
          { id: 'rtc', x: 400, y: 610, w: 240, rot: 8 },
        ]}
      />
      <div className="wrap">
        <Masthead n="04" kicker="The record" title={<>A diary that can’t be<br />quietly edited.</>}>
          <p>The pod’s log isn’t a spreadsheet someone can tidy up later. Every entry is chained to the one before it and signed in hardware. At the dock it becomes a plain answer for the lab: run the test, review it, or recollect.</p>
        </Masthead>

        <section className="sec">
          <div className="sec-label"><span className="label">4.1</span><h2 className="d3">One trip, as the pod saw it</h2></div>
          <Ledger />
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">4.2</span><h2 className="d3">From sensor to lab record</h2></div>
          <ol className="chain">
            {chain.map(([h, p], i) => (
              <li key={h}>
                <span className="chain-n mono">{String(i + 1).padStart(2, '0')}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">4.3</span><h2 className="d3">The verdict</h2></div>
          <p className="body sec-intro">The pod weighs everything together. A little warmth on its own is fine. Warmth plus a gas spike is not. Move the sliders.</p>
          <Score />
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">4.4</span><h2 className="d3">Others log the box. This witnesses the sample.</h2></div>
          <p className="body sec-intro">Temperature loggers like TubeSense and TempTale, workflow tools like Roche navify, sensor tubes like SmartTube and stick-on heat strips each cover part of the trip.</p>
          <Compare />
        </section>
      </div>
    </>
  );
}
