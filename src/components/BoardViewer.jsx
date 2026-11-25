// A single real board in 3D: drag to turn it any way, scroll to zoom. Swaps models without
// re-creating the WebGL context, so a gallery can use one viewer.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DRACO } from './model.js';

const base = import.meta.env.BASE_URL;
export const boardSrc = (id) => `${base}boards/${id}.glb`;

export default function BoardViewer({ id, spin = 1.2, zoom = true, className = '', onReady }) {
  const wrapRef = useRef(null);
  const api = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    wrap.appendChild(renderer.domElement);
    const aniso = renderer.capabilities.getMaxAnisotropy();
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-2, 4, 3); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6aa8ff, 1.6); rim.position.set(3, 2, -3); scene.add(rim);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
    controls.enableZoom = zoom; controls.zoomSpeed = 0.6;
    controls.autoRotate = !reduce; controls.autoRotateSpeed = spin;
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    const draco = new DRACOLoader().setDecoderPath(DRACO);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    let current = null, token = 0, disposed = false;

    const show = (bid) => {
      const my = ++token;
      loader.load(boardSrc(bid), (g) => {
        if (disposed || my !== token) return;
        if (current) { scene.remove(current); current.traverse((o) => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); }); }
        current = g.scene;
        current.traverse((o) => { if (o.isMesh) for (const k of ['map', 'normalMap']) if (o.material[k]) o.material[k].anisotropy = aniso; });
        const box = new THREE.Box3().setFromObject(current);
        const c = box.getCenter(new THREE.Vector3()); const r = box.getSize(new THREE.Vector3()).length() / 2;
        current.position.sub(c);
        scene.add(current);
        const dist = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.05;
        camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
        camera.position.set(dist * 0.45, dist * 0.65, dist * 0.62);
        controls.target.set(0, 0, 0); controls.minDistance = dist * 0.35; controls.maxDistance = dist * 1.8;
        controls.autoRotate = !reduce;
        controls.update();
        onReady?.();
      });
    };
    api.current = { show };
    show(id);

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(wrap); resize();
    let raf = 0, visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); });
    io.observe(wrap);
    function tick() { raf = 0; if (disposed || !visible) return; controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick); }
    raf = requestAnimationFrame(tick);
    return () => {
      disposed = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); controls.dispose(); draco.dispose(); pmrem.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach((m) => { for (const k in m) if (m[k]?.isTexture) m[k].dispose(); m.dispose(); }); });
      renderer.dispose(); renderer.forceContextLoss(); wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { api.current?.show(id); }, [id]);

  return <div className={`board-gl ${className}`} ref={wrapRef} />;
}
