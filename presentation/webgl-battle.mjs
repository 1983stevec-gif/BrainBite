import * as THREE from '../vendor/three/three.module.js';
import { makeMascot, makeTree, makeRock, makeLabelSprite, disposeObject } from './props.mjs';
import { shouldReduceMotion } from './capability.mjs';
import { loadGltfAsset, disposeGltfAsset } from './gltf-assets.mjs';
import { addJungleBanks, makeWaterMaterial, fitSceneCamera } from './jungle-environment.mjs';
import { createCharacterAnimation } from './character-animation.mjs';
import { createQualityController } from './graphics-quality.mjs';
import { createPerformanceBudget } from './performance-budget.mjs';
import { createProgrammableBit } from './programmable-bit.mjs';

// How long to wait for the browser to restore a lost WebGL context before falling back
// to the DOM presentation. Long enough for a driver reset, short enough to stay snappy.
const CONTEXT_RESTORE_WINDOW_MS = 1500;

function makeKraken() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x9b6cff, roughness: 0.42, metalness: 0.06 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.48 });
  const belly = new THREE.MeshStandardMaterial({ color: 0xd8b4fe, roughness: 0.55 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x111827 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 24), skin);
  head.scale.set(1.15, 1.0, 1.05);
  head.position.set(0, 2.55, 0);
  g.add(head);

  const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 16), belly);
  bellyMesh.position.set(0, 2.15, 0.55);
  bellyMesh.scale.set(1.1, 0.9, 0.7);
  g.add(bellyMesh);

  // Angry brows
  for (const x of [-0.42, 0.42]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.18), dark);
    brow.position.set(x, 2.95, 0.95);
    brow.rotation.z = x > 0 ? -0.45 : 0.45;
    brow.rotation.x = -0.35;
    g.add(brow);
  }
  for (const x of [-0.38, 0.38]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), eyeWhite);
    eye.position.set(x, 2.6, 1.05);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), pupil);
    p.position.set(x * 0.92, 2.55, 1.24);
    g.add(eye, p);
  }

  // Crown / mantle bumps
  for (let i = 0; i < 6; i++) {
    const bump = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), dark);
    const a = (i / 6) * Math.PI * 2;
    bump.position.set(Math.cos(a) * 0.85, 3.35, Math.sin(a) * 0.55 - 0.1);
    g.add(bump);
  }

  // Thick forward tentacles (readable vs reference)
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * 0.75 + (i / 7) * Math.PI * 1.5;
    let rad = 0.22;
    for (let s = 0; s < 6; s++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 10), i % 2 ? dark : skin);
      const reach = 0.7 + s * 0.42;
      const droop = s * s * 0.08;
      seg.position.set(Math.cos(a) * reach, 1.7 - droop - s * 0.18, Math.sin(a) * reach * 0.55 - 0.1 + s * 0.05);
      g.add(seg);
      rad *= 0.84;
    }
  }
  return g;
}

