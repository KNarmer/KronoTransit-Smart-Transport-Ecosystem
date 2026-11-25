import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ease } from './motion.js';
import { TopBar, Footer, RouteScan } from './components/Shell.jsx';
import Overview from './pages/Overview.jsx';

const PodArch = lazy(() => import('./pages/PodArch.jsx'));
const LabReports = lazy(() => import('./pages/LabReports.jsx'));
const Engineering = lazy(() => import('./pages/Engineering.jsx'));
const Grants = lazy(() => import('./pages/Grants.jsx'));

export default function App() {
  const location = useLocation();
  return (
    <MotionConfig reducedMotion="user" transition={{ ease }}>
      <TopBar />
      <RouteScan />
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.main
          key={location.pathname}
          className="page"
          initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.55, ease, delay: 0.12 } }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease } }}
          onAnimationComplete={(def) => { if (def?.clipPath) document.querySelector('.page')?.style.removeProperty('clip-path'); }}
        >
          <Suspense fallback={<div className="page-wait" />}>
            <Routes location={location}>
              <Route path="/" element={<Overview />} />
              <Route path="/pod" element={<PodArch />} />
              <Route path="/lab-reports" element={<LabReports />} />
              <Route path="/engineering" element={<Engineering />} />
              <Route path="/grants" element={<Grants />} />
              <Route path="*" element={<Overview />} />
            </Routes>
          </Suspense>
          <Footer />
        </motion.main>
      </AnimatePresence>
    </MotionConfig>
  );
}
