import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ease } from './motion.js';
import { TopBar, Footer, NextPage } from './components/Shell.jsx';
import Overview from './pages/Overview.jsx';

const Problem = lazy(() => import('./pages/Problem.jsx'));
const Pod = lazy(() => import('./pages/Pod.jsx'));
const Record = lazy(() => import('./pages/Record.jsx'));
const Build = lazy(() => import('./pages/Build.jsx'));
const Plan = lazy(() => import('./pages/Plan.jsx'));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease }}>
      <ScrollTop />
      <TopBar />
      <main className="page">
        <Suspense fallback={<div className="page-loading" />}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/problem" element={<Problem />} />
            <Route path="/pod" element={<Pod />} />
            <Route path="/record" element={<Record />} />
            <Route path="/build" element={<Build />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </Suspense>
        <NextPage />
      </main>
      <Footer />
    </MotionConfig>
  );
}
