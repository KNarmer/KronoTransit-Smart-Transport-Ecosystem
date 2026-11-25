// A band of scrolling sensor traces that fills space between sections. Purely visual, illustrative.
const W = 1200;
function wave(kind, seed) {
  let d = 'M0 0';
  for (let x = 0; x <= W * 2; x += 8) {
    const t = x / W;
    let y = 0;
    if (kind === 'temp') y = Math.sin(t * Math.PI * 4 + seed) * 10 + Math.sin(t * 31 + seed) * 2;
    if (kind === 'gas') y = Math.sin(t * Math.PI * 10 + seed) * 6 + Math.cos(t * 23) * 4;
    if (kind === 'g') y = (Math.abs(Math.sin(x * 12.99 + seed)) > 0.985 ? -26 : 0) + Math.sin(x * 0.9) * 2.5;
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d;
}
const LANES = [['temp', 'core °C', 0.4], ['g', 'impact g', 1.7], ['gas', 'gas Ω', 2.9]];

export default function Telemetry({ className = '' }) {
  return (
    <div className={`telemetry ${className}`} aria-hidden="true">
      {LANES.map(([k, label, seed], i) => (
        <div key={k} className={`tl-lane tl-${k}`}>
          <span className="tl-label mono">{label}</span>
          <svg viewBox={`0 -32 ${W} 48`} preserveAspectRatio="none" className="tl-svg">
            <path d={wave(k, seed)} className="tl-path" style={{ animationDuration: `${14 + i * 5}s` }} />
          </svg>
        </div>
      ))}
      <span className="tl-scan" />
    </div>
  );
}
