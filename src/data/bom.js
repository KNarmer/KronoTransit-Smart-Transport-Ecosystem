// Manufacturing cost model.
// Tier 1 is the real prototype parts list at supplier list prices (Adafruit, Mouser, PiShop.us, Elechouse,
// Uline, MatterHackers, Carolina, K&J, Home Depot; checked Nov 2026). Tiers 2 and 3 are projections:
// every number there is an estimate with its assumption written next to it. No volume quotes yet.

export const CATS = [
  ['pcba', 'Electronics / PCBA'],
  ['sensors', 'Sensors'],
  ['thermal', 'Thermal sub-assembly'],
  ['enclosure', 'Enclosure'],
  ['labor', 'Assembly + calibration'],
  ['qa', 'Testing / QA'],
];

// [category, item, qty, unit price USD]
const PROTO = [
  ['pcba', 'nRF5340 DK (Mouser)', 1, 48.21], ['pcba', 'USB cable, 6 in', 1, 2.95], ['pcba', 'LiPo 3.7 V 2,500 mAh, protected', 1, 14.95],
  ['pcba', 'MAX17048 fuel gauge', 1, 5.95], ['pcba', 'JST-PH jumper', 1, 0.95], ['pcba', 'bq24074 LiPo charger', 1, 14.95],
  ['pcba', 'Panel-mount SPDT toggle', 1, 0.95], ['pcba', 'MCP1700 3.3 V LDO', 2, 0.5], ['pcba', '1 µF X7R capacitor', 2, 1.34],
  ['pcba', 'MiniBoost 5 V', 1, 3.95], ['pcba', 'Perma-Proto half-size, 3-pack', 1, 12.5], ['pcba', '30 AWG silicone wire, 2 colours', 2, 4.95],
  ['pcba', 'Heat-shrink kit', 1, 9.95], ['pcba', 'Female/female jumpers', 1, 3.95], ['pcba', 'Female/male jumpers', 1, 3.95],
  ['pcba', 'Break-away headers, 10-pack', 1, 4.95], ['pcba', 'Nylon M2.5 standoff set', 1, 16.95], ['pcba', 'PCF8523 real-time clock', 1, 4.95],
  ['pcba', 'CR1220 coin cell', 1, 0.95], ['pcba', 'STEMMA QT cable 100 mm', 4, 0.95], ['pcba', 'STEMMA QT cable 200 mm', 2, 1.25],
  ['pcba', 'STEMMA QT to header cable', 1, 0.95], ['pcba', 'Resettable fuse RXEF110', 1, 0.64], ['pcba', 'Magnetic 5-pin connector pair', 1, 6.95],
  ['pcba', 'RGB LED, diffused', 1, 2.0], ['pcba', '3 mm white LEDs, 25-pack', 1, 4.95], ['pcba', 'PN2222 transistors, 10-pack', 1, 1.95],
  ['pcba', '220 Ω resistors, 25-pack', 1, 0.75], ['pcba', '1 kΩ resistors, 25-pack', 1, 0.75], ['pcba', 'Kapton tape', 1, 4.95],
  ['pcba', 'PicoBlade 7-pin cable (Mouser)', 1, 5.83], ['pcba', 'Raspberry Pi Zero 2 W (dock)', 1, 17.25], ['pcba', 'Pi power supply 5.1 V', 1, 8.8],
  ['pcba', 'microSD 32 GB', 1, 14.95],
  ['sensors', 'AS7341 spectral sensor', 1, 18.95], ['sensors', 'BME688 gas sensor', 1, 19.95], ['sensors', 'LSM6DSOX IMU', 1, 11.95],
  ['sensors', 'H3LIS331 high-g accelerometer', 1, 24.95], ['sensors', 'MAX31865 PT1000 amplifier', 2, 14.95], ['sensors', 'TE PT1000 element (1 spare)', 3, 11.05],
  ['sensors', 'ST25R3916B NFC module', 1, 13.9], ['sensors', 'Reed switch MDSR-7 (1 spare)', 2, 1.36],
  ['thermal', 'FOAMULAR XPS panel 2 × 2 ft', 1, 10.0], ['thermal', 'Cold packs (zip bags + water)', 2, 0],
  ['enclosure', 'PETG filament 1 kg', 1, 20.99], ['enclosure', 'Brass M3 heat-set inserts', 1, 5.95], ['enclosure', 'Sorbothane hemispheres, 4-pack', 1, 9.95],
  ['enclosure', 'Silicone O-ring cord, 20 ft', 20, 0.5], ['enclosure', 'ePTFE vent plug M6', 1, 3.39],
  ['enclosure', 'Glass vials 15 mL, case of 24 (cartridges)', 1, 30.0], ['enclosure', 'NTAG215 stickers', 10, 0.58], ['enclosure', 'N52 magnets', 10, 0.52],
  ['enclosure', 'Bromothymol blue 0.04%, 100 mL', 1, 4.35],
];