function makePillar(value) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x9aa39c, roughness: 0.88 });
  const moss = new THREE.MeshStandardMaterial({ color: 0x5f8f4a, roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ color: 0xc4a06a, roughness: 0.75 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.35, 16), stone);
  base.position.y = 0.18;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.72, 2.15, 14), stone);
  col.position.y = 1.25;
  col.name = 'hit';
  const mossPatch = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.74, 0.35, 14), moss);
  mossPatch.position.y = 0.7;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.22, 20), wood);
  top.position.y = 2.4;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.06, 10, 36),
    new THREE.MeshStandardMaterial({ color: 0x3dff8a, emissive: 0x19ff6a, emissiveIntensity: 0 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  ring.name = 'ring';

  const label = makeLabelSprite(value);
  label.position.set(0, 3.12, 0.45);
  label.name = 'label';

  group.add(base, col, mossPatch, top, ring, label);
  group.userData = { value, col, ring, label };
  return group;
}

export function createBattleScene(host, { onSelect, onContextLost, onContextRestored } = {}) {
  const performanceClock = globalThis.performance || { now: () => Date.now() };
  const performanceBudget = createPerformanceBudget({
    clock: performanceClock,
    rendererSource: () => renderer,
  });
  const longTaskObserver = performanceBudget.observeLongTasks();
  const sceneStartedAt = performanceClock.now();
  const width = Math.max(host.clientWidth || 720, 1);
  const height = Math.max(host.clientHeight || 460, 1);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'webgl-canvas webgl-battle';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x72b9be);
  scene.fog = new THREE.Fog(0x83b7aa, 16, 36);

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 120);
  fitSceneCamera(camera, width / height, { span: 10.8, height: 6.5, target: [0, 1.2, 1], distance: 15.5 });
  addJungleBanks(scene);

  scene.add(new THREE.HemisphereLight(0xeaf9ff, 0x355f2b, 1.0));
  const sun = new THREE.DirectionalLight(0xffe1ac, 1.65);
  sun.position.set(5, 14, 7);
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 35 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  // Water
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    makeWaterMaterial()
  );
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  // Pier
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x8a6238, roughness: 0.9 });
  const plankGeometry = new THREE.BoxGeometry(3.4, 0.28, 0.38);
  for (let i = 0; i < 13; i++) {
    const plank = new THREE.Mesh(plankGeometry, pierMat);
    plank.position.set(0, 0.28, 2.6 + i * 0.4);
    plank.receiveShadow = true;
    scene.add(plank);
  }
  for (const x of [-1.45, 1.45]) {
    for (const z of [3.2, 4.5, 5.8]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.1, 8), pierMat);
      post.position.set(x, 0.55, z);
      scene.add(post);
    }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0x6b4423 }));
    rail.rotation.x = Math.PI / 2;
    rail.position.set(x, 1.05, 4.7);
    scene.add(rail);
  }

  // Broken rocky ridges behind the shared stepped temple, not solid grey walls.
  const cliff = new THREE.MeshStandardMaterial({ color: 0x61765a, roughness: 0.95 });
  const ridgeGeometry = new THREE.DodecahedronGeometry(1, 1);
  for (const [x, y, scale] of [[-8, 2.2, 3], [8, 2.1, 2.8], [-5, 1.5, 2.1], [5, 1.4, 2.1]]) {
    const ridge = new THREE.Mesh(ridgeGeometry, cliff);
    ridge.position.set(x, y, -9);
    ridge.scale.set(scale, scale * 1.2, scale * 0.8);
    scene.add(ridge);
  }

  for (const x of [-2.6, 2.8]) {
    const fall = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 2.8),
      new THREE.MeshStandardMaterial({ color: 0xcff4ff, transparent: true, opacity: 0.7, roughness: 0.2 })
    );
    fall.position.set(x, 2.0, -5.9);
    scene.add(fall);
  }

  for (const [x, z, s] of [[-7, 1, 1.2], [7, 0.5, 1.1], [-6, -3, 1.0], [6.2, -2.5, 1.15], [-3.5, -4.5, 0.9], [3.2, -4.8, 1.0]]) {
    scene.add(makeTree(x, z, s));
  }
  scene.add(makeRock(-4.5, 2.5, 1.1), makeRock(4.8, 2.2, 0.9));

  const krakenFallback = makeKraken();
  let kraken = krakenFallback;
  kraken.position.set(0, 0.1, -3.0);
  scene.add(kraken);

  const mascotFallback = makeMascot({ facing: Math.PI, wave: false });
  let mascot = mascotFallback;
  mascot.position.set(0, 0.42, 4.8);
  mascot.scale.set(0.95, 0.95, 0.95);
  scene.add(mascot);
  const programmableBit = createProgrammableBit({
    definition: window.BrainBiteProfile?.getActiveBit?.() || null,
    baseY: 1.12,
  });
  programmableBit.group.position.set(2.35, 0, 4.25);
  scene.add(programmableBit.group);
  const onBitEvent = event => programmableBit.react(event.detail?.event || 'correct');
  window.addEventListener('bb:bit-event', onBitEvent);
  host.dataset.programmableBit = 'true';

  const pillars = [];
  const controls = document.createElement('div');
  controls.className = 'webgl-answer-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Choose an answer');
  host.appendChild(controls);
  let choicesKey = '';
  let currentChoices = [];
  let pillarAsset = null;
  let encounter = { boss: false, bossName: '' };
  kraken.visible = false;
  let disposed = false;
  let webglContextLost = false;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = shouldReduceMotion();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function clearPillars() {
    for (const p of pillars) {
      scene.remove(p);
      disposeObject(p);
    }
    pillars.length = 0;
  }

  function setChoices(choices = [], force = false) {
    const list = [...new Set(choices.map(String))].slice(0, 4);
    const key = JSON.stringify(list);
    if (!force && key === choicesKey) return;
    choicesKey = key;
    currentChoices = list;
    clearPillars();
    controls.replaceChildren();
    const span = 7.2;
    list.forEach((value, i) => {
      const p = makePillar(value);
      const x = list.length === 1 ? 0 : -span / 2 + (span * i) / (list.length - 1 || 1);
      p.position.set(x, 0, 0.6);
      scene.add(p);
      pillars.push(p);
      if (pillarAsset) p.traverse(child => { if (child.isMesh) child.visible = false; });
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = value;
      button.addEventListener('click', () => { if (!disposed) onSelect?.(value); });
      controls.appendChild(button);
    });
    // The exported kit has four slots; reposition and hide unused slots to match
    // the actual question instead of leaving decorative but clickable answers.
    pillarAsset?.traverse(child => {
      const index = 'ABCD'.indexOf(child.userData.answer_slot);
      if (index < 0) return;
      child.visible = index < list.length && !/answer_pillar_(label|plate|gem)/.test(child.userData.brainbite_kind || '');
      const x = list.length <= 1 ? 0 : -span / 2 + span * index / (list.length - 1);
      child.position.x = x / pillarAsset.scale.x;
    });
    if (reducedMotion && !disposed && !webglContextLost) renderer.render(scene, camera);
  }

  function setEncounter(next = {}) {
    encounter = { boss: Boolean(next.boss), bossName: String(next.bossName || '') };
    // Do not mislabel the legacy math/language bosses as Fraction Kraken.
    kraken.visible = encounter.boss && encounter.bossName === 'Fraction Kraken';
    host.dataset.encounter = kraken.visible ? 'fraction-kraken' : encounter.boss ? 'boss' : 'activity';
    if (reducedMotion && !disposed && !webglContextLost) renderer.render(scene, camera);
  }

  function highlight(value) {
    for (const p of pillars) {
      const on = String(p.userData.value) === String(value);
      const ring = p.getObjectByName('ring');
      if (ring) ring.material.emissiveIntensity = on ? 1.1 : 0;
      const col = p.getObjectByName('hit');
      if (col) {
        col.material.emissive = new THREE.Color(on ? 0x14532d : 0x000000);
        col.material.emissiveIntensity = on ? 0.28 : 0;
      }
    }
    pillarAsset?.traverse(child => {
      const index = 'ABCD'.indexOf(child.userData.answer_slot);
      if (index < 0 || !/pillar_(ring|shaft)/.test(child.userData.brainbite_kind || '')) return;
      const on = String(currentChoices[index]) === String(value);
      if (child.material?.emissive) {
        child.material.emissive.setHex(on ? 0x14532d : 0x000000);
        child.material.emissiveIntensity = on ? 0.75 : 0;
      }
    });
  }

  function onPointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pillarAsset ? [...pillars, pillarAsset] : pillars, true)
      .filter(hit => {
        for (let object = hit.object; object; object = object.parent) if (!object.visible) return false;
        return true;
      });
    if (!hits.length) return;
    const mesh = hits[0].object;
    const slotIndex = 'ABCD'.indexOf(mesh.userData.answer_slot);
    if (slotIndex >= 0 && currentChoices[slotIndex] !== undefined) {
      onSelect?.(currentChoices[slotIndex]);
      return;
    }
    let picked = mesh;
    while (picked && !pillars.includes(picked)) picked = picked.parent;
    if (picked) {
      onSelect?.(picked.userData.value);
    }
  }
  renderer.domElement.addEventListener('pointerdown', onPointer);

  let raf = 0;
  // A transient GPU reset should keep the child in 3D. Ask the browser to restore the
  // context and only fall back to the DOM presentation if restoration never arrives.
  let restoreTimer = 0;
  function contextLost(event) {
    event.preventDefault();
    if (disposed || webglContextLost) return;
    webglContextLost = true;
    cancelAnimationFrame(raf);
    restoreTimer = setTimeout(() => {
      if (!disposed && webglContextLost) onContextLost?.();
    }, CONTEXT_RESTORE_WINDOW_MS);
  }
  function contextRestored() {
    if (disposed || !webglContextLost) return;
    clearTimeout(restoreTimer);
    webglContextLost = false;
    applyQuality();
    frame();
    onContextRestored?.();
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  const clock = new THREE.Clock();
  let lastFrameAt = null;
  let frameCount = 0;
  let characterAnimation = null;
  let pendingCharacterReaction = null;
  let pendingAssetLoads = 0;
  let sceneReadyRecorded = false;
  let frameTimingActive = false;
  const applyQuality = createQualityController(renderer, scene, sun, host);
  applyQuality();
  const classObserver = new MutationObserver(() => {
    applyQuality();
    syncMotionState();
    if (reducedMotion && !disposed && !webglContextLost) renderer.render(scene, camera);
  });
  classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  function installAsset(asset, fallback, options, onInstall) {
    pendingAssetLoads += 1;
    const assetStartedAt = performanceClock.now();
    void loadGltfAsset(asset, options).then(root => {
      performanceBudget.recordAssetTiming({
        name: asset,
        duration: Math.max(0, performanceClock.now() - assetStartedAt),
      });
      if (disposed || webglContextLost) return disposeGltfAsset(root);
      fallback?.traverse?.(child => { child.visible = false; });
      scene.add(root);
      onInstall?.(root);
      host.dispatchEvent(new CustomEvent('bb:webgl-asset-loaded', { detail: { asset } }));
      if (reducedMotion) renderer.render(scene, camera);
    }).catch(error => {
      performanceBudget.recordAssetTiming({
        name: asset,
        duration: Math.max(0, performanceClock.now() - assetStartedAt),
      });
      console.warn(`[BrainBite] ${asset} GLB unavailable; keeping procedural fallback.`, error.message);
    }).finally(() => {
      pendingAssetLoads -= 1;
      if (!sceneReadyRecorded && pendingAssetLoads === 0) {
        sceneReadyRecorded = true;
        frameTimingActive = true;
        lastFrameAt = performanceClock.now();
        performanceBudget.sampleMemory();
        performanceBudget.sampleRenderer();
        performanceBudget.recordSceneLoad(Math.max(0, performanceClock.now() - sceneStartedAt));
      }
    });
  }

  installAsset('mascot', mascotFallback, {
    position: [0, 0.42, 4.8], rotation: [0, Math.PI, 0], scale: 0.52,
  }, root => {
    mascot = root;
    characterAnimation = createCharacterAnimation(root);
    host.dataset.characterAnimated = String(characterAnimation.animated);
    characterAnimation.update(0, reducedMotion);
    if (pendingCharacterReaction) {
      characterAnimation.react(pendingCharacterReaction);
      characterAnimation.update(reducedMotion ? 0 : clock.getElapsedTime(), reducedMotion);
      host.dataset.characterPoseY = String(mascot.position.y);
      pendingCharacterReaction = null;
    }
  });
  installAsset('kraken', krakenFallback, {
    position: [0, 0.1, -3], scale: 1.05,
  }, root => { kraken = root; setEncounter(encounter); });
  installAsset('pillars', null, {
    position: [0, 0, 0.6], scale: 4 / 3,
  }, root => {
    pillarAsset = root;
    root.traverse(child => {
      if (child.userData.brainbite_kind === 'answer_pillar_label') child.visible = false;
      if (/pillar_(ring|shaft)/.test(child.userData.brainbite_kind || '') && child.material) {
        child.material = child.material.clone();
      }
    });
    setChoices(currentChoices, true);
  });
  const onResize = () => {
    const w = Math.max(host.clientWidth || width, 1);
    const h = Math.max(host.clientHeight || height, 1);
    if (disposed || webglContextLost) return;
    fitSceneCamera(camera, w / h, { span: 10.8, height: 6.5, target: [0, 1.2, 1], distance: 15.5 });
    renderer.setSize(w, h);
    if (reducedMotion) renderer.render(scene, camera);
  };
  window.addEventListener('resize', onResize);
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(host);

  const onMotionChange = event => {
    if (disposed || webglContextLost) return;
    reducedMotion = event.matches || shouldReduceMotion();
    cancelAnimationFrame(raf);
    if (reducedMotion) clock.stop();
    else clock.start();
    frame();
  };
  motion.addEventListener('change', onMotionChange);

  function syncMotionState() {
    if (disposed || webglContextLost) return;
    const next = shouldReduceMotion();
    if (next === reducedMotion) return;
    reducedMotion = next;
    cancelAnimationFrame(raf);
    if (reducedMotion) clock.stop();
    else clock.start();
    frame();
  }

  function frame() {
    if (disposed || webglContextLost) return;
    const now = performanceClock.now();
    if (frameTimingActive && lastFrameAt !== null) performanceBudget.recordFrame(Math.max(0, now - lastFrameAt));
    lastFrameAt = now;
    frameCount += 1;
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    characterAnimation?.update(t, reducedMotion);
    programmableBit.update(t, reducedMotion);
    kraken.position.y = 0.1 + Math.sin(t * 1.3) * 0.12;
    kraken.rotation.y = Math.sin(t * 0.4) * 0.08;
    const bob = Math.sin(t * 2) * 0.03;
    if (characterAnimation) mascot.position.y += bob;
    else mascot.position.y = 0.42 + bob;
    water.position.y = Math.sin(t * 1.2) * 0.015;
    water.material.map.offset.y = t * 0.008;
    renderer.render(scene, camera);
    if (frameCount % 60 === 0) {
      performanceBudget.sampleMemory();
      performanceBudget.sampleRenderer();
    }
    if (!reducedMotion) raf = requestAnimationFrame(frame);
  }
  frame();

  return {
    kind: 'battle',
    getPerformanceReport() { return performanceBudget.report(); },
    setChoices,
    setEncounter,
    highlight,
    react(state) {
      if (characterAnimation) {
        const next = characterAnimation.react?.(state);
        if (next) {
          characterAnimation.update(reducedMotion ? 0 : clock.getElapsedTime(), reducedMotion);
          host.dataset.characterState = next;
          host.dataset.characterPoseY = String(mascot.position.y);
        }
      } else if (state) {
        pendingCharacterReaction = state;
        host.dataset.characterState = state;
      }
      if (reducedMotion && !disposed && !webglContextLost) renderer.render(scene, camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      longTaskObserver?.disconnect?.();
      characterAnimation?.dispose();
      programmableBit.dispose();
      window.removeEventListener('bb:bit-event', onBitEvent);
      clearPillars();
      window.removeEventListener('resize', onResize);
      motion.removeEventListener('change', onMotionChange);
      classObserver.disconnect();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointer);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      clearTimeout(restoreTimer);
      controls.remove();
      delete host.dataset.encounter;
      for (const key of ['characterAnimated', 'characterState', 'characterPoseY', 'graphicsTier', 'shadowSize', 'pixelRatio', 'programmableBit']) delete host.dataset[key];
      disposeObject(scene);
      sun.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
