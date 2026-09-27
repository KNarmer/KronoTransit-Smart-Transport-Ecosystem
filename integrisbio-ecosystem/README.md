# ChronoVerity: Smart Transport Ecosystem for Pre-Analytical Diagnostics

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Embedded Platform: ARM Cortex-M](https://img.shields.io/badge/Platform-STM32%20%7C%20Nordic%20nRF5340-brightgreen.svg)](https://www.nordicsemi.com/)
[![Framework: TinyML / TensorFlow Lite](https://img.shields.io/badge/Edge%20AI-TFLite%20Micro-orange.svg)](https://www.tensorflow.org/lite/microcontrollers)
[![Healthcare Standard: HL7 FHIR R4](https://img.shields.io/badge/Interoperability-HL7%20FHIR%20R4-firebrick.svg)](https://hl7.org/fhir/)
[![Status: Conrad Challenge 2026–2027](https://img.shields.io/badge/Status-Conrad%20Challenge%202026--2027-9cf.svg)](https://www.conradchallenge.org/)

**ChronoVerity** (`ChronoCase` active hardware + `Verity Bio` chemical indicator) is an edge-intelligent specimen
transport and quality-assurance platform built to close the single largest blind spot in hospital diagnostics: the
**pre-analytical transit phase**, which accounts for up to **70% of all diagnostic laboratory errors**.

Instead of treating liquid specimens (blood, urine, saliva) and solid tissue (biopsies, resections) as separate
problems, ChronoVerity unifies them under one "Hub-and-Cartridge" architecture — a reusable active carrier paired
with a low-cost consumable cartridge — that continuously monitors thermal, mechanical, and biochemical integrity
from the moment a sample leaves the patient to the moment it docks at the lab, **with or without a network
connection**.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [System Architecture](#system-architecture)
3. [Sensor Scaling: Environmental & Structural Integrity](#sensor-scaling-environmental--structural-integrity)
4. [Edge AI: The Pre-Analytical Quality Index (PQI)](#edge-ai-the-pre-analytical-quality-index-pqi)
5. [Clinical Systems Integration (HL7 / FHIR)](#clinical-systems-integration-hl7--fhir)
6. [Competitive Landscape & Strategic Advantage](#competitive-landscape--strategic-advantage)
7. [Business Model: DaaS + Consumable Engine](#business-model-daas--consumable-engine)
8. [What Needs to Be Coded Computationally](#what-needs-to-be-coded-computationally)
9. [Potential for Computational Scaling](#potential-for-computational-scaling)
10. [Conrad Challenge: Achievable MVP Implementation](#conrad-challenge-achievable-mvp-implementation)
11. [Directory Layout](#directory-layout)
12. [Getting Started](#getting-started)
13. [Project Roadmap & Competition Timeline](#project-roadmap--competition-timeline)
14. [Contributing](#contributing)
15. [License](#license)

---

## Problem Statement

Modern diagnostics has invested heavily in analytical instrumentation (mass spectrometers, sequencers, automated
immunoassay platforms) and in post-analytical reporting (LIS/EHR software). The **pre-analytical phase** — collection,
labeling, and transport of the specimen to the lab — remains almost entirely manual, unmonitored, and
paper-label-dependent. This gap is where the majority of diagnostic errors originate:

- **Liquid specimens** (blood, urine, saliva) degrade via hemolysis, clotting, and thermal exposure during courier
  transport or pneumatic tube transit.
- **Solid tissue** (biopsies, surgical resections) degrades via fixative (formalin) leakage or depletion, ischemic
  decay from delayed fixation, and physical damage (fragmentation, floating above the fixative meniscus).
- Existing tools address **either** bulk cold-chain logistics **or** manual barcode/checkpoint tracking — none
  combine biological, chemical, and mechanical failure detection in a single device built for the hospital
  pre-analytical corridor (surgical suites → pneumatic tubes → couriers → central lab).

ChronoVerity closes this gap with a single reusable hardware platform and a family of low-cost consumables that work
across both specimen types.

---

## System Architecture

### The "Hub-and-Cartridge" Model

Packing expensive active electronics into every single-use specimen vial makes collection prohibitively expensive.
ChronoVerity instead uses a two-tier architecture: a reusable, sterilizable active carrier that houses all compute
and sensing, and a cheap, swappable consumable that holds the specimen itself.

```
+------------------------------------------------------------+
|                  CHRONOCASE ACTIVE POD                     |
|   (Reusable Carrier: Cortex-M4/M7, VOC, IMU, RTD, Optics)  |
|                                                              |
|  +----------------------------------------------------+    |
|  |          VERITY-CARTRIDGE / SPECIMEN VIAL           |    |
|  |   (Low-cost Consumable: Chemosensitive Swatch,      |    |
|  |    RFID Tag, Direct-Contact Liquid/Tissue Chamber)  |    |
|  +----------------------------------------------------+    |
+------------------------------------------------------------+
```

- **ChronoCase Pod (Reusable Active Carrier):** A ruggedized, sterilizable carrier designed for transit between
  surgical suites, outpatient clinics, pneumatic tube systems, and the central pathology/clinical lab. Houses the
  processing unit, active environmental sensors, optical readers, and rechargeable power.
- **Verity Cartridge (Consumable Specimen Insert):** A standardized, low-cost ($2–$4) vial, cassette, or transport
  sleeve with a transparent optical window and a dry-chemistry colorimetric reaction disc.

When the Verity cartridge snaps into the ChronoCase carrier, the carrier's internal optical sensors monitor the
consumable disc continuously **without opening the container**.

### Full Hardware Stack

```
                              CHRONOVERITY ACTIVE POD (Reusable)

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  MCU: Dual-Core Cortex-M33/M7 @ 480MHz  │  Storage: 64MB SPI NOR Flash (Append-Only Log)     │
├─────────────────────────────────────────┼───────────────────────────────────────────────────┤
│  SENSORS:                               │  EDGE AI ENGINE:                                  │
│   • MOX VOC Gas Sensor (Formalin/Amine) │   • INT8 Quantized Neural Network                 │
│   • 11-Channel Spectral Optical Array   │   • Real-Time Pre-Analytical Quality Index (PQI)  │
│   • 6-Axis High-G IMU (Pneumatic Shock) │   • Visual RGB Status Triage Indicator             │
│   • Dual 4-Wire RTDs (Thermal Gradient) │                                                    │
└─────────────────────────────────────────┴────────────────────────────────────────────────────┘
                                        ▲
                                        │ Snaps In via Keyed Alignment
                                        ▼
                        VERITY SPECIMEN CARTRIDGE (Consumable)
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  • Low-Cost Standardized Injection Mold ($2.00–$4.00)                                        │
│  • Embedded Passive RFID/NFC Tag (UID Serialization)                                          │
│  • Submersion Meniscus Optical Channel                                                        │
│  • Solid-State Chemosensitive Dry Reaction Swatch (Ischemia / Thermal Exposure)               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ Docks at Lab Receiver
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  HOSPITAL LIS/EHR INTEGRATION: Epic Beaker / Cerner Millennium (HL7 FHIR Specimen Resource)   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Sensor Scaling: Environmental & Structural Integrity

| Sensor Modality | Hardware Implementation | Target Mechanism & Clinical Failure Mode Prevented |
|---|---|---|
| **Volatile Organic Compounds (VOC)** | Metal-oxide (MOX) gas sensor (e.g., Bosch BME688 or Sensirion SGP40) | **Formalin leakage / depletion:** formalin (3.7% formaldehyde) evaporates rapidly if poorly sealed; the sensor flags micro-leaks into the carrier air cavity. For fresh unfixed tissue, it also detects volatile amines (putrescine/cadaverine) indicating ischemic tissue decay. |
| **Multi-Spectral Optical Array** | Miniaturized RGB/IR reflective sensor array or photodiode cluster (e.g., AS7341 11-channel spectral sensor) | **Colorimetric tracking & submersion:** monitors the Verity chemical disc non-destructively through the vial wall. For liquid biopsy/blood, detects gross hemolysis or clotting via turbidity; for biopsies, detects whether the sample floated above the fixative meniscus. |
| **6-Axis Inertial Measurement Unit (IMU)** | Ultra-low-power accelerometer/gyroscope (e.g., STMicroelectronics LSM6DSOX with finite state machine) | **Pneumatic tube stress & accidental drops:** pneumatic tube systems subject samples to acceleration spikes (>10G), causing red-blood-cell hemolysis and friable tumor fragmentation. The IMU logs mechanical shock profiles. |
| **Redundant RTD Array** | Dual 4-wire PT100/PT1000 Class-A platinum RTDs | **Micro-thermal gradients:** one probe monitors the core vial-sleeve interface while the second monitors outer chassis ambient temperature, distinguishing surface warming from true core thermal compromise. |

---

## Edge AI: The Pre-Analytical Quality Index (PQI)

In hospital basements, elevators, courier vehicles, and lead-lined surgical suites, wireless signals drop. The system
cannot rely on cloud computation to assess sample viability — all scoring happens on-device.

**Target microcontroller cores:** Nordic nRF5340 (dual Arm Cortex-M33 with BLE 5.3) or STM32H7 (Arm Cortex-M7 up to
480 MHz), running **TensorFlow Lite for Microcontrollers** or an Edge Impulse–exported quantized (INT8) model.

```
Raw Sensor Data (Temp, IMU, VOC, Optical)
            |
            v
     Feature Extraction
   * Thermal Integral   * Shock Vectors
   * Off-Gas Slope      * Color Delta
            |
            v
 TinyML Classifier (Quantized INT8 Model)
            |
   +--------+--------+
   v                 v
GREEN: Viable     RED: Degraded
   Sample             Sample
```

### PQI Formulation

The edge microcontroller runs continuous sampling across all sensor buses, computing a real-time, non-linear
degradation metric rather than reporting isolated threshold breaches:

```
PQI(t) = 1.0 − ( w1·∫ΔT(τ)dτ  +  w2·ΣG_impact,k  +  w3·d[VOC]/dt  +  w4·ΔColor_Verity )
```

| Term | Meaning |
|---|---|
| `ΔT(τ)` | Thermal deviation above the validated holding envelope (4°C or 20°C baseline) |
| `G_impact,k` | Kinetic shock vector integral logged during drops or pneumatic tube transit (>10G) |
| `d[VOC]/dt` | Rate of change in volatile organic off-gassing (formalin evaporation or necrotic diamine release) |
| `ΔColor_Verity` | Spectral shift captured by the 11-channel photodiode array across the consumable swatch |

The model evaluates these terms **jointly**, not independently. For example, if an unfixed biopsy experiences a mild
temperature rise for 15 minutes but the IMU detects zero agitation and VOC levels show zero off-gassing, the sample
remains classified as high quality. If temperature rises **simultaneously** with a VOC spike, the unit's local LED
immediately switches to amber/red and logs a degradation alert to onboard non-volatile flash memory (SPI NOR Flash).

---

## Clinical Systems Integration (HL7 / FHIR)

To be adopted without creating a siloed, single-purpose interface, the receiving dock pushes data directly into
existing Laboratory Information Systems (LIS) such as **Epic Beaker**, **Cerner Millennium**, or **Sunquest** — no
manual data entry required.

When the carrier docks via pogo pins or NFC:

- **`Specimen` resource:** the carrier links its internal serial log to the patient's unique specimen identifier
  (`Specimen.identifier`).
- **`Specimen.condition`:** the calculated PQI score and temperature timeline map directly into the FHIR condition
  element (e.g., SNOMED CT code for "Specimen acceptable" or "Specimen degraded by thermal exposure").
- **`Observation` resource:** raw metrics (min/max temperature, total transport duration, max G-force) are populated
  as clinical observations linked to the pathology accession report.

Pathologists simply see a verified **"Pre-Analytical Integrity Check: PASSED (Score 98/100)"** directly inside the
patient's existing electronic health record.

---

## Competitive Landscape & Strategic Advantage

Existing specimen logistics solutions focus exclusively on bulk transport temperature logging or manual barcode
tracking. None address the biological, chemical, and mechanical failure points of fresh tissue biopsies and liquid
diagnostics inside the hospital pre-analytical transit corridor.

```
                     ┌─────────────────────────────────────────────────────────┐
                     │               CHRONOVERITY ECOSYSTEM                    │
                     │  • Edge-AI Multi-Modal Sensing (VOC, IMU, Optics, RTD)  │
                     │  • Continuous Physical & Chemical Viability (PQI)       │
                     │  • Autonomous Zero-Connectivity Operation               │
                     └────────────────────────────┬────────────────────────────┘
                                                   │
         ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
         ▼                                         ▼                                         ▼
┌──────────────────┐                     ┌──────────────────┐                      ┌──────────────────┐
│    TubeSense      │                     │  Roche Navify     │                     │ TempTale / Cargo  │
│ (Smart NFC Tag)   │                     │ Sample Transport   │                    │   Data Loggers    │
├──────────────────┤                     ├──────────────────┤                      ├──────────────────┤
│ Temp/Time only;    │                    │ Workflow portal;   │                    │ Post-hoc USB/NFC  │
│ no chemical or     │                    │ relies on manual   │                    │ download; no bio  │
│ optical logging;   │                    │ scans & generic    │                    │ sensing; no real- │
│ cloud-dependent     │                   │ data loggers        │                   │ time decisioning  │
└──────────────────┘                     └──────────────────┘                      └──────────────────┘
```

### Competitor Breakdown

- **TubeSense** — Uses compact NFC/868 MHz wireless tags affixed to transport boxes or racks to log temperature
  curves against ISO 15189 standards.
  **How we win:** TubeSense functions purely as a thermometer. It cannot detect formalin leakage, un-submerged
  floating biopsies, or cellular shear from pneumatic tube systems. ChronoVerity integrates VOC gas monitoring,
  11-channel multi-spectral optical evaluation, and 6-axis inertial impact logging with onboard TinyML
  classification that functions even when wireless signals drop.

- **Roche Navify Sample Transport** — An enterprise software solution tracking transport timestamps, handoffs, and
  basic temperature warnings across courier networks.
  **How we win:** Navify is a clinical workflow wrapper reliant on human checkpoint scanning and generic external
  dataloggers. ChronoVerity operates at the hardware-cartridge interface, pairing real-time physical-chemical
  telemetry with native HL7/FHIR serialization directly into Epic Beaker and Cerner Millennium — no third-party
  scanning portal required.

- **Sensitech (TempTale) & DeltaTrak** — Cold-chain cargo loggers designed for commercial pallets and bulk
  pharmaceutical shipping.
  **How we win:** These devices rely on post-hoc USB downloads or costly cellular gateways, don't fit standard
  surgical collection workflows, offer zero consumable-cartridge economics, and ignore tissue-ischemia biomarkers
  (e.g., cadaverine, putrescine) entirely.

- **Passive Colorimetric Strips (SpotSee, WarmMark)** — Disposable chemical stickers indicating an irreversible
  temperature-threshold breach.
  **How we win:** Purely binary, non-digitized, and prone to tampering or missed readings. ChronoVerity pairs
  consumable colorimetric chemistry with autonomous, non-destructive optical monitoring inside an active, reusable
  carrier.

### Feature Comparison Matrix

| Capability / Metric | ChronoVerity Ecosystem | TubeSense | Roche Navify Transport | TempTale Ultra | Passive Strips (SpotSee) |
|---|---|---|---|---|---|
| **Architecture** | Reusable Active Hub + Low-Cost Cartridge | Reusable NFC Tag on Box/Rack | Software Portal + Generic Tags | USB Data Logger | Single-Use Sticker |
| **Monitored Modalities** | Temp, VOC Gas, Optical Turbidity, 6-Axis IMU | Temp, Timestamp | Checkpoint Scan, Temp | Temp, Humidity | Temp Breach (Binary) |
| **Tissue Ischemia Detection** | **Yes** (MOX VOC + Colorimetric) | No | No | No | No |
| **Pneumatic Shock Tracking** | **Yes** (6-Axis IMU >10G logging) | No | No | Optional G-sensor | No |
| **Local Viability Scoring** | **Yes** (Onboard TinyML PQI) | No (cloud threshold) | No (cloud flags) | No (post-hoc alert) | Visual only |
| **Offline Resilience** | Full local scoring & local triage LED | Stores logs; fails real-time | Fails without network | Stores logs; requires PC | Manual inspection |
| **Hospital IT Interface** | Direct Native HL7 / FHIR R4 API | Proprietary Azure Cloud API | Roche Navify Cloud Sync | USB PDF / CSV Export | None (Manual Entry) |
| **Procurement Model** | OpEx Device-as-a-Service ($85/mo) | Capital Hardware / SaaS | Enterprise Software License | Per-unit purchase | Consumable purchase |

---

## Business Model: DaaS + Consumable Engine

Selling capital equipment to hospitals typically takes 12–18 months of administrative committee review. A
**Device-as-a-Service (DaaS) + Consumable** structure avoids capital-expenditure (CapEx) hurdles by operating
entirely within the hospital's flexible operating budget (OpEx).

| Revenue Tier | Price | Details |
|---|---|---|
| **Hardware (DaaS)** | $75–$95 / carrier / month | Includes ChronoCase pods, receiving docks, firmware updates, automated bi-annual recalibration, and FHIR/LIS integration connectors. Hospital perspective: negligible monthly expense versus the cost of one cancelled surgery or repeated core-needle biopsy ($3,000–$10,000). |
| **Consumables (Reagent Kits)** | $3.00–$4.50 / cartridge | Billed per unit alongside routine surgical supplies. Production cost at scale (injection-molded polymer + printed colorimetric membrane) is roughly $0.60–$0.85, yielding a **~75% gross margin**. |

---

## What Needs to Be Coded Computationally

### 1. Embedded Firmware & Real-Time Drivers (Edge Layer)

**Target platforms:** Nordic nRF5340 (Application Core Cortex-M33 @ 128 MHz, Network Core @ 64 MHz) or STM32H7.

**Sensor driver abstraction layer (C/C++):**

- `bme688_driver.c` — I2C/SPI driver configured to pulse the gas sensor hot plate for VOC sensing
  (formalin/amine detection) with power duty-cycling.
- `as7341_driver.c` — Spectral sensor I2C driver measuring 8 optical channels (415 nm–680 nm) + Near-IR + Clear to
  quantify color shift on the Verity swatch.
- `lsm6dsox_driver.c` — High-G accelerometer interrupt driver with an onboard Finite State Machine (FSM) that wakes
  the processor only on significant impact events (>2G).
- `max31865_rtd.c` — Dual SPI RTD converters reading redundant PT100/PT1000 probes to calculate the
  core-vs-ambient thermal differential.

**Storage & ring-buffer management:**

- SPI NOR Flash wear-leveling ring-buffer recording fixed-size log frames (timestamp, temp core, temp ambient, VOC
  raw, optical channels 1–8, peak G-force, running PQI).
- Cryptographic hashing (SHA-256) per telemetry block to guarantee a tamper-proof audit trail for clinical
  chain-of-custody.

**Edge inference engine:**

- TensorFlow Lite for Microcontrollers (TFLite Micro) runtime executing a fully quantized `pqi_model_int8.tflite`
  model.
- Feature extraction window: 60-second rolling sliding windows calculating variance, area under the thermal curve,
  peak impact force, and spectral Euclidean distance.

### 2. Physical Handoff & Synchronization Logic (Docking Layer)

**Docking station daemon (Go / Rust / C++):**

- Automatic handshake over UART pogo pins or NFC upon mechanical docking into the lab receiving bay.
- Batch synchronization protocol pulling encrypted session flash memory without erasing until cryptographic
  confirmation is returned by the dock.

### 3. Integration & Middleware (Clinical Layer)

**HL7 / FHIR R4 transformation engine (Node.js / Python FastAPI):**

- Parser translating binary session records into FHIR JSON bundles:
  - `Specimen` resource containing container ID, collection time, and specimen type.
  - `Observation` resources capturing minimum, maximum, and mean transit temperature, max G-force vector, and
    final calculated PQI.
  - `Condition` / `DiagnosticReport` flags automatically triaging degraded samples (`PQI < 0.70`) to alert
    pathologists prior to running assays.
- mTLS REST client communicating directly with Epic Beaker and Cerner Millennium webhooks.

---

## Potential for Computational Scaling

```
┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│ Carrier Fleet Node 1 │         │ Carrier Fleet Node 2 │         │ Carrier Fleet Node N │
└──────────┬───────────┘         └──────────┬───────────┘         └──────────┬───────────┘
           │                                │                                │
           ▼                                ▼                                ▼
   [ Local Edge PQI ]               [ Local Edge PQI ]               [ Local Edge PQI ]
           │                                │                                │
           └────────────────────────┬───────┴────────────────────────────────┘
                                     │ Docking / Bluetooth Mesh
                                     ▼
                       ┌──────────────────────────────┐
                       │  Enterprise Sync Engine       │
                       │  • CRDT Offline/Online Sync   │
                       │  • Delta Encryption           │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │ Central Cloud Analytics Core │
                       └──────────────┬───────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
  ┌──────────────────┐     ┌───────────────────┐     ┌───────────────────┐
  │ Dynamic Transit   │     │ Spatio-Temporal    │     │ Live Real-Time     │
  │ Risk Surfacing     │    │ Route Telemetry     │    │ Clinician Portal    │
  │ (Neural Network)   │    │ (Graph Analysis)    │    │ (WebSockets/Map)     │
  └──────────────────┘     └───────────────────┘     └───────────────────┘
```

### 1. Hybrid Offline/Online Mesh & Conflict-Free Replication (CRDT)

**Problem:** Transit happens across cellular dead zones, hospital basements, elevators, and shielded surgical
blocks.

**Computational solution:** Implement state-based Conflict-Free Replicated Data Types (CRDTs) for container logs.
If multiple base stations or couriers observe a carrier intermittently, the local logs merge seamlessly out of
order without collision. When long-range Bluetooth Mesh (BLE Long Range / Coded PHY) is available between pods in
a courier van, they form ad-hoc peer networks, relaying critical degradation warnings through whichever node has
active cellular uplink.

### 2. Fleet Telemetry & Spatio-Temporal Route Degradation Analysis

- **Route failure mapping:** As thousands of carriers move between outpatient clinics, surgical wings, and
  centralized pathology hubs, individual sensor profiles are correlated against transit metadata (courier ID,
  transit route, transport mechanism, time of day).
- **Graph Neural Network (GNN) pipeline:**
  - *Nodes:* hospital suites, collection centers, elevator banks, central accessioning.
  - *Edges:* transport paths (courier vans, walking porters, pneumatic tube lines).
  - *Systemic issue detection:* the network isolates systemic failure points (e.g., "Pneumatic Tube Branch 4
    generates excessive kinetic impact spikes >12G" or "Courier Route 14 consistently leaves specimens on loading
    docks exceeding 28°C for >22 minutes").
  - *Preventive logistics:* the system reroutes critical oncology specimens away from historically hazardous
    routes before the specimen leaves the operating room.

### 3. Real-Time Global Telemetry & Web Tracking Portal

- **Live WebSocket / gRPC streaming:** for high-priority living tissue resections and organ preservation, carriers
  with cellular backhaul (LTE-M/NB-IoT) stream downsampled telemetry every 10 seconds.
- **Public/clinician dashboard:** interactive Mapbox GIS web layer rendering live thermal heat maps, battery
  states, and degradation probabilities.
- **Role-based access control (RBAC):** ensures HIPAA/GDPR compliance — couriers see physical routing and urgent
  mechanical warnings, while pathologists see molecular degradation surfaces and patient-linked accession IDs.

### 4. Physics-Informed Neural Networks (PINNs) for Molecular Viability

Instead of purely empirical machine learning, the PQI model can be scaled into a physics-informed model running in
the cloud. By encoding Arrhenius enzyme kinetics, fixative diffusion rates (Fick's laws), and RNA decay curves
directly into the loss function, the system predicts downstream assay feasibility:

- RNA-Seq / transcriptomics quality score (e.g., predicted RIN score degradation).
- Multiplex immunohistochemistry (mIHC) staining fidelity.
- Flow cytometry cell viability percentages for liquid biopsies.

---

## Conrad Challenge: Achievable MVP Implementation

A common mistake in innovation competitions is presenting a long list of advanced features without a working
prototype — judges identify theoretical plans quickly. The strategy here is to clearly separate **what is built and
demonstrated** from **what is presented as the commercial roadmap**.

### What to Build for the Innovation Video (Achievable MVP)

- **Chassis & optics:** 3D-print a two-piece container — a main carrier box and an inner removable clear vial.
  Mount an ambient light sensor or basic color sensor (e.g., TCS34725, ~$8) facing the vial's bottom.
- **Colorimetric reaction:** use a benign chemical reaction to mimic degradation (e.g., a food-grade pH dye like
  bromothymol blue reacting to mild carbonation, or a temperature-sensitive leuco dye swatch).
- **Controller:** an affordable microcontroller with integrated IMU and digital temperature sensor, such as the
  Arduino Nano 33 BLE Sense (9-axis IMU, temperature, humidity, and digital microphone/gas capabilities).

### Prototype Bill of Materials (BOM)

| Component | Function | Model / Source | Cost |
|---|---|---|---|
| **Microcontroller** | Core compute, onboard IMU & temp | Arduino Nano 33 BLE Sense | ~$35.00 |
| **Spectral Sensor** | Colorimetric swatch verification | Adafruit TCS34725 Color Sensor | ~$8.00 |
| **Enclosure** | 2-piece carrier and cartridge | Custom 3D-printed PETG chassis | ~$5.00 |
| **Degradation Indicator** | Model chemical reaction | Bromothymol blue + dilute acid/effervescence | <$2.00 |
| **Total Hardware Cost** | | | **~$50.00** |

### Pinout Mapping (TCS34725 → Arduino Nano 33 BLE Sense)

| TCS34725 Pin | Arduino Pin |
|---|---|
| `SDA` | `A4` (SDA) |
| `SCL` | `A5` (SCL) |
| `VIN` | `3.3V` |
| `GND` | `GND` |

**Status indication (onboard RGB LED):** Green = *Viable / Stable*, Amber = *Environmental Warning*,
Red = *Sample Integrity Breached*.

### The Video Demo (3–5 minutes)

1. **Scene 1 — The Problem:** show a standard sample vial with an illegible, peeling paper label and no record of
   transit conditions.
2. **Scene 2 — The Tech:** drop the cartridge into the ChronoCase. The status LED turns green.
3. **Scene 3 — The Stress Test:** subject the case to a heat source or an intentional drop. Show the sensor
   detecting the event, the TinyML threshold triggering, and the status LED shifting to red while the companion
   interface logs an unalterable incident event.

### What to Present in the Pitch Deck (Not Built for the MVP)

- Present the VOC sensor, redundant RTDs, and FHIR integration as the **Engineering Roadmap (Phase II / Clinical
  Scale)**.
- Highlight the DaaS + Consumable financial model to demonstrate an understanding of hospital budget structures,
  procurement friction, and recurring-revenue economics.

---

## Directory Layout

```
chronoverity-ecosystem/
├── firmware/
│   ├── core-mcu/               # Production STM32 / nRF5340 C/C++ firmware
│   │   ├── drivers/            # BME688, AS7341, LSM6DSOX, MAX31865 drivers
│   │   ├── tinyml/             # Quantized TFLite Micro PQI model and kernels
│   │   └── src/                # State machine, flash ring-buffer, encryption
│   └── mvp-arduino/            # Conrad Challenge Arduino Nano 33 BLE Sense build
│       ├── ChronoVerity_MVP.ino
│       └── sensor_processing.cpp
├── edge-ai/
│   ├── datasets/               # Simulated thermal, shock, and spectral drift datasets
│   ├── training/                # Python training pipelines (Keras / TensorFlow)
│   └── quantization/            # INT8 quantization & post-training pruning scripts
├── middleware/
│   ├── dock-daemon/             # Receiving dock sync service (Go/Rust)
│   ├── fhir-service/            # HL7 FHIR R4 translation and REST export
│   └── lis-connectors/          # Epic Beaker & Cerner Millennium mock webhooks
├── cloud-platform/
│   ├── route-analytics/         # Spatio-temporal route failure detection (GNN)
│   ├── api/                     # FastAPI core backend service
│   └── web-dashboard/           # Next.js / React interactive clinician GIS portal
├── hardware/
│   ├── cad/                     # STEP and STL files for carrier pod and cartridge
│   ├── schematics/               # Altium / KiCAD schematics and PCB layouts
│   └── bom/                      # Full commercial and prototype bills of materials
├── docs/                         # Technical specs, CAP/CLIA compliance roadmap
├── LICENSE
└── README.md
```

---

## Getting Started

These steps cover the **Conrad Challenge MVP build** (Arduino Nano 33 BLE Sense track). Production firmware
(`firmware/core-mcu/`) targets STM32H7/nRF5340 toolchains and is documented separately under `docs/`.

### Prerequisites

- [Arduino IDE](https://www.arduino.cc/en/software) or [PlatformIO](https://platformio.org/)
- Arduino Nano 33 BLE Sense board support package
- Adafruit TCS34725 library (`Adafruit_TCS34725`)
- Arduino_LSM9DS1 (onboard IMU) and Arduino built-in temperature/humidity libraries
- Python 3.10+ (for `edge-ai/training` and `middleware/fhir-service`)
- Node.js 18+ (for `cloud-platform/web-dashboard`)

### Build the MVP Firmware

```bash
cd firmware/mvp-arduino
# Open ChronoVerity_MVP.ino in the Arduino IDE, select
# Tools > Board > Arduino Nano 33 BLE, then Upload.
```

### Run the FHIR Middleware Locally

```bash
cd middleware/fhir-service
pip install -r requirements.txt
uvicorn main:app --reload
```

### Run the Web Dashboard

```bash
cd cloud-platform/web-dashboard
npm install
npm run dev
```

---

## Project Roadmap & Competition Timeline

This project is being developed for the **2026–2027 Conrad Challenge** cycle (Health and Nutrition category), which
launched August 27, 2026.

| Phase | Window | Cost |
|---|---|---|
| 1. Activation Stage | Aug 27 – Oct 29, 2026 | Free |
| 2. Innovation Stage | Oct 29, 2026 – Jan 7, 2027 | $499 / team |
| 3. Judging Window | Jan 8 – Feb 26, 2027 | — |
| 4. Innovation Summit (finalists only) | Apr 21–24, 2027, Houston | $499 / attendee |

### Phase 1 — Activation Stage (through Oct 29, 2026)

Lightweight by design: register the team and coach in the Conrad Portal, review the Student Guide / Rules &
Regulations / Terms & Conditions, and complete a 12-question Lean Canvas (problem, solution, unique value
proposition, revenue streams, cost structure — capped at ~40 words per answer).

| Week | Focus |
|---|---|
| Sep 12–16 | Confirm team roster (2–5 students) + coach; register in the Conrad Portal |
| Sep 17–23 | Attend Workshop #2, "Research like a Professional" (Thu Sep 17, 4–5pm CDT); research the 70% pre-analytical-error stat and competitor landscape (Cologuard, RNAlater, existing cold-chain loggers) |
| Sep 24–30 | Draft the Lean Canvas — problem, solution, UVP (Hub-and-Cartridge), revenue streams (DaaS + consumable), cost structure |
| Oct 1–7 | Attend Workshop #3, "Design Cycle" (Thu Oct 1, 4–5pm CDT); refine MVP scope |
| Oct 8–14 | Attend Workshop #4, "Turning an Innovation into a Business" (Wed Oct 14, 4–5pm CDT); lock in team/innovation names and category |
| Oct 15–21 | Buffer week — coach review, tighten 40-word answers |
| Oct 22–29 | Final submit in the Portal before Oct 29, 11:59pm CDT |

### Phase 2 — Innovation Stage (Oct 29, 2026 – Jan 7, 2027)

The build sprint. Three deliverables: a 10-question Innovation Brief, a 3–5 minute Innovation Video showing an
"Innovation Model" (sketches, 3D models, or a physical prototype), and a public website.

| Weeks | Focus |
|---|---|
| Oct 29 – Nov 11 | Pay the $499 fee (or apply for financial aid, window Nov 2 – Dec 3, 2026). Order parts: Arduino Nano 33 BLE Sense, TCS34725, 3D-print filament, bromothymol blue/leuco dye. Start the Innovation Brief draft. |
| Nov 12–30 | Attend Workshop #5, "Protect your Idea" (Thu Nov 12, 4–5pm CST) — relevant to provisional patent language around the PQI algorithm. Build the two-piece 3D-printed chassis + inner vial; wire the color sensor and Arduino; get the colorimetric reaction working reliably. |
| Dec 1–9 | Build the website; draft the pitch deck's DaaS economics and FHIR "Phase II" roadmap slides. Financial aid deadline: Dec 3, 11:59pm CST. |
| Dec 10–31 | Attend Workshop #6, "Communicating your Idea" (Thu Dec 10, 4–5pm CST). Film the 3 demo scenes. Finish the Innovation Brief. Treat the last week as a holiday buffer. |
| Jan 1–7 | Final polish and submission. **Hard deadline: Jan 7, 2027, 11:59pm CST** for the Brief, video, website, and $499 payment. |

> Note: workshop times shift from CDT to CST after daylight saving ends in November.

### Phase 3 — Judging Window (Jan 8 – Feb 26, 2027)

No submissions due. Online judging runs through Feb 1, lead judging through Feb 16, finalists announced Feb 26,
2027. Use this window to keep refining the Phase-II engineering roadmap slides (VOC sensor, RTDs, FHIR/LIS
integration) in case of advancement — judges will ask about scale-up.

### Phase 4 — Innovation Summit (Apr 21–24, 2027, Houston, finalists only)

In-person presentation of the full pitch deck and business model, live demo of the stress test, and judge Q&A on
unit economics and clinical adoption path.

---

## Contributing

This repository currently supports a student team's Conrad Challenge submission. Contributions, issue reports, and
design suggestions are welcome via pull request. Please open an issue first to discuss significant firmware,
hardware, or architecture changes before submitting a PR.

---

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.
