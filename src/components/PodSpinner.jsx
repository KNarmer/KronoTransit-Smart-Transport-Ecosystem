// A frameless, slowly turning 3D pod for dropping into any page.
import { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { ease } from '../motion.js';

const PodViewer = lazy(() => import('./PodViewer.jsx'));

export default function PodSpinner({ exploded = false, className = '', caption, spin = 0.9 }) {
  const [ready, setReady] = useState(false);
  const [part, setPart] = useState(null);
  return (
    <figure className={`spinner ${className}`}>
      <motion.div className="spinner-gl" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.8, ease }}>
        <Suspense fallback={null}><PodViewer onReady={() => setReady(true)} onHover={setPart} startExploded={exploded} autoRotate spin={spin} near={exploded ? 0.72 : 0.7} /></Suspense>
      </motion.div>
      <figcaption className="mono">{part ? `› ${part}` : caption}</figcaption>
    </figure>
  );
}
