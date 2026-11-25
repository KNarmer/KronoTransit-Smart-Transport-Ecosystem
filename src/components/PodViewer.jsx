// The real Kit B model (every board, wire and printed part from the bench-build app), pulled apart.
// Rendering notes: full device pixel ratio, anisotropic texture filtering, logarithmic depth (no z-fighting
// flicker on coplanar labels and pads), no fog, and shadow biasing so faces don't shimmer as the view turns.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { POD_GLB, DRACO } from './model.js';

const HILITE = new THREE.Color('#d4ff3a');

export default function PodViewer({ selected = null, onHover, onParts, onReady, autoRotate = true, controlsRef }) {
  const wrapRef = useRef(null);
  const api = useRef({});

  useEffect(() => {
    const wrap = wrapRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.75;

    const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 200);

    scene.add(new THREE.HemisphereLight(0xc8d6e4, 0x0a0c10, 0.35));
    const key = new THREE.DirectionalLight(0xfff1e2, 3.4);
    key.position.set(-5, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 });
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.025;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5aa8ff, 3.2);
    rim.position.set(6, 4, -7);
    scene.add(rim);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.45 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enablePan = false; controls.enableZoom = false;
    controls.minPolarAngle = 0.75; controls.maxPolarAngle = 1.38;
    controls.rotateSpeed = 0.55;
    controls.autoRotate = autoRotate && !reduce; controls.autoRotateSpeed = 0.4;
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    const byLabel = new Map();
    let model = null, disposed = false, home = null;

    const draco = new DRACOLoader().setDecoderPath(DRACO);
    new GLTFLoader().setDRACOLoader(draco).load(POD_GLB, (gltf) => {
      if (disposed) return;
      model = gltf.scene;
      model.traverse((o) => { if (o.parent === model) o.rotation.set(0, -0.5, 0); });
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.scale.setScalar(5.6 / Math.max(size.x, size.z));
      box.setFromObject(model);
      const c = box.getCenter(new THREE.Vector3());
      model.position.set(-c.x, -box.min.y, -c.z);
      scene.add(model);

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true; o.receiveShadow = true;
          const m = o.material = o.material.clone();
          for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) if (m[k]) m[k].anisotropy = maxAniso;
          // Decals and silkscreen sit a hair above their board: push them forward so they never flicker.
          if (m.transparent || m.alphaTest > 0) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
        }
        const raw = o.userData?.name || '';
        if (raw.startsWith('part:')) {
          const name = raw.slice(5);
          const label = /^[a-z0-9_]+$/.test(name) ? 'Wire' : name;
          const mats = [];
          o.traverse((m) => { if (m.isMesh) mats.push(m.material); });
          mats.forEach((m) => { m.userData.baseEmissive = m.emissive ? m.emissive.clone() : null; });
          o.userData.label = label; o.userData.mats = mats;
          if (!byLabel.has(label)) byLabel.set(label, []);
          byLabel.get(label).push(o);
        }
      });

      const bb = new THREE.Box3().setFromObject(model);
      const h = bb.max.y - bb.min.y;
      controls.target.set(0, h * 0.42, 0);
      camera.position.set(0.5, h * 0.62 + 2.2, 13.5);
      controls.update();
      home = { pos: camera.position.clone(), target: controls.target.clone() };
      onParts?.([...byLabel.keys()].filter((l) => l !== 'Wire'));
      onReady?.();
    });

    // Highlighting: hover (transient) and selection (sticky) share one tint routine.
    let hovered = null, sticky = null;
    const tint = (label, on, k = 0.28) => {
      (byLabel.get(label) || []).forEach((o) => o.userData.mats.forEach((m) => {
        if (!m.emissive) return;
        if (on) { m.emissive.copy(HILITE); m.emissiveIntensity = k; }
        else { m.emissive.copy(m.userData.baseEmissive); m.emissiveIntensity = 1; }
      }));
    };
    const refresh = () => {
      for (const l of byLabel.keys()) tint(l, false);
      if (sticky) tint(sticky, true, 0.35);
      if (hovered && hovered !== sticky) tint(hovered, true, 0.22);
    };
    api.current.select = (label) => { sticky = label; refresh(); };
    api.current.reset = () => {
      if (!home) return;
      camera.position.copy(home.pos); controls.target.copy(home.target); controls.update();
    };
    if (controlsRef) controlsRef.current = api.current;

    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let pending = false, inside = false;
    const labelOf = (o) => { while (o && !o.userData.label) o = o.parent; return o?.userData.label || null; };
    const onMove = (e) => {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      inside = true; pending = true;
    };
    const onLeave = () => { inside = false; if (hovered) { hovered = null; refresh(); onHover?.(null); } };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerleave', onLeave);

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.fov = w / h < 1 ? 38 : 26;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

    let visible = true, raf = 0;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); });
    io.observe(wrap);

    function tick() {
      raf = 0;
      if (disposed || !visible) return;
      controls.update();
      if (pending && model && inside) {
        pending = false;
        ray.setFromCamera(ptr, camera);
        const hit = ray.intersectObject(model, true)[0];
        const l = hit ? labelOf(hit.object) : null;
        if (l !== hovered) { hovered = l; refresh(); onHover?.(l); renderer.domElement.style.cursor = l ? 'grab' : ''; }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      controls.dispose(); draco.dispose(); pmrem.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); });
      });
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { api.current.select?.(selected); }, [selected]);

  return <div className="viewer" ref={wrapRef} />;
}
