import { Masthead } from '../components/Shell.jsx';
import { Rig, drop } from '../components/Rig.jsx';

const harms = [
  ['Heat and cold', 'A tube left in a warm car or against a freezer pack changes. Cells burst, analytes drift, tissue starts to break down. Nothing on the label shows it.', 'temp'],
  ['Shock', 'Pneumatic tubes, couriers and dropped bags hit samples hard. Hard impacts burst red cells (haemolysis) and fragment fragile tissue.', 'shock'],
  ['Leaks and delay', 'Preservative can leak or run low, and a biopsy can float above it. Every minute before fixation, tissue decays and gives off gas.', 'gas'],
];

// Illustrative tube-route shock profile (relative peak g, normalised): one route stands out.
const routes = [42, 51, 47, 39, 86, 49, 44, 53];

const who = [
  ['Patients', 'Fewer repeat draws, fewer biopsies taken twice, fewer results built on a damaged sample.'],
  ['Labs', 'Evidence for CAP and ISO 15189 inspections, and a reason to reject a sample that isn’t a guess.'],
  ['Couriers and hospitals', 'A record of which routes and tube stations damage samples, so they can be fixed.'],
  ['Research', 'Biobank and clinical-trial samples with a chain of custody that holds up.'],
];

function Mini({ kind }) {
  if (kind === 'temp') return (
    <svg viewBox="0 0 220 90" className="mini" aria-hidden="true">
      <rect x="0" y="26" width="220" height="36" className="mini-band" />
      <path d="M0 50 C40 48 70 52 100 46 S140 10 165 16 S200 44 220 46" className="mini-line" />
      <circle cx="165" cy="16" r="3.5" className="mini-hot" />
    </svg>
  );
  if (kind === 'shock') return (
    <svg viewBox="0 0 220 90" className="mini" aria-hidden="true">
      <line x1="0" y1="22" x2="220" y2="22" className="mini-dash" />
      <path d="M0 72 L20 68 L30 74 L45 64 L60 70 L80 66 L95 72 L110 8 L118 72 L140 66 L160 70 L180 64 L200 68 L220 66" className="mini-line" />
      <circle cx="110" cy="8" r="3.5" className="mini-hot" />
    </svg>
  );
  return (
    <svg viewBox="0 0 220 90" className="mini" aria-hidden="true">
      <path d="M0 78 C50 77 90 74 120 66 S170 40 190 26 S210 14 220 12" className="mini-line" />
    </svg>
  );
}

export default function Problem() {
  return (
    <>
      <Rig
        className="rig-pr-hang"
        viewBox="0 0 520 760"
        wires={[
          ...drop([150, 164, 178, 192], { top: -40, to: 330, sway: 50, colors: ['black', 'red', 'yellow', 'blue'], spread: 2 }),
          ...drop([346, 360, 374, 388, 402], { top: -40, to: 500, sway: 80, colors: ['white', 'grey', 'green', 'orange', 'purple'], spread: 2 }),
        ]}
        boards={[
          { id: 'h3lis', x: 170, y: 440, w: 260, rot: 7 },
          { id: 'lsm6', x: 375, y: 610, w: 250, rot: -10 },
        ]}
      />
      <div className="wrap">
        <Masthead
          n="02"
          kicker="The problem"
          title={<>The trip is the<br />blind spot.</>}
          aside={<div className="stat-big"><b>46–68%</b><span>of laboratory errors happen before the sample is analysed: in collection, labelling, handling and transport.</span></div>}
        >
          <p>Hospitals have spent decades perfecting analyzers and lab software. The journey in between, from the patient’s arm to the analyzer, is still a paper label and a courier. A sample that cooked in a hot car looks exactly like one that didn’t.</p>
        </Masthead>

        <section className="sec">
          <div className="sec-label"><span className="label">2.1</span><h2 className="d3">What the trip does to a sample</h2></div>
          <ol className="harms">
            {harms.map(([h, p, k], i) => (
              <li key={h}>
                <span className="harm-n">0{i + 1}</span>
                <div className="harm-t"><h3>{h}</h3><p>{p}</p></div>
                <Mini kind={k} />
              </li>
            ))}
          </ol>
        </section>

        <section className="sec split">
          <div>
            <div className="sec-label"><span className="label">2.2</span><h2 className="d3">Every tube route is different</h2></div>
            <p className="body">Pneumatic tube forces vary route by route, and change after maintenance. A <i>Clinical Chemistry</i> haemolysis study concluded that each tube system needs its own validation. One lab found a single route delivered 70% more shock than any other.</p>
            <p className="note">Bars are illustrative, drawn to show the pattern the studies describe.</p>
          </div>
          <figure className="routes">
            <div className="routes-plot">
              {routes.map((v, i) => (
                <div key={i} className={`route ${v > 80 ? 'is-hot' : ''}`}>
                  <span className="route-bar" style={{ height: `${v}%` }}>{v > 80 && <em>+70%</em>}</span>
                  <span className="route-l mono">R{i + 1}</span>
                </div>
              ))}
            </div>
            <figcaption className="mono">Peak shock by tube route, relative</figcaption>
          </figure>
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">2.3</span><h2 className="d3">What not knowing costs</h2></div>
          <div className="costs">
            <div className="cost"><b>4.36% → 3.07%</b><p>Haemolysis rate in one emergency department after it tackled handling, saving an estimated €510 a year on that alone (Cervellin et al., 2017).</p></div>
            <div className="cost"><b>$3,000–10,000</b><p>Cost of a cancelled surgery or a repeated core-needle biopsy, the kind of event a single damaged specimen can cause.</p></div>
            <div className="cost"><b>Irreplaceable</b><p>Oncology tissue, frozen sections, clinical-trial and biobank samples can’t be drawn again. These are where a trustworthy record matters most.</p></div>
          </div>
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">2.4</span><h2 className="d3">Who it helps</h2></div>
          <div className="who">
            {who.map(([h, p]) => <div key={h}><h3>{h}</h3><p>{p}</p></div>)}
          </div>
        </section>

        <section className="sec belief">
          <Rig
            className="rig-pr-bat"
            viewBox="0 0 560 420"
            boards={[{ id: 'bat', x: 300, y: 230, w: 420, rot: -16 }]}
            wires={[
              { from: [140, 210], c1: [60, 240], c2: [20, 330], to: [-40, 360], color: 'red' },
              { from: [150, 232], c1: [80, 280], c2: [40, 380], to: [-20, 430], color: 'black' },
            ]}
          />
          <p className="label">The bigger idea</p>
          <blockquote className="d2">Blood, vaccines, food and packages are trusted today because someone signed a clipboard. We think every object should be able to testify about its own past.</blockquote>
        </section>
      </div>
    </>
  );
}
