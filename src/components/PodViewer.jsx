// Pod Architecture viewer. The model is exported assembled; each part carries its explode offset (mm).
// - explode: 0 = assembled, 1 = pulled apart (animated), with the harness swapped to match
// - select(component): camera eases to frame it, everything else ghosts to ~18% so it's visible
// - reset(): clears selection and returns to the home view
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { POD_GLB } from './model.js';
import { cloneScene, disposeOwned } from './gltfCache.js';

// Start downloading and decoding the pod as soon as this chunk arrives.
cloneScene(POD_GLB).catch(() => {});

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function PodViewer({ onReady, onPick, onHover, apiRef, startExploded = false, autoRotate = false, zoom = false, spin = 0.5, near = 1 }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // No logarithmic depth buffer: with near/far at 0.3/300 the standard buffer resolves every layer,
    // and log depth disables early-z, roughly doubling the cost of each frame.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    // The two glass materials are fully frosted (roughness 1), so they sample the blurriest mip of the
    // transmission pass. Rendering that pass at a third of the size is pixel-identical and far cheaper.
    renderer.transmissionResolutionScale = 0.33;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // The light is fixed and orbiting only moves the camera, so the 4K shadow map is redrawn only
    // when parts actually move (explode) or change opacity (ghosting), not every frame.
    renderer.shadowMap.autoUpdate = false;
    wrap.appendChild(renderer.domElement);
    const aniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.8;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.3, 300);
    scene.add(new THREE.HemisphereLight(0xdfe8f5, 0x10141c, 0.45));
    const key = new THREE.DirectionalLight(0xfff2e4, 3.0);
    key.position.set(-6, 10, 7); key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 50 });
    key.shadow.bias = -0.0002; key.shadow.normalBias = 0.03;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6aa8ff, 2.4); rim.position.set(7, 5, -8); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.3 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.enableZoom = zoom; controls.zoomSpeed = 0.6;
    controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.45;
    controls.autoRotate = autoRotate && !reduce; controls.autoRotateSpeed = spin;
    controls.addEventListener('start', () => { controls.autoRotate = false; });
    // Draw only when something changed: the camera moved, parts moved, or the hover state changed.
    let dirty = true;
    const redraw = (shadows = false) => { dirty = true; if (shadows) renderer.shadowMap.needsUpdate = true; };
    controls.addEventListener('change', () => redraw());

    const parts = []; // { node, label, base: Vector3, off: Vector3, meshes: Mesh[] }
    let wiresA = null, wiresE = null, model = null, unit = 1, home = null, disposed = false;
    let explode = 0, explodeTo = 0, selected = null, hovered = null;
    let cam = null; // camera tween

    const allMeshes = [];
    const setGhost = (mesh, ghost) => {
      const m = mesh.material;
      if (ghost) {
        if (!m.userData.ghost) { m.userData.ghost = { t: m.transparent, o: m.opacity, d: m.depthWrite }; }
        m.transparent = true; m.opacity = mesh.userData.wire ? 0.05 : 0.15; m.depthWrite = false;
      } else if (m.userData.ghost) {
        const g = m.userData.ghost; m.transparent = g.t; m.opacity = g.o; m.depthWrite = g.d; delete m.userData.ghost;
      }
      m.needsUpdate = true;
    };
    const tint = (mesh, on) => {
      const m = mesh.material; if (!m.emissive) return;
      if (!m.userData.e0) m.userData.e0 = m.emissive.clone();
      if (on) { m.emissive.set(on); m.emissiveIntensity = 0.5; } else { m.emissive.copy(m.userData.e0); m.emissiveIntensity = 1; }
    };
    const paint = () => {
      const sel = new Set(selected ? selected.meshes : []);
      const hov = new Set(hovered ? hovered.meshes : []);
      for (const m of allMeshes) {
        setGhost(m, !!selected && !sel.has(m));
        tint(m, sel.has(m) ? '#3d7dff' : hov.has(m) ? '#5aa8ff' : null);
      }
      if (wiresA) wiresA.traverse((o) => o.isMesh && setGhost(o, !!selected));
      if (wiresE) wiresE.traverse((o) => o.isMesh && setGhost(o, !!selected));
      redraw();
    };

    const frame = (meshes, dur = 1.1) => {
      const box = new THREE.Box3();
      meshes.forEach((m) => box.expandByObject(m));
      const c = box.getCenter(new THREE.Vector3());
      const r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.25);
      const dir = camera.position.clone().sub(controls.target).normalize();
      const dist = Math.max(r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 3, 4.4);
      // Shift the view so the part sits left of centre, clear of the info panel on the right.
      const fwd = dir.clone().negate();
      const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
      const shift = right.multiplyScalar(wrap.clientWidth > 900 ? dist * 0.22 : 0);
      const t1 = c.clone().add(shift);
      cam = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: c.clone().addScaledVector(dir, dist).add(shift), t1 };
    };

    cloneScene(POD_GLB).then((root) => {
      if (disposed) return;
      model = root;
      model.rotation.y = -0.45;
      model.updateMatrixWorld(true);
      // Scale on the exploded footprint so both states fit.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      // Leave room for the exploded layout: the shell steps 260 mm to the left.
      unit = 6.2 / Math.max(size.x + 260, size.z);
      model.scale.setScalar(unit);
      box.setFromObject(model);
      const c = box.getCenter(new THREE.Vector3());
      model.position.set(-c.x + 120 * unit, -box.min.y, -c.z);
      scene.add(model);

      model.traverse((o) => {
        const raw = o.userData?.name || '';
        if (raw === 'wires:assembled') wiresA = o;
        if (raw === 'wires:exploded') wiresE = o;
      });
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true; o.receiveShadow = true;
          o.material = o.material.clone(); o.material.userData.owned = true;
          for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) if (o.material[k]) o.material[k].anisotropy = aniso;
          if (o.material.transparent || o.material.alphaTest > 0) { o.material.polygonOffset = true; o.material.polygonOffsetFactor = -2; o.material.polygonOffsetUnits = -2; }
        }
        const raw = o.userData?.name || '';
        if (raw.startsWith('part:')) {
          const label = raw.slice(5);
          // Unlabelled ids are copies of wiring that the harness snapshots replace.
          if (/^[a-z0-9_]+$/.test(label)) { o.visible = false; return; }
          const meshes = []; o.traverse((m) => m.isMesh && meshes.push(m));
          const off = o.userData.off || [0, 0, 0];
          parts.push({ node: o, label, base: o.position.clone(), off: new THREE.Vector3(...off), meshes });
          meshes.forEach((m) => { m.userData.part = parts[parts.length - 1]; allMeshes.push(m); });
        }
      });
      if (wiresE) wiresE.visible = false;
      [wiresA, wiresE].forEach((w) => w && w.traverse((o) => { if (o.isMesh) o.userData.wire = true; }));

      const hgt = box.max.y - box.min.y;
      // The hero opens the pod, so frame the taller exploded stack from further back.
      if (startExploded) { controls.target.set(0, hgt * 0.95, 0); camera.position.set(6.2 * near, hgt * 0.95 + 4.2 * near, 14.5 * near); }
      else { controls.target.set(0, hgt * 0.3, 0); camera.position.set(4.5 * near, 4.2 * near, 10.5 * near); }
      controls.update();
      home = { p: camera.position.clone(), t: controls.target.clone() };
      redraw(true);
      onReady?.(parts.map((p) => p.label));
      // Hero: open the pod up in front of the visitor.
      if (startExploded) setTimeout(() => { explodeTo = 1; }, 500);
    });

    const api = {
      setExplode: (v) => { explodeTo = v; },
      select: (match, labelForHud) => {
        if (!match) { selected = null; paint(); return; }
        const re = match instanceof RegExp ? match : new RegExp(`^${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
        const hit = parts.filter((p) => re.test(p.label));
        if (!hit.length) return;
        const meshes = hit.flatMap((p) => p.meshes);
        selected = { meshes, label: labelForHud };
        paint();
        frame(meshes);
      },
      reset: () => {
        selected = null; paint();
        if (home) cam = { t: 0, dur: 1, p0: camera.position.clone(), t0: controls.target.clone(), p1: home.p.clone(), t1: home.t.clone() };
      },
    };
    if (apiRef) apiRef.current = api;

    // Pointer: hover highlights a part, click selects it.
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let pending = false, down = null;
    const pick = (e) => {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const hits = ray.intersectObjects(allMeshes, false).filter((h) => h.object.visible && !(h.object.material.userData.ghost));
      return hits[0]?.object.userData.part || null;
    };
    const onMove = (e) => { ptr.ex = e; pending = true; };
    const onDown = (e) => { down = [e.clientX, e.clientY]; };
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const p = pick(e);
      onPick?.(p ? p.label : null);
    };
    const onLeave = () => { if (hovered) { hovered = null; paint(); onHover?.(null); } };
    const el = renderer.domElement;
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onLeave);

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); el.style.width = '100%'; el.style.height = '100%';
      camera.aspect = w / h; camera.fov = w / h < 1 ? 42 : 30; camera.updateProjectionMatrix();
      redraw();
    };
    const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

    let raf = 0, visible = true, last = performance.now();
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) dirty = true; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } });
    io.observe(wrap);

    function tick(now) {
      raf = 0; if (disposed || !visible) return;
      const dt = Math.min(0.12, (now - last) / 1000); last = now;
      // Explode easing (critically damped: no overshoot).
      if (explode !== explodeTo) {
        const step = reduce ? 1 : dt / 0.9;
        explode = explodeTo > explode ? Math.min(explodeTo, explode + step) : Math.max(explodeTo, explode - step);
        const k = ease(explode);
        for (const p of parts) p.node.position.copy(p.base).addScaledVector(p.off, k);
        if (wiresA) wiresA.visible = k < 0.5;
        if (wiresE) wiresE.visible = k >= 0.5;
        if (explode === explodeTo && selected) frame(selected.meshes, 0.8);
        redraw(true);
      }
      if (cam) {
        cam.t = Math.min(1, cam.t + (reduce ? 1 : dt / cam.dur));
        const k = ease(cam.t);
        camera.position.lerpVectors(cam.p0, cam.p1, k);
        controls.target.lerpVectors(cam.t0, cam.t1, k);
        if (cam.t >= 1) cam = null;
        redraw();
      }
      controls.update();
      if (pending && model && ptr.ex) {
        pending = false;
        const p = pick(ptr.ex);
        if (p !== hovered) { hovered = p; paint(); onHover?.(p ? p.label : null); el.style.cursor = p ? 'pointer' : ''; }
      }
      if (dirty) { dirty = false; renderer.render(scene, camera); }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp); el.removeEventListener('pointerleave', onLeave);
      controls.dispose(); pmrem.dispose(); scene.environment?.dispose();
      disposeOwned(model);
      floor.geometry.dispose(); floor.material.dispose();
      renderer.dispose(); renderer.forceContextLoss();
      wrap.removeChild(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="viewer" ref={wrapRef} />;
}
