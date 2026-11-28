// Living background: signals race along an invisible circuit grid behind every page, turning at
// right angles and leaving glowing trails. They swerve toward the cursor. Paused when the tab is
// hidden; static for reduced-motion visitors.
import { useEffect, useRef } from 'react';

const GRID = 48;

export default function Ambient() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; const g = c.getContext('2d');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let w = 0, h = 0, dpr = 1, raf = 0, color = '91,157,255', light = false;
    const mouse = { x: -1e4, y: -1e4 };
    const readColor = () => {
      const t = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      light = t === 'light'; color = light ? '36,86,196' : '91,157,255';
    };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight;
      c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    };
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const spawn = () => {
      const d = dirs[(Math.random() * 4) | 0];
      return { x: Math.round((Math.random() * w) / GRID) * GRID, y: Math.round((Math.random() * h) / GRID) * GRID, dx: d[0], dy: d[1], v: 1.2 + Math.random() * 2.4, life: 200 + Math.random() * 400, hot: Math.random() < 0.18 };
    };
    let P = [];
    const seed = () => { P = Array.from({ length: Math.round((w * h) / 26000) }, spawn); };
    readColor(); resize(); seed();
    const mo = new MutationObserver(readColor); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('resize', () => { resize(); seed(); });

    const tick = () => {
      // fade previous frame for trails
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,0.075)'; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
      for (const p of P) {
        const px = p.x, py = p.y;
        p.x += p.dx * p.v; p.y += p.dy * p.v; p.life -= 1;
        // at grid crossings, sometimes turn — biased toward the cursor
        if (Math.abs(p.x % GRID) < p.v && Math.abs(p.y % GRID) < p.v && Math.random() < 0.35) {
          const mx = mouse.x - p.x, my = mouse.y - p.y; const near = mx * mx + my * my < 260 * 260;
          const d = near ? (Math.abs(mx) > Math.abs(my) ? [Math.sign(mx), 0] : [0, Math.sign(my)]) : dirs[(Math.random() * 4) | 0];
          if (d[0] !== -p.dx || d[1] !== -p.dy) { p.dx = d[0]; p.dy = d[1]; p.x = Math.round(p.x / GRID) * GRID; p.y = Math.round(p.y / GRID) * GRID; }
        }
        const a = Math.min(1, p.life / 120) * (p.hot ? 0.9 : 0.45) * (light ? 0.6 : 1);
        g.strokeStyle = `rgba(${color},${a})`; g.lineWidth = p.hot ? 2 : 1.3;
        g.beginPath(); g.moveTo(px, py); g.lineTo(p.x, p.y); g.stroke();
        if (p.hot) { g.fillStyle = `rgba(${color},${a})`; g.beginPath(); g.arc(p.x, p.y, 2.2, 0, 7); g.fill(); }
        if (p.life <= 0 || p.x < -20 || p.y < -20 || p.x > w + 20 || p.y > h + 20) Object.assign(p, spawn());
      }
      raf = requestAnimationFrame(tick);
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(tick); };
    document.addEventListener('visibilitychange', vis);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); mo.disconnect(); removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', vis); };
  }, []);
  return <canvas ref={ref} className="ambient" aria-hidden="true" />;
}
