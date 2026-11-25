import { useState } from 'react';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { REPO } from '../routes.js';
import { Reveal, Kicker } from '../components/Bits.jsx';
import Prov from '../components/Prov.jsx';
import { Hang, Peek } from '../components/Rig.jsx';
import Sci from '../components/Sci.jsx';
import Telemetry from '../components/Telemetry.jsx';

// Add a public contact address here when you have one; until then, visitors are sent to GitHub.
const CONTACT_EMAIL = '';
const contact = (subject) => (CONTACT_EMAIL
  ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`
  : `${REPO}/issues/new?title=${encodeURIComponent(subject)}`);

const PORTS = [
  ['GRANT', 'Grant makers & funders', 'Fund engineering validation: two custom PCB spins, enclosure prototypes, a reference thermometer and ten pods.', 'Grant enquiry: KronoTransit'],
  ['LAB', 'Hospitals & laboratories', 'Host a pilot. We’ll start with tube-route validation, which needs no cartridges and no hospital IT integration.', 'Pilot enquiry: KronoTransit'],
  ['RES', 'Researchers', 'Help us design honest calibration and validation studies, from haemolysis to tissue decay markers.', 'Research collaboration: KronoTransit'],
  ['MENT', 'Mentors & engineers', 'Review our hardware, firmware or data pipeline. Office hours, a design review or a lab bench all help.', 'Mentorship: KronoTransit'],
  ['MAKE', 'Makers & suppliers', 'Sensors, enclosures, PCB fabrication or test equipment at student-project rates.', 'Supplier / maker: KronoTransit'],
];

const UNLOCKS = [
  ['$500', 'finishes the working prototype', 'quote'],
  ['$8–10k', 'engineering validation: custom PCBs and ten pods', 'est'],
  ['$40–80k', 'a hospital and laboratory pilot with twenty pods', 'est'],
];

const FOUNDERS = [
  // Fill these in when ready: { name, role, bio, photo: 'founders/naitik.jpg' }
  { name: 'Naitik Patel', role: '', bio: '', photo: '' },
  { name: 'Deeptanava Roy', role: '', bio: '', photo: '' },
];

function Port({ code, title, text, subject, i }) {
  const [on, setOn] = useState(false);
  return (
    <Reveal as="li" delay={i * 0.05} className={`port ${on ? 'on' : ''}`}>
      <a href={contact(subject)} target="_blank" rel="noreferrer" onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)} onFocus={() => setOn(true)} onBlur={() => setOn(false)}>
        <svg className="port-svg" viewBox="0 0 120 70" aria-hidden="true">
          <rect x="62" y="16" width="44" height="38" rx="3" className="sock" />
          {[0, 1, 2, 3].map((k) => <rect key={k} x="70" y={22 + k * 8} width="20" height="3" className="sock-pin" />)}
          <motion.g animate={{ x: on ? 30 : 0 }} transition={{ duration: 0.35, ease }}>
            <path d="M-20 35 H22" className="cable" />
            <rect x="22" y="22" width="28" height="26" rx="3" className="plug" />
            {[0, 1, 2, 3].map((k) => <rect key={k} x="50" y={24 + k * 6} width="8" height="2.4" className="plug-pin" />)}
          </motion.g>
          <motion.circle cx="100" cy="12" r="3.5" className="port-led" animate={{ opacity: on ? 1 : 0.25 }} />
        </svg>
        <span className="port-code mono">{code}</span>
        <h3 className="h4">{title}</h3>
        <p>{text}</p>
        <span className="go">Plug in <span>→</span></span>
      </a>
    </Reveal>
  );
}

export default function Grants() {
  return (
    <>
      <section className="wrap lead-block grants-hero lead-split">
        <Hang id="magDock" className="rig-top" colors={['red', 'black', 'white', 'green', 'yellow']} len={160} w={190} rot={6} />
        <div>
          <Kicker>Grants & Team</Kicker>
          <h1 className="h1">We’ve got the wiring. <em>Got a power supply?</em></h1>
          <p className="lede">High school students looking for grants, pilot sites and mentors. No funding yet — that’s what this page is for.</p>
        </div>
        <Sci kind="particles" tag="P" label="Wave your cursor through it" />
      </section>
      <Telemetry />

      <section className="wrap section ports-wrap">
        <Reveal><Kicker>Plug in</Kicker><h2 className="h2">Five ways to connect.</h2></Reveal>
        <ul className="ports">
          {PORTS.map(([code, title, text, subject], i) => <Port key={code} code={code} title={title} text={text} subject={subject} i={i} />)}
        </ul>
      </section>

      <section className="wrap section unlocks">
        <Reveal><Kicker>What funding unlocks</Kicker><h2 className="h2">Small numbers, large steps.</h2></Reveal>
        <ol>
          {UNLOCKS.map(([v, t, k], i) => (
            <Reveal as="li" key={v} delay={i * 0.06}>
              <b>{v}</b><span>{t} <Prov k={k} /></span>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="wrap section">
        <Reveal><Kicker>Meet the founders</Kicker><h2 className="h2">The people behind the pod.</h2></Reveal>
        <div className="founders">
          {FOUNDERS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06} className="founder">
              <div className="founder-photo">{p.photo ? <img src={`${import.meta.env.BASE_URL}${p.photo}`} alt={p.name} /> : <span aria-hidden="true" />}</div>
              <h3 className="h3">{p.name}</h3>
              <p className="founder-role">{p.role}</p>
              <p className="founder-bio">{p.bio}</p>
            </Reveal>
          ))}
        </div>
        <p className="note">Student-led · high school · open source</p>
      </section>
    </>
  );
}
