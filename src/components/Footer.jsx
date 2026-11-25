import { Arrow, Logo } from './Icons.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="cta">
        <p className="eyebrow">Why we’re building it</p>
        <h2 className="h-huge">Every object should be able to testify about <span>its own past.</span></h2>
        <div className="hero-ctas">
          <a className="btn-lime" href="https://github.com/KNarmer/KronoTransit-Smart-Transport-Ecosystem">
            Read the full spec <span className="dot-arrow dark"><Arrow /></span>
          </a>
          <a className="btn-ghost" href="#top">Back to the top</a>
        </div>
      </div>
      <div className="foot">
        <span className="nav-logo"><Logo /> KronoTransit</span>
        <span>A student project for the Conrad Challenge 2026–27 · Apache 2.0</span>
      </div>
    </footer>
  );
}