const sum = (rows) => rows.reduce((a, r) => a + r[2] * r[3], 0);
const byCat = (rows) => Object.fromEntries(CATS.map(([k]) => [k, sum(rows.filter((r) => r[0] === k))]));

export const PROTO_LINES = PROTO;

export const TIERS = [
  {
    id: 'proto', name: 'Prototype', qty: 1, prov: 'quote',
    blurb: 'The actual alpha prototype on breakout boards, including the dock and ten cartridges, at supplier list prices.',
    unit: { ...byCat(PROTO), labor: 0, qa: 0 },
    notes: [
      ['quote', 'Every line is a supplier list price from the parts list; total ≈ $502.71.'],
      ['est', 'Student build time is not costed. Hand tools (≈ $148) are excluded; campus makerspaces are used where possible.'],
    ],
  },
  {
    id: 'pilot', name: 'Clinical pilot batch', qty: 50, prov: 'est',
    blurb: 'A first custom-PCB batch for pilot sites: chips bought at small-batch prices, enclosures printed, hand assembly.',
    unit: { pcba: 83.7, sensors: 44.7, thermal: 12, enclosure: 35, labor: 50, qa: 45 },
    notes: [
      ['est', 'Chips and sensors at ≈1.3× the ~1,000-unit prices below (small-batch distributor pricing).'],
      ['est', 'Custom 4-layer PCB + assembly ≈ $40 per board with setup costs spread over 50 boards.'],
      ['est', 'Enclosure 3D-printed by a service, ≈ $35 per shell + lid; insulation hand-cut, ≈ $12.'],
      ['est', 'Assembly + calibration ≈ 2 h at $25/h; QA ≈ 1 h at $25/h plus ≈ $1,000 of fixtures over 50 units.'],
    ],
  },
  {
    id: 'scale', name: 'Scaled production', qty: 1000, prov: 'est',
    blurb: 'Custom PCB at roughly 1,000 units with a moulded enclosure: the project’s production cost target of ≈ $135 per pod.',
    unit: { pcba: 51.6, sensors: 34.4, thermal: 8, enclosure: 26, labor: 15, qa: 0 },
    notes: [
      ['est', 'PCBA: nRF5340 $12.50, 64 MB flash $1.10, secure element ≈$1, battery/charger/gauge ≈$8, regulators + passives ≈$6, NFC front-end ≈$5, 4-layer PCB + assembly ≈$18.'],
      ['est', 'Sensors: BME688 $6.20, AS7341 $4.50, LSM6DSOX $2.90, 2 × MAX31865 + PT1000 $14.80, high-g accelerometer ≈$6.'],
      ['est', 'Moulded enclosure, gasket, light pipe, pogo pins + magnets ≈$26; insulation + phase-change insert ≈$8; final test + calibration ≈$15 (counted under assembly).'],
      ['est', 'Excludes injection-mould tooling, certification testing and margin; none has been quoted yet.'],
    ],
  },
];

export const unitTotal = (t) => Object.values(t.unit).reduce((a, b) => a + b, 0);

export const CARTRIDGE = [
  ['Prototype cartridge', 4.54, 'quote', 'Glass vial, NFC sticker, magnet and indicator at list prices (per cartridge of ten).'],
  ['Cartridge at scale', 0.85, 'est', 'Moulded shell $0.45 + NFC inlay $0.25 + membrane $0.15.'],
];

// Funding steps, from the project's own planning estimates.
export const STAGES = [
  ['Develop', 'Prototype working end to end; calibrate against reference instruments with labelled heat, cold, drop and tube runs.', '≈ $500 parts', 'quote'],
  ['Engineering validation', 'Two custom PCB spins, enclosure prototypes, a reference thermometer, test fixtures and ten pods.', '$8,000–10,000', 'est'],
  ['Hospital & lab pilots', 'Twenty pods at partner sites, route-validation studies, integration engineering, insurance.', '$40,000–80,000', 'est'],
  ['Refine', 'Fold pilot feedback into hardware, firmware and the report format.', 'Depends on pilot findings', 'est'],
  ['Market', 'Device-as-a-service: pods and docks per month, cartridges per use.', '$75–95 per pod per month (target)', 'est'],
];
