import * as THREE from '../vendor/three/three.module.js';
import { makeMascot, makeTreeGrove, makeRock, makeWorldSign, disposeObject } from './props.mjs';
import { shouldReduceMotion } from './capability.mjs';
import { loadGltfAsset, disposeGltfAsset } from './gltf-assets.mjs';
import { addJungleBanks, makeWaterMaterial, fitSceneCamera, makeBiteHouse } from './jungle-environment.mjs';
import { createCharacterAnimation } from './character-animation.mjs';
import { createQualityController } from './graphics-quality.mjs';
import { makeTerrainMaterial, makePortalEnergyMaterial } from './surface-textures.mjs';
import { createPerformanceBudget } from './performance-budget.mjs';

// How long to wait for the browser to restore a lost WebGL context before falling back
// to the DOM presentation. Long enough for a driver reset, short enough to stay snappy.
const CONTEXT_RESTORE_WINDOW_MS = 1500;
import { createProgrammableBit } from './programmable-bit.mjs';
import { createWorldProfileDecor, getWorldProfile } from './world-profiles.mjs';
import { createBubbleReefKit } from './bubble-reef-kit.mjs';
import { createBubbleReefRouteKit as createBubbleReefRouteSceneKit } from './bubble-reef-route-kit.mjs';
import { createBubbleReefBaseContribution } from './bubble-reef-base-contribution.mjs';

