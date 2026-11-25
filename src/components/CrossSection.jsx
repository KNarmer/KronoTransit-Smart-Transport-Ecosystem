// Section view of the pod, to scale (2.4 px per mm), drawn like a mechanical drawing.
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import Prov from './Prov.jsx';

const S = 2.4; // px per mm
const X0 = 250, Y0 = 40; // drawing origin (top-left of shell)
const W = 190 * S, H = 160 * S;
const y = (mm) => Y0 + H - mm * S; // mm from the floor
const x = (mm) => X0 + mm * S;

const labels = [
  // [text, anchor x mm, anchor y mm, label side]
  ['Lid · 14 mm, O-ring seal, light pipe', 150, 153, 'r'],
  ['XPS foam well · 4 × 25 mm', 170, 110, 'r'],
  ['Cold pack', 160, 75, 'r'],
  ['Glass vial in keyed collar', 95, 118, 'r'],
  ['Cradle on Sorbothane feet', 120, 58, 'r'],
  ['Mid deck · 45 mm', 175, 45, 'r'],
  ['Battery · charger · fuel gauge', 40, 18, 'l'],
  ['nRF5340 DK on 12 mm standoffs', 140, 24, 'r'],
  ['Colour sensor at optical window', 70, 96, 'l'],
  ['Core PT1000 clipped to glass', 82, 132, 'l'],
  ['Gas sensor at vent', 30, 128, 'l'],
];

export default function CrossSection() {
  const draw = (d, cls, delay = 0) => (
    <motion.path d={d} className={cls} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 1.1, ease, delay }} />
  );
  return (
    <figure className="xs">
      <svg viewBox="0 0 1040 500" role="img" aria-label="Cross-section of the pod showing lid, foam well, vial, cradle, mid deck and electronics">
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
        <rect x={x(30)} y={y(132)} width={22} height={10} className="xs-sensor" />
        <circle cx={x(84)} cy={y(126)} r="4" className="xs-probe" />
        {/* mid deck */}
        <rect x={x(3)} y={y(45)} width={(190 - 6) * S} height={3 * S} className="xs-deck" />
        {/* electronics */}
        <rect x={x(12)} y={y(30)} width={60 * S} height={18 * S} rx="3" className="xs-pcb" />
        <rect x={x(95)} y={y(28)} width={85 * S} height={4 * S} className="xs-pcb" />
        {[100, 172].map((m) => <rect key={m} x={x(m)} y={y(24)} width="6" height={12 * S} className="xs-std" />)}
        {/* dimension lines */}
        {draw(`M${X0} ${Y0 + H + 34}H${X0 + W}`, 'dim')}
        {draw(`M${X0} ${Y0 + H + 26}v16M${X0 + W} ${Y0 + H + 26}v16`, 'dim')}
        <text x={X0 + W / 2} y={Y0 + H + 54} className="dim-t" textAnchor="middle">190 mm</text>
        {draw(`M${X0 + W + 34} ${Y0}V${Y0 + H}`, 'dim', 0.2)}
        {draw(`M${X0 + W + 26} ${Y0}h16M${X0 + W + 26} ${Y0 + H}h16`, 'dim', 0.2)}
        <text x={X0 + W + 46} y={Y0 + H / 2} className="dim-t" transform={`rotate(90 ${X0 + W + 46} ${Y0 + H / 2})`} textAnchor="middle">160 mm</text>
        {/* leaders */}
        {labels.map(([t, mx, my, side], i) => {
          const ax = x(mx), ay = y(my);
          const lx = side === 'r' ? X0 + W + 70 : 10;
          return (
            <g key={t} className="lead">
              {draw(`M${ax} ${ay}L${side === 'r' ? lx - 8 : X0 - 12} ${ay}`, 'lead-l', 0.3 + i * 0.04)}
              <circle cx={ax} cy={ay} r="2.6" className="lead-dot" />
              <text x={side === 'r' ? lx : lx} y={ay + 4} className={`lead-t ${side}`}>{t}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mono">Section A–A, to scale. Dimensions from the CAD layout <Prov k="est" /></figcaption>
    </figure>
  );
}
