// Demonstration transport reports. ILLUSTRATIVE: generated from simple models, not measured.
// They show the structure and content of a real report; no bench logs have been published yet.

const STEP = 10; // seconds per frame
// Deterministic pseudo-noise so the demo is identical on every visit.
const rnd = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

function build(kind) {
  const minutes = kind === 'A' ? 46 : 58;
  const n = (minutes * 60) / STEP;
  const f = [];
  for (let i = 0; i < n; i++) {
    const m = (i * STEP) / 60; // minutes
    let amb = 21.4 + (rnd(i, 1) - 0.5) * 0.4;
    let core = 4.1 + m * 0.01 + (rnd(i, 2) - 0.5) * 0.06;
    let g = 0.3 + rnd(i, 3) * 0.4;
    let rh = 41 + (rnd(i, 4) - 0.5) * 1.2;
    let hpa = 1012.4 + (rnd(i, 5) - 0.5) * 0.3;
    let tilt = 3 + rnd(i, 6) * 3;
    let ind = 0.6 + m * 0.02;
    // Walking to the van, carried by hand
    if (m > 3 && m < 7) { g += rnd(i, 7) * 2.5; tilt = 12 + rnd(i, 8) * 18; }
    // Van segment
    if (m >= 7 && m < (kind === 'A' ? 33 : 41)) { amb = kind === 'A' ? 18.2 + (rnd(i, 9) - 0.5) * 0.6 : amb; g += rnd(i, 10) * 1.6; }
    if (kind === 'A' && m > 31.5 && m < 32.3) g = 6 + rnd(i, 11) * 3.8; // tube station at the lab
    if (kind === 'B') {
      if (m > 14.33 && m < 15) g += 4;
      if (Math.abs(m - 14.33) < 0.09) g = 38.6; // pothole
      // Van parked on tarmac with a failed air-con: ambient ramp, core follows with a lag
      const heat = Math.max(0, Math.min(1, (m - 18) / 8)) * (m < 31 ? 1 : Math.max(0, 1 - (m - 31) / 6));
      amb += 13 * heat;
      const lag = Math.max(0, m - 21);
      const coreRise = m < 21 ? 0 : m < 34 ? 5.0 * (1 - Math.exp(-lag / 7)) : 5.0 * (1 - Math.exp(-13 / 7)) * Math.exp(-(m - 34) / 14);
      core += coreRise;
      rh += 6 * heat;
      ind += 7 * Math.max(0, Math.min(1, (m - 26) / 14));
      if (m > 49.5 && m < 50.3) g = 7.5 + rnd(i, 12) * 2;
    }
    if (m > minutes - 2) { tilt = 2; g = 0.4; }
    f.push({ i, s: i * STEP, core: +core.toFixed(2), amb: +amb.toFixed(2), g: +g.toFixed(1), rh: +rh.toFixed(1), hpa: +hpa.toFixed(1), tilt: +tilt.toFixed(1), ind: +ind.toFixed(1) });
  }
  return f;
}

// Mean kinetic temperature (ΔH = 83.144 kJ/mol → ΔH/R = 10,000 K).
export function mkt(temps) {
  const H = 10000;
  const s = temps.reduce((a, t) => a + Math.exp(-H / (t + 273.15)), 0) / temps.length;
  return H / -Math.log(s) - 273.15;
}

export const BAND = [2, 8]; // example acceptance band chosen by the receiving lab, °C

const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

function events(kind, f) {
  const ev = [
    [0, 'CART', 'Cartridge seated · seat switch closed · NFC UID 04:A2:7F:1C', 'ok'],
    [20, 'LOG', 'Log opened · clock synced · first frame signed', 'ok'],
    [190, 'MOVE', 'Handling detected · pod carried to vehicle', 'info'],
    [430, 'MOVE', 'Vehicle transit begins', 'info'],
  ];
  const maxG = f.reduce((a, x) => (x.g > a.g ? x : a), f[0]);
  if (maxG.g > 5) ev.push([maxG.s, 'IMPACT', `Peak impact ${maxG.g} g`, maxG.g > 20 ? 'warn' : 'info']);
  let above = null;
  f.forEach((x) => {
    const out = x.core > BAND[1];
    if (out && above === null) { above = x.s; ev.push([x.s, 'TEMP', `Core left band: ${x.core} °C > ${BAND[1]} °C`, 'warn']); }
    if (!out && above !== null) { ev.push([x.s, 'TEMP', `Core back in band after ${fmt(x.s - above)} (passive recovery: insulation + cold packs)`, 'warn']); above = null; }
  });
  const lightPeak = kind === 'B' ? f.find((x) => x.ind > 5) : null;
  if (lightPeak) ev.push([lightPeak.s, 'COLOUR', `Indicator shift ${lightPeak.ind}% · agrees with thermal exposure`, 'warn']);
  const end = f[f.length - 1].s;
  ev.push([end - 60, 'DOCK', 'Docked at KronoDock · magnetic link detected', 'ok']);
  ev.push([end - 50, 'SYNC', `${f.length} frames transferred · every signature verified · ACK`, 'ok']);
  ev.push([end - 40, 'REPORT', 'Report issued to lab system (FHIR R4)', 'ok']);
  return ev.sort((a, b) => a[0] - b[0]).map(([s, k, t, lvl]) => ({ s, at: fmt(s), k, t, lvl }));
}

function summarise(kind, f) {
  const temps = f.map((x) => x.core);
  const aboveSec = f.filter((x) => x.core > BAND[1] || x.core < BAND[0]).length * STEP;
  const peak = f.reduce((a, x) => (x.g > a.g ? x : a), f[0]);
  // Demo acceptance rule, configurable by the lab: none outside band → VERIFIED; ≤ 10 min → WARNING; more → EXCURSION.
  const status = aboveSec === 0 ? 'VERIFIED' : aboveSec <= 600 ? 'WARNING' : 'EXCURSION';
  return {
    status,
    duration: fmt(f[f.length - 1].s + STEP),
    mkt: mkt(temps),
    peakG: peak.g, peakAt: fmt(peak.s),
    outside: fmt(aboveSec),
    maxCore: Math.max(...temps),
    seal: 'Intact · cartridge never unseated · same NFC UID at dock',
    frames: f.length,
  };
}

export const SCENARIOS = ['A', 'B'].map((k) => {
  const f = build(k);
  return {
    id: k,
    name: k === 'A' ? 'Nominal transit' : 'Excursion, mitigated',
    blurb: k === 'A'
      ? 'Ward to central lab by courier van with a tube-station hop at the end. Cold, quiet, unbroken.'
      : 'Same route, but the van stops on hot tarmac with its air-conditioning off, after a pothole. The core warms past the band and recovers passively.',
    frames: f,
    events: events(k, f),
    sum: summarise(k, f),
  };
});
