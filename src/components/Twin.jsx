import { WireframeObject } from './canvasui/WireframeObject.tsx';
import { POD_GLB, DRACO } from './model.js';

const stats = [
  ['99', 'parts at true scale'],
  ['88', 'wires, each one routed'],
  ['232', 'one-action build steps'],
  ['2', 'parts caught that wouldn’t plug in'],
];

const layers = [
  ['Lid', 'Gasket, foam plug, light pipe for the status LED'],
  ['Cradle', 'Cartridge well with colour, gas, motion, high-g, NFC and core-temperature sensors on its faces'],
  ['Backbone', 'Upright SPI board with both temperature amplifiers, the clock and the ambient probe'],
  ['Base tray', 'nRF5340 board, battery, charger, fuel gauge, power board and main switch'],
  ['KronoDock', 'Raspberry Pi Zero 2 W behind a magnetic five-pin connector'],
];

export default function Twin() {
  return (
    <section className="section" id="twin">
      <div className="sec-head head-right">
        <h2 className="h-xl">Built first in the browser.<br />Every board, every wire.</h2>
        <p className="lede">
          Before buying a part, we built Kit B as a 1:1 digital twin, with boards generated from their real layout files and every wire routed. This is that model, pulled apart. Version zero found two parts that physically wouldn’t connect.
        </p>
      </div>
      <div className="twin">
        <div className="twin-stage">
          <WireframeObject
            className="twin-canvas"
            src={POD_GLB}
            dracoDecoderPath={DRACO}
            lineColor="#8fbfff"
            nodeColor="#d4ff3a"
            lineWidth={1}
            nodes={false}
            glow={0.45}
            scan={0.5}
            scanSpeed={0.5}
            hiddenLines={0.12}
            topology={0.05}
            creaseAngle={35}
            scale={2.9}
            floatIntensity={0}
            rotationIntensity={0}
            zoom={false}
          />
          <span className="twin-tag mono">Drag to orbit</span>
        </div>
        <ol className="layers">
          {layers.map(([h, p], i) => (
            <li key={h}><span className="mono">0{i + 1}</span><div><b>{h}</b><p>{p}</p></div></li>
          ))}
        </ol>
      </div>
      <dl className="twin-stats">
        {stats.map(([n, l]) => <div key={l}><dt>{n}</dt><dd>{l}</dd></div>)}
      </dl>
    </section>
  );
}
