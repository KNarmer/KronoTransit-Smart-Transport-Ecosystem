import { Link } from 'react-router-dom';
import { Reveal, Kicker } from '../components/Bits.jsx';
import Prov, { ProvKey } from '../components/Prov.jsx';
import { Bench } from '../components/Rig.jsx';
import RoiCalculator from '../components/RoiCalculator.jsx';
import { StakesBanner, ZeroClick, Matrix, RazorBlade, Roadmap, Sources, Cite } from '../components/WhyParts.jsx';
import { NEED_ONE_LINE, NEED_CHAIN, NEED_GAP, WHY_THIS, WHY_NOW, NOT_CLAIMED } from '../data/why.js';

export default function Why() {
  return (
    <>
      <section className="wrap lead-block why-lead">
        <Kicker>Why it matters</Kicker>
        <h1 className="h1">Every specimen travels without a witness. <em>We’re building one.</em></h1>
        <p className="lede">{NEED_ONE_LINE}</p>
      </section>

      <StakesBanner />

      <section className="wrap section">
        <Reveal className="sec-intro">
          <Kicker>The unmet need</Kicker>
          <h2 className="h2">What’s missing, who it hurts, and why nothing fixes it today.</h2>
        </Reveal>
        <ol className="need">
          {NEED_CHAIN.map((c, i) => (
            <Reveal as="li" key={c.n} delay={i * 0.06}>
              <span className="need-n mono">{c.n}</span>
              <h3 className="h4">{c.h}</h3>
              <p>{c.p}{c.src && <> <Prov k="lit" /><Cite id={c.src} /></>}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal><p className="need-gap"><span className="mono">The gap</span>{NEED_GAP}</p></Reveal>

        <div className="why-two">
          <div>
            <h3 className="h3">Why this product</h3>
            <ul className="why-list">
              {WHY_THIS.map(([h, p]) => <li key={h}><b>{h}.</b> {p}{h.startsWith('Cheap') && <> <Prov k="est" /></>}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="h3">Why now</h3>
            <ul className="why-list">
              {WHY_NOW.map(([h, p, src]) => <li key={h}><b>{h}.</b> {p}{src && <> <Cite id={src} /></>}</li>)}
            </ul>
          </div>
        </div>

        <div className="nope">
          <h3 className="h4">What we don’t claim (yet)</h3>
          <ul>
            {NOT_CLAIMED.map(([h, p]) => <li key={h}><b>{h}</b> {p}</li>)}
          </ul>
        </div>
      </section>

      <section className="wrap section">
        <Reveal className="sec-intro">
          <Kicker>Zero-click clinical workflow</Kicker>
          <h2 className="h2">Three things staff already do. Nothing they don’t.</h2>
          <p className="body">The pod rides on actions already in the routine: put the sample in the carrier, move it, set it down at the lab.</p>
        </Reveal>
        <ZeroClick />
      </section>

      <section className="wrap section">
        <Reveal className="sec-intro">
          <Kicker>Competitive landscape</Kicker>
          <h2 className="h2">We’re not the first sensor near a sample. We cover the leg nobody watches.</h2>
          <p className="body">Loggers watch shipments. Couriers track bags. Transport monitors flag boxes and tubes between sites. Inside the hospital, the short and busy trip of an irreplaceable specimen has no witness. That leg is our wedge. The other products are shipping today; ours is a prototype.</p>
        </Reveal>
        <Matrix />
      </section>

      <section className="wrap section">
        <Reveal className="sec-intro">
          <Kicker>Failure cost & ROI calculator</Kicker>
          <h2 className="h2">Put in your lab’s numbers.</h2>
          <p className="body">One avoided repeat procedure can pay for a year of pods. Change the volume and rejection rate, or open the assumptions and use your own costs.</p>
        </Reveal>
        <RoiCalculator />
      </section>

      <section className="wrap section">
        <Reveal className="sec-intro">
          <Kicker>Unit economics</Kicker>
          <h2 className="h2">Razor, blade and ledger.</h2>
          <p className="body">The hardware is leased so it can go everywhere. Cartridges are used once per trip, and the compliance cloud keeps every signed record. Margins shown are targets, not results.</p>
        </Reveal>
        <RazorBlade />
      </section>

      <section className="wrap section">
        <Reveal className="sec-intro">
          <Kicker>Validation & roadmap</Kicker>
          <h2 className="h2">Bench first, then shadow, then cleared.</h2>
        </Reveal>
        <Roadmap />
        <p className="road-go"><Link to="/grants" className="go go-strong">Fund the next stage <span>→</span></Link></p>
      </section>

      <section className="wrap section why-src">
        <Kicker>Sources</Kicker>
        <ProvKey />
        <Sources />
      </section>
      <Bench ids={['as7341', 'lsm6', 'bme', 'rtc']} />
    </>
  );
}
