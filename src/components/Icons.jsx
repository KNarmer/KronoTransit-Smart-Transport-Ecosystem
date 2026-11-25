export const Arrow = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Mark: a vial inside a rounded pod outline.
export const Logo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.5" y="5" width="19" height="15" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="9.5" y="2.5" width="5" height="12" rx="2.5" fill="#d4ff3a" />
  </svg>
);
