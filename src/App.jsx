import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ease } from './motion.js';
import { TopBar, Footer, RouteScan } from './components/Shell.jsx';
import Overview from './pages/Overview.jsx';
import SideRigs from './components/SideRigs.jsx';

const Why = lazy(() => import('./pages/Why.jsx'));
const PodArch = lazy(() => import('./pages/PodArch.jsx'));
const LabReports = lazy(() => import('./pages/LabReports.jsx'));
const Engineering = lazy(() => import('./pages/Engineering.jsx'));
const Grants = lazy(() => import('./pages/Grants.jsx'));

const RIGS = {
  '/': ['lsm6', 'rtc', 'bme', 'gauge'],
  '/why': ['as7341', 'lsm6', 'rtc', 'bme'],
  '/pod': ['nfc', 'h3lis', 'core', 'boost'],
  '/lab-reports': ['as7341', 'rtc', 'magDock', 'lsm6'],
  '/engineering': ['pp1', 'gauge', 'pp2', 'chg'],
  '/grants': ['h3lis', 'as7341', 'bme', 'nfc'],
};

export default function App() {
  const location = useLocation();
  return (
    <MotionConfig reducedMotion="user" transition={{ ease }}>
      <TopBar />
      <RouteScan />
      <SideRigs key={location.pathname} ids={RIGS[location.pathname] || RIGS['/']} heroHeight={location.pathname === '/' ? window.innerHeight : 0} />
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
              <Route path="/why" element={<Why />} />
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
