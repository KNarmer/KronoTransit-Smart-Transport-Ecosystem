// Component register. Every value carries provenance:
//   ds    = manufacturer datasheet / product page (source given)
//   est   = design calculation, target or estimate from the project's own engineering notes
//   quote = supplier list price at time of ordering (not a volume quote)
//   bench = measured on the KronoTransit prototype (none published yet)
// `match` selects the matching parts in the 3D model by name.

const ADA = (n) => `https://www.adafruit.com/product/${n}`;

export const COMPONENTS = [
  {
    id: 'mcu', name: 'nRF5340', maker: 'Nordic Semiconductor', board: 'nRF5340 DK', img: 'dk', match: /^nRF5340/,
    group: 'Base tray', role: 'Main processor. Samples every sensor, runs the on-device quality model, keeps the log and signs it.',
    iface: 'Hosts I²C, SPI, UART and GPIO', supply: ['1.7–5.5 V SoC supply', 'ds'], power: ['Mode-dependent; see product specification', 'ds'],
    specs: [
      ['Application core', 'Arm Cortex-M33, up to 128 MHz, 1 MB flash, 512 KB RAM', 'ds'],
      ['Network core', 'Arm Cortex-M33, 64 MHz, 256 KB flash, 64 KB RAM', 'ds'],
      ['Security', 'Arm CryptoCell-312 for hashing and signing', 'ds'],
      ['Radio', 'Bluetooth Low Energy', 'ds'],
      ['Prototype supply', '3.3 V from the LDO into the DK’s P21 input', 'est'],
    ],
    ref: ['Nordic nRF5340 product page', 'https://www.nordicsemi.com/Products/nRF5340'],
  },
  {
    id: 'h3lis', name: 'H3LIS331DL', maker: 'STMicroelectronics', board: 'Adafruit #4627', img: 'h3lis', match: /H3LIS331/,
    group: 'Cartridge well', role: 'High-g witness. Catches drops and tube-system slams that would saturate an ordinary accelerometer.',
    iface: 'I²C 0x18 · interrupt on D3', supply: ['2.16–3.6 V', 'ds'], power: ['Low-power modes available; see datasheet', 'ds'],
    specs: [
      ['Range', '±100 / ±200 / ±400 g selectable, 3 axes', 'ds'],
      ['Output data rate', 'Up to 1 kHz', 'ds'],
      ['Operating temperature', '−40 to +85 °C', 'ds'],
    ],
    ref: ['ST H3LIS331DL', 'https://www.st.com/en/mems-and-sensors/h3lis331dl.html'],
  },
  {
    id: 'imu', name: 'LSM6DSOX', maker: 'STMicroelectronics', board: 'Adafruit #4438', img: 'lsm6', match: /LSM6DSOX/,
    group: 'Cartridge well', role: 'Motion witness. Logs handling, tilt and orientation, and wakes the processor on movement.',
    iface: 'I²C 0x6A · interrupt on D2', supply: ['1.71–3.6 V', 'ds'], power: ['0.55 mA, accelerometer + gyroscope high-performance', 'ds'],
    specs: [
      ['Accelerometer', '±2 / ±4 / ±8 / ±16 g', 'ds'],
      ['Gyroscope', '±125 to ±2000 dps', 'ds'],
      ['On-chip logic', 'Finite-state machine and machine-learning core for wake-on-event', 'ds'],
      ['Sampling plan', '≥ 400 Hz at ±16 g so short impacts aren’t missed', 'est'],
    ],
    ref: ['ST LSM6DSOX', 'https://www.st.com/en/mems-and-sensors/lsm6dsox.html'],
  },
  {
    id: 'gas', name: 'BME688', maker: 'Bosch Sensortec', board: 'Adafruit #5046', img: 'bme', match: /BME688/,
    group: 'Cartridge well', role: 'Air witness. Gas resistance tracks preservative leaks and decay volatiles; also humidity and pressure.',
    iface: 'I²C 0x77', supply: ['1.71–3.6 V', 'ds'], power: ['2.1 µA (1 Hz humidity + temp) up to 0.09–12 mA with the gas heater', 'ds'],
    specs: [
      ['Pressure', '300–1100 hPa', 'ds'],
      ['Humidity', '0–100 %RH', 'ds'],
      ['Temperature', '−40 to +85 °C', 'ds'],
      ['Gas', 'Metal-oxide sensor with heater profiles for volatile organic compounds', 'ds'],
    ],
    ref: ['Bosch BME688', 'https://www.bosch-sensortec.com/products/environmental-sensors/gas-sensors/bme688/'],
  },
  {
    id: 'spec', name: 'AS7341', maker: 'ams OSRAM', board: 'Adafruit #4698', img: 'as7341', match: /AS7341/,
    group: 'Cartridge well', role: 'Colour witness. Reads the cartridge’s chemical indicator through the vial wall.',
    iface: 'I²C 0x39', supply: ['Sensor 1.7–2.0 V; breakout regulates from 3–5 V', 'ds'], power: ['See datasheet', 'ds'],
    specs: [
      ['Channels', '8 visible (≈415–680 nm) + clear + near-IR + flicker detection', 'ds'],
      ['Illumination', '3 mm white LED switched by the MCU for each reading', 'est'],
    ],
    ref: ['Adafruit AS7341 breakout', ADA(4698)],
  },
  {
    id: 'rtd', name: 'MAX31865 ×2', maker: 'Analog Devices', board: 'Adafruit #3648', img: 'core', match: /MAX31865/,
    group: 'Backbone', role: 'Temperature witness. Converts two PT1000 probes, one clipped to the vial and one in free air.',
    iface: 'SPI mode 1, 4 MHz · CS D10 (core), D9 (ambient)', supply: ['3.0–3.6 V', 'ds'], power: ['See datasheet', 'ds'],
    specs: [
      ['ADC', '15-bit RTD-to-digital, 0.03125 °C resolution', 'ds'],
      ['Accuracy', '0.5 °C max total error over operating conditions', 'ds'],
      ['Wiring', '4-wire PT1000 with 4,300 Ω reference resistor', 'est'],
      ['Linearisation', 'Callendar–Van Dusen; the linear formula reads ≈0.35 °C high at 37 °C', 'est'],
    ],
    ref: ['Analog Devices MAX31865', 'https://www.analog.com/en/products/max31865.html'],
  },
  {
    id: 'pt', name: 'PT1000 probes', maker: 'TE Connectivity', board: 'PTFM102T1A0', img: null, match: /PT1000/,
    group: 'Cartridge well', role: 'Platinum resistance elements: the core probe touches the vial, the ambient probe sits on a post.',
    iface: '4-wire to MAX31865', supply: ['Passive element', 'ds'], power: ['—', 'ds'],
    specs: [
      ['Nominal', '1,000 Ω at 0 °C', 'ds'],
      ['At 22 °C', '≈1,085 Ω (α = 0.00385)', 'est'],
      ['Calibration target', 'Ice bath reads 0.0 ± 0.3 °C on both channels', 'est'],
    ],
    ref: ['TE PTF thin-film RTDs', 'https://www.te.com/en/products/sensors/temperature-sensors/rtd-sensors.html'],
  },
  {
    id: 'nfc', name: 'ST25R3916B', maker: 'STMicroelectronics', board: 'Elechouse module', img: 'nfc', match: /ST25R3916B/,
    group: 'Cartridge well', role: 'Identity witness. Reads the cartridge’s NFC tag so every log is tied to one specimen.',
    iface: 'SPI · CS D7 · IRQ D6', supply: ['5 V in, onboard 3.3 V regulator (module)', 'ds'], power: ['10 µA power-down · 5.16 mA idle · 24 mA polling · 72 mA RF on (module)', 'ds'],
    specs: [
      ['Frequency', '13.56 MHz HF reader', 'ds'],
      ['Tags', 'Reads NTAG215 (504-byte user memory) cartridge tags', 'ds'],
      ['Design rule', 'Keep 5 V on while running; power-down between reads to avoid back-powering via SPI', 'est'],
    ],
    ref: ['ST ST25R3916B', 'https://www.st.com/en/nfc/st25r3916b.html'],
  },
  {
    id: 'rtc', name: 'PCF8523', maker: 'NXP', board: 'Adafruit #5189', img: 'rtc', match: /PCF8523/,
    group: 'Backbone', role: 'Real-time clock. Timestamps every frame, kept alive by a coin cell.',
    iface: 'I²C 0x68', supply: ['1.6–5.5 V', 'ds'], power: ['≈150 nA typical', 'ds'],
    specs: [['Backup', 'CR1220 coin cell', 'est']],
    ref: ['Adafruit PCF8523 breakout', ADA(5189)],
  },
  {
    id: 'gauge', name: 'MAX17048', maker: 'Analog Devices', board: 'Adafruit #5580', img: 'gauge', match: /MAX17048/,
    group: 'Base tray', role: 'Fuel gauge. Reports state of charge so the pod can sleep before its regulator drops out.',
    iface: 'I²C 0x36 · alert on A5', supply: ['Runs from the cell', 'ds'], power: ['23 µA active', 'ds'],
    specs: [
      ['Voltage accuracy', '±7.5 mV', 'ds'],
      ['Alert threshold', '3.50 V', 'est'],
    ],
    ref: ['Analog Devices MAX17048', 'https://www.analog.com/en/products/max17048.html'],
  },
  {
    id: 'chg', name: 'bq24074', maker: 'Texas Instruments', board: 'Adafruit #4755', img: 'chg', match: /bq24074/,
    group: 'Base tray', role: 'Power-path charger. Charges from the dock while the pod keeps running.',
    iface: 'VBUS from dock, OUT to main switch', supply: ['USB/DC input', 'ds'], power: ['Charge current programmable up to 1.5 A', 'ds'],
    specs: [['Configured charge', '0.5 A (0.2 C for 2,500 mAh): cut the 1.0 A trace, then bridge 0.5 A', 'est']],
    ref: ['TI BQ24074', 'https://www.ti.com/product/BQ24074'],
  },
  {
    id: 'ldo', name: 'MCP1700-3302E', maker: 'Microchip', board: 'TO-92 on power board', img: null, match: /MCP1700/,
    group: 'Base tray', role: '3.3 V regulator for the processor and every sensor.',
    iface: 'VSYS in → 3V3 rail out', supply: ['2.3–6.0 V input', 'ds'], power: ['1.6 µA quiescent; 250 mA max output', 'ds'],
    specs: [
      ['Dropout', '178 mV at 250 mA (≈60 mV at the pod’s load)', 'ds'],
      ['3V3 rail peak', '≈40 mA, about 6× headroom', 'est'],
    ],
    ref: ['Microchip MCP1700', 'https://www.microchip.com/en-us/product/MCP1700'],
  },
  {
    id: 'boost', name: 'MiniBoost 5 V', maker: 'Adafruit (TI TPS61023)', board: 'Adafruit #4654', img: 'boost', match: /MiniBoost/,
    group: 'Base tray', role: 'Switched 5 V rail for the NFC reader and status lights; off when not needed.',
    iface: 'EN on D5', supply: ['0.5–5.5 V input', 'ds'], power: ['5V_SW rail peak ≈110 mA, about 10× headroom', 'est'],
    specs: [['Output', '≈5.2 V in practice; LED resistors sized for 5.2 V', 'est']],
    ref: ['Adafruit MiniBoost', ADA(4654)],
  },
  {
    id: 'bat', name: 'LiPo 2,500 mAh', maker: 'Adafruit', board: 'Adafruit #328', img: 'bat', match: /^LiPo/,
    group: 'Base tray', role: 'Energy store for a full transport run off the dock.',
    iface: 'JST-PH via the fuel gauge', supply: ['3.7 V nominal', 'ds'], power: ['≈9.25 Wh; worst-case pod draw ≈0.20 A', 'est'],
    specs: [['Protection', 'Built-in protection circuit; charged only through the charger board', 'ds']],
    ref: ['Adafruit 2500 mAh LiPo', ADA(328)],
  },
  {
    id: 'cart', name: 'Verity cartridge', maker: 'KronoTransit', board: 'Glass vial + collar', img: null, match: /Cartridge|vial|cradle|Reed/,
    group: 'Cartridge well', role: 'Holds the specimen. Keyed so it seats one way; magnet closes the reed switch when seated.',
    iface: 'NFC tag + reed switch on D4', supply: ['Passive', 'est'], power: ['—', 'est'],
    specs: [
      ['Prototype vial', '15 mL clear glass', 'quote'],
      ['Identity', 'NTAG215 sticker, 25 mm', 'quote'],
      ['Indicator (prototype)', 'Bromothymol blue colour disc as a safe stand-in chemistry', 'est'],
      ['Cost at scale', '≈ $0.85: shell $0.45 + NFC inlay $0.25 + membrane $0.15', 'est'],
    ],
    ref: ['Project BOM', null],
  },
  {
    id: 'dock', name: 'KronoDock', maker: 'Raspberry Pi Zero 2 W', board: 'Pi + magnetic connector', img: 'pi', match: /KronoDock|Raspberry|Perma-Proto #3|dock half|RXEF110|microSD/,
    group: 'KronoDock', role: 'Receives the signed log over the magnetic connector, verifies it, and charges the pod.',
    iface: 'UART /dev/serial0 · 5-pin magnetic link', supply: ['5 V', 'ds'], power: ['Fused VBUS: 1.1 A hold, 2.2 A trip; charging ≈0.55 A', 'est'],
    specs: [
      ['Processor', 'RP3A0: quad-core Arm Cortex-A53, 1 GHz, 512 MB', 'ds'],
      ['Wireless', '2.4 GHz 802.11 b/g/n, Bluetooth 4.2 / BLE', 'ds'],
      ['Protocol', 'HELLO → GET_FRAMES → ACK with HMAC; pod erases only after ACK', 'est'],
      ['Back-feed guard', '1 kΩ in pod-TX → Pi-RX', 'est'],
    ],
    ref: ['Raspberry Pi Zero 2 W', 'https://www.raspberrypi.com/products/raspberry-pi-zero-2-w/'],
  },
  {
    id: 'shell', name: 'Shell, insulation, mounts', maker: 'Printed PETG + XPS', board: '190 × 130 × 160 mm', img: null, match: /^Shell|^Lid|foam|Sorbothane|vent|gasket|cold packs|Mid deck|inserts/,
    group: 'Shell', role: 'Sealed, insulated body. Foam well and cold packs hold temperature; Sorbothane feet soak up shock.',
    iface: '—', supply: ['—', 'est'], power: ['Passive', 'est'],
    specs: [
      ['Shell', 'PETG, 3 mm walls, 146 mm body + 14 mm lid', 'est'],
      ['Insulation', 'FOAMULAR XPS, R-5 per inch, four layers', 'ds'],
      ['Mounts', 'Sorbothane 0.75 in hemispheres, 50 duro', 'ds'],
      ['Seal', '2 mm silicone O-ring cord + ePTFE vent plug', 'est'],
      ['Active cooling', 'None. A Peltier was removed: ≈50 W at 60% duty would empty the original 18.5 Wh pack in ≈22 min', 'est'],
    ],
    ref: ['Project engineering notes', null],
  },
];

export const PROV = {
  ds: ['Datasheet', 'Manufacturer datasheet or product page'],
  est: ['Design estimate', 'Design calculation, target or projection; not yet measured'],
  quote: ['List price', 'Supplier list price at time of ordering, not a volume quote'],
  bench: ['Bench measured', 'Measured on the KronoTransit prototype'],
  lit: ['Published study', 'Peer-reviewed literature'],
};
