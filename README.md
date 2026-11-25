# KronoTransit website

React 19 + Vite + Framer Motion, with [Canvas UI](https://canvasui.dev) effects rendering the real Kit B pod model.

```bash
npm install
npm run dev      # local dev server
npm run build    # static output in dist/
```

`dist/` is plain static files with relative paths, so it can go on GitHub Pages, Vercel or Netlify.

## Where things live

- `src/components/`: page sections
- `src/components/canvasui/`: [Canvas UI](https://canvasui.dev) components, installed from its shadcn registry
  - `ParticleObject` (hero), `WireframeObject` (inside the pod), `DecryptReveal` (trip log)
  - `DecryptReveal` needs Chrome 157+ (html-in-canvas); other browsers show the plain log
- `public/models/kronotransit-pod.glb`: the Kit B pod from the bench-build app (99 parts, every wire), exploded, Draco-compressed (~950 KB). Hero = ParticleObject, "Inside the pod" = WireframeObject.
  - Made by `tools/export-from-bench-build.cjs`: serve the unzipped bench-build app (with its three import map pointed at a local three@0.160) on :8765, run the script with Playwright, then `gltf-transform optimize <in> <out> --compress draco --texture-compress webp --texture-size 256`.
- `public/draco/`: self-hosted Draco decoder for the model.
- `src/motion.js`: easing tokens

## Motion rules (after Emil Kowalski's skills)

- Ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for entrances; no ease-in on UI.
- One hero entrance. No scroll reveals, marquees, count-ups or hover lifts. What moves: the Canvas UI models (cursor-driven), the score ring, and the sensor-tab crossfade.
- Press feedback `scale(0.97)` at 160ms; hover effects gated by `(hover: hover) and (pointer: fine)`.
- Exits are faster than entrances. Numbers animate through motion values, not React state.
- `prefers-reduced-motion` is respected through `MotionConfig reducedMotion="user"`.
