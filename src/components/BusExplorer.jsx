// Schematic of the prototype's wiring, drawn like an EDA sheet: orthogonal traces with 45° chamfers,
// grouped by bus. Hover or tap a net to trace it; unrelated buses dim and the live path animates.
import { useMemo, useState } from 'react';
import Prov from './Prov.jsx';

export const BUSES = {
  power: ['Power & battery', 'Battery, charger, switch, 3.3 V and switched 5 V rails, dock charging'],
  data: ['I²C / SPI telemetry', 'Six I²C devices at 100 kHz; SPI mode 1 at 4 MHz for temperature and NFC'],
  ctrl: ['MCU control & Edge AI node', 'Interrupts, wake lines, light drivers, boost enable and the dock link'],
  thermal: ['Thermal sensing loop', '4-wire PT1000 probes into the RTD converters. Passive: no heater or cooler in this design'],
};

// Blocks on the sheet: [id, label, sub, x, y, w, h]
const NODES = [
  ['dk', 'nRF5340 DK', 'MCU · Edge AI · signing', 470, 250, 260, 250],
  ['h3lis', 'H3LIS331', '0x18 · ±400 g', 80, 92, 200, 52],
  ['imu', 'LSM6DSOX', '0x6A · 6-axis', 80, 170, 200, 52],
  ['gas', 'BME688', '0x77 · gas / RH / hPa', 80, 248, 200, 52],
  ['spec', 'AS7341', '0x39 · spectral', 80, 326, 200, 52],
  ['rtc', 'PCF8523', '0x68 · clock', 80, 404, 200, 52],
  ['core', 'MAX31865 · core', 'SPI · CS D10', 900, 92, 190, 52],
  ['amb', 'MAX31865 · ambient', 'SPI · CS D9', 900, 172, 190, 52],
  ['nfc', 'ST25R3916B', 'SPI · CS D7 · IRQ D6', 900, 252, 190, 52],
  ['ptc', 'PT1000 core', 'on the vial', 1150, 92, 110, 52],
  ['pta', 'PT1000 ambient', 'free air', 1150, 172, 110, 52],
  ['mag', 'Magnetic link', '5-pin pod half', 900, 380, 160, 52],
  ['pi', 'KronoDock Pi', 'Pi Zero 2 W', 1110, 380, 150, 52],
  ['reed', 'Reed switch', 'cartridge seated', 300, 540, 140, 44],
  ['led', 'Status lights', 'RGB + white, PN2222', 560, 548, 170, 44],
  ['bat', 'LiPo 2,500 mAh', '3.7 V', 40, 660, 150, 52],
  ['gauge', 'MAX17048', '0x36 · fuel gauge', 230, 660, 160, 52],
  ['chg', 'bq24074', 'charger · 0.5 A', 430, 660, 160, 52],
  ['sw', 'Main switch', 'SPDT', 630, 660, 120, 52],
  ['ldo', 'MCP1700', '3V3 rail', 790, 660, 140, 52],
  ['boost', 'MiniBoost', '5V_SW rail', 970, 660, 150, 52],
];

