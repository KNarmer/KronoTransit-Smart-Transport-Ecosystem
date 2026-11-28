import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ROUTES, REPO, TAGLINE } from '../routes.js';
import { useTheme } from '../theme.js';
import { Mark, Wordmark, Pulse } from './Brand.jsx';

function ThemeSwitch() {
  const [theme, toggle] = useTheme();
  const dark = theme === 'dark';
  return (
    <button className="theme" onClick={toggle} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`${dark ? 'Light' : 'Dark'} mode`}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        {dark
          ? <><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>
          : <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />}
      </svg>
    </button>
  );
}

export function TopBar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <header className="top">
      <Link to="/" className="brand" aria-label="KronoTransit overview"><Mark /><Wordmark /></Link>
      <nav className="nav" aria-label="Main">
        {ROUTES.map((r, i) => (
          <NavLink key={r.path} to={r.path} end className={({ isActive }) => `nav-a ${isActive ? 'on' : ''}`}>
            <span className="nav-i">{String(i + 1).padStart(2, '0')}</span>{r.label}
          </NavLink>
        ))}
      </nav>
      <div className="top-r">
        <ThemeSwitch />
        <button className="menu" aria-expanded={open} aria-controls="menu-sheet" onClick={() => setOpen((v) => !v)}>{open ? 'Close' : 'Menu'}</button>
      </div>
      {open && (
        <nav id="menu-sheet" className="sheet" aria-label="Main">
          {ROUTES.map((r, i) => (
            <NavLink key={r.path} to={r.path} end className={({ isActive }) => `sheet-a ${isActive ? 'on' : ''}`}>
              <span className="nav-i">{String(i + 1).padStart(2, '0')}</span>{r.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

// Computerised route change: a scan line sweeps the viewport while the address resolves.
export function RouteScan() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setRun((n) => n + 1);
  }, [pathname]);
  const r = ROUTES.find((x) => x.path === pathname) || ROUTES[0];
  if (!run) return null;
  return (
    <div className="scan" key={run} aria-hidden="true">
      <div className="scan-grid" />
      <div className="scan-line" />
      <div className="scan-text"><span>route</span> /{r.slug}<i>_</i></div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-brand"><Mark size={26} /><Wordmark /></div>
      <p className="foot-tag">{TAGLINE}</p>
      <Pulse className="foot-pulse" width={180} />
      <p className="foot-meta">A student research project by high school students. Not a commercial product. Open source under Apache 2.0 · <a href={REPO} target="_blank" rel="noreferrer">source</a></p>
    </footer>
  );
}
