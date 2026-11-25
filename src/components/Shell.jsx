import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { PAGES, REPO } from '../pages.js';
import { Arrow, Logo } from './Icons.jsx';

export function TopBar() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 8);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { document.documentElement.style.overflow = open ? 'hidden' : ''; }, [open]);

  return (
    <header className={`bar ${solid ? 'is-solid' : ''}`}>
      <Link to="/" className="bar-brand" aria-label="KronoTransit, overview">
        <Logo /><span>KronoTransit</span><em>Kit B</em>
      </Link>
      <nav className="navtabs" aria-label="Pages">
        {PAGES.map((p) => (
          <NavLink key={p.path} to={p.path} end className={({ isActive }) => `navtab ${isActive ? 'is-on' : ''}`}>
            <span className="nt-n">{p.n}</span>
            <span className="nt-l">{p.label}</span>
          </NavLink>
        ))}
      </nav>
      <a className="bar-src" href={REPO} target="_blank" rel="noreferrer">Source <Arrow /></a>
      <button className="bar-menu" aria-expanded={open} aria-controls="sheet" onClick={() => setOpen((v) => !v)}>
        <span>{open ? 'Close' : 'Menu'}</span><i /><i />
      </button>
      <div id="sheet" className={`sheet ${open ? 'is-open' : ''}`} hidden={!open}>
        {PAGES.map((p) => (
          <NavLink key={p.path} to={p.path} end className={({ isActive }) => `sheet-row ${isActive ? 'is-on' : ''}`}>
            <span className="nt-n">{p.n}</span><b>{p.label}</b><small>{p.blurb}</small>
          </NavLink>
        ))}
        <a className="sheet-row" href={REPO} target="_blank" rel="noreferrer"><span className="nt-n">↗</span><b>Source on GitHub</b></a>
      </div>
    </header>
  );
}

// Big "next chapter" link at the bottom of every page.
export function NextPage() {
  const { pathname } = useLocation();
  const i = PAGES.findIndex((p) => p.path === pathname);
  const next = PAGES[(i + 1) % PAGES.length];
  const isLast = i === PAGES.length - 1;
  return (
    <Link to={next.path} className="next">
      <span className="next-k">{isLast ? 'Back to the start' : 'Next chapter'}</span>
      <span className="next-t"><span className="next-n">{next.n}</span>{next.label}</span>
      <span className="next-b">{next.blurb}</span>
      <span className="next-a" aria-hidden="true"><Arrow size={22} /></span>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-l"><Logo /> KronoTransit</div>
      <nav className="foot-nav" aria-label="Pages">
        {PAGES.map((p) => <Link key={p.path} to={p.path}>{p.n} {p.label}</Link>)}
      </nav>
      <p>A student project for the Conrad Challenge 2026–27, Health &amp; Nutrition. Apache 2.0. Figures marked ≈ are estimates.</p>
    </footer>
  );
}

// Page masthead: chapter number, title, and a standfirst.
export function Masthead({ n, kicker, title, children, aside }) {
  return (
    <header className="mast">
      <div className="mast-top">
        <span className="mast-n">{n}</span>
        <span className="mast-k">{kicker}</span>
      </div>
      <h1 className="mast-h">{title}</h1>
      <div className="mast-row">
        <div className="mast-p">{children}</div>
        {aside && <div className="mast-aside">{aside}</div>}
      </div>
    </header>
  );
}
