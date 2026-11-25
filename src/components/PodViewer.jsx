// Hero viewer: the real Kit B model (every board, wire and printed part from the bench-build app),
// pulled apart, under hard low-key studio light. Drag to orbit; hover a part to see what it is.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { POD_GLB, DRACO } from './model.js';

const HILITE = new THREE.Color('#d4ff3a');

export default function PodViewer({ onReady }) {
  const wrapRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const label = labelRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07090c, 9, 22);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

    // Low-key lighting: one hard key from above-left, a cold rim from behind, a faint lime kicker.
    scene.add(new THREE.HemisphereLight(0x9fb4c8, 0x050608, 0.25));
    const key = new THREE.DirectionalLight(0xfff4e6, 3.8);
    key.position.set(-4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.bias = -0.0004; key.shadow.radius = 3;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4aa3ff, 6);
    rim.position.set(5, 3, -6);
    scene.add(rim);
    const kick = new THREE.PointLight(0xd4ff3a, 6, 6, 2);
    kick.position.set(-2.4, 0.6, 2.2);
    scene.add(kick);

    // Floor: catches the shadow, plus a faint engineering grid that fades into fog.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(40, 80, 0x1d2a36, 0x111820);
    grid.material.transparent = true; grid.material.opacity = 0.55;
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.42;
    controls.rotateSpeed = 0.6;
    controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.35;
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    const parts = []; // { node, mats: Material[] }
    let model = null;
    let disposed = false;

    const draco = new DRACOLoader().setDecoderPath(DRACO);
    new GLTFLoader().setDRACOLoader(draco).load(POD_GLB, (gltf) => {
      if (disposed) return;
      model = gltf.scene;
      // The export is tilted for Canvas UI's low camera; stand it upright here.
      model.traverse((o) => { if (o.parent === model) o.rotation.set(0, -0.62, 0); });
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const s = 4.2 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(s);
      box.setFromObject(model);
      const c = box.getCenter(new THREE.Vector3());
      model.position.set(-c.x, -box.min.y, -c.z);
      scene.add(model);

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true; o.receiveShadow = true;
          o.material = o.material.clone(); // so highlights stay per-part
        }
        // GLTFLoader sanitises node names; the original is kept in userData.name.
        const raw = o.userData?.name || '';
        if (raw.startsWith('part:')) {
          const mats = [];
          o.traverse((m) => { if (m.isMesh) mats.push(m.material); });
          const name = raw.slice(5);
          // Unlabelled children carry internal ids (e.g. "amb_rn", "w_ldo_gnd"): those are wires and jumpers.
          o.userData.label = /^[a-z0-9_]+$/.test(name) ? 'Wire' : name;
          o.userData.mats = mats;
          mats.forEach((m) => { m.userData.baseEmissive = m.emissive ? m.emissive.clone() : null; });
          parts.push(o);
        }
      });

      const h = box.max.y - box.min.y;
      controls.target.set(0, h * 0.5, 0);
      camera.position.set(8.4, h * 0.85 + 1.7, 10.2);
      controls.update();
      onReady?.();
    });

    // Hover: raycast once per frame at most, highlight the part, move the label without React state.
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let pending = false, hovered = null, px = 0, py = 0, inside = false;
    const partOf = (o) => { while (o && !o.userData.label) o = o.parent; return o; };
    const setHover = (p) => {
      if (p === hovered) return;
      if (hovered) hovered.userData.mats.forEach((m) => { if (m.emissive) { m.emissive.copy(m.userData.baseEmissive); m.emissiveIntensity = 1; } });
      hovered = p;
      if (p) {
        p.userData.mats.forEach((m) => { if (m.emissive) { m.emissive.copy(HILITE); m.emissiveIntensity = 0.22; } });
        label.textContent = p.userData.label;
        label.dataset.on = '1';
        renderer.domElement.style.cursor = 'grab';
      } else {
        label.dataset.on = '';
        renderer.domElement.style.cursor = '';
      }
    };
    const onMove = (e) => {
      const r = renderer.domElement.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top; inside = true;
      ptr.set((px / r.width) * 2 - 1, -(py / r.height) * 2 + 1);
      pending = true;
    };
    const onLeave = () => { inside = false; setHover(null); };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerleave', onLeave);

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      // Narrow screens: widen the view so the whole model fits.
      camera.fov = w / h < 0.9 ? 40 : 28;
      // Wide screens: shift the frame so the model sits right of centre and clear of the headline.
      if (w / h >= 0.9) camera.setViewOffset(w, h, -w * 0.14, -h * 0.02, w, h);
      else camera.clearViewOffset();
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
        setHover(hit ? partOf(hit.object) : null);
      }
      if (hovered) label.style.transform = `translate(${px + 16}px, ${py + 16}px)`;
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
  }, [onReady]);

  return (
    <div className="viewer" ref={wrapRef}>
      <div className="viewer-label" ref={labelRef} aria-hidden="true" />
    </div>
  );
}
