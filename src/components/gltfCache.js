// One GLTF/Draco loader for the whole site, and a cache of parsed models. The pod is downloaded and
// Draco-decoded once, however many viewers show it (the overview has two) and however often the
// visitor moves between pages. Each viewer gets its own clone of the scene graph; geometry and
// textures are shared and never disposed, so returning to a page is instant.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { DRACO } from './model.js';

const draco = new DRACOLoader().setDecoderPath(DRACO);
draco.setWorkerLimit(Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) - 1)));
draco.preload();
const loader = new GLTFLoader().setDRACOLoader(draco);
const cache = new Map();

export function loadGLTF(url) {
  if (!cache.has(url)) {
    const p = loader.loadAsync(url);
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return cache.get(url);
}

// Fresh, independent scene graph sharing the cached geometry and textures.
export async function cloneScene(url) {
  const gltf = await loadGLTF(url);
  return gltf.scene.clone(true);
}

// Free only what a viewer owns: its cloned materials. Shared geometry and textures stay cached.
export function disposeOwned(root) {
  root?.traverse((o) => {
    if (o.isMesh && o.material) [].concat(o.material).forEach((m) => m.userData.owned && m.dispose());
  });
}
