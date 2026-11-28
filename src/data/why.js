// Content for the "Why it matters" page. Every outside number links to its source (SOURCES).
// Links last checked Nov 2026. PubMed, Roche, Google Patents and eCFR block automated checks but
// open normally in a browser.

export const SOURCES = {
  plebani: ['Plebani M. Errors in clinical laboratories or errors in laboratory medicine? Clin Chem Lab Med 2006;44(6):750–9', 'https://pubmed.ncbi.nlm.nih.gov/16729864/'],
  ascoFaq: ['CAP. ASCO/CAP ER and PgR guideline: frequently asked questions (cold ischaemia ≤ 1 h, fixation 6–72 h)', 'https://documents.cap.org/documents/immunohistochemical-testing-er-pgr-faq.pdf'],
  capGuide: ['CAP/NSH. Practical Guide to Specimen Handling in Surgical Pathology, v12.0, 2025', 'https://documents.cap.org/documents/Practical_Guide_to_Specimen_Handling_in_Surgical_Pathology_2025.pdf'],
  streichert: ['Streichert T et al. Determination of hemolysis thresholds by the use of data loggers in pneumatic tube systems. Clin Chem 2011;57:1390–7', 'https://myadlm.org/science-and-research/clinical-chemistry/clinical-chemistry-podcasts/2011/determination-of-hemolysis-thresholds-by-the-use-of-data-loggers-in-pneumatic-tube-systems'],
  nakhleh: ['Nakhleh RE, Zarbo RJ. Surgical pathology specimen identification and accessioning: a CAP Q-Probes study of 1,004,115 cases from 417 institutions. Arch Pathol Lab Med 1996;120(3):227–33', 'https://pubmed.ncbi.nlm.nih.gov/8629896/'],
  temptale: ['Sensitech TempTale Ultra BLE product sheet', 'https://www.sensitech.com/de/media/TT_Ultra_BLE_LS_0822_web_tcm969-156705.pdf'],
  medspeed: ['MedSpeed laboratory logistics', 'https://www.medspeed.com/solutions/laboratory/'],
  navify: ['Roche navify Sample Transport', 'https://navify.roche.com/marketplace/products/navify-sample-transport'],
  tracie: ['Greiner Bio-One Tracie transport monitoring flyer', 'https://www.gbo.com/fileadmin/media/GBO-International/02_Downloads_Preanalytics/SALES_Flyers/Tracie/2408_Flyer_Tracie_TransportMonitoring_EN_web.pdf'],
  tubesense: ['US 12,235,131 B2: Sensor device for detecting transport parameters', 'https://patents.google.com/patent/US12235131'],
  cfr: ['21 CFR 864.3250: Specimen transport and storage container', 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-864/subpart-D/section-864.3250'],
};

// Comparison: symbols, with the detail on hover / focus.
// 2 = yes, 1 = partly, 0 = no
export const MATRIX_COLS = [
  { k: 'logger', h: 'Cold-chain loggers', eg: 'TempTale', src: 'temptale' },
  { k: 'courier', h: 'Medical couriers', eg: 'MedSpeed', src: 'medspeed' },
  { k: 'monitor', h: 'Sample-transport monitors', eg: 'navify · Tracie · TubeSense', src: 'navify' },
  { k: 'kt', h: 'KronoTransit', eg: 'student prototype', us: true },
];

export const MATRIX_ROWS = [
  ['Per specimen', { logger: [0, 'One logger per box or shipment'], courier: [0, 'Per bag or tote'], monitor: [1, 'Per bag, box or dummy tube, depending on product'], kt: [2, 'Sensors sit at the vial'] }],
  ['Temperature', { logger: [2, 'Core feature'], courier: [1, 'Only if a logger rides along'], monitor: [2, 'Yes'], kt: [2, 'Core + air, two platinum probes'] }],
  ['Shock', { logger: [0, 'No'], courier: [0, 'No'], monitor: [1, 'Some products (tube-system forces)'], kt: [2, 'Up to ±400 g'] }],
  ['Lid opened', { logger: [0, 'No'], courier: [0, 'No'], monitor: [0, 'No'], kt: [2, 'Light sensor + reed switch'] }],
  ['Inside the hospital', { logger: [0, 'Built for shipping lanes'], courier: [0, 'Between sites'], monitor: [1, 'Mostly site to site, or tube validation'], kt: [2, 'Theatre → histology, ward → lab'] }],
  ['Zero added steps', { logger: [1, 'Start, stop, download'], courier: [0, 'Scan at every hand-off'], monitor: [1, 'Scan bag or sample'], kt: [2, 'Cartridge in starts it, dock ends it'] }],
  ['Proven in use', { logger: [2, 'Mature, widely validated'], courier: [2, 'National services'], monitor: [1, 'On the market or in research'], kt: [0, 'Not yet: bench testing only'] }],
];

export const LIMITS = [
  ['Doesn’t cool', 'Foam and cold packs hold temperature. The pod records it.'],
  ['Doesn’t see formalin', 'It logs cartridge-in to dock, not tissue-to-fixative.'],
  ['Tops out at ±400 g', 'Tube carriers can hit ~1,500 g. It flags, it can’t measure.'],
  ['Not validated', 'Bench testing is under way. Nothing is cleared.'],
];
