// Scientific instrument panels: the pod rendered through Canvas UI effects.
// Each panel is a fixed cell in the layout (never floats over text), with a corner-marked frame and a short label.
import { useEffect, useState } from 'react';
import { WireframeObject } from './canvasui/WireframeObject.tsx';
import { TopographicObject } from './canvasui/TopographicObject.tsx';
import { AsciiObject } from './canvasui/AsciiObject.tsx';
import { DitheredObject } from './canvasui/DitheredObject.tsx';
import { ParticleObject } from './canvasui/ParticleObject.tsx';
import { POD_EXPLODED, DRACO } from './model.js';

function useDark() {
  const get = () => (document.documentElement.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  const [dark, setDark] = useState(get);
  useEffect(() => {
    const mo = new MutationObserver(() => setDark(get()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

const common = { src: POD_EXPLODED, dracoDecoderPath: DRACO, zoom: false, orbit: true };

export default function Sci({ kind = 'wire', label, tag, className = '', scale = 4.6 }) {
  const dark = useDark();
  const ink = dark ? '#9fc4ff' : '#1d3f8f';
  const accent = dark ? '#5b9dff' : '#2456c4';
  let el = null;
  // key on theme so colour changes re-create the effect cleanly
  const k = `${kind}-${dark}`;
  if (kind === 'wire') el = <WireframeObject key={k} {...common} className="sci-gl" lineColor={ink} nodeColor={accent} lineWidth={1} nodes={false} glow={dark ? 0.5 : 0.15} scan={0.6} scanSpeed={0.6} hiddenLines={0.12} topology={0.04} creaseAngle={35} scale={scale} floatIntensity={0.4} rotationIntensity={0.4} autoRotate autoRotateSpeed={0.6} />;
  if (kind === 'topo') el = <TopographicObject key={k} {...common} className="sci-gl" lines={22} indexEvery={5} lineColor={ink} indexColor={accent} fill={dark ? 0.25 : 0.12} shading={0.6} drift={0.3} scale={scale} floatIntensity={0.4} rotationIntensity={0.4} autoRotate autoRotateSpeed={0.5} />;
  if (kind === 'ascii') el = <AsciiObject key={k} {...common} className="sci-gl" cellSize={9} colored={false} color={ink} contrast={1.6} edgeContrast={3} highlight={accent} scale={scale} floatIntensity={0.6} rotationIntensity={0.5} autoRotate autoRotateSpeed={0.7} invert={!dark} />;
  if (kind === 'dither') el = <DitheredObject key={k} {...common} className="sci-gl" method="bayer" gridSize={3} highlight={accent} invert={dark} scale={scale} floatIntensity={0.6} rotationIntensity={0.5} autoRotate autoRotateSpeed={0.6} />;
  if (kind === 'particles') el = <ParticleObject key={k} {...common} className="sci-gl" count={26000} size={1.8} radius={120} swirl={0.9} drift={0.5} scale={scale} floatIntensity={1} rotationIntensity={0.5} autoRotate autoRotateSpeed={0.6} />;
  return (
    <figure className={`sci ${className}`}>
      <span className="crop tl" /><span className="crop tr" /><span className="crop bl" /><span className="crop br" />
      {el}
      {(label || tag) && <figcaption className="sci-cap mono">{tag && <b>{tag}</b>}{label}</figcaption>}
    </figure>
  );
}
