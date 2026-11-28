// Meet the hardware: pick a board, spin it in 3D, then ask what would break without it.
import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from '../motion.js';
import { COMPONENTS } from '../data/components.js';
import { hw } from './Rig.jsx';

const BoardViewer = lazy(() => import('./BoardViewer.jsx'));

// board model id → component id, plus what the pod loses without it
const BOARDS = [
  ['dk', 'mcu', 'No brain. Nothing is sampled, scored or signed — the pod is an insulated box.'],
  ['h3lis', 'h3lis', 'Drops and tube slams over ±16 g go unrecorded. The worst impacts become invisible.'],
  ['lsm6', 'imu', 'The pod can’t tell it’s being carried, so it can’t wake on handling or log orientation.'],
  ['bme', 'gas', 'Leaking preservative and decay gases go unnoticed until someone opens the vial.'],
  ['as7341', 'spec', 'The chemical indicator still changes colour — but nobody reads it until the lab.'],
  ['core', 'rtd', 'No way to tell a warm room from a warming sample. The temperature record falls apart.'],
  ['nfc', 'nfc', 'The log can’t prove which vial it belongs to. Samples could be swapped silently.'],
  ['rtc', 'rtc', 'Every event loses its timestamp. A log without times can’t be trusted.'],
  ['pi', 'dock', 'Nothing at the lab verifies the signatures or forwards the report.'],
  ['gauge', 'gauge', 'The pod can’t warn before its battery dies mid-trip.'],
  ['chg', 'chg', 'No safe charging on the dock between trips.'],
  ['boost', 'boost', 'The NFC reader and status lights have no 5 V supply.'],
  ['bat', 'bat', 'No power off the dock — no trip at all.'],
];

export default function HardwareExplorer() {
  const [sel, setSel] = useState('dk');
  const [why, setWhy] = useState(false);
  const [ready, setReady] = useState(false);
  const [board, cid, loss] = BOARDS.find((b) => b[0] === sel);
  const c = COMPONENTS.find((x) => x.id === cid);
  const pick = (id) => { setSel(id); setWhy(false); };

  return (
    <div className="hwx">
      <div className="hwx-stage">
        <Suspense fallback={null}><BoardViewer id={sel} onReady={() => setReady(true)} /></Suspense>
        {!ready && <p className="hwx-wait mono">Loading board…</p>}
        <p className="hwx-hint mono">Drag to turn · scroll to zoom</p>
      </div>

      <div className="hwx-info">
        <AnimatePresence mode="wait">
          <motion.div key={sel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }} transition={{ duration: 0.4, ease }}>
            <p className="mono hwx-k">{c.group} · {c.board}</p>
            <h3 className="hwx-n">{c.name}</h3>
            <p className="hwx-role">{c.role.split('.')[0]}.</p>
            <ul className="hwx-facts">
              {c.specs.slice(0, 2).map(([k, v]) => <li key={k}><span>{k}</span>{v}</li>)}
              <li><span>Talks over</span>{c.iface}</li>
            </ul>
            <button className={`hwx-why ${why ? 'on' : ''}`} onClick={() => setWhy((v) => !v)} aria-expanded={why}>
              {why ? 'Put it back' : 'Pull it out — what breaks?'}
            </button>
            <AnimatePresence>
              {why && (
                <motion.p className="hwx-loss" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease }}>
                  {loss}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="hwx-tray" role="tablist" aria-label="Boards">
        {BOARDS.map(([id, comp]) => {
          const cc = COMPONENTS.find((x) => x.id === comp);
          return (
            <button key={id} role="tab" aria-selected={sel === id} className={`hwx-chip ${sel === id ? 'on' : ''}`} onClick={() => pick(id)} title={cc.name}>
              <img src={hw(id, true)} decoding="async" alt="" loading="lazy" />
              <span>{cc.name.replace(' ×2', '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
