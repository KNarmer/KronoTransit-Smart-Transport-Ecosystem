# hardware/schematics

Altium / KiCAD schematics and PCB layouts for the production ChronoCase carrier board
(Nordic nRF5340 or STM32H7, BME688, AS7341, LSM6DSOX, dual MAX31865).

Not applicable to the Conrad Challenge MVP, which uses an off-the-shelf Arduino Nano 33 BLE
Sense + breakout sensor rather than a custom PCB (see `firmware/mvp-arduino/README.md`). This
directory is the home for the custom board files once Phase II hardware development begins.

Suggested contents once layout begins:

- `chronocase_mainboard.kicad_pro` (or `.PrjPcb` for Altium)
- `chronocase_mainboard_schematic.pdf` — exported schematic for review without the CAD tool installed
- `bom_reference_designators.csv` — cross-reference to `hardware/bom/full_bom.csv`
