import { MotionConfig } from 'framer-motion';
import { ease } from './motion.js';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Problem from './components/Problem.jsx';
import System from './components/System.jsx';
import Sensors from './components/Sensors.jsx';
import Ledger from './components/Ledger.jsx';
import Score from './components/Score.jsx';
import Twin from './components/Twin.jsx';
import Business from './components/Business.jsx';
import Compare from './components/Compare.jsx';
import Roadmap from './components/Roadmap.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease }}>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <System />
        <Sensors />
        <Ledger />
        <Score />
        <Twin />
        <Business />
        <Compare />
        <Roadmap />
      </main>
      <Footer />
    </MotionConfig>
  );
}
