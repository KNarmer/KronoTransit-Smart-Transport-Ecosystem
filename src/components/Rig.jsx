// Decorative hardware: the real boards (rendered from the build model) hanging on jumper wires or
// peeking in from page edges. aria-hidden and pointer-free. Hanging rigs sway gently; edge rigs slide
// in from their side when they scroll into view.
import { useId } from 'react';
import { motion } from 'framer-motion';

const base = import.meta.env.BASE_URL;
export const hw = (id) => `${base}hw/${id}.webp`;
export const ASPECT = { as7341: 0.832, bat: 0.729, bme: 0.832, boost: 0.909, chg: 0.842, core: 0.894, dk: 0.629, gauge: 0.97, h3lis: 0.838, lsm6: 0.721, magDock: 0.589, nfc: 0.803, pi: 0.651, pp1: 0.666, pp2: 0.695, rtc: 0.832 };

export const WIRE = {
  red: '#d6382c', black: '#2a2d33', yellow: '#e4b51f', blue: '#2e6cd6', green: '#2b9a55',
  white: '#dfe2e6', orange: '#e07a2e', purple: '#7a52cf', grey: '#8e969d', brown: '#8a5a3a',
};

function Wire({ d, color, w = 5 }) {
  return (
    <g>
      <path d={d} fill="none" stroke="#050607" strokeOpacity="0.45" strokeWidth={w + 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth={w * 0.26} strokeLinecap="round" transform={`translate(${-w * 0.18} ${-w * 0.2})`} />
    </g>
  );
}

function Plug({ x, y, angle = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x="-5" y="-4" width="10" height="22" rx="1.5" fill="#15171a" stroke="#000" strokeWidth="1" />
      <rect x="-5" y="-4" width="3" height="22" fill="#2c3036" />
      <rect x="-1" y="18" width="2" height="7" fill="#c9a24c" />
    </g>
  );
}

export function Wires({ wires, w = 5 }) {
  return wires.map((r, i) => (
    <g key={i}>
      <Wire d={`M${r.from} C${r.c1} ${r.c2} ${r.to}`} color={WIRE[r.color] || r.color} w={r.w || w} />
      {r.plug !== undefined && <Plug x={r.to[0]} y={r.to[1]} angle={r.plug} />}
    </g>
  ));
}

const PEEK = { left: { x: -80 }, right: { x: 80 }, top: { y: -80 }, bottom: { y: 80 } };

export function Rig({ className = '', viewBox, wires = [], boards = [], w = 5, led, from, sway = false }) {
  const fid = useId().replace(/:/g, '');
  const Board = (b) => {
    const h = b.w * (ASPECT[b.id] || 0.7);
    return (
      <g key={b.id + b.x} transform={`translate(${b.x} ${b.y}) rotate(${b.rot || 0})`} filter={`url(#s${fid})`}>
        <image href={hw(b.id)} x={-b.w / 2} y={-h / 2} width={b.w} height={h} preserveAspectRatio="xMidYMid meet" />
      </g>
    );
  };
  const anim = from ? { initial: { opacity: 0, ...PEEK[from] }, whileInView: { opacity: 1, x: 0, y: 0 }, viewport: { once: true, margin: '-5% 0px' }, transition: { duration: 1.1, ease: [0.23, 1, 0.32, 1] } } : {};
  return (
    <motion.svg className={`rig ${sway ? 'sway' : ''} ${className}`} viewBox={viewBox} aria-hidden="true" focusable="false" {...anim}>
      <defs>
        <filter id={`s${fid}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#000" floodOpacity="0.45" />
        </filter>
        <radialGradient id={`l${fid}`}><stop offset="0" stopColor="#3ddc97" /><stop offset="1" stopColor="#3ddc97" stopOpacity="0" /></radialGradient>
      </defs>
      {boards.filter((b) => b.under).map(Board)}
      <Wires wires={wires} w={w} />
      {boards.filter((b) => !b.under).map(Board)}
      {led && (
        <g className="rig-led">
          <circle cx={led[0]} cy={led[1]} r="14" fill={`url(#l${fid})`} />
          <circle cx={led[0]} cy={led[1]} r="3.2" fill="#d9ffe9" />
        </g>
      )}
    </motion.svg>
  );
}

// Wires dropping from the top edge to a board's header row, swaying like vines.
export function drop(xs, { top = -20, to, sway = 60, colors, plug = 0, spread = 1 }) {
  return xs.map((x, i) => {
    const s = sway * (i % 2 ? 1 : 0.7) * (i % 3 === 0 ? -1 : 1);
    const x0 = x + (i - xs.length / 2) * 6 * spread;
    return { from: [x0, top], c1: [x0 + s, top + (to - top) * 0.35], c2: [x - s * 0.6, top + (to - top) * 0.75], to: [x, to], color: colors[i % colors.length], plug };
  });
}

// Ready-made scenes so every page gets its own hardware.
export const Hang = ({ id, className, colors, len = 330, w = 260, rot = 7 }) => (
  <Rig className={`rig-hang ${className}`} sway viewBox={`0 0 360 ${len + w}`}
    wires={drop([150, 165, 180, 195, 210].slice(0, colors.length), { top: -40, to: len, sway: 55, colors, spread: 2 })}
    boards={[{ id, x: 180, y: len + w * 0.36, w, rot }]} />
);

export const Peek = ({ id, side = 'right', className, w = 420, rot = -12, colors = ['red', 'black', 'yellow'] }) => {
  const L = side === 'left';
  const cx = L ? 200 : 300;
  const wires = colors.map((c, i) => {
    const y0 = 160 + i * 26;
    const xEdge = L ? -40 : 540;
    return { from: [cx + (L ? 40 : -40), y0], c1: [cx + (L ? -40 : 40), y0 + 80], c2: [xEdge + (L ? 80 : -80), y0 + 150 + i * 30], to: [xEdge, y0 + 120 + i * 40], color: c };
  });
  return <Rig className={`rig-peek ${side} ${className}`} from={side} viewBox="0 0 500 420" wires={wires} boards={[{ id, x: cx, y: 210, w, rot }]} />;
};
