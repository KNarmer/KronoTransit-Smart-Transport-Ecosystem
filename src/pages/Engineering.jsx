import { COMPONENTS } from '../data/components.js';
import { STAGES, CARTRIDGE } from '../data/bom.js';
import Prov, { ProvKey } from '../components/Prov.jsx';
import BusExplorer from '../components/BusExplorer.jsx';
import CostExplorer from '../components/CostExplorer.jsx';
import { Reveal, Kicker } from '../components/Bits.jsx';
import { Hang, Peek, hw, Bench } from '../components/Rig.jsx';
import { lazy, Suspense } from 'react';
import HardwareExplorer from '../components/HardwareExplorer.jsx';
const BoardViewer = lazy(() => import('../components/BoardViewer.jsx'));

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
  const gallery = COMPONENTS.filter((c) => c.img && c.id !== 'dock');
  return (
    <>
      <section className="wrap lead-block lead-split">
        <div>
          <Kicker>Engineering & BOM</Kicker>
          <h1 className="h1">Every board, every wire, every dollar.</h1>
          <p className="lede">Off-the-shelf boards today, one custom PCB tomorrow.</p>
        </div>
        <figure className="lead-board"><Suspense fallback={null}><BoardViewer id="dk" spin={1} zoom={false} /></Suspense><figcaption className="mono">nRF5340 development kit — the brain · drag me</figcaption></figure>
      </section>

      <section className="wrap section gallery-wrap">
        <Reveal><Kicker>Board by board</Kicker><h2 className="h2">Pick a board up. Pull it out. See what breaks.</h2></Reveal>
        <HardwareExplorer />
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

      <section className="wrap section bus-wrap t-right">
        <Reveal className="sec-intro"><Kicker>I²C · SPI · GPIO</Kicker><h2 className="h2">Follow any wire.</h2></Reveal>
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

      <section className="wrap section t-center">
        <Reveal className="sec-intro"><Kicker>Roadmap</Kicker><h2 className="h2">On the bench now. The rest is future work.</h2></Reveal>
        <ol className="path">
          {STAGES.map(([h, , cost, k], i) => (
            <Reveal as="li" key={h} delay={i * 0.05} className={i === 0 ? 'now' : ''}>
              <span className="path-dot" />
              <span className="mono">{i === 0 ? 'We are here' : i === 1 ? 'Next, if funded' : 'Future direction'}</span>
              <h3 className="h4">{h}</h3>
              <p className="path-cost">{cost}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="wrap section cost-wrap">
        <Reveal><Kicker>Bill of materials</Kicker><h2 className="h2">One pod at 1, 50 and 1,000.</h2></Reveal>
        <CostExplorer />
      </section>
      <Bench ids={['chg', 'gauge', 'pp2', 'boost', 'bat']} />
    </>
  );
}
