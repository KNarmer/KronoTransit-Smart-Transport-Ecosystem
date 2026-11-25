// Decorative hardware: the real Kit B boards (rendered from the bench-build model) hanging on
// jumper wires or pushing in from the page edges. Everything here is aria-hidden and pointer-free.
import { useId } from 'react';

const base = import.meta.env.BASE_URL;
export const hw = (id) => `${base}hw/${id}.webp`;
// height / width of each render, so boards keep their true proportions.
export const ASPECT = {"as7341": 0.832, "bat": 0.729, "bme": 0.832, "boost": 0.909, "chg": 0.842, "core": 0.894, "dk": 0.629, "gauge": 0.97, "h3lis": 0.838, "lsm6": 0.721, "magDock": 0.589, "nfc": 0.803, "pi": 0.651, "pp1": 0.666, "pp2": 0.695, "rtc": 0.832};

// Jumper-wire colours as they come out of a real 40-way Dupont ribbon.
export const WIRE = {
  red: '#d6382c', black: '#22252a', yellow: '#e4b51f', blue: '#2e6cd6', green: '#2b9a55',
  white: '#e6e8ea', orange: '#e07a2e', purple: '#7a52cf', grey: '#8e969d', brown: '#8a5a3a',
};

// One insulated wire: dark edge, body colour, thin specular line along the top.
function Wire({ d, color, w = 5 }) {
  return (
    <g>
      <path d={d} fill="none" stroke="#050607" strokeOpacity="0.55" strokeWidth={w + 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth={w * 0.26} strokeLinecap="round" transform={`translate(${-w * 0.18} ${-w * 0.2})`} />
    </g>
  );
}

// Dupont housing at a wire end, pointing along `angle` (degrees, 0 = down).
function Plug({ x, y, angle = 0, pin = true }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x="-5" y="-4" width="10" height="22" rx="1.5" fill="#15171a" stroke="#000" strokeWidth="1" />
      <rect x="-5" y="-4" width="3" height="22" fill="#2c3036" />
      {pin && <rect x="-1" y="18" width="2" height="7" fill="#c9a24c" />}
    </g>
  );
}

/**
 * A run of wires. Each wire: { from:[x,y], to:[x,y], c1:[x,y], c2:[x,y], color, plug?:angle }.
 */
export function Wires({ wires, w = 5 }) {
  return wires.map((r, i) => {
    const d = `M${r.from} C${r.c1} ${r.c2} ${r.to}`;
    return (
      <g key={i}>
        <Wire d={d} color={WIRE[r.color] || r.color} w={r.w || w} />
        {r.plug !== undefined && <Plug x={r.to[0]} y={r.to[1]} angle={r.plug} />}
      </g>
    );
  });
}

/**
 * A hardware composition in its own coordinate space (viewBox), placed absolutely by className.
 * boards: [{ id, x, y, w, rot, shadow? }] drawn above wires unless under:true.
 */
export function Rig({ className = '', viewBox, wires = [], boards = [], w = 5, led }) {
  const fid = useId().replace(/:/g, '');
  const under = boards.filter((b) => b.under);
  const over = boards.filter((b) => !b.under);
  const Board = (b) => (
    <g key={b.id + b.x} transform={`translate(${b.x} ${b.y}) rotate(${b.rot || 0})`} filter={`url(#s${fid})`}>
      <image href={hw(b.id)} x={-b.w / 2} y={-(b.w * (ASPECT[b.id] || 0.7)) / 2} width={b.w} height={b.w * (ASPECT[b.id] || 0.7)} preserveAspectRatio="xMidYMid meet" />
    </g>
  );
  return (
    <svg className={`rig ${className}`} viewBox={viewBox} aria-hidden="true" focusable="false">
      <defs>
        <filter id={`s${fid}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity="0.65" />
        </filter>
        <radialGradient id={`l${fid}`}><stop offset="0" stopColor="#d4ff3a" /><stop offset="1" stopColor="#d4ff3a" stopOpacity="0" /></radialGradient>
      </defs>
      {under.map(Board)}
      <Wires wires={wires} w={w} />
      {over.map(Board)}
      {led && (
        <g className="rig-led">
          <circle cx={led[0]} cy={led[1]} r="14" fill={`url(#l${fid})`} />
          <circle cx={led[0]} cy={led[1]} r="3.2" fill="#eaffb0" />
        </g>
      )}
    </svg>
  );
}

// Helper: a bundle of wires dropping from the top edge (y = top) to a board's header row,
// swaying like vines. xs = header x positions, to = header y. sway shifts the mid-curve.
export function drop(xs, { top = -20, to, sway = 60, colors, plug = 0, spread = 1 }) {
  return xs.map((x, i) => {
    const s = sway * (i % 2 ? 1 : 0.7) * (i % 3 === 0 ? -1 : 1);
    const x0 = x + (i - xs.length / 2) * 6 * spread;
    return {
      from: [x0, top],
      c1: [x0 + s, top + (to - top) * 0.35],
      c2: [x - s * 0.6, top + (to - top) * 0.75],
      to: [x, to],
      color: colors[i % colors.length],
      plug,
    };
  });
}
