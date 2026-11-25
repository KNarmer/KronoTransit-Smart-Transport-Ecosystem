// Opens the user's bench-build app (served locally), switches to the finished, exploded pod,
// screenshots it, and exports the pod + dock as a GLB for the website.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await p.evaluate(() => { go(0); });
  await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => ({ mode: POD.mode, parts: Object.keys(B.parts).length })), errs.slice(0, 3));
  await p.evaluate(() => {
    POD.lidOff = false; POD.setCut(false); POD.setExplode(1);
    // Website layout: drop the shell below the electronics, hide the foam so the insides read.
    for (const id of Object.keys(B.parts)) if (/^e_foam|^e_packs|^e_silica/.test(id)) B.parts[id].obj.visible = false;
    if (B.parts.e_lid) B.parts.e_lid.obj.visible = true;
    const sh = B.parts.e_shell.obj; sh.position.y -= 150;
    if (B.parts.e_inserts) B.parts.e_inserts.obj.position.y -= 150;
    window.__stats = (() => { let v = 0, tex = new Set(); [POD.podRoot, POD.dockRoot].forEach(r => r.traverse(o => { if (o.visible && o.geometry) v += o.geometry.attributes.position.count; if (o.material?.map) tex.add(o.material.map.uuid); })); return { verts: v, textures: tex.size }; })();
  });
  console.log('stats', await p.evaluate(() => window.__stats));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/app-pod.png' });
  if (process.argv[3] === 'export') {
    const b64 = await p.evaluate(async () => {
      const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
            // This page is throwaway: strip app bookkeeping (userData) and clipping so the export is the plain, solid model.
      const roots = [POD.podRoot, POD.dockRoot];
      // Near-black printed plastic disappears as particles on a dark page: lift untextured dark materials to steel blue.
      const seen = new Set();
      roots.forEach((r) => r.traverse((o) => {
        if (!o.material) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          if (seen.has(m) || !m.color) return; seen.add(m);
          const hsl = {}; m.color.getHSL(hsl);
          if (hsl.l < 0.18) m.color.setHSL(0.6, 0.5, 0.22 + hsl.l * 0.5);
        });
      }));
      roots.forEach((r) => r.traverse((o) => {
        o.userData = {};
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.clippingPlanes = null; m.userData = {}; });
        if (o.geometry) o.geometry.userData = {};
      }));
      // Tilt toward Canvas UI's slightly-low camera so the stack reads in three-quarter view.
      const THREE = await import('three');
      const wrap = new THREE.Group(); wrap.rotation.set(0.42, -0.62, 0);
      roots.forEach((r) => wrap.add(r));
      const buf = await new Promise((res, rej) => new GLTFExporter().parse(wrap, res, rej, { binary: true, onlyVisible: true, maxTextureSize: 256 }));
      const bytes = new Uint8Array(buf); let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(s);
    });
    fs.writeFileSync(out + '/pod-full.glb', Buffer.from(b64, 'base64'));
    console.log('glb', fs.statSync(out + '/pod-full.glb').size);
  }
  await b.close();
})();
