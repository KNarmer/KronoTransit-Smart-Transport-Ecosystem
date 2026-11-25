import { COMPONENTS } from '../data/components.js';
import { STAGES, CARTRIDGE } from '../data/bom.js';
import Prov, { ProvKey } from '../components/Prov.jsx';
import BusExplorer from '../components/BusExplorer.jsx';
import CostExplorer from '../components/CostExplorer.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';

const base = import.meta.env.BASE_URL;

const RAILS = [
  ['VBAT', '3.0–4.2 V', 'LiPo through the fuel gauge', '≈0.20 A worst case', 'est'],
  ['VSYS', 'Battery, switched', 'bq24074 OUT → main switch', '—', 'est'],
  ['3V3', '3.3 V', 'MCP1700, 250 mA max', '≈40 mA peak · ≈6× headroom', 'est'],
  ['5V_SW', '≈5.2 V', 'MiniBoost, enabled by D5', '≈110 mA peak · ≈10× headroom', 'est'],
  ['VBUS (dock)', '5 V', 'Pi supply via 1.1 A-hold resettable fuse', 'Charging ≈0.55 A', 'est'],
];

const DECISIONS = [
  ['No active cooling', 'A Peltier element drew about 50 W at 60% duty, enough to empty the original 18.5 Wh pack in roughly 22 minutes, and its cut-off was never implemented. It was removed in favour of passive insulation and cold packs.'],
  ['A second, high-g accelerometer', 'Ordinary IMUs saturate at ±16 g. Tube-system and drop impacts can exceed that, so a ±400 g sensor records the true peak while the IMU handles orientation and wake-up.'],
  ['Platinum probes, not thermistors', 'Two 4-wire PT1000 probes through 15-bit converters, linearised with Callendar–Van Dusen. The core probe touches the vial; the ambient probe tells room heat from sample heat.'],
  ['Sign in silicon', 'The nRF5340’s CryptoCell hashes and signs each frame, so no separate secure element is needed in the prototype; the production design adds one (≈$1).'],
  ['Catch the mistakes before buying', 'A 1:1 digital twin of the build, with every wire routed, found two parts that physically wouldn’t connect (female DK headers; the NFC module’s PicoBlade socket) and three wiring fixes before a single order.'],
];

export default function Engineering() {
  return (
    <>
      <section className="wrap lead-block">
        <Kicker>Engineering & BOM</Kicker>
        <h1 className="h1">Every number, with where it came from.</h1>
        <p className="lede">The prototype is built from off-the-shelf breakout boards so each subsystem can be tested on its own. Specifications below are tagged by source: what the manufacturer guarantees, what our own calculations predict, and what we paid. Nothing here has been bench-measured yet; when it is, it will say so.</p>
        <ProvKey />
      </section>

      <section className="wrap section">
        <Reveal><Kicker>Component register</Kicker><h2 className="h2">Seventeen subsystems, each with its source.</h2></Reveal>
        <div className="reg-scroll">
          <table className="reg">
            <thead><tr><th>Component</th><th>Function</th><th>Key specification</th><th>Interface</th><th>Supply · power</th><th>Source</th></tr></thead>
            <tbody>
              {COMPONENTS.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    {c.img ? <img src={`${base}hw/${c.img}.webp`} alt="" loading="lazy" /> : <span className="reg-noimg" />}
                    <span><b>{c.name}</b><small>{c.maker}</small></span>
                  </th>
                  <td>{c.role}</td>
                  <td>{c.specs.slice(0, 2).map(([k, v, p]) => <span key={k} className="reg-spec"><em>{k}</em> {v} <Prov k={p} src={c.ref[0]} /></span>)}</td>
                  <td className="mono">{c.iface}</td>
                  <td>{c.supply[0]} <Prov k={c.supply[1]} /><br /><span className="muted">{c.power[0]}</span></td>
                  <td>{c.ref[1] ? <a href={c.ref[1]} target="_blank" rel="noreferrer">{c.ref[0]} ↗</a> : <span className="muted">{c.ref[0]}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="wrap section">
        <Reveal><Kicker>Wiring</Kicker><h2 className="h2">Trace any wire from pin to pin.</h2></Reveal>
        <BusExplorer />
      </section>

      <section className="wrap section split">
        <Reveal>
          <Kicker>Power</Kicker>
          <h2 className="h2">Five rails, generous headroom.</h2>
          <p className="body">The pod runs from one 2,500 mAh cell (≈9.25 Wh). The fuel gauge raises an alert at 3.50 V so firmware can sleep before the 3.3 V regulator drops out; the switched 5 V rail is off whenever the NFC reader and lights aren’t needed.</p>
        </Reveal>
        <Reveal delay={0.05}>
          <table className="rails">
            <thead><tr><th>Rail</th><th>Level</th><th>Source</th><th>Load</th></tr></thead>
            <tbody>{RAILS.map(([r, v, s, l, p]) => <tr key={r}><th className="mono">{r}</th><td>{v}</td><td>{s}</td><td>{l} <Prov k={p} /></td></tr>)}</tbody>
          </table>
        </Reveal>
      </section>

      <section className="wrap section">
        <Reveal><Kicker>Design decisions</Kicker><h2 className="h2">What we changed, and why.</h2></Reveal>
        <ol className="decisions">
          {DECISIONS.map(([h, p], i) => (
            <Reveal as="li" key={h} delay={i * 0.04}><span className="mono">{String(i + 1).padStart(2, '0')}</span><div><h3 className="h4">{h}</h3><p className="body">{p}</p></div></Reveal>
          ))}
        </ol>
      </section>

      <section className="wrap section">
        <Reveal>
          <Kicker>Path to market</Kicker>
          <h2 className="h2">Develop, pilot, refine, then sell.</h2>
          <p className="body">We are students building technology first. The plan is to prove the pod on the bench, put it in front of hospitals and laboratories, change it based on what they tell us, and only then bring it to market. Budgets below are planning estimates.</p>
        </Reveal>
        <ol className="path">
          {STAGES.map(([h, p, cost, k], i) => (
            <Reveal as="li" key={h} delay={i * 0.05} className={i === 0 ? 'now' : ''}>
              <span className="path-dot" />
              <span className="mono">{i === 0 ? 'Now' : `Step ${i + 1}`}</span>
              <h3 className="h4">{h}</h3>
              <p>{p}</p>
              <p className="path-cost">{cost} <Prov k={k} /></p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="wrap section">
        <Reveal>
          <Kicker>Manufacturing cost</Kicker>
          <h2 className="h2">What one pod costs at one, fifty and a thousand.</h2>
          <p className="body">Switch between production tiers to see per-unit cost by category. The prototype tier is built from real list prices; the other two are models, with every assumption written out. We haven’t requested volume quotes yet; when we do, they’ll replace these estimates.</p>
        </Reveal>
        <CostExplorer />
        <div className="cart-cost">
          {CARTRIDGE.map(([n, v, k, d]) => (
            <div key={n}><span className="mono">{n}</span><b>${v.toFixed(2)}</b> <Prov k={k} /><p>{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
