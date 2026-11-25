// Section view of the pod, to scale (2.4 px per mm), drawn like a mechanical drawing.
// Labels sit in two columns either side of the drawing; their rows are spread so no two
// ever touch, and each leader elbows from its part to its row. On narrow screens the
// labels become numbered callouts with a legend underneath, so text never shrinks to dust.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';

const S = 2.4; // px per mm
const LEFT_COL = 330; // width reserved for left labels
const X0 = LEFT_COL + 40, Y0 = 40; // drawing origin (top-left of shell)
const W = 190 * S, H = 160 * S;
const y = (mm) => Y0 + H - mm * S; // mm from the floor
const x = (mm) => X0 + mm * S;
const RIGHT_X = X0 + W + 96; // where right labels start
const VB_W = RIGHT_X + 380;
const VB_H = Y0 + H + 72;
const GAP = 34; // minimum vertical distance between label rows

// [text, anchor x mm, anchor y mm, side]
const LABELS = [
  ['Lid · 14 mm, O-ring seal, light pipe', 150, 153, 'r'],
  ['Glass vial in keyed collar', 100, 118, 'r'],
  ['XPS foam well · 4 × 25 mm', 176, 110, 'r'],
  ['Cold pack (one each side)', 160, 80, 'r'],
  ['Cradle on Sorbothane feet', 120, 58, 'r'],
  ['Mid deck · 45 mm', 178, 45, 'r'],
  ['nRF5340 DK on 12 mm standoffs', 150, 26, 'r'],
  ['Core PT1000 clipped to glass', 84, 126, 'l'],
  ['Gas sensor at vent', 34, 110, 'l'],
  ['Colour sensor at optical window', 72, 96, 'l'],
  ['Battery · charger · fuel gauge', 40, 21, 'l'],
];

// spread rows so none are closer than GAP, keeping them inside the drawing's height
function spread(items) {
  const rows = items.map((it) => ({ ...it, ty: it.ay })).sort((a, b) => a.ay - b.ay);
  for (let i = 1; i < rows.length; i++) rows[i].ty = Math.max(rows[i].ty, rows[i - 1].ty + GAP);
  const over = rows[rows.length - 1].ty - (Y0 + H);
  if (over > 0) rows.forEach((r) => { r.ty -= over; });
  for (let i = rows.length - 2; i >= 0; i--) rows[i].ty = Math.min(rows[i].ty, rows[i + 1].ty - GAP);
  return rows;
}

const PLACED = (() => {
  const all = LABELS.map(([t, mx, my, side], i) => ({ t, side, n: i + 1, ax: x(mx), ay: y(my) }));
  return [...spread(all.filter((l) => l.side === 'r')), ...spread(all.filter((l) => l.side === 'l'))]
    .sort((a, b) => a.n - b.n);
})();

