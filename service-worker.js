const CACHE = 'brainbite-v2.0-shell-v42-hud-pass';
const FALLBACK = './index.html';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './fonts.css',
  './sw-register.js',
  './app.js',
  './assets/fonts/fredoka-variable.woff2',
  './assets/fonts/nunito-variable.woff2',
  './content/storage-copies.js',
  './content/explainers.js',
  './content/experience-registry.js',
  './content/content-review-manifest.js',
  './content/content-control-gate.js',
  './content/code-bridge.mjs',
  './content/code-bridge-curriculum.mjs',
  './content/code-lab.mjs',
  './content/programmable-bits.mjs',
  './content/programmable-bit-curriculum.mjs',
  './content/typing-progression.mjs',
  './brainbite-core.mjs',
  './manifest.webmanifest',
  './privacy.html',
  './terms.html',
  './support.html',
  './assets/art/nib.svg',
  './assets/art/zip.svg',
  './assets/art/bloop.svg',
  './assets/art/scout.svg',
  './assets/art/bite-village.svg',
  './presentation/boot.mjs',
  './presentation/presentation-adapter.mjs',
  './presentation/capability.mjs',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './audio/AUDIO_MANIFEST.json',
  './audio/AUDIO_MANIFEST_v1.8.json',
  './audio/AUDIO_FILES_v6.json',
];
const OFFLINE_CONTENT = [
  './content/concept-morph-v1.8.json',
  './content/content-manifest.json',
  './content/curriculum-map-v1.4.json',
  './content/french-core-v1.json',
  './content/german-core-v1.json',
  './content/italian-core-v1.json',
  './content/japanese-core-v1.json',
  './content/language-depth-v1.8.json',
  './content/language-question-bank-v1.7.json',
  './content/language-question-bank-v1.9.json',
  './content/math-35-v1.json',
  './content/math-6-v1.json',
  './content/math-core-v1.json',
  './content/math-curated-v3.json',
  './content/math-expanded-v2.json',
  './content/math-k2-v1.json',
  './content/math-question-bank-v1.7.json',
  './content/math-question-bank-v1.9.json',
  './content/skill-links.v1.json',
  './content/spanish-core-v1.json',
  './content/spanish-curated-v3.json',
  './content/spanish-expanded-v2.json',
  './content/words-35-v1.json',
  './content/words-6-v1.json',
  './content/words-core-v1.json',
  './content/words-curated-v3.json',
  './content/words-expanded-v2.json',
  './content/words-k2-v1.json',
  './content/words-question-bank-v1.7.json',
  './content/words-question-bank-v1.9.json',
];
const OPTIONAL_3D = [
  "./presentation/webgl-home.mjs",
  "./presentation/webgl-battle.mjs",
  './presentation/gltf-assets.mjs',
  './presentation/jungle-environment.mjs',
  './presentation/character-animation.mjs',
  './presentation/graphics-quality.mjs',
  './presentation/performance-budget.mjs',
  './presentation/surface-textures.mjs',
  './presentation/props.mjs',
  './presentation/programmable-bit.mjs',
  './presentation/world-profiles.mjs',
  './presentation/bubble-reef-kit.mjs',
  './presentation/bubble-reef-route-kit.mjs',
  './presentation/bubble-reef-base-contribution.mjs',
  './presentation/match-plates.mjs',
  './content/bubble-reef/rewards.mjs',
  './vendor/three/three.module.js',
  './vendor/three/addons/loaders/GLTFLoader.js',
  './vendor/three/addons/utils/BufferGeometryUtils.js',
  './vendor/three/addons/utils/SkeletonUtils.js',
  './assets/generated/blender/glb/brainbite_mascot.glb',
  './assets/generated/blender/glb/brainbite_jungle_props.glb',
  './assets/generated/blender/glb/brainbite_portal.glb',
  './assets/generated/blender/glb/brainbite_answer_pillars.glb',
  './assets/generated/blender/glb/brainbite_kraken.glb',
];

self.addEventListener('install', event => {
  event.waitUntil(Promise.all([
    caches.open(CACHE).then(async cache => {
      await cache.addAll([...CORE, ...OFFLINE_CONTENT]);
      await Promise.allSettled(OPTIONAL_3D.map(url => cache.add(url)));
    }),
    self.skipWaiting(),
  ]));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => response.ok ? response : Promise.reject()).catch(() => caches.match(FALLBACK)));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && response.type === 'basic') caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});

