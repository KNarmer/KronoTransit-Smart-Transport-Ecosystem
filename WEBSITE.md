# KronoTransit website

React 19 + Vite + Framer Motion + three.js, hash-routed for GitHub Pages. Five pages:

| Route | Page | Main pieces |
|---|---|---|
| `#/` | Overview | `PcbHero` (board renders joined by routed traces), `Journey` (five-stage scroll story), `Witnesses` (live five-sensor simulator) |
| `#/pod` | Pod Architecture | `PodViewer` (assemble/explode, click-to-frame, ghosting, HUD), `CrossSection` (to-scale section drawing) |
| `#/lab-reports` | Lab Reports | `Report` (triage banner, scrubbable multi-axis timeline, SHA-256 audit chain), FHIR example |
| `#/engineering` | Engineering & BOM | Component register, `BusExplorer` (EDA-style schematic), power rails, `CostExplorer` (1× / 50× / 1,000×) |
| `#/grants` | Grants & Team | Outreach "ports", funding steps, founder profiles |

```bash
npm install
npm run dev
npm run build   # static output in dist/, deployed by .github/workflows/deploy.yml
```

## Data and provenance

All technical numbers live in `src/data/`:

- `components.js` — component register; every value is tagged `ds` (datasheet), `est` (design estimate), `quote` (supplier list price), `lit` (published study) or `bench` (measured; none yet).
- `bom.js` — prototype line items at list prices (total $502.71) and the modelled 50× and 1,000× tiers with written assumptions.
- `scenarios.js` — the illustrative Lab Report scenarios. Generated, not measured.

When bench measurements exist, add them with the `bench` tag and replace the matching estimates.

## Founders

Fill in `FOUNDERS` in `src/pages/Grants.jsx` (role, bio, photo path under `public/`). Set `CONTACT_EMAIL` there to show an email link instead of GitHub issues.

## Assets

- `public/models/kronotransit-pod.glb` — the prototype exported assembled from the bench-build model, with per-part explode offsets in node extras and two wiring-harness states. Draco-compressed; decoder in `public/draco/`.
- `public/hw/*.webp` — board renders made from the same model.
