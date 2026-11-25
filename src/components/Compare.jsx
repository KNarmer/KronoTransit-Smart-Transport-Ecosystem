const cols = ['KronoTransit', 'Temp loggers', 'Workflow software', 'Sensor tubes', 'Heat strips'];
const rows = [
  ['Temperature', [1, 1, 0.5, 1, 0.5]],
  ['Drops and tube shocks', [1, 0, 0, 1, 0]],
  ['Leaks and decay gases', [1, 0, 0, 0, 0]],
  ['Chemical indicator, read automatically', [1, 0, 0, 0, 0]],
  ['Scores the sample on board, offline', [1, 0, 0, 0, 0]],
  ['Signed, tamper-evident log', [1, 0, 0, 0, 0]],
  ['Standard FHIR hand-off', [1, 0.5, 1, 0, 0]],
];

const Mark = ({ v }) => (
  <span className={`mark m${v === 1 ? 'y' : v ? 'p' : 'n'}`} aria-label={v === 1 ? 'Yes' : v ? 'Partly' : 'No'}>
    {v === 1 ? <svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg> : v ? '~' : '—'}
  </span>
);

export default function Compare() {
  return (
    <section className="section" id="compare">
      <div className="sec-head head-center">
        <h2 className="h-xl">Others log the box.<br />We witness the sample.</h2>
        <p className="lede">Temperature loggers like TubeSense and TempTale, workflow tools like Roche navify, sensor tubes like SmartTube and stick-on heat strips each cover part of the trip.</p>
      </div>
      <div className="table" role="table" aria-label="Comparison">
        <div className="trow thead" role="row">
          <span role="columnheader" />
          {cols.map((c, i) => <span key={c} role="columnheader" className={i === 0 ? 'us' : ''}>{c}</span>)}
        </div>
        {rows.map(([label, vals]) => (
          <div className="trow" key={label} role="row">
            <span className="tlabel" role="rowheader">{label}</span>
            {vals.map((v, i) => <span key={i} role="cell" className={i === 0 ? 'us' : ''}><Mark v={v} /></span>)}
          </div>
        ))}
      </div>
    </section>
  );
}
