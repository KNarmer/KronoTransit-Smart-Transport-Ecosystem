// The specimen's journey, told in five stages. The drawing on the left is pinned; scrolling the text
// changes the stage. Every value shown in the drawings is illustrative.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';

const STEPS = [
  ['Load', 'Click the vial in. The pod reads its tag and starts the diary.'],
  ['Transport', 'Vans, tubes, potholes. Every bump gets written down.'],
  ['Monitor', 'Temperature, air, light and motion, every few seconds. No Wi-Fi needed.'],
  ['Edge AI', 'An on-board model weighs it all and lights green, amber or red.'],
  ['Report', 'Dock it. The lab gets a signed report before opening the box.'],
];

function Stage({ i }) {
  const common = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.45, ease } };
  return (
    <AnimatePresence mode="wait">
      <motion.g key={i} {...common}>
        {i === 0 && <Load />}
        {i === 1 && <Transport />}
        {i === 2 && <Monitor />}
        {i === 3 && <Infer />}
        {i === 4 && <Report />}
      </motion.g>
    </AnimatePresence>
  );
}

function Pod({ x = 300, y = 250, open = false, children }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="40" width="200" height="150" rx="10" className="j-body" />
      <rect x="14" y="54" width="172" height="122" rx="6" className="j-inner" />
      {children}
      <motion.rect x="-4" y="22" width="208" height="20" rx="5" className="j-lid"
        animate={open ? { y: [0, -86, -86, 0, 0] } : { y: 0 }}
        transition={open ? { duration: 2.8, times: [0, 0.2, 0.62, 0.8, 1], ease: 'easeInOut', repeat: Infinity } : {}} />
      <circle cx="176" cy="32" r="4" className="j-led" />
    </g>
  );
}

function Load() {
  return (
    <g>
      <Pod open>
        {/* vial drops into the well while the lid is up, then the lid closes over it */}
        <motion.g animate={{ y: [-210, -210, 0, 0] }} transition={{ duration: 2.8, times: [0, 0.22, 0.6, 1], ease: 'easeInOut', repeat: Infinity }}>
          <rect x="88" y="66" width="24" height="96" rx="12" className="j-vial" />
          <rect x="88" y="112" width="24" height="50" rx="10" className="j-blood" />
          <rect x="84" y="62" width="32" height="12" rx="2" className="j-cap" />
        </motion.g>
      </Pod>
      {[0, 1, 2].map((k) => (
        <motion.circle key={k} cx="400" cy="330" r={30} className="j-ring" initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 1.8 + k * 0.4, opacity: 0 }}
          transition={{ duration: 1.6, delay: 1.2 + k * 0.25, repeat: Infinity, repeatDelay: 1.2 }} />
      ))}
      <text x="560" y="300" className="j-t">NFC · UID 04:A2:7F:1C</text>
      <text x="560" y="324" className="j-t j-dim">seat switch closed · log opened</text>
    </g>
  );
}

function Transport() {
  const road = 'M0 470 H180 q14 -12 28 0 H420 q10 -8 20 0 H800';
  return (
    <g>
      <motion.path d={road} className="j-road" animate={{ x: [0, -200] }} transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }} />
      <motion.path d={road} className="j-road" initial={{ x: 800 }} animate={{ x: [800, 600] }} transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }} />
      <motion.g animate={{ y: [0, 0, -9, 2, 0, 0] }} transition={{ duration: 2.4, times: [0, 0.4, 0.46, 0.52, 0.6, 1], repeat: Infinity }}>
        <rect x="230" y="300" width="250" height="140" rx="10" className="j-van" />
        <path d="M480 340 h60 l40 50 v50 h-100 z" className="j-van" />
        <rect x="500" y="352" width="44" height="30" rx="3" className="j-window" />
        <path d="M330 342 h24 v-24 h20 v24 h24 v20 h-24 v24 h-20 v-24 h-24 z" className="j-cross" />
        <rect x="250" y="390" width="56" height="40" rx="4" className="j-podmini" />
        <circle cx="300" cy="446" r="22" className="j-wheel" /><circle cx="520" cy="446" r="22" className="j-wheel" />
      </motion.g>
      <path d="M90 150 H710" className="j-axis" />
      <motion.path d="M90 150 H330 l8 -2 l6 -86 l7 96 l6 -12 l5 4 H710" className="j-trace" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }} />
      <text x="90" y="110" className="j-t j-dim">impact, g</text>
      <text x="356" y="62" className="j-t">38.6 g · pothole</text>
    </g>
  );
}