function useNarrow(q = '(max-width: 760px)') {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

export default function CrossSection() {
  const narrow = useNarrow();
  const draw = (d, cls, delay = 0) => (
    <motion.path d={d} className={cls} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 1.1, ease, delay }} />
  );
  // narrow: crop to the drawing plus its dimension lines
  const vb = narrow ? `${X0 - 24} ${Y0 - 40} ${W + 96} ${H + 112}` : `0 0 ${VB_W} ${VB_H}`;
  return (
    <figure className={`xs ${narrow ? 'xs-narrow' : ''}`}>
      <svg viewBox={vb} role="img" aria-label="Cross-section of the pod showing lid, foam well, vial, cradle, mid deck and electronics">
        <defs>
          <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V7" className="hatch" /></pattern>
          <pattern id="foam" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.1" className="foamdot" /></pattern>
        </defs>
        {/* shell walls (hatched) */}
        <rect x={X0} y={y(146)} width={W} height={146 * S} className="xs-shell" fill="url(#hatch)" />
        <rect x={x(3)} y={y(143)} width={(190 - 6) * S} height={140 * S} className="xs-cavity" />
        {/* lid */}
        <rect x={X0} y={y(160)} width={W} height={14 * S} className="xs-lid" fill="url(#hatch)" />
        {/* foam well */}
        <rect x={x(3)} y={y(143)} width={(190 - 6) * S} height={98 * S} fill="url(#foam)" className="xs-foam" />
        <rect x={x(62)} y={y(140)} width={66 * S} height={88 * S} className="xs-well" />
        {/* cold packs */}
        <rect x={x(140)} y={y(100)} width={30 * S} height={44 * S} rx="6" className="xs-pack" />
        <rect x={x(20)} y={y(100)} width={30 * S} height={44 * S} rx="6" className="xs-pack" />
        {/* cradle + feet */}
        <rect x={x(68)} y={y(60)} width={54 * S} height={8 * S} className="xs-part" />
        {[74, 112].map((m) => <circle key={m} cx={x(m)} cy={y(52) + 3} r={8} className="xs-feet" />)}
        {/* vial */}
        <rect x={x(85)} y={y(130)} width={20 * S} height={66 * S} rx="10" className="xs-vial" />
        <rect x={x(85)} y={y(105)} width={20 * S} height={39 * S} rx="8" className="xs-blood" />
        <rect x={x(82)} y={y(134)} width={26 * S} height={8 * S} className="xs-part" />
        {/* sensors on cradle faces */}
        <rect x={x(70)} y={y(100)} width={10} height={22} className="xs-sensor" />
        <rect x={x(110)} y={y(92)} width={10} height={22} className="xs-sensor" />
        <rect x={x(30)} y={y(112)} width={22} height={10} className="xs-sensor" />
        <circle cx={x(84)} cy={y(126)} r="4" className="xs-probe" />
        {/* mid deck */}
        <rect x={x(3)} y={y(45)} width={(190 - 6) * S} height={3 * S} className="xs-deck" />
        {/* electronics */}
        <rect x={x(12)} y={y(30)} width={60 * S} height={18 * S} rx="3" className="xs-pcb" />
        <rect x={x(95)} y={y(28)} width={85 * S} height={4 * S} className="xs-pcb" />
        {[100, 172].map((m) => <rect key={m} x={x(m)} y={y(24)} width="6" height={12 * S} className="xs-std" />)}
        {/* dimension lines */}
        {draw(`M${X0} ${Y0 + H + 30}H${X0 + W}`, 'dim')}
        {draw(`M${X0} ${Y0 + H + 22}v16M${X0 + W} ${Y0 + H + 22}v16`, 'dim')}
        <text x={X0 + W / 2} y={Y0 + H + 56} className="dim-t" textAnchor="middle">190 mm</text>
        {draw(`M${X0 + W + 30} ${Y0}V${Y0 + H}`, 'dim', 0.2)}
        {draw(`M${X0 + W + 22} ${Y0}h16M${X0 + W + 22} ${Y0 + H}h16`, 'dim', 0.2)}
        <text x={X0 + W + 30} y={Y0 - 14} className="dim-t" textAnchor="middle">160 mm</text>
        {/* leaders */}
        {PLACED.map(({ t, side, n, ax, ay, ty }, i) => {
          if (narrow) {
            return (
              <g key={t} className="lead">
                <circle cx={ax} cy={ay} r="13" className="lead-badge" />
                <text x={ax} y={ay + 5} className="lead-n" textAnchor="middle">{n}</text>
              </g>
            );
          }
          const r = side === 'r';
          const elbow = r ? X0 + W + 66 : X0 - 26;
          const end = r ? RIGHT_X - 10 : LEFT_COL + 10;
          const d = `M${ax} ${ay}H${elbow}L${r ? elbow + 14 : elbow - 14} ${ty}H${end}`;
          return (
            <g key={t} className="lead">
              {draw(d, 'lead-l', 0.3 + i * 0.04)}
              <circle cx={ax} cy={ay} r="3.2" className="lead-dot" />
              <text x={r ? RIGHT_X : LEFT_COL} y={ty + 6} className="lead-t" textAnchor={r ? 'start' : 'end'}>{t}</text>
            </g>
          );
        })}
      </svg>
      {narrow && (
        <ol className="xs-legend">
          {LABELS.map(([t]) => <li key={t}>{t}</li>)}
        </ol>
      )}
      <figcaption className="mono">Section A–A · to scale · 2.4 px per mm</figcaption>
    </figure>
  );
}
