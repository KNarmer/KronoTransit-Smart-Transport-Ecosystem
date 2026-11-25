// KronoTransit mark, after the logo: a K, an orbit around it, and a drop of blood beneath the joint.
export function Mark({ size = 30 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path className="mark-orbit-back" d="M6 41C2 30 22 15 46 11c10-1.6 15 1 13 6" fill="none" strokeWidth="2.6" strokeLinecap="round" />
      <path className="mark-k" d="M15 9h10v19L41 9h12L35 29l19 26H42L29 37l-4 4.5V55H15z" />
      <path className="mark-orbit-front" d="M59 17c-2 7-17 19-37 25" fill="none" strokeWidth="2.6" strokeLinecap="round" />
      <path className="mark-drop" d="M32 39s-5.6 6.6-5.6 10.4a5.6 5.6 0 0 0 11.2 0C37.6 45.6 32 39 32 39z" />
      <path d="M29.6 47.4a2.4 2.4 0 0 0 1.4 3.4" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark"><span>KRONO</span><span className="wm-2">TRANSIT</span></span>
  );
}

// The heartbeat rule from the logo, used as a section signature.
export function Pulse({ className = '', width = 240 }) {
  return (
    <svg className={`pulse ${className}`} width={width} height="18" viewBox="0 0 240 18" aria-hidden="true" preserveAspectRatio="none">
      <path d="M0 9h104l6-7 7 14 6-11 4 4h113" fill="none" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