// Nets: [id, bus, label, points[], meta[]]
const NETS = [
  // telemetry
  ['i2c-h3lis', 'data', 'I²C · H3LIS331', [[280, 112], [380, 112], [380, 300], [470, 300]], ['SDA / SCL from the DK’s Arduino header', 'Address 0x18', 'Bus speed 100 kHz']],
  ['i2c-imu', 'data', 'I²C · LSM6DSOX', [[280, 190], [380, 190], [380, 300]], ['Address 0x6A', 'STEMMA QT daisy-chain']],
  ['i2c-gas', 'data', 'I²C · BME688', [[280, 268], [380, 268]], ['Address 0x77']],
  ['i2c-spec', 'data', 'I²C · AS7341', [[280, 346], [380, 346], [380, 300]], ['Address 0x39']],
  ['i2c-rtc', 'data', 'I²C · PCF8523', [[280, 424], [380, 424], [380, 300]], ['Address 0x68']],
  ['i2c-gauge', 'data', 'I²C · MAX17048', [[310, 660], [310, 620], [360, 620], [360, 300]], ['Address 0x36', 'Combined pull-ups ≈1.7 kΩ, bus ≈180 pF, rise ≈0.3 µs (design calc)']],
  ['spi-core', 'data', 'SPI · MAX31865 core', [[730, 290], [830, 290], [830, 112], [900, 112]], ['SCK D13 · MISO D12 · MOSI D11', 'CS D10', 'Mode 1, 4 MHz']],
  ['spi-amb', 'data', 'SPI · MAX31865 ambient', [[830, 192], [900, 192]], ['Shares SCK/MISO/MOSI', 'CS D9']],
  ['spi-nfc', 'data', 'SPI · NFC reader', [[830, 290], [830, 272], [900, 272]], ['Shares SCK/MISO/MOSI', 'CS D7', 'Drive D7, D11, D13 low before the boost turns off']],
  // thermal
  ['rtd-core', 'thermal', '4-wire · core probe', [[1150, 112], [1090, 112]], ['F+ · RTD+ · RTD− · F−', 'Reference 4,300 Ω for PT1000', 'Probe clipped to the vial in a spring clip']],
  ['rtd-amb', 'thermal', '4-wire · ambient probe', [[1150, 192], [1090, 192]], ['F+ · RTD+ · RTD− · F−', 'Probe taped to a post in free air', 'Core − ambient separates a warm room from a warming sample']],
  // control
  ['int-imu', 'ctrl', 'LSM6DSOX INT1 → D2', [[280, 206], [350, 206], [350, 380], [470, 380]], ['Wake-on-motion from the IMU’s state machine']],
  ['int-h3lis', 'ctrl', 'H3LIS331 INT → D3', [[280, 128], [340, 128], [340, 400], [470, 400]], ['High-g event interrupt']],
  ['reed', 'ctrl', 'Reed switch → D4', [[440, 562], [520, 562], [520, 500]], ['Internal pull-up; magnet in the cartridge collar closes it']],
  ['irq-nfc', 'ctrl', 'NFC IRQ → D6', [[900, 290], [860, 290], [860, 330], [730, 330]], ['Tag-present interrupt']],
  ['alert', 'ctrl', 'Fuel gauge ALRT → A5', [[270, 660], [270, 600], [500, 600], [500, 500]], ['Alert at 3.50 V so firmware sleeps before the LDO drops out']],
  ['leds', 'ctrl', 'A1–A4 → light drivers', [[645, 500], [645, 548]], ['PN2222 per colour, 1 kΩ base', 'At 5.2 V via 220 Ω: red 13.6, green 7.6, blue 7.4, white 8.2 mA (design calc)']],
  ['en', 'ctrl', 'D5 → boost EN', [[700, 500], [700, 525], [1045, 525], [1045, 660]], ['True output disconnect when EN is low']],
  ['uart', 'ctrl', 'UART D0/D1 → dock', [[730, 420], [900, 420], [900, 406]], ['Framed protocol: HELLO → GET_FRAMES → ACK with HMAC', 'A0 = dock detect']],
  ['dock', 'ctrl', 'Magnetic link → Pi', [[1060, 406], [1110, 406]], ['Pins: VBUS · GND · pod TX · pod RX via 1 kΩ · detect', 'Pi uses /dev/serial0 with Bluetooth disabled']],
  // power
  ['p-bat', 'power', 'Battery → fuel gauge', [[190, 686], [230, 686]], ['3.7 V nominal, ≈9.25 Wh', 'Gauge sits inline and measures every milliamp']],
  ['p-gauge', 'power', 'Gauge → charger BAT', [[390, 686], [430, 686]], ['JST-PH jumper']],
  ['p-out', 'power', 'Charger OUT → switch', [[590, 686], [630, 686]], ['Doubled 30 AWG for current']],
  ['p-vsys', 'power', 'VSYS → LDO + boost', [[750, 686], [790, 686]], ['Battery voltage, switched', 'Worst-case draw ≈0.20 A']],
  ['p-vsys2', 'power', 'VSYS → boost', [[770, 686], [770, 735], [1045, 735], [1045, 712]], ['Boost runs from VSYS, 0.5–5.5 V in']],
  ['p-3v3', 'power', '3V3 → DK P21', [[860, 660], [860, 600], [600, 600], [600, 500]], ['3.3 V into P21 (SW9 = VDD, SW10 = OFF)', 'Peak ≈40 mA, ≈6× headroom']],
  ['p-5v', 'power', '5V_SW → NFC + lights', [[1120, 686], [1180, 686], [1180, 320], [1090, 320], [1090, 304]], ['≈5.2 V, peak ≈110 mA, ≈10× headroom']],
  ['p-dock', 'power', 'Dock VBUS → charger', [[960, 432], [960, 620], [510, 620], [510, 660]], ['Fused RXEF110: 1.1 A hold, 2.2 A trip', 'Charging ≈0.55 A']],
];

