import { Masthead } from '../components/Shell.jsx';
import { Rig, hw } from '../components/Rig.jsx';
import { WireframeObject } from '../components/canvasui/WireframeObject.tsx';
import { POD_GLB, DRACO } from '../components/model.js';

const weeks = [
  ['Week 1', 'Nov 9–15', '2026-11-09', '2026-11-15', 'Orders + software', 'Parts ordered, firmware builds, base tray printed'],
  ['Week 2', 'Nov 16–22', '2026-11-16', '2026-11-22', 'Power', 'Runs from battery at 3.3 V; charging works'],
  ['Week 3', 'Nov 23–29', '2026-11-23', '2026-11-29', 'Sensors + dock', 'Six sensors on one I²C bus; the pod says hello to the dock'],
  ['Week 4', 'Nov 30–Dec 6', '2026-11-30', '2026-12-06', 'Temperature, NFC, lights', 'Ice bath reads 0.0 ± 0.3 °C; NFC reads 20 of 20'],
  ['Week 5', 'Dec 7–13', '2026-12-07', '2026-12-13', 'Into the pod', 'Cartridge seats one way and is identified'],
  ['Week 6', 'Dec 14–20', '2026-12-14', '2026-12-20', 'Firmware + validation', 'Signed log, dock sync, demo footage'],
];

const bom = [
  ['A', 'Power system + DK', 160.69, 'dk'],
  ['B', 'I²C sensors, cables, dock', 137.54, 'pi'],
  ['C', 'Temperature, NFC, reed, lights', 95.02, 'core'],
  ['D', 'Enclosure, thermal, cartridges', 99.68, 'bat'],
  ['+', 'Two parts the twin caught', 9.78, 'nfc'],
];

const fixes = [
  ['The DK’s headers are female sockets', 'Female-to-female jumpers can’t plug in. Added F/M extension jumpers.'],
  ['The NFC module has a 7-pin PicoBlade socket', 'No solder pads. Added a PicoBlade cable to splice into the harness.'],
  ['The charger ships at 1.0 A through a trace', 'Bridging 0.5 A isn’t enough: cut the 1.0 A trace first.'],
  ['The NFC module back-powers through SPI', 'Keep its rail on while the pod runs; power-down between reads.'],
  ['A powered pod could back-feed an unpowered Pi', 'Added a 1 kΩ resistor in the pod-TX → Pi-RX line.'],
];

const bus = [['0x18', 'H3LIS331', 'high-g'], ['0x36', 'MAX17048', 'battery'], ['0x39', 'AS7341', 'colour'], ['0x68', 'PCF8523', 'clock'], ['0x6A', 'LSM6DSOX', 'motion'], ['0x77', 'BME688', 'gas']];

const day = 864e5;
export default function Build() {
  const now = Date.now();
  const st = (s, e) => (now > +new Date(e) + day ? 'done' : now >= +new Date(s) ? 'now' : 'next');
  const total = bom.reduce((a, b) => a + b[2], 0);

  return (
    <>
      <Rig
        className="rig-build"
        viewBox="0 0 700 560"
        boards={[{ id: 'pp1', x: 380, y: 300, w: 560, rot: -11 }]}
        wires={[
          { from: [200, 250], c1: [120, 170], c2: [60, 60], to: [-40, 40], color: 'red' },
          { from: [230, 236], c1: [180, 120], c2: [140, 20], to: [90, -40], color: 'black' },
          { from: [420, 210], c1: [470, 120], c2: [560, 60], to: [720, 40], color: 'yellow' },
          { from: [450, 200], c1: [520, 120], c2: [600, 100], to: [720, 110], color: 'blue' },
        ]}
      />
      <div className="wrap">
        <Masthead n="05" kicker="The build" title={<>Built twice.<br />Once in the browser.</>}
          aside={<div className="stat-big"><b>≈ $503</b><span>for the whole alpha pod, dock and ten cartridges, on breakout boards.</span></div>}>
          <p>Before buying a single part, we built Kit B as a 1:1 digital twin: boards generated from their real layout files, every one of 88 wires routed, 232 one-action build steps and a simulated trip. Version zero found two parts that physically wouldn’t connect. Then we started buying.</p>
        </Masthead>

        <section className="sec twin2">
          <div className="twin2-stage">
            <span className="crop tl" /><span className="crop tr" /><span className="crop bl" /><span className="crop br" />
            <WireframeObject className="twin2-canvas" src={POD_GLB} dracoDecoderPath={DRACO} lineColor="#9cc4ff" nodeColor="#d4ff3a"
              lineWidth={1} nodes={false} glow={0.4} scan={0.45} scanSpeed={0.5} hiddenLines={0.1} topology={0.04} creaseAngle={35}
              scale={3.4} floatIntensity={0} rotationIntensity={0} zoom={false} />
            <span className="mono twin2-cap"><b>Fig. 5</b> The digital twin, edges only · drag to orbit</span>
          </div>
          <dl className="twin2-stats">
            <div><dt>99</dt><dd>parts at true scale</dd></div>
            <div><dt>88</dt><dd>wires, each routed</dd></div>
            <div><dt>232</dt><dd>one-action steps</dd></div>
            <div><dt>30</dt><dd>virtual meter test points</dd></div>
          </dl>
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">5.1</span><h2 className="d3">Six weeks, six gates</h2></div>
          <p className="body sec-intro">Each week ends with a test the build has to pass before the next one starts. Target: a working pod by December 20.</p>
          <ol className="gates">
            {weeks.map(([w, d, s, e, name, gate]) => {
              const k = st(s, e);
              return (
                <li key={w} className={`gate is-${k}`}>
                  <div className="gate-top"><span className="mono">{w} · {d}</span>{k === 'now' && <span className="tag tag-lime">Now</span>}{k === 'done' && <span className="tag">Passed</span>}</div>
                  <h3>{name}</h3>
                  <p><span className="mono gate-k">Gate</span>{gate}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="sec">
          <div className="sec-label"><span className="label">5.2</span><h2 className="d3">Where the money goes</h2></div>
          <div className="bom">
            {bom.map(([k, name, v, img]) => (
              <div key={k} className="bom-row">
                <img src={hw(img)} alt="" loading="lazy" />
                <span className="mono bom-k">Build {k}</span>
                <span className="bom-n">{name}</span>
                <span className="bom-bar"><i style={{ width: `${(v / 160.69) * 100}%` }} /></span>
                <b className="bom-v">${v.toFixed(2)}</b>
              </div>
            ))}
            <div className="bom-total"><span>Total</span><b>${total.toFixed(2)}</b></div>
          </div>
        </section>

        <section className="sec split">
          <div>
            <div className="sec-label"><span className="label">5.3</span><h2 className="d3">What the twin caught</h2></div>
            <ol className="fixes">
              {fixes.map(([h, p], i) => <li key={h}><span className="mono">F{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></li>)}
            </ol>
          </div>
          <div>
            <div className="sec-label"><span className="label">5.4</span><h2 className="d3">One bus, six sensors</h2></div>
            <p className="body">All six I²C devices share two wires at 100 kHz with no address clashes.</p>
            <ul className="bus">
              {bus.map(([a, n, r]) => <li key={a}><span className="mono bus-a">{a}</span><b>{n}</b><span>{r}</span></li>)}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
