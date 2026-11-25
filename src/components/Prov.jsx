import { PROV } from '../data/components.js';

// Provenance tag shown beside every technical number.
export default function Prov({ k = 'est', src }) {
  const [label, desc] = PROV[k] || PROV.est;
  return <span className={`prov prov-${k}`} title={src ? `${desc} · ${src}` : desc}>{label}</span>;
}

export function ProvKey() {
  return (
    <ul className="prov-key">
      {Object.entries(PROV).map(([k, [l, d]]) => (
        <li key={k}><Prov k={k} /> <span>{d}{k === 'bench' ? ' — none published yet.' : '.'}</span></li>
      ))}
    </ul>
  );
}