const C = 9;
export function chamfer(pts, c = C) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (i < pts.length - 1) {
      const [px, py] = pts[i - 1]; const [nx, ny] = pts[i + 1];
      const inx = Math.sign(x - px), iny = Math.sign(y - py), ox = Math.sign(nx - x), oy = Math.sign(ny - y);
      d += ` L${x - inx * c} ${y - iny * c} L${x + ox * c} ${y + oy * c}`;
    } else d += ` L${x} ${y}`;
  }
  return d;
}

export default function BusExplorer() {
  const [bus, setBus] = useState(null);
  const [net, setNet] = useState(null);
  const [node, setNode] = useState(null);
  const nets = useMemo(() => NETS.map(([id, b, label, pts, meta]) => ({ id, b, label, d: chamfer(pts), pts, meta })), []);
  const touches = (n, nd) => {
    const [, , , x, y, w, h] = NODES.find((q) => q[0] === nd);
    return n.pts.some(([px, py]) => px >= x - 1 && px <= x + w + 1 && py >= y - 1 && py <= y + h + 1);
  };
  const activeNet = nets.find((n) => n.id === net);
  const isOn = (n) => (net ? n.id === net : node ? touches(n, node) : bus ? n.b === bus : true);
  const live = (n) => net === n.id || (node && touches(n, node)) || (!net && !node && bus === n.b);

  return (
    <div className="bus">
      <div className="bus-keys" role="group" aria-label="Filter by bus">
        {Object.entries(BUSES).map(([k, [l]]) => (
          <button key={k} className={`bus-key k-${k} ${bus === k ? 'on' : ''}`} aria-pressed={bus === k}
            onClick={() => { setNet(null); setNode(null); setBus(bus === k ? null : k); }}>
            <i />{l}
          </button>
        ))}
      </div>
      <div className="bus-sheet">
        <svg viewBox="0 0 1290 760" className="bus-svg" role="img" aria-label="Wiring schematic of the prototype">
          <defs>
            <pattern id="sheetgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" className="sheet-grid" /></pattern>
          </defs>
          <rect width="1290" height="760" fill="url(#sheetgrid)" />
          {nets.map((n) => (
            <g key={n.id} className={`net b-${n.b} ${isOn(n) ? '' : 'dim'} ${live(n) ? 'live' : ''}`}
              onMouseEnter={() => setNet(n.id)} onMouseLeave={() => setNet(null)} onClick={() => setNet(n.id)}>
              <path d={n.d} className="net-hit" />
              <path d={n.d} className="net-line" />
              <path d={n.d} className="net-flow" />
              {n.pts.slice(-1).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.6" className="net-pad" />)}
            </g>
          ))}
          {NODES.map(([id, label, sub, x, y, w, h]) => (
            <g key={id} className={`blk ${node === id ? 'on' : ''} ${id === 'dk' ? 'blk-mcu' : ''}`} tabIndex="0"
              onMouseEnter={() => setNode(id)} onMouseLeave={() => setNode(null)} onFocus={() => setNode(id)} onBlur={() => setNode(null)}>
              <rect x={x} y={y} width={w} height={h} />
              <text x={x + 12} y={y + 22} className="blk-l">{label}</text>
              <text x={x + 12} y={y + 40} className="blk-s">{sub}</text>
              {id === 'dk' && (
                <g className="blk-pins">
                  {['SDA/SCL', 'D2 · D3', 'D4 · D5', 'D0/D1 UART', 'D7 D9 D10', 'D11–D13 SPI', 'A1–A4', 'A5 · P21'].map((t, i) => (
                    <text key={t} x={x + 12} y={y + 78 + i * 20}>{t}</text>
                  ))}
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="bus-info" aria-live="polite">
        {activeNet ? (
          <>
            <span className={`bus-tag k-${activeNet.b}`}>{BUSES[activeNet.b][0]}</span>
            <h4>{activeNet.label}</h4>
            <ul>{activeNet.meta.map((m) => <li key={m}>{m}</li>)}</ul>
            <Prov k="est" src="Project compatibility check, Nov 2026" />
          </>
        ) : bus ? (
          <><span className={`bus-tag k-${bus}`}>{BUSES[bus][0]}</span><p>{BUSES[bus][1]}</p></>
        ) : (
          <p className="bus-hint">Hover a trace to follow it pin to pin. Pick a bus to isolate it. Pin assignments and electrical figures come from the prototype’s compatibility check; they are design values, not bench measurements.</p>
        )}
      </div>
    </div>
  );
}
