import { DecryptReveal } from './canvasui/DecryptReveal.tsx';

// The trip log, rendered through Canvas UI's Decrypt Reveal: it reads as cipher text
// until the cursor passes over it. Browsers without html-in-canvas just show the log.
const rows = [
  ['08:14:02', 'CART', 'NFC 04:A2:7F:1C · Verity · seated', 'ok'],
  ['08:14:03', 'TEMP', 'core 4.1 °C · ambient 21.8 °C', 'ok'],
  ['08:21:47', 'IMPACT', '6.2 g · handling', 'ok'],
  ['08:29:10', 'IMPACT', '38.6 g · tube station 4', 'warn'],
  ['08:31:55', 'TEMP', 'core 8.3 °C · above range for 6 min', 'warn'],
  ['08:33:20', 'GAS', 'vent baseline · no leak', 'ok'],
  ['08:40:02', 'COLOUR', 'indicator Δ 4% · within limit', 'ok'],
  ['08:46:31', 'DOCK', 'log signed · 212 frames · hash 9f3c…e1a7', 'ok'],
];

export default function Ledger() {
  return (
    <section className="section" id="record">
      <div className="ledger">
        <div className="sec-head ledger-head">
          <h2 className="h-xl">A diary that can’t be quietly edited.</h2>
          <p className="lede">Each entry is chained to the one before it and signed by the pod’s secure hardware. Change one line and the chain breaks. At the dock, the log becomes a standard FHIR record the lab system can read.</p>
          <ul className="ledger-points">
            <li><span>Hash-chained</span>every frame points to the last</li>
            <li><span>Signed</span>on the nRF5340’s CryptoCell</li>
            <li><span>FHIR R4</span>Specimen + Observation at the dock</li>
          </ul>
        </div>
        <DecryptReveal
          className="ledger-box"
          radius={170}
          cell={14}
          color="#d4ff3a"
          colored={0.35}
          background="#0b0e12"
          passthrough={0.06}
          scramble={0.25}
          scrambleSpeed={10}
          edgeGlow={1.2}
        >
          <div className="log">
            <div className="log-top"><span>pod CC-0007 · trip 0143</span><span>specimen: whole blood</span></div>
            {rows.map(([t, k, v, s]) => (
              <div key={t} className={`log-row ${s}`}>
                <span className="log-t">{t}</span><span className="log-k">{k}</span><span className="log-v">{v}</span>
              </div>
            ))}
            <div className="log-end">Verdict: <b>AMBER</b> · flag for review before analysis</div>
          </div>
        </DecryptReveal>
        <p className="fine ledger-hint">Move your cursor over the log to decrypt it. Sample trip shown for illustration.</p>
      </div>
    </section>
  );
}