const lanes = [['Core °C', 'M0 0 C80 0 160 2 240 -2 S400 -10 480 -14 S640 -12 700 -10'], ['Ambient °C', 'M0 0 C80 -4 160 -18 240 -22 S400 -20 480 -12 S640 -6 700 -4'], ['Impact g', 'M0 0 H260 l6 -36 l6 40 l5 -6 H700'], ['Gas kΩ', 'M0 0 C120 0 240 2 360 0 S560 -4 700 -6'], ['Colour Δ', 'M0 0 C200 0 400 -2 560 -6 S660 -9 700 -10']];
function Monitor() {
  return (
    <g>
      {lanes.map(([l, d], k) => (
        <g key={l} transform={`translate(60 ${120 + k * 82})`}>
          <text x="0" y="-20" className="j-t j-dim">{l}</text>
          <path d="M0 0 H700" className="j-axis" />
          <motion.path d={d} className={`j-trace t${k}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.6, ease: 'linear', repeat: Infinity, delay: k * 0.15 }} />
        </g>
      ))}
      <text x="60" y="540" className="j-t j-dim">identity: cartridge 04:A2:7F:1C present · seat closed</text>
    </g>
  );
}

function Infer() {
  const L = [[160, [140, 210, 280, 350, 420]], [380, [175, 245, 315, 385]], [580, [280]]];
  const edges = [];
  L.slice(0, -1).forEach(([x1, ys1], li) => { const [x2, ys2] = L[li + 1]; ys1.forEach((a) => ys2.forEach((b) => edges.push([x1, a, x2, b]))); });
  const ins = ['temp', 'impact', 'gas', 'colour', 'identity'];
  return (
    <g>
      {edges.map(([a, b, c, d], k) => (
        <motion.line key={k} x1={a} y1={b} x2={c} y2={d} className="j-edge" animate={{ opacity: [0.15, 0.9, 0.15] }} transition={{ duration: 1.8, delay: (k % 9) * 0.08 + (a > 300 ? 0.6 : 0), repeat: Infinity }} />
      ))}
      {L.map(([x, ys], li) => ys.map((y, k) => <circle key={`${li}-${k}`} cx={x} cy={y} r={li === 2 ? 18 : 10} className={li === 2 ? 'j-out' : 'j-node'} />))}
      {ins.map((t, k) => <text key={t} x="40" y={L[0][1][k] + 5} className="j-t j-dim">{t}</text>)}
      <text x="616" y="276" className="j-t">quality score</text>
      <motion.text x="616" y="306" className="j-score" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>98 → 81 · AMBER</motion.text>
      <text x="40" y="520" className="j-t j-dim">warmth + impact together outweigh either alone (illustrative)</text>
    </g>
  );
}

function Report() {
  return (
    <g>
      <motion.g initial={{ y: -60 }} animate={{ y: 0 }} transition={{ duration: 1, ease }}>
        <Pod x={90} y={170} />
      </motion.g>
      <rect x="70" y="372" width="240" height="40" rx="6" className="j-dock" />
      <text x="190" y="398" textAnchor="middle" className="j-t">KronoDock</text>
      <path d="M310 392 H470" className="j-axis" />
      {[0, 1, 2, 3].map((k) => (
        <motion.rect key={k} y="387" width="12" height="10" rx="2" className="j-packet" initial={{ x: 310 }} animate={{ x: [310, 460] }} transition={{ duration: 1.2, delay: k * 0.3, repeat: Infinity, ease: 'linear' }} />
      ))}
      <rect x="480" y="170" width="270" height="300" rx="10" className="j-screen" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <motion.rect key={k} x="504" y={230 + k * 32} height="10" rx="3" className={k === 0 ? 'j-line-hot' : 'j-line'} initial={{ width: 0 }} animate={{ width: k === 0 ? 140 : 200 - (k % 3) * 40 }} transition={{ duration: 0.6, delay: 0.6 + k * 0.12 }} />
      ))}
      <text x="504" y="208" className="j-t">Transport report</text>
      <text x="480" y="500" className="j-t j-dim">signatures verified · FHIR R4 Specimen + Observation</text>
    </g>
  );
}

export default function Journey() {
  const [step, setStep] = useState(0);
  const refs = useRef([]);
  useEffect(() => {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) setStep(+e.target.dataset.i); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="journey">
      <div className="journey-stage">
        <div className="journey-sticky">
          <ol className="journey-rail" aria-hidden="true">
            {STEPS.map(([t], i) => <li key={t} className={i === step ? 'on' : i < step ? 'done' : ''}><span>{String(i + 1).padStart(2, '0')}</span>{t}</li>)}
          </ol>
          <svg viewBox="40 60 740 480" className="journey-svg" role="img" aria-label={`Stage ${step + 1}: ${STEPS[step][0]}`}>
            <Stage i={step} />
          </svg>
          <p className="journey-note mono">Illustrative animation</p>
        </div>
      </div>
      <div className="journey-steps">
        {STEPS.map(([t, p], i) => (
          <div key={t} className={`journey-step ${i === step ? 'on' : ''}`} data-i={i} ref={(el) => (refs.current[i] = el)}>
            <p className="mono">Stage {i + 1} of 5</p>
            <h3 className="h3">{t}</h3>
            <p className="body">{p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
