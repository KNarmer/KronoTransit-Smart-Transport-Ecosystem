import { Link } from 'react-router-dom';
import PcbHero from '../components/PcbHero.jsx';
import Journey from '../components/Journey.jsx';
import Witnesses from '../components/Witnesses.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';
import Prov from '../components/Prov.jsx';

const facts = [
  ['46–68%', 'of laboratory errors happen before analysis: in collection, labelling, handling and transport.', 'Laboratory quality-indicator literature'],
  ['±400 g', 'the highest impact the pod can record, enough to capture a dropped bag or a pneumatic-tube slam.', 'H3LIS331DL datasheet'],
  ['0.03125 °C', 'temperature resolution of the platinum-probe converters that watch the vial.', 'MAX31865 datasheet'],
];

export default function Overview() {
  return (
    <>
      <PcbHero />

      <section className="wrap section problem">
        <Reveal className="problem-head">
          <Kicker>The blind spot</Kicker>
          <h2 className="h2">A sample that cooked in a hot car looks exactly like one that didn’t.</h2>
        </Reveal>
        <div className="problem-cols">
          <Reveal className="problem-text" delay={0.05}>
            <p className="body">Hospitals have spent decades perfecting analysers and lab software. The trip in between, from the patient’s arm to the analyser, is still a paper label and a courier. Heat, cold and hard knocks can burst blood cells or degrade tissue, and the lab usually can’t tell, so it either tests a compromised sample or asks the patient for another one.</p>
            <p className="body">KronoTransit gives the specimen a witness. Five, in fact.</p>
          </Reveal>
          <dl className="facts">
            {facts.map(([n, t, s], i) => (
              <Reveal key={n} delay={0.08 * i} className="fact">
                <dt>{n}</dt>
                <dd>{t} <Prov k={i === 0 ? 'lit' : 'ds'} src={s} /></dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="wrap"><Reveal><Kicker>The journey</Kicker><h2 className="h2">From the ward to the analyser, recorded end to end.</h2></Reveal></div>
        <Journey />
      </section>

      <section className="wrap section">
        <Reveal className="sec-intro">
          <Kicker>Five witnesses</Kicker>
          <h2 className="h2">No single sensor is trusted. The pod cross-examines all five.</h2>
          <p className="body">A spike on one sensor is a rumour. The same story told by temperature, impact, air, light and identity together is evidence. Trigger an event and watch the streams answer.</p>
        </Reveal>
        <Witnesses />
      </section>

      <section className="wrap section handoff">
        <Reveal>
          <Kicker>At the lab</Kicker>
          <h2 className="h2">The journey arrives before the sample is opened.</h2>
        </Reveal>
        <Reveal className="handoff-row" delay={0.05}>
          <p className="body">On the dock, the pod’s signed log becomes a transport report: a verdict, a timeline of every reading, each deviation with its timestamp, and the chain of custody. See exactly what a receiving lab would get.</p>
          <div className="handoff-links">
            <Link className="go go-strong" to="/lab-reports">Open an example report <span>→</span></Link>
            <Link className="go" to="/engineering">See the engineering <span>→</span></Link>
          </div>
        </Reveal>
      </section>

      <section className="wrap section student">
        <Reveal>
          <p className="student-line">Designed, wired and coded by high school students. Built to the standard of the labs it’s meant for.</p>
          <Link className="go" to="/grants">Meet the team and help us pilot it <span>→</span></Link>
        </Reveal>
      </section>
    </>
  );
}
