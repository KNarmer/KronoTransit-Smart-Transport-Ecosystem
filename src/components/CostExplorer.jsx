// Volume-scaling cost explorer: per-unit cost by category for three production tiers, with sources.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CATS, TIERS, unitTotal, PROTO_LINES } from '../data/bom.js';
import Prov from './Prov.jsx';

const usd = (v, d = 2) => `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

export default function CostExplorer() {
  const [tid, setTid] = useState('proto');
  const [lines, setLines] = useState(false);
  const t = TIERS.find((x) => x.id === tid);
  const total = unitTotal(t);
  const max = Math.max(...TIERS.map(unitTotal));

  return (
    <div className="cost">
      <div className="cost-tiers" role="tablist" aria-label="Production volume">
        {TIERS.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === tid} className={`cost-tier ${x.id === tid ? 'on' : ''}`} onClick={() => setTid(x.id)}>
            <span className="cost-q">{x.qty.toLocaleString()}×</span>
            <span className="cost-n">{x.name}</span>
            <span className="cost-u">{usd(unitTotal(x), 0)}<small> / unit</small></span>
          </button>
        ))}
      </div>

      <div className="cost-body">
        <div className="cost-head">
          <div>
            <p className="cost-big">{usd(total)}<small> per unit</small> <Prov k={t.prov} /></p>
            <p className="cost-tot">{t.qty === 1 ? '1 unit' : `${t.qty.toLocaleString()} units`} → {usd(total * t.qty, 0)} total</p>
          </div>
        </div>

        <svg className="cost-bar" viewBox="0 0 1000 46" preserveAspectRatio="none" aria-hidden="true">
          {(() => {
            let x = 0;
            return CATS.map(([k], i) => {
              const w = (t.unit[k] / max) * 1000;
              const el = <motion.rect key={k} className={`seg s${i}`} initial={false} animate={{ x, width: Math.max(w, 0) }} transition={{ duration: 0.6 }} y="0" height="46" />;
              x += w;
              return el;
            });
          })()}
        </svg>

        <table className="cost-table">
          <tbody>
            {CATS.map(([k, label], i) => (
              <tr key={k}>
                <th><i className={`sw s${i}`} />{label}</th>
                <td>{t.unit[k] ? usd(t.unit[k]) : <span className="muted">{t.id === 'proto' && (k === 'labor' || k === 'qa') ? 'not costed' : '—'}</span>}</td>
                <td className="muted">{total ? `${Math.round((t.unit[k] / total) * 100)}%` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <details className="more">
          <summary>Assumptions behind this number</summary>
          <ul className="cost-notes">
            {t.notes.map(([k, n]) => <li key={n}><Prov k={k} /> {n}</li>)}
          </ul>
        </details>

        {t.id === 'proto' && (
          <>
            <button className="link" onClick={() => setLines((v) => !v)} aria-expanded={lines}>{lines ? 'Hide' : 'Show'} all {PROTO_LINES.length} line items</button>
            {lines && (
              <table className="lines">
                <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Line</th></tr></thead>
                <tbody>
                  {PROTO_LINES.map(([c, n, q, u]) => (
                    <tr key={n}><td>{n}</td><td>{q}</td><td>{usd(u)}</td><td>{usd(q * u)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