export function createHomeScene(host, { onContextLost, onContextRestored, onPlay, worldProfile: worldProfileId = 'jungle-circuit' } = {}) {
  const worldProfile = getWorldProfile(worldProfileId);
  const performanceClock = globalThis.performance || { now: () => Date.now() };
  const performanceBudget = createPerformanceBudget({
    clock: performanceClock,
    rendererSource: () => renderer,
  });
  const longTaskObserver = performanceBudget.observeLongTasks();
  const sceneStartedAt = performanceClock.now();
  const width = Math.max(host.clientWidth || 640, 1);
  const height = Math.max(host.clientHeight || 480, 1);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'webgl-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(worldProfile.palette.sky);
  scene.fog = new THREE.Fog(worldProfile.palette.fog, 15, 34);

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
  fitSceneCamera(camera, width / height, { span: 10.8, height: 4.6, target: [0, 1.25, 0], distance: 11.5 });
  addJungleBanks(scene);

  scene.add(new THREE.HemisphereLight(0xd7f4ed, 0x344831, 1.05));
  const sun = new THREE.DirectionalLight(worldProfile.lighting.key, 2.05);
  sun.position.set(-5, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 8, bottom: -8, near: 0.5, far: 28 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(worldProfile.lighting.fill, 0.35);
  fill.position.set(-6, 4, -3);
  scene.add(fill);

  // Terrain bowl
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    makeTerrainMaterial()
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(3.7, 48),
    makeWaterMaterial()
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0.4, 0.03, -3.2);
  scene.add(water);
  const bubbleReefKit = worldProfile.id === 'bubble-reef' ? createBubbleReefKit() : null;
  const bubbleReefRouteKit = worldProfile.id === 'bubble-reef' ? createBubbleReefRouteSceneKit() : null;
  const bubbleReefContribution = worldProfile.id === 'bubble-reef' ? createBubbleReefBaseContribution() : null;
  const profileDecor = bubbleReefKit?.group || createWorldProfileDecor(THREE, worldProfile.id);
  scene.add(profileDecor);
  if (bubbleReefRouteKit) {
    bubbleReefRouteKit.group.position.z = 1.5;
    bubbleReefRouteKit.group.scale.setScalar(0.72);
    scene.add(bubbleReefRouteKit.group);
  }
  if (bubbleReefContribution) {
    bubbleReefContribution.group.position.set(-2.75, 0.55, -1.55);
    bubbleReefContribution.group.scale.setScalar(0.62);
    scene.add(bubbleReefContribution.group);
  }

  // Stone stage
  const stage = new THREE.Mesh(
    new THREE.CylinderGeometry(1.65, 1.85, 0.42, 36),
    new THREE.MeshStandardMaterial({ color: 0xb8a879, roughness: 0.88 })
  );
  stage.position.y = 0.22;
  stage.castShadow = true;
  stage.receiveShadow = true;
  const stageRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.72, 0.08, 10, 48),
    new THREE.MeshStandardMaterial({ color: 0x7d8578, roughness: 0.85 })
  );
  stageRim.rotation.x = Math.PI / 2;
  stageRim.position.y = 0.42;
  scene.add(stage, stageRim);

  // Shared stepping stones connect the foreground water to the two destinations.
  const pathGeometry = new THREE.CylinderGeometry(0.46, 0.5, 0.16, 7);
  const pathMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xc7b995, roughness: 0.96 }),
    new THREE.MeshStandardMaterial({ color: 0xa99e82, roughness: 0.96 }),
  ];
  const path = [
    [-0.25, 4.5], [0.08, 3.7], [-0.16, 2.9], [0.06, 2.1],
    [-1.9, 0.85], [-2.6, 0.92], [-3.28, 0.95],
    [1.9, 0.75], [2.6, 0.65], [3.35, 0.65],
  ];
  pathMaterials.forEach((material, materialIndex) => {
    const entries = path.filter((_, index) => index % pathMaterials.length === materialIndex);
    const batch = new THREE.InstancedMesh(pathGeometry, material, entries.length);
    batch.receiveShadow = true;
    entries.forEach(([x, z], entryIndex) => {
      const sourceIndex = materialIndex + entryIndex * pathMaterials.length;
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x, 0.14, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sourceIndex * 0.63, 0)),
        new THREE.Vector3(1, 1, 0.78 + (sourceIndex % 3) * 0.08),
      );
      batch.setMatrixAt(entryIndex, matrix);
    });
    batch.instanceMatrix.needsUpdate = true;
    scene.add(batch);
  });

  // Low garden silhouettes frame the landmarks without covering signs or mascot.
  const leafGeometry = new THREE.SphereGeometry(1, 8, 6);
  const flowerGeometry = new THREE.IcosahedronGeometry(0.1, 0);
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x28694a, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x78a94a, roughness: 0.95 }),
  ];
  const flowerMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xffca67, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0xef9983, roughness: 0.85 }),
  ];
  const leafEntries = leafMaterials.map(() => []);
  const flowerEntries = flowerMaterials.map(() => []);
  for (const [x, z] of [[-5.2, 0.7], [-4.8, 2.9], [5.35, 0.8], [5.1, 3.1], [-2.4, -2.6], [2.5, -2.4]]) {
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      const leafPosition = new THREE.Vector3(x + Math.cos(angle) * 0.28, 0.22, z + Math.sin(angle) * 0.28);
      leafEntries[i % leafMaterials.length].push({
        position: leafPosition,
        rotation: new THREE.Euler(Math.sin(angle) * 0.45, 0, -Math.cos(angle) * 0.45),
        scale: new THREE.Vector3(0.16, 0.38 + (i % 2) * 0.1, 0.17),
      });
      flowerEntries[i % flowerMaterials.length].push({
        position: new THREE.Vector3(leafPosition.x, 0.55 + (i % 2) * 0.1, leafPosition.z),
        rotation: new THREE.Euler(),
        scale: new THREE.Vector3(1, 1, 1),
      });
    }
  }
  leafEntries.forEach((entries, materialIndex) => {
    const batch = new THREE.InstancedMesh(leafGeometry, leafMaterials[materialIndex], entries.length);
    batch.receiveShadow = true;
    entries.forEach((entry, index) => {
      batch.setMatrixAt(index, new THREE.Matrix4().compose(
        entry.position,
        new THREE.Quaternion().setFromEuler(entry.rotation),
        entry.scale,
      ));
    });
    batch.instanceMatrix.needsUpdate = true;
    scene.add(batch);
  });
  flowerEntries.forEach((entries, materialIndex) => {
    const batch = new THREE.InstancedMesh(flowerGeometry, flowerMaterials[materialIndex], entries.length);
    entries.forEach((entry, index) => {
      batch.setMatrixAt(index, new THREE.Matrix4().compose(
        entry.position,
        new THREE.Quaternion().setFromEuler(entry.rotation),
        entry.scale,
      ));
    });
    batch.instanceMatrix.needsUpdate = true;
    scene.add(batch);
  });

  // Bite House
  const housePosition = [-2.75, 0, -1.55];
  const portalPosition = [2.55, 0, -1.35];
  const portalScale = 0.82;
  const hut = makeBiteHouse();
  hut.scale.setScalar(0.8);
  hut.position.set(...housePosition);
  scene.add(hut);
  const houseSign = makeWorldSign('BITE HOUSE');
  houseSign.scale.set(1.85, 0.46, 1);
  houseSign.position.set(housePosition[0], 2.8, -0.5);
  scene.add(houseSign);

  // Play Portal (stone arch + swirl)
  const portal = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x8e968c, roughness: 0.9 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.6, 0.7), stone);
  left.position.set(-1.05, 1.3, 0);
  const right = left.clone();
  right.position.x = 1.05;
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.55, 0.75), stone);
  top.position.set(0, 2.55, 0);
  const swirl = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.14, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0x4fd0ff, emissive: 0x1a7cff, emissiveIntensity: 0.7 })
  );
  swirl.position.set(0, 1.35, 0.1);
  swirl.name = 'swirl';
  const swirlFill = new THREE.Mesh(
    new THREE.CircleGeometry(0.88, 32),
    new THREE.MeshBasicMaterial({ color: 0x7af3ff, transparent: true, opacity: 0.55 })
  );
  swirlFill.position.set(0, 1.35, 0.05);
  swirlFill.name = 'swirlFill';
  swirlFill.material.depthWrite = false;
  portal.add(left, right, top, swirl, swirlFill);
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd590, emissive: 0xe99a38, emissiveIntensity: 0.3, roughness: 0.5,
  });
  const accentGeometry = new THREE.OctahedronGeometry(0.12, 0);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const accent = new THREE.Mesh(accentGeometry, accentMaterial);
    accent.position.set(Math.cos(angle) * 0.95, 1.35 + Math.sin(angle) * 0.95, 0.26);
    accent.rotation.z = angle;
    portal.add(accent);
  }
  portal.position.set(...portalPosition);
  portal.scale.setScalar(portalScale);
  scene.add(portal);
  const portalSign = makeWorldSign('PLAY PORTAL');
  portalSign.scale.set(1.85, 0.46, 1);
  portalSign.position.set(portalPosition[0], 2.7, -0.25);
  scene.add(portalSign);

  const portalButton = document.createElement('button');
  portalButton.type = 'button';
  portalButton.className = 'webgl-home-portal';
  portalButton.textContent = 'PLAY';
  portalButton.setAttribute('aria-label', 'Play: enter the 3D play portal');
  portalButton.title = 'Enter the play portal';
  Object.assign(portalButton.style, {
    position: 'absolute',
    left: '76%',
    top: '46%',
    transform: 'translate(-50%, -50%)',
    zIndex: '4',
    minWidth: '92px',
    minHeight: '48px',
    padding: '0.65rem 1rem',
    border: '2px solid rgba(255,255,255,0.9)',
    borderRadius: '999px',
    background: 'rgba(17,63,54,0.9)',
    color: '#f2fff6',
    font: '700 1rem/1 system-ui, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
  });
  portalButton.addEventListener('click', () => onPlay?.());
  host.appendChild(portalButton);

  // Ruins / cliff backdrop
  const cliffMat = new THREE.MeshStandardMaterial({ color: 0x7a8574, roughness: 0.95 });
  for (const [x, z, w, h, d] of [
    [-7.5, -4.5, 3.2, 3.8, 2.2],
    [7.2, -4.2, 3.0, 3.4, 2.0],
    [0.5, -6.5, 8.5, 2.6, 2.4],
  ]) {
    const cliff = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), cliffMat);
    cliff.scale.set(w * 0.6, h * 0.65, d);
    cliff.position.set(x, h / 2 - 0.1, z);
    scene.add(cliff);
  }

  // Waterfalls (simple planes)
  const fallMat = new THREE.MeshStandardMaterial({
    color: 0xbfefff,
    transparent: true,
    opacity: 0.72,
    roughness: 0.2,
    metalness: 0.1,
  });
  for (const x of [-2.2, 2.4]) {
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.4), fallMat);
    fall.position.set(x, 1.5, -5.2);
    scene.add(fall);
  }

  // Jungle density
  const jungleFallback = new THREE.Group();
  const trees = [
    [-6.2, 2.5, 1.3], [-5.4, -1.8, 1.1], [-4.8, 3.8, 0.95],
    [5.8, 2.2, 1.25], [6.4, -1.5, 1.05], [4.9, 3.6, 0.9],
    [-2.8, -3.8, 1.15], [2.6, -3.9, 1.2], [0, -4.5, 1.4],
  ];
  jungleFallback.add(makeTreeGrove(trees));
  jungleFallback.add(makeRock(-1.8, 3.2, 0.9), makeRock(2.1, 3.5, 0.7), makeRock(-4.2, 1.6, 1.1));
  scene.add(jungleFallback);

  const mascotFallback = makeMascot({ facing: 0.15, wave: true });
  let mascot = mascotFallback;
  mascot.position.set(0, 0.42, 0.15);
  scene.add(mascot);
  const programmableBit = createProgrammableBit({
    definition: window.BrainBiteProfile?.getActiveBit?.() || null,
    baseY: 1.18,
  });
  programmableBit.group.position.set(1.35, 0, 0.5);
  scene.add(programmableBit.group);
  const onBitEvent = event => programmableBit.react(event.detail?.event || 'correct');
  window.addEventListener('bb:bit-event', onBitEvent);
  host.dataset.programmableBit = 'true';

  // Limit shadow casters to the focal objects; foliage remains inexpensive fill.
  for (const object of [hut, mascot, portal]) {
    object.traverse(child => {
      if (child.isMesh && !child.material.transparent) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  let raf = 0;
  let restoreTimer = 0;
  let disposed = false;
  let contextLost = false;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = shouldReduceMotion();
  const clock = new THREE.Clock();
  let lastFrameAt = null;
  let frameCount = 0;
  let characterAnimation = null;
  let portalEnergyMaterial = null;
  let pendingAssetLoads = 0;
  let sceneReadyRecorded = false;
  let frameTimingActive = false;
  const applyQuality = createQualityController(renderer, scene, sun, host);
  applyQuality();
  const classObserver = new MutationObserver(() => {
    applyQuality();
    syncMotionState();
    if (reducedMotion && !disposed && !contextLost) renderer.render(scene, camera);
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
      if (disposed || contextLost) {
        disposeGltfAsset(root);
        return;
      }
      if (fallback) fallback.visible = false;
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
    position: [0, 0.42, 0.15], rotation: [0, 0.15, 0], scale: 0.78,
  }, root => {
    mascot = root;
    characterAnimation = createCharacterAnimation(root);
    host.dataset.characterAnimated = String(characterAnimation.animated);
    characterAnimation.update(0, reducedMotion);
  });
  installAsset('portal', portal, {
    position: portalPosition, scale: portalScale,
  }, root => {
    // Retain the high-contrast world label, not the asset-kit duplicate plaque.
    root.traverse(child => { if (/sign|label|plaque/i.test(child.name)) child.visible = false; });
    root.traverse(child => {
      if (!child.isMesh) return;
      if (/EnergyRing/.test(child.name)) child.visible = false;
      if (/EnergyField/.test(child.name)) {
        // Keep the authored geometry; project the vortex in world space across its face.
        portalEnergyMaterial = makePortalEnergyMaterial([portalPosition[0], 1.35 * portalScale], 0.88 * portalScale);
        child.userData.originalEnergyMaterial = child.material;
        child.material = portalEnergyMaterial;
        child.castShadow = false;
      }
      if (/Stone/.test(child.material?.name || '')) {
        child.material.color.setHex(/Light/.test(child.material.name) ? 0x9d9c6f : 0x657956);
      }
    });
  });
  installAsset('jungle', null, {
    position: [0, 0, -4.3], scale: 1.15,
  }, root => {
    root.traverse(child => { if (/sign|label|plaque/i.test(child.name)) child.visible = false; });
  });

  const onResize = () => {
    if (disposed || contextLost) return;
    const w = Math.max(host.clientWidth || width, 1);
    const h = Math.max(host.clientHeight || height, 1);
    fitSceneCamera(camera, w / h, { span: 10.8, height: 4.6, target: [0, 1.25, 0], distance: 11.5 });
    renderer.setSize(w, h);
    const anchor = new THREE.Vector3(portalPosition[0], 0.5, portalPosition[2] + 0.6).project(camera);
    portalButton.style.left = `${(anchor.x + 1) * w / 2}px`;
    portalButton.style.top = `${(1 - anchor.y) * h / 2}px`;
    if (reducedMotion) renderer.render(scene, camera);
  };
  window.addEventListener('resize', onResize);
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(host);
  onResize();

  const handleContextLost = event => {
    event.preventDefault();
    if (disposed || contextLost) return;
    contextLost = true;
    cancelAnimationFrame(raf);
    clock.stop();
    // Keep 3D when the browser can restore the context; fall back only if it cannot.
    restoreTimer = setTimeout(() => {
      if (!disposed && contextLost) onContextLost?.();
    }, CONTEXT_RESTORE_WINDOW_MS);
  };
  const handleContextRestored = () => {
    if (disposed || !contextLost) return;
    clearTimeout(restoreTimer);
    contextLost = false;
    clock.start();
    frame();
    onContextRestored?.();
  };
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

  const onMotionChange = event => {
    if (disposed || contextLost) return;
    reducedMotion = event.matches || shouldReduceMotion();
    cancelAnimationFrame(raf);
    if (reducedMotion) clock.stop();
    else clock.start();
    frame();
  };
  motionQuery.addEventListener('change', onMotionChange);

  function syncMotionState() {
    if (disposed || contextLost) return;
    const next = shouldReduceMotion();
    if (next === reducedMotion) return;
    reducedMotion = next;
    cancelAnimationFrame(raf);
    if (reducedMotion) clock.stop();
    else clock.start();
    frame();
  }

  function frame() {
    if (disposed || contextLost) return;
    const now = performanceClock.now();
    if (frameTimingActive && lastFrameAt !== null) performanceBudget.recordFrame(Math.max(0, now - lastFrameAt));
    lastFrameAt = now;
    frameCount += 1;
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    if (portalEnergyMaterial) portalEnergyMaterial.uniforms.time.value = t;
    characterAnimation?.update(t, reducedMotion);
    programmableBit.update(t, reducedMotion);
    bubbleReefKit?.update(t, reducedMotion);
    bubbleReefRouteKit?.update(t, reducedMotion);
    bubbleReefContribution?.update(t, reducedMotion);
    const bob = Math.sin(t * 2.1) * 0.04;
    if (characterAnimation) mascot.position.y += bob;
    else mascot.position.y = 0.42 + bob;
    const arm = mascot.userData.waveArm;
    if (arm) arm.rotation.z = -1.05 + Math.sin(t * 3.2) * 0.35;
    const swirl = portal.getObjectByName('swirl');
    const fill = portal.getObjectByName('swirlFill');
    if (swirl) swirl.rotation.z = t * 0.8;
    if (fill) fill.material.opacity = 0.42 + Math.sin(t * 3.5) * 0.14;
    water.position.y = 0.03 + Math.sin(t * 1.4) * 0.01;
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
    kind: 'home',
    getPerformanceReport() { return performanceBudget.report(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      longTaskObserver?.disconnect?.();
      clock.stop();
      characterAnimation?.dispose();
      programmableBit.dispose();
      bubbleReefKit?.dispose();
      bubbleReefRouteKit?.dispose();
      bubbleReefContribution?.dispose();
      window.removeEventListener('bb:bit-event', onBitEvent);
      scene.traverse(child => { child.userData.originalEnergyMaterial?.dispose(); });
      window.removeEventListener('resize', onResize);
      motionQuery.removeEventListener('change', onMotionChange);
      classObserver.disconnect();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      clearTimeout(restoreTimer);
      disposeObject(scene);
      sun.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      portalButton.remove();
      for (const key of ['characterAnimated', 'graphicsTier', 'shadowSize', 'pixelRatio', 'programmableBit']) delete host.dataset[key];
    },
  };
}
