// Boards hanging in the empty side margins. Each one is a slow, lightly damped pendulum: it drifts
// in its own gentle "air" (two slow sines with random phases) and lags behind scrolling like a weight
// on a rope. They only appear when the margin is wide enough to hold them without touching content.
import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useScroll, useTransform } from 'framer-motion';
import { hw, ASPECT, WIRE } from './Rig.jsx';

const CONTENT = 1340;
const COLORS = [['red', 'black', 'yellow'], ['blue', 'white', 'green'], ['orange', 'purple', 'black'], ['green', 'red', 'white']];

function Swing({ id, x, len, w, k, colors, hideUntil = 0 }) {
  const { scrollY } = useScroll();
  const swing = useMotionValue(0);
  // per-rig character: natural period 5–8 s, its own drift
  const p = useMemo(() => ({ T: 5 + Math.random() * 3, a1: 0.5 + Math.random() * 0.6, a2: 0.2 + Math.random() * 0.35, f1: 0.07 + Math.random() * 0.05, f2: 0.17 + Math.random() * 0.08, ph1: Math.random() * 6.28, ph2: Math.random() * 6.28 }), []);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const w0 = (2 * Math.PI) / p.T, damp = 0.22;
    let th = 0, om = 0, raf = 0, last = performance.now(), lastY = window.scrollY, v = 0;
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const y = window.scrollY; const vNow = dt > 0 ? (y - lastY) / dt : 0; lastY = y;
      v += (vNow - v) * Math.min(1, dt * 6); // smoothed scroll speed, px/s
      const t = now / 1000;
      const air = p.a1 * Math.sin(t * p.f1 * 6.28 + p.ph1) + p.a2 * Math.sin(t * p.f2 * 6.28 + p.ph2);
      const drag = Math.max(-3, Math.min(3, -v * 0.0011 * k)); // degrees, at most 3°
      const target = air + drag;
      om += (-w0 * w0 * (th - target) - damp * om) * dt;
      th += om * dt;
      swing.set(th);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [p, k, swing]);
  const drop = useTransform(scrollY, [hideUntil * 0.6, hideUntil], [-len - 260, 0]);
  const h = w * (ASPECT[id] || 0.8);
  const n = colors.length;
  return (
    <motion.div className="srig" style={{ left: x - w / 2, width: w, rotate: swing, y: hideUntil ? drop : 0 }}>
      <svg viewBox={`0 0 ${w} ${len + h}`} width={w} height={len + h} aria-hidden="true">
        {colors.map((c, i) => {
          const xi = w / 2 + (i - (n - 1) / 2) * 7;
          const d = `M${xi} 0 C${xi + (i - 1) * 10} ${len * 0.4} ${xi - (i - 1) * 8} ${len * 0.75} ${xi} ${len + h * 0.18}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="#050607" strokeOpacity="0.4" strokeWidth="6" />
              <path d={d} fill="none" stroke={WIRE[c]} strokeWidth="4" strokeLinecap="round" />
              <path d={d} className="zap" style={{ animationDelay: `${i * -0.45}s` }} />
            </g>
          );
        })}
        <image href={hw(id)} x="0" y={len} width={w} height={h} style={{ filter: 'drop-shadow(0 12px 12px rgba(0,0,0,.45))' }} />
      </svg>
    </motion.div>
  );
}

export default function SideRigs({ ids, heroHeight = 0 }) {
  const [vw, setVw] = useState(() => window.innerWidth);
  const [vh, setVh] = useState(() => window.innerHeight);
  useEffect(() => {
    const on = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', on); return () => window.removeEventListener('resize', on);
  }, []);
  const gut = Math.min(72, Math.max(20, vw * 0.045));
  const margin = (vw - CONTENT) / 2 + gut - 16;
  if (margin < 70) return null;
  const w = Math.min(170, margin - 10);
  const two = margin > 230;
  const slots = two
    ? [[margin * 0.3, 0.22], [margin * 0.72, 0.5], [vw - margin * 0.3, 0.45], [vw - margin * 0.72, 0.2]]
    : [[margin / 2, 0.24], [vw - margin / 2, 0.42]];
  const ww = two ? Math.min(w, margin * 0.42) : w;
  return (
    <div className="srigs" aria-hidden="true">
      {slots.map(([x, f], i) => ids[i] && (
        <Swing key={ids[i] + i} id={ids[i]} x={x} len={Math.round(vh * f)} w={ww} k={i % 2 ? -1 : 1} colors={COLORS[i % 4]} hideUntil={heroHeight} />
      ))}
    </div>
  );
}
