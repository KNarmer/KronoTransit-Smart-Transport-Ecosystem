
// Kit B build weeks and their pass/fail gates. Status is worked out from today's date.
const weeks = [
  { w: 'Week 1', d: 'Nov 9–15', s: '2026-11-09', e: '2026-11-15', name: 'Orders + software', gate: 'Parts ordered, firmware builds, base tray printed' },
  { w: 'Week 2', d: 'Nov 16–22', s: '2026-11-16', e: '2026-11-22', name: 'Power', gate: 'Runs from battery at 3.3 V; charging works' },
  { w: 'Week 3', d: 'Nov 23–29', s: '2026-11-23', e: '2026-11-29', name: 'Sensors + dock', gate: 'Six sensors on one bus; pod says hello to the dock' },
  { w: 'Week 4', d: 'Nov 30–Dec 6', s: '2026-11-30', e: '2026-12-06', name: 'Temperature, NFC, lights', gate: 'Ice bath 0.0 ± 0.3 °C; NFC reads 20 of 20' },
  { w: 'Week 5', d: 'Dec 7–13', s: '2026-12-07', e: '2026-12-13', name: 'Into the pod', gate: 'Cartridge seats one way and is identified' },
  { w: 'Week 6', d: 'Dec 14–20', s: '2026-12-14', e: '2026-12-20', name: 'Firmware + validation', gate: 'Signed log, dock sync, demo footage' },
];

const milestones = [
  ['Jan 7, 2027', 'Innovation Stage closes'],
  ['Feb 26, 2027', 'Finalists announced'],
  ['Apr 21–24, 2027', 'Innovation Summit, Houston'],
];

const day = 864e5;

export default function Roadmap() {
  const now = Date.now();
  const status = (x) => (now > +new Date(x.e) + day ? 'done' : now >= +new Date(x.s) ? 'now' : 'next');

  return (
    <section className="section" id="roadmap">
      <div className="sec-head head-split">
        <h2 className="h-xl">Working prototype<br />by December 20.</h2>
        <p className="lede">The alpha pod, Kit B, uses the same sensors, cartridge and dock hand-off as the product, on breakout boards. About $500 of parts. Each week ends with a test it has to pass.</p>
      </div>
      <ol className="weeks">
        {weeks.map((x) => {
          const st = status(x);
          return (
            <li key={x.w} className={`week ${st}`}>
              <div className="week-track">
                <span className="week-fill" style={{ transform: `scaleX(${st === 'done' ? 1 : st === 'now' ? 0.5 : 0})` }} />
              </div>
              <div className="week-top">
                <span className="mono">{x.w} · {x.d}</span>
                {st === 'now' && <span className="chip chip-lime">Now</span>}
                {st === 'done' && <span className="chip">Done</span>}
              </div>
              <h3>{x.name}</h3>
              <p><span className="gate">Gate</span>{x.gate}</p>
            </li>
          );
        })}
      </ol>
      <div className="milestones">
        {milestones.map(([d, t]) => (
          <div key={d}><span className="mono">{d}</span><b>{t}</b></div>
        ))}
      </div>
    </section>
  );
}
