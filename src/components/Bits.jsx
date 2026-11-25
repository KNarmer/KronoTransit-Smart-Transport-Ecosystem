import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { Pulse } from './Brand.jsx';

// Scroll-triggered reveal: a short rise with a clip, once.
export function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const M = motion[as];
  return (
    <M className={className} initial={{ opacity: 0, y: 18, clipPath: 'inset(0 0 12% 0)' }} whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
      viewport={{ once: true, margin: '-12% 0px' }} transition={{ duration: 0.7, ease, delay }}>
      {children}
    </M>
  );
}

export function Kicker({ children }) {
  return <p className="kicker"><Pulse width={44} /><span>{children}</span></p>;
}

// Draws an SVG path when it scrolls into view.
export function Draw({ d, className = '', delay = 0, dur = 1.2 }) {
  return (
    <motion.path d={d} className={className} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: dur, ease, delay }} />
  );
}
