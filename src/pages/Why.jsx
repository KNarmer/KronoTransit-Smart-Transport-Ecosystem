import { Link } from 'react-router-dom';
import { Reveal, Kicker } from '../components/Bits.jsx';
import { Bench } from '../components/Rig.jsx';
import { RouteViz, Stakes, Gaps, ZeroClick, Matrix, Limits, Next, Sources } from '../components/WhyParts.jsx';

export default function Why() {
  return (
    <>
      <section className="wrap lead-block lead-center why-lead">
        <Kicker>Pre-analytical phase</Kicker>
        <h1 className="h1">Every specimen travels without a witness.</h1>
        <p className="lede">Hospitals record where a sample went. Not what happened to it on the way.</p>
        <RouteViz />
        <p className="note route-note">Illustrative trip.</p>
      </section>

      <section className="wrap section">
        <Stakes />
      </section>

      <section className="wrap section why-split">
        <Reveal className="sec-intro">
          <Kicker>Blind spots</Kicker>
          <h2 className="h2">The checks exist. They just aren’t per trip.</h2>
        </Reveal>
        <Gaps />
      </section>

      <section className="wrap section why-right">
        <Reveal className="sec-intro">
          <Kicker>Workflow</Kicker>
          <h2 className="h2">Three things staff already do. Nothing new.</h2>
        </Reveal>
        <ZeroClick />
      </section>

      <section className="wrap section">
        <Reveal className="sec-intro">
          <Kicker>Prior art</Kicker>
          <h2 className="h2">Others watch the box. We watch the vial.</h2>
        </Reveal>
        <Matrix />
      </section>

      <section className="wrap section why-two">
        <div>
          <Reveal><Kicker>Known limits</Kicker><h2 className="h3">What it can’t do yet.</h2></Reveal>
          <Limits />
        </div>
        <div>
          <Reveal><Kicker>Status</Kicker><h2 className="h3">A student project, on the bench.</h2></Reveal>
          <Next />
          <p className="note">Not a company and not for sale. No pilots are planned; clinical use is a future direction only. <Link to="/grants">Help the bench work →</Link></p>
        </div>
      </section>

      <section className="wrap section why-src">
        <Kicker>Sources</Kicker>
        <Sources />
      </section>
      <Bench ids={['as7341', 'lsm6', 'bme', 'rtc']} />
    </>
  );
}
