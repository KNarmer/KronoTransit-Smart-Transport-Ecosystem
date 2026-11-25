import { COMPONENTS } from '../data/components.js';
import { STAGES, CARTRIDGE } from '../data/bom.js';
import Prov, { ProvKey } from '../components/Prov.jsx';
import BusExplorer from '../components/BusExplorer.jsx';
import CostExplorer from '../components/CostExplorer.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';
import { Hang, Peek, hw } from '../components/Rig.jsx';
import Telemetry from '../components/Telemetry.jsx';
import Sci from '../components/Sci.jsx';

const RAILS = [
  ['VBAT', '3.0–4.2 V', 'LiPo through the fuel gauge', '≈0.20 A worst case'],
  ['3V3', '3.3 V', 'MCP1700, 250 mA max', '≈40 mA peak'],
  ['5V_SW', '≈5.2 V', 'MiniBoost, enabled by D5', '≈110 mA peak'],
  ['VBUS', '5 V', 'Dock, 1.1 A-hold fuse', 'Charging ≈0.55 A'],
];
const DECISIONS = [
  ['No cooler', 'A Peltier would have emptied the battery in about 22 minutes. Foam and cold packs instead.'],
  ['Two accelerometers', 'Normal ones max out at ±16 g. The second one reads up to ±400 g.'],
  ['Platinum thermometers', 'One on the vial, one in the air, so room heat isn’t mistaken for sample heat.'],
];

export default function Engineering() {
  const gallery = COMPONENTS.filter((c) => c.img);
  return (
    <>
      <section className="wrap lead-block lead-split">
        <Hang id="pp1" className="rig-top" colors={['red', 'black', 'yellow', 'blue']} len={160} w={190} rot={6} />
        <div>
          <Kicker>Engineering & BOM</Kicker>
          <h1 className="h1">Every board, every wire, every dollar.</h1>
          <p className="lede">Off-the-shelf boards today, one custom PCB tomorrow.</p>
        </div>
        <Sci kind="wire" tag="E" label="Wireframe · drag to rotate" />
      </section>
      <Telemetry />

      <section className="wrap section gallery-wrap">
        <Reveal><Kicker>The parts</Kicker><h2 className="h2">Meet the hardware.</h2></Reveal>
        <ul className="gallery">
          {gallery.map((c, i) => (
            <Reveal as="li" key={c.id} delay={(i % 4) * 0.05} className="gal">
              <div className="gal-img"><img src={hw(c.img)} alt="" loading="lazy" /></div>
              <h3 className="h4">{c.name}</h3>
              <p>{c.role.split('.')[0]}.</p>
            </Reveal>
          ))}
        </ul>
        <details className="more">
          <summary>Full specification table, with sources</summary>
          <ProvKey />
          <div className="reg-scroll">
            <table className="reg">
              <thead><tr><th>Component</th><th>Key specification</th><th>Interface</th><th>Supply · power</th><th>Source</th></tr></thead>
              <tbody>
                {COMPONENTS.map((c) => (
                  <tr key={c.id}>
                    <th scope="row"><span><b>{c.name}</b><small>{c.maker}</small></span></th>
                    <td>{c.specs.map(([k, v, p]) => <span key={k} className="reg-spec"><em>{k}</em> {v} <Prov k={p} src={c.ref[0]} /></span>)}</td>
                    <td className="mono">{c.iface}</td>
                    <td>{c.supply[0]} <Prov k={c.supply[1]} /><br /><span className="muted">{c.power[0]}</span></td>
                    <td>{c.ref[1] ? <a href={c.ref[1]} target="_blank" rel="noreferrer">{c.ref[0]} ↗</a> : <span className="muted">{c.ref[0]}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="wrap section bus-wrap">
        <Reveal><Kicker>Wiring</Kicker><h2 className="h2">Follow any wire.</h2></Reveal>
        <BusExplorer />
        <details className="more">
          <summary>Power rails and design decisions</summary>
          <div className="split more-split">
            <table className="rails">
              <thead><tr><th>Rail</th><th>Level</th><th>Source</th><th>Load</th></tr></thead>
              <tbody>{RAILS.map(([r, v, s, l]) => <tr key={r}><th className="mono">{r}</th><td>{v}</td><td>{s}</td><td>{l} <Prov k="est" /></td></tr>)}</tbody>
            </table>
            <ul className="decisions">
              {DECISIONS.map(([h, p]) => <li key={h}><h3 className="h4">{h}</h3><p className="body">{p} <Prov k="est" /></p></li>)}
            </ul>
          </div>
        </details>
      </section>

      <section className="wrap section">
        <Reveal><Kicker>The plan</Kicker><h2 className="h2">Build it. Pilot it. Fix it. Ship it.</h2></Reveal>
        <ol className="path">
          {STAGES.map(([h, , cost, k], i) => (
            <Reveal as="li" key={h} delay={i * 0.05} className={i === 0 ? 'now' : ''}>
              <span className="path-dot" />
              <span className="mono">{i === 0 ? 'We are here' : `Step ${i + 1}`}</span>
              <h3 className="h4">{h}</h3>
              <p className="path-cost">{cost}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="wrap section cost-wrap">
        <Reveal><Kicker>Cost</Kicker><h2 className="h2">One pod at 1, 50 and 1,000.</h2></Reveal>
        <CostExplorer />
      </section>
    </>
  );
}
