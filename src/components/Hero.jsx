import { lazy, Suspense, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';
import { Arrow } from './Icons.jsx';

const PodViewer = lazy(() => import('./PodViewer.jsx'));

// Full-bleed model; copy sits at the edges so the pod owns the middle of the screen.
export default function Hero() {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <section id="top" className="hero">
      <motion.div className="hero-stage" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 1, ease }}>
        <Suspense fallback={null}><PodViewer onReady={onReady} /></Suspense>
      </motion.div>
      {!ready && <p className="hero-loading mono">Loading Kit B · 158 parts</p>}

      <dl className="hero-spec mono">
        <div><dt>Unit</dt><dd>KronoTransit Kit B · alpha pod</dd></div>
        <div><dt>Build</dt><dd>99 parts · 88 wires · ≈ $500</dd></div>
        <div><dt>Shell</dt><dd>190 × 130 × 160 mm PETG</dd></div>
      </dl>

      <p className="hero-blurb">
        A sealed pod that rides with a blood or tissue sample and keeps a signed, tamper-proof diary of the trip: heat, cold, every impact, leaks, and which vial it carried.
      </p>

      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.15 }}
      >
        A suitcase for blood <span>that can’t lie.</span>
      </motion.h1>

      <div className="hero-foot">
        <a className="btn-lime" href="#system">How it works <span className="dot-arrow dark"><Arrow /></span></a>
        <span className="mono hero-hint">Drag to turn · hover any part</span>
      </div>
    </section>
  );
}
