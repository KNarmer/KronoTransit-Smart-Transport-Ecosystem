import { PROV } from '../data/components.js';

// Source marker: a small dot with a tooltip, so numbers stay clean.
export default function Prov({ k = 'est', src }) {
  const [label, desc] = PROV[k] || PROV.est;
  return <span className={`prov prov-${k}`} title={`${label}: ${src ? `${desc} · ${src}` : desc}`} aria-label={label} />;
}

export function ProvKey() {
  return (
    <ul className="prov-key">
      {Object.entries(PROV).map(([k, [l]]) => <li key={k}><Prov k={k} /> {l}</li>)}
    </ul>
  );
}
