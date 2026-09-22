import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from '../vendor/three/addons/utils/SkeletonUtils.js';

const ASSET_ROOT = '../assets/generated/blender/glb/';

export const GLTF_ASSETS = Object.freeze({
  mascot: new URL(`${ASSET_ROOT}brainbite_mascot.glb`, import.meta.url).href,
  jungle: new URL(`${ASSET_ROOT}brainbite_jungle_props.glb`, import.meta.url).href,
  portal: new URL(`${ASSET_ROOT}brainbite_portal.glb`, import.meta.url).href,
  pillars: new URL(`${ASSET_ROOT}brainbite_answer_pillars.glb`, import.meta.url).href,
  kraken: new URL(`${ASSET_ROOT}brainbite_kraken.glb`, import.meta.url).href,
});

const loader = new GLTFLoader();

// Parsed GLB documents are cached per URL, so moving between the home hub and a battle
// re-uses one download and one parse instead of repeating both. Each mount receives a
// clone, so the cached document is never mutated and never added to a live scene.
const PARSE_CACHE = new Map();
let CLONE_COUNT = 0;

function parsedAsset(url) {
  let pending = PARSE_CACHE.get(url);
  if (!pending) {
    pending = loader.loadAsync(url).catch(error => {
      // A failed load must not poison the cache, otherwise a transient network error
      // would keep the scene broken for the rest of the session.
      PARSE_CACHE.delete(url);
      throw error;
    });
    PARSE_CACHE.set(url, pending);
  }
  return pending;
}

export async function loadGltfAsset(asset, {
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  shadows = true,
} = {}) {
  const url = GLTF_ASSETS[asset];
  if (!url) throw new Error(`Unknown BrainBite GLB asset: ${asset}`);

  const gltf = await parsedAsset(url);
  // SkeletonUtils.clone preserves SkinnedMesh bone bindings, which plain Object3D.clone
  // does not, so the rigged mascot keeps its idle/blink clip.
  const root = cloneSkinned(gltf.scene);
  CLONE_COUNT += 1;
  root.name = `BrainBiteGLB_${asset}`;
  root.position.fromArray(position);
  root.rotation.fromArray(rotation);
  if (Array.isArray(scale)) root.scale.fromArray(scale);
  else root.scale.setScalar(scale);
  root.userData.brainbiteAsset = asset;
  root.animations = gltf.animations;
  root.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = shadows && !child.material?.transparent;
    child.receiveShadow = shadows;
  });
  return root;
}

// The clone shares geometries, materials, and textures with the cached parsed document,
// so a mount may only detach its own clone. Disposing those shared resources here would
// break every later mount of the same asset.
export function disposeGltfAsset(root) {
  if (!root) return;
  root.removeFromParent();
}

// Full teardown for tests or a future single-page reload path.
export function releaseGltfCache() {
  for (const pending of PARSE_CACHE.values()) {
    pending.then(gltf => {
      gltf.scene.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
          if (!material) continue;
          for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
          material.dispose();
        }
        if (child.skeleton?.boneTexture) child.skeleton.boneTexture.dispose();
      });
    }).catch(() => {});
  }
  PARSE_CACHE.clear();
}

export function gltfCacheSize() {
  return PARSE_CACHE.size;
}

export function gltfCloneCount() {
  return CLONE_COUNT;
}

// Read-only diagnostics for the Lab and for automated evidence. No control surface.
if (typeof window !== 'undefined') {
  window.BrainBiteGltfCache = Object.freeze({ size: gltfCacheSize, clones: gltfCloneCount });
}
