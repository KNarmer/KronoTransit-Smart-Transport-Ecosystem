import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';


const Viz = {
  temp: () => (
    <svg viewBox="0 0 320 140" className="viz" aria-hidden="true">
      <rect x="0" y="40" width="320" height="50" className="viz-band" />
      <text x="8" y="34" className="viz-t">Safe range</text>
      <path d="M0 78 C60 76 120 80 180 76 S260 74 320 75" className="viz-line viz-dim" />
      <path d="M0 70 C40 66 60 72 90 68 S140 60 160 56 S200 24 230 30 S280 62 320 64" className="viz-line" />
      <circle cx="230" cy="30" r="4" className="viz-hot" />
      <text x="8" y="132" className="viz-t">Core vs ambient</text>
    </svg>
  ),
  shock: () => (
    <svg viewBox="0 0 320 140" className="viz" aria-hidden="true">
      <line x1="0" y1="36" x2="320" y2="36" className="viz-dash" />
      <text x="8" y="28" className="viz-t">Impact logged</text>
      <path d="M0 110 L30 106 L45 112 L60 100 L80 108 L100 104 L120 110 L140 102 L155 112 L170 14 L182 112 L200 104 L230 108 L260 100 L290 106 L320 104" className="viz-line" />
      <circle cx="170" cy="14" r="4" className="viz-hot" />
      <text x="182" y="20" className="viz-t">38.6 g</text>
    </svg>
  ),
  gas: () => (
    <svg viewBox="0 0 320 140" className="viz" aria-hidden="true">
      <path d="M0 116 C60 114 110 112 150 104 S220 70 250 46 S300 20 320 16" className="viz-line" />
      <text x="8" y="28" className="viz-t">Gas at the vent</text>
    </svg>
  ),
  color: () => (
    <svg viewBox="0 0 320 140" className="viz" aria-hidden="true">
      <defs>
        <linearGradient id="sw" x1="0" x2="1">
          <stop offset="0" stopColor="#2f7bff" />
          <stop offset="0.5" stopColor="#3ddc84" />
          <stop offset="1" stopColor="#ffd23a" />
        </linearGradient>
      </defs>
      <rect x="0" y="52" width="320" height="36" rx="18" fill="url(#sw)" opacity="0.9" />
      <circle cx="250" cy="70" r="13" className="viz-knob" />
      <text x="0" y="116" className="viz-t">As sealed</text>
      <text x="320" y="116" textAnchor="end" className="viz-t">Changed</text>
    </svg>
  ),
  id: () => (
    <svg viewBox="0 0 320 140" className="viz" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${130 - i * 22} ${70 - 26 - i * 16} A ${30 + i * 22} ${30 + i * 22} 0 0 1 ${130 - i * 22} ${70 + 26 + i * 16}`}
          className="viz-line" opacity={1 - i * 0.25} />
      ))}
      <rect x="190" y="40" width="90" height="60" rx="10" className="viz-tag" />
      <text x="235" y="76" textAnchor="middle" className="viz-t">UID 04:A2:…</text>
    </svg>
  ),
};

const sensors = [
  { id: 'temp', name: 'Temperature', hw: 'Two PT1000 probes', body: 'One probe clips to the vial, one reads the air in the case. Comparing them separates a warm room from a specimen that is actually heating up.' },
  { id: 'shock', name: 'Impact', hw: 'Two accelerometers, up to ±400 g', body: 'A motion sensor catches handling; a high-g sensor catches drops and tube slams that would saturate it. Every impact is timestamped.' },
  { id: 'gas', name: 'Gas', hw: 'Metal-oxide gas sensor', body: 'Watches the air near the vent for leaking preservative and the gases tissue gives off as it decays. Neither is visible from outside.' },
  { id: 'color', name: 'Colour', hw: '10-channel light sensor', body: 'Reads the cartridge’s indicator disc through the clear wall. The disc changes colour with cumulative exposure, so the reading is a second, chemical witness.' },
  { id: 'id', name: 'Identity', hw: 'NFC reader', body: 'Reads the cartridge’s tag when it clicks in, so every log is tied to one specific specimen and nothing can be swapped quietly.' },
];

export default function Sensors() {
  const [active, setActive] = useState('temp');
  const s = sensors.find((x) => x.id === active);
  const V = Viz[active];

  return (
    <div className="sensors-wrap">
      <div className="sensors">
        <div className="tabs" role="tablist" aria-label="Sensors">
          {sensors.map((x) => (
            <button key={x.id} role="tab" aria-selected={active === x.id}
              className={`tab ${active === x.id ? 'on' : ''}`} onClick={() => setActive(x.id)}>
              <span className="tab-name">{x.name}</span>
              <span className="tab-hw">{x.hw}</span>
            </button>
          ))}
        </div>
        <div className="sensor-panel" role="tabpanel">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.25, ease } }}
              exit={{ opacity: 0, filter: 'blur(2px)', transition: { duration: 0.15, ease } }}
            >
              <V />
              <h3>{s.name}</h3>
              <p>{s.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
