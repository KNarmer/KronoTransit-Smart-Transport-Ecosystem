// Home hero: the prototype's real boards laid out as one circuit, joined to the processor by routed copper.
// Hover (or focus) a board to trace its connections; data pulses run along every live trace.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { chamfer } from './BusExplorer.jsx';
import { TAGLINE } from '../routes.js';

const base = import.meta.env.BASE_URL;
const ASPECT = { as7341: 0.832, bat: 0.729, bme: 0.832, chg: 0.842, core: 0.894, dk: 0.629, gauge: 0.97, h3lis: 0.838, lsm6: 0.721, nfc: 0.803, pi: 0.651 };

// [id, name, role, cx, cy, width, route points (from board to the processor), bundle width, bus]
const BOARDS = [
  ['h3lis', 'H3LIS331', 'High-g impacts to ±400 g', 860, 175, 180, [[860, 250], [860, 305], [975, 305], [975, 392]], 3, 'data'],
  ['lsm6', 'LSM6DSOX', 'Motion and orientation', 1090, 160, 180, [[1090, 228], [1090, 392]], 3, 'data'],
  ['bme', 'BME688', 'Leaks, decay gases, humidity, pressure', 1335, 175, 180, [[1335, 248], [1335, 305], [1215, 305], [1215, 392]], 3, 'data'],
  ['as7341', 'AS7341', 'Reads the cartridge’s colour indicator', 1530, 390, 170, [[1455, 400], [1390, 400], [1390, 470], [1330, 470]], 3, 'data'],
  ['core', 'MAX31865', 'Core and ambient platinum thermometry', 1510, 640, 180, [[1425, 640], [1330, 640]], 4, 'thermal'],
  ['nfc', 'ST25R3916B', 'Knows which cartridge is inside', 1400, 880, 200, [[1400, 800], [1400, 735], [1260, 735], [1260, 655]], 4, 'data'],
  ['pi', 'Raspberry Pi Zero 2 W', 'KronoDock: verifies and forwards the log', 1075, 885, 250, [[1075, 805], [1075, 655]], 3, 'ctrl'],
  ['chg', 'bq24074', 'Charges from the dock while running', 815, 875, 170, [[815, 800], [815, 715], [955, 715], [955, 655]], 2, 'power'],
  ['gauge', 'MAX17048', 'Battery fuel gauge', 590, 900, 140, [[590, 830], [590, 780], [900, 780], [900, 640]], 2, 'power'],
];

export default function PcbHero() {
  const [on, setOn] = useState(null);
  const active = BOARDS.find((b) => b[0] === on);

  return (
    <section className="hero">
      <svg className="pcb" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="vias" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.1" className="via" /></pattern>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#000" floodOpacity="0.45" /></filter>
        </defs>
        <rect width="1600" height="1000" fill="url(#vias)" />
        {/* the processor's outline and pin field */}
        <rect x="878" y="380" width="460" height="290" rx="6" className="pcb-keepout" />
        {BOARDS.map(([id, , , , , , pts, n, bus]) => (
          <g key={id} className={`trace-b b-${bus} ${on && on !== id ? 'dim' : ''} ${on === id ? 'live' : ''}`}>
            {Array.from({ length: n }, (_, i) => {
              const k = (i - (n - 1) / 2) * 7;
              const d = chamfer(pts.map(([x, y]) => [x + k, y + k]), 12);
              return (
                <g key={i}>
                  <path d={d} className="cu" />
                  <path d={d} className="cu-pulse" style={{ animationDelay: `${(i * 0.7 + id.length * 0.31) % 4}s`, animationDuration: `${3.2 + ((i + id.length) % 4) * 0.6}s` }} />
                </g>
              );
            })}
            {Array.from({ length: n }, (_, i) => { const k = (i - (n - 1) / 2) * 7; const [x, y] = pts[pts.length - 1]; return <circle key={i} cx={x + k} cy={y + k} r="3.4" className="pad" />; })}
          </g>
        ))}
        <image href={`${base}hw/dk.webp`} x={1108 - 230} y={525 - 145} width="460" height={460 * ASPECT.dk} filter="url(#shadow)" className={`hw ${on ? 'hw-dim' : ''}`} />
        {BOARDS.map(([id, name, , cx, cy, w]) => {
          const h = w * ASPECT[id];
          return (
            <g key={id} className={`hw-g ${on && on !== id ? 'hw-dim' : ''}`} tabIndex="0" role="button" aria-label={name}
              onMouseEnter={() => setOn(id)} onMouseLeave={() => setOn(null)} onFocus={() => setOn(id)} onBlur={() => setOn(null)}>
              <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="transparent" />
              <image href={`${base}hw/${id}.webp`} x={cx - w / 2} y={cy - h / 2} width={w} height={h} filter="url(#shadow)" className="hw" />
            </g>
          );
        })}
        <text x="1108" y="700" textAnchor="middle" className="pcb-ref">U1 · nRF5340 · edge model + signing</text>
      </svg>

      {active && (
        <div className="hero-tip" style={{ left: `${(active[3] / 1600) * 100}%`, top: `${(active[4] / 1000) * 100}%` }} aria-hidden="true">
          <b>{active[1]}</b><span>{active[2]}</span>
        </div>
      )}

      <div className="hero-copy">
        <motion.p className="hero-k mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease }}>
          Student-led biomedical engineering
        </motion.p>
        <motion.h1 className="display" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.05 }}>
          {TAGLINE.replace('.', '')}<span className="dot">.</span>
        </motion.h1>
        <motion.p className="hero-lede" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.15 }}>
          KronoTransit is a sealed carrier for blood and tissue samples. Five independent sensors watch the specimen on its way to the lab, an on-board model judges what they see, and the whole journey is signed so the lab can trust the record.
        </motion.p>
        <motion.div className="hero-links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, ease, delay: 0.3 }}>
          <Link to="/pod" className="go go-strong">Explore the architecture <span>→</span></Link>
          <Link to="/lab-reports" className="go">Read a lab report <span>→</span></Link>
        </motion.div>
        <p className="hero-hint mono">Hover a board to trace it</p>
      </div>
    </section>
  );
}
