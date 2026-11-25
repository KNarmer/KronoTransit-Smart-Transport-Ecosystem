import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { Arrow, Logo } from './Icons.jsx';

const links = [
  ['System', '#system'],
  ['Sensors', '#sensors'],
  ['Record', '#record'],
  ['Twin', '#twin'],
  ['Plan', '#plan'],
];

export default function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <motion.header
      className={`nav ${solid ? 'is-solid' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease, delay: 0.1 }}
    >
      <a href="#top" className="nav-logo" aria-label="KronoTransit home"><Logo /> <span>KronoTransit</span></a>
      <nav className="nav-pill" aria-label="Sections">
        {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <a className="nav-cta btn-ghost" href="https://github.com/KNarmer/KronoTransit-Smart-Transport-Ecosystem">
        <span className="nav-cta-txt">Follow the build</span> <span className="dot-arrow"><Arrow /></span>
      </a>
    </motion.header>
  );
}
