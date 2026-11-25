// Content for the "Why it matters" page. Every outside number links to its source (SOURCES);
// every number of ours is tagged as a design estimate or target until a pilot measures it.

export const SOURCES = {
  plebani: ['Plebani M. Errors in clinical laboratories or errors in laboratory medicine? Clin Chem Lab Med 2006;44(6):750–9', 'https://pubmed.ncbi.nlm.nih.gov/16729864/'],
  green: ['Green SF. The cost of poor blood specimen quality and errors in preanalytical processes. Clin Biochem 2013;46(13–14):1175–9 (summarised by MLO)', 'https://www.mlo-online.com/home/article/13006606/preanalytical-errors-their-impact-and-how-to-minimize-them'],
  capGuide: ['College of American Pathologists. Practical Guide to Specimen Handling in Surgical Pathology, 2025', 'https://documents.cap.org/documents/Practical_Guide_to_Specimen_Handling_in_Surgical_Pathology_2025.pdf'],
  ascoFaq: ['ASCO/CAP ER and PgR guideline: frequently asked questions (cold ischaemia ≤ 1 hour)', 'https://documents.cap.org/documents/immunohistochemical-testing-er-pgr-faq.pdf'],
  streichert: ['Streichert T et al. Determination of hemolysis thresholds by the use of data loggers in pneumatic tube systems. Clin Chem 2011;57:1390–7 (ADLM podcast)', 'https://myadlm.org/science-and-research/clinical-chemistry/clinical-chemistry-podcasts/2011/determination-of-hemolysis-thresholds-by-the-use-of-data-loggers-in-pneumatic-tube-systems'],
  nakhleh: ['Nakhleh RE, Zarbo RJ. Surgical pathology specimen identification and accessioning: a CAP Q-Probes study of 1,004,115 cases from 417 institutions. Arch Pathol Lab Med 1996', 'https://pubmed.ncbi.nlm.nih.gov/8629896/'],
  temptale: ['Sensitech TempTale Ultra BLE product sheet', 'https://www.sensitech.com/de/media/TT_Ultra_BLE_LS_0822_web_tcm969-156705.pdf'],
  navify: ['Roche navify Sample Transport product page', 'https://navify.roche.com/marketplace/products/navify-sample-transport'],
  tracie: ['Greiner Bio-One Tracie Transport Monitoring flyer', 'https://gbo.com//fileadmin/media/GBO-International/02_Downloads_Preanalytics/SALES_Flyers/Tracie/2408_Flyer_Tracie_TransportMonitoring_EN_web.pdf'],
  smarttube: ['Hahn-Schickard SmartTube: transport monitoring of medical samples', 'https://www.innbw.de/en/projekte/projektdetails/smarttube-c-transport-monitoring-of-medical-samples'],
  tubesense: ['US 12,235,131 B2: Sensor device for detecting transport parameters (TubeSense)', 'https://patents.google.com/patent/US12235131'],
  medspeed: ['MedSpeed laboratory logistics', 'https://www.medspeed.com/solutions/laboratory/'],
  cfr: ['21 CFR 864.3250: specimen transport and storage container (Class I, 510(k)-exempt)', 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-864/subpart-D/section-864.3250'],
};

// "Clinical & financial stakes" tiles
export const STAKES = [
  { big: '46–68%', label: 'of laboratory errors happen before the sample is analysed: in collection, labelling, handling and transport.', src: 'plebani', k: 'lit' },
  { big: '≤ 1 h', label: 'from excision to formalin for breast tissue, then 6–72 h of fixation. Labs must record both times for every breast specimen.', src: 'ascoFaq', k: 'lit' },
  { big: '0.23–1.2%', label: 'of a hospital’s operating costs go on pre-analytical errors. Modelled at about $1.2 M a year for a 650-bed US hospital.', src: 'green', k: 'lit' },
  { big: '≈ 1,500 g', label: 'peak forces measured inside pneumatic-tube carriers. Every tube system is different, so each needs its own validation.', src: 'streichert', k: 'lit' },
];

// The unmet need, answered in full
export const NEED_ONE_LINE = 'Hospitals can prove where a specimen went, but not what happened to it on the way. So the lab accepts or rejects irreplaceable samples on trust.';

export const NEED_CHAIN = [
  {
    n: '01', h: 'Who carries the risk',
    p: 'The pathologist and lab director sign the result and answer for pre-analytical quality at inspection. But nurses, OR staff, porters and tube systems move the sample, and none of them is the one judged on it.',
  },
  {
    n: '02', h: 'What happens today',
    p: 'Times are written by hand on the requisition. The specimen rides in a bag, a foam box or a pneumatic tube. Cold-chain loggers ride in shipments between sites, not in the 400 m from theatre to histology. Tube systems are validated once, with a logger, then trusted.',
  },
  {
    n: '03', h: 'Why that fails',
    p: 'The checks are episodic (one validation, not every trip), shipment-level (one logger per box, not per specimen) and manual. In a CAP study of a million surgical-pathology cases, 6% arrived with an accessioning deficiency, most of them missing or conflicting information.',
    src: 'nakhleh',
  },
  {
    n: '04', h: 'What it costs',
    p: 'When a trip goes wrong, nobody can tell. A compromised sample gets run and gives a wrong answer with no warning. Or a good sample gets rejected and the patient is recollected, and for a biopsy that can mean another procedure and a delayed diagnosis.',
  },
];

export const NEED_GAP = 'The missing piece: a record for each specimen of time, temperature, shock and opening. It has to be captured with no extra steps, tamper-evident, and handed to the lab at receipt as “pass” or “flag” with the evidence behind it.';

export const WHY_THIS = [
  ['The evidence travels with the specimen', 'Sensors sit at the vial, not on a box or a shelf. The log describes this sample, on this trip.'],
  ['Staff do nothing new', 'Dropping the cartridge in wakes the pod. Setting it on the dock ends the trip. There are no buttons, no app and no scanning.'],
  ['It fits paperwork labs already owe', 'Cold-ischaemia and fixation times, transport conditions and tube-system checks are already documented. KronoTransit turns one-off checks into a record of every trip.'],
  ['Cheap enough for every carrier', 'About $135 to build at 1,000 units, leased for $75–95 a month. It is meant to be deployed everywhere, not only on special routes.'],
];

export const WHY_NOW = [
  ['The rules got specific', 'CAP’s 2025 handling guide spells out cold-ischaemia and fixation records per breast specimen, and asks for transport conditions to be controlled and recorded.', 'capGuide'],
  ['The parts got cheap', 'A Bluetooth microcontroller, MEMS motion sensors, platinum thermometers and NFC now cost tens of dollars together, not thousands.', null],
  ['The practice already exists', 'Labs already put data loggers in tube carriers to validate routes. The habit is there; it just runs once instead of every trip.', 'streichert'],
];

export const NOT_CLAIMED = [
  ['It does not cool the sample.', 'It uses foam and cold packs and records what happens. Holding 2–8 °C for 8 hours is a target we are testing, not a result.'],
  ['It does not see the fixative or read barcodes.', 'An NFC tag in the cartridge identifies the trip. The pod logs the time from cartridge-in to dock, not the moment tissue meets formalin.'],
  ['The high-g sensor tops out at ±400 g.', 'Tube carriers can peak near 1,500 g. The pod will flag a hard hit but cannot measure how hard.'],
  ['It is not validated or cleared yet.', 'Benchtop validation is under way. The lab-system link is planned for the pilot stage.'],
];

// Zero-click workflow
export const FLOW = [
  {
    k: 'drop', n: '1', h: 'Drop & snap',
    staff: 'Nurse or OR tech drops the sealed cartridge into the pod and closes the lid. That’s it.',
    pod: 'A magnet in the cartridge closes a reed switch and the pod wakes. It reads the cartridge’s NFC tag and starts a time-stamped log.',
  },
  {
    k: 'transit', n: '2', h: 'Active transit',
    staff: 'Carry it, cart it or send it by tube, exactly as today.',
    pod: 'Logs core and air temperature, shock up to ±400 g, tilt, light (lid opened) and humidity, and runs a status LED. No cooling: foam and cold packs hold temperature, the pod records it.',
  },
  {
    k: 'dock', n: '3', h: 'Dock & verify',
    staff: 'Lab staff set the pod on the KronoDock when they unpack it.',
    pod: 'The dock pulls the log through a magnetic connector, scores the trip, signs the record and shows pass or flag. It can then post the record to the lab system as FHIR (pilot stage). The pod charges while it waits.',
  },
];

// Competitive landscape
export const MATRIX_COLS = [
  { k: 'logger', h: 'Legacy cold-chain loggers', eg: 'Sensitech TempTale, ELPRO LIBERO, USB loggers', src: 'temptale' },
  { k: 'courier', h: 'Smart medical couriers', eg: 'MedSpeed, barcode-scanned courier totes', src: 'medspeed' },
  { k: 'monitor', h: 'Sample-transport monitors', eg: 'Roche navify Sample Transport, Greiner Tracie, SmartTube, TubeSense', src: 'navify' },
  { k: 'kt', h: 'KronoTransit', eg: 'Pod + cartridge + KronoDock', us: true },
];

export const MATRIX_ROWS = [
  ['Granularity', {
    logger: 'One logger per shipment or box, recording every 1–30 minutes',
    courier: 'Per bag or tote, at each barcode scan',
    monitor: 'Per bag, box or sensor tube, depending on product',
    kt: 'Per specimen: sensors at the vial, logging the whole trip',
  }],
  ['What it detects', {
    logger: 'Temperature (some add humidity)',
    courier: 'Location and hand-off times. Temperature only if a logger rides along',
    monitor: 'Temperature and time; some add falls (SmartTube) or tube-system forces (TubeSense)',
    kt: 'Core + air temperature, shock, tilt, light / lid-open, humidity and time, scored together',
  }],
  ['In-hospital transit', {
    logger: 'Rarely: built for shipping lanes',
    courier: 'No: between sites',
    monitor: 'Mostly site-to-site, or tube-system validation',
    kt: 'Built for it: theatre → histology, ward → lab, by hand or by tube',
  }],
  ['Workflow friction', {
    logger: 'Start, stop and download each logger (app or USB)',
    courier: 'Scan at every hand-off',
    monitor: 'Scan the bag or each sample; reader at the lab',
    kt: 'None added: cartridge-in starts it, docking ends it',
  }],
  ['What the lab receives', {
    logger: 'A PDF per shipment',
    courier: 'Chain-of-custody time stamps',
    monitor: 'A quality flag at delivery, with lab-system links',
    kt: 'Pass / flag per specimen, with the signed evidence',
  }],
  ['Maturity', {
    logger: 'Mature and widely validated',
    courier: 'Mature national services',
    monitor: 'On the market (navify, Tracie) or in research (SmartTube)',
    kt: 'Prototype: benchtop validation in progress',
  }],
];

// Razor and blade
export const ECON = [
  { k: 'hw', tag: 'The razor', h: 'Reusable pod + KronoDock', price: '$75–95 / pod / month', cost: '≈ $135 to build at 1,000 units', margin: null, payback: 'Pays back its build cost in under 2 months', role: 'Placement, not profit: it puts a witness in every carrier.' },
  { k: 'cart', tag: 'The blade', h: 'Single-use cartridge', price: '$3.00–4.50 per trip', cost: '≈ $0.85 at scale', margin: [72, 81], role: 'Used on every trip, so revenue follows volume.' },
  { k: 'cloud', tag: 'The ledger', h: 'Compliance cloud', price: 'Per-site subscription (set in pilot)', cost: 'Hosting and support', margin: [90, 90], role: 'Signed trip records, inspection-ready exports and route analytics. Hard to leave once a lab’s audit trail lives there.' },
];

// Validation & roadmap
export const ROADMAP = [
  {
    stage: 'Stage 1', h: 'Benchtop telemetry validation', now: true, cost: '≈ $500 parts', k: 'quote',
    items: ['Working prototype on development boards', 'Every part checked for voltage and current compatibility', 'Calibrate against a reference thermometer; labelled heat, cold, drop and tube runs', 'Test the 8 h at 2–8 °C hold'],
    exit: 'Exit: sensors agree with the reference instruments, and labelled events are flagged correctly.',
  },
  {
    stage: 'Stage 2', h: 'Shadow hospital pilot', cost: '$40–80k', k: 'est',
    items: ['Twenty pods ride alongside the current transport method at partner sites', 'No clinical decisions are made from pod data (shadow mode)', 'Compare pod flags with the lab’s own rejections and incident reports', 'Validate tube routes; time the real workflow'],
    exit: 'Exit: flag accuracy and zero-added-step workflow shown on real routes.',
  },
  {
    stage: 'Stage 3', h: 'FDA pathway & lab-system integration', cost: 'Set by pilot findings', k: 'est',
    items: ['Specimen transport containers are Class I and 510(k)-exempt (21 CFR 864.3250)', 'If we claim the pod decides sample quality, expect a 510(k). Confirm the route with FDA before launch', 'FHIR / HL7 interface to the lab information system', 'Custom PCB, moulded enclosure, cartridge supply'],
    exit: 'Exit: a cleared or listed product, connected to the lab system, sold as a service.',
    src: 'cfr',
  },
];
