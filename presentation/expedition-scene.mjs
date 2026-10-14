/** Opt-in Playful Expedition prototype. All scenery is live Three.js geometry. */
import * as THREE from '../vendor/three/three.module.js';
import { makeMascot, disposeObject } from './props.mjs';
import { loadGltfAsset, disposeGltfAsset } from './gltf-assets.mjs';
import { createCharacterAnimation } from './character-animation.mjs';
import { shouldReduceMotion } from './capability.mjs';
import { createQualityController } from './graphics-quality.mjs';
import { createPerformanceBudget } from './performance-budget.mjs';

const SKY_TOP = 0x1f8fe6;
const SKY_HORIZON = 0xbfeefa;
const WATER_Y = -0.9;
const COLORS = {
  grass: 0x4fbf4f, grassLight: 0x86dc5f, grassDark: 0x2f9a45, rock: 0xd6b483, rockDark: 0xa98159,
  stoneTop: 0x8fd66a, leaf: 0x2c9f52, leafLight: 0x4cc261, leafDeep: 0x1f7f45, trunk: 0x9a6a43,
  coral: 0xff6f61, water: 0x18aec4,
};

function material(color, extras = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extras });
}

function shade(mesh, cast = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  return mesh;
}

function ellipsoid(parent, position, scale, color, segments = 24, extras) {
  const mesh = shade(new THREE.Mesh(new THREE.SphereGeometry(1, segments, Math.max(8, Math.round(segments * 0.66))), material(color, extras)));
  mesh.position.fromArray(position);
  mesh.scale.fromArray(scale);
  parent.add(mesh);
  return mesh;
}

// Small procedural textures keep the prototype download-free.
function canvasTexture(width, height, draw, repeat = null) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  return texture;
}

function radialTexture(stops) {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    stops.forEach(([at, color]) => g.addColorStop(at, color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeSky(scene) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(85, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(SKY_TOP) }, horizon: { value: new THREE.Color(SKY_HORIZON) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vDir; void main(){ float k = smoothstep(0.0, 0.2, vDir.y); gl_FragColor = vec4(mix(horizon, top, k), 1.0);\n#include <colorspace_fragment>\n}',
  }));
  sky.renderOrder = -10;
  scene.add(sky);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture([[0, '#fffef2'], [0.16, '#fff6c4'], [0.42, 'rgba(255,240,190,0.35)'], [1, 'rgba(255,240,190,0)']]),
    depthWrite: false, fog: false, transparent: true,
  }));
  glow.position.set(-22, 24, -58);
  glow.scale.setScalar(24);
  scene.add(glow);
}

function makeWater(scene) {
  const ripples = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i += 1) {
      const x = (i * 97) % w, y = (i * 53) % h, r = 10 + (i * 7) % 26;
      ctx.lineWidth = 2 + (i % 3);
      ctx.strokeStyle = `rgba(${150 + (i % 4) * 20},225,240,0.9)`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r * 0.5, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }, [16, 16]);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(170, 170), material(COLORS.water, { roughness: 0.14, metalness: 0.1, emissive: 0x0b6f8a, emissiveIntensity: 0.18, map: ripples }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_Y;
  water.receiveShadow = true;
  scene.add(water);
  return ripples;
}

// Light shallows and a foam ring sit where each island meets the lagoon.
function shoreline(parent, x, z, radius, stretch = 1, level = WATER_Y) {
  const shallow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({
    map: radialTexture([[0, 'rgba(150,250,235,1)'], [0.6, 'rgba(110,236,226,0.8)'], [1, 'rgba(110,236,226,0)']]),
    transparent: true, depthWrite: false,
  }));
  shallow.rotation.x = -Math.PI / 2;
  shallow.position.set(x, level + 0.012, z);
  shallow.scale.set(radius * 1.6, radius * 1.6 * stretch, 1);
  const foam = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(x, level + 0.02, z);
  foam.scale.set(radius * 1.02, radius * 1.02 * stretch, 1);
  foam.userData.base = foam.scale.clone();
  parent.add(shallow, foam);
  return foam;
}

// Faceted sandstone cliffs under a smooth grass cap give a toy-like diorama read.
function island(parent, x, y, z, radius, depth = 1, stretch = 1, { rock = COLORS.rock, top = COLORS.grass, boulders = true } = {}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const height = depth * 2 + 0.4;
  const cliff = shade(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.97, radius * 0.74, height, 11, 2), material(rock, { flatShading: true, roughness: 0.92 })));
  cliff.position.y = 0.1 - height / 2;
  cliff.scale.z = stretch;
  const lip = shade(new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 0.98, 0.22, 40), material(COLORS.grassDark)));
  lip.position.y = 0.13;
  lip.scale.z = stretch;
  const cap = shade(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.99, radius * 1.02, 0.16, 40), material(top, { roughness: 0.9 })));
  cap.position.y = 0.3;
  cap.scale.z = stretch;
  group.add(cliff, lip, cap);
  if (boulders) {
    const count = Math.max(3, Math.round(radius * 2.2));
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + radius;
      const r = 0.22 + ((i * 37) % 10) / 40;
      const boulder = shade(new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), material(i % 2 ? COLORS.rockDark : rock, { flatShading: true })));
      boulder.position.set(Math.cos(a) * radius * 0.9, -0.45 - (i % 3) * 0.22, Math.sin(a) * radius * 0.9 * stretch);
      boulder.rotation.set(i, i * 2, 0);
      group.add(boulder);
    }
  }
  group.userData.top = cap;
  parent.add(group);
  return group;
}

function tree(parent, x, y, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  const trunk = shade(new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 1.15, 4, 8), material(COLORS.trunk)));
  trunk.position.y = 0.65;
  group.add(trunk);
  ellipsoid(group, [-0.3, 1.6, 0.05], [0.66, 0.66, 0.62], COLORS.leafDeep, 18);
  ellipsoid(group, [0.36, 1.68, 0.1], [0.6, 0.6, 0.58], COLORS.leaf, 18);
  ellipsoid(group, [0, 2.05, 0], [0.62, 0.66, 0.6], COLORS.leafLight, 18);
  parent.add(group);
  return group;
}

// Curved palm trunk with drooping fronds; the frame loop sways the crown.
function palm(parent, x, y, z, scale = 1, lean = 0.35, turn = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.rotation.y = turn;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.25, 1.1, 0), new THREE.Vector3(lean * 0.8, 2.1, 0), new THREE.Vector3(lean * 1.5, 2.85, 0)]);
  group.add(shade(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.11, 7), material(COLORS.trunk, { flatShading: true }))));
  for (let i = 1; i < 7; i += 1) {
    const ring = shade(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 5, 10), material(0x7d5434)), false);
    ring.position.copy(curve.getPoint(i / 7));
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }
  const crown = new THREE.Group();
  crown.position.copy(curve.getPoint(1));
  for (let i = 0; i < 8; i += 1) {
    const frond = new THREE.Group();
    frond.rotation.y = (i / 8) * Math.PI * 2;
    const leaf = ellipsoid(frond, [0.72, -0.12, 0], [0.8, 0.045, 0.21], i % 2 ? COLORS.leaf : COLORS.leafLight, 14);
    leaf.rotation.z = -0.38 - (i % 3) * 0.09;
    crown.add(frond);
  }
  ellipsoid(crown, [0.05, -0.12, 0.06], [0.11, 0.11, 0.11], 0x6b4a2b, 10);
  ellipsoid(crown, [-0.07, -0.14, -0.04], [0.1, 0.1, 0.1], 0x6b4a2b, 10);
  group.add(crown);
  group.userData.crown = crown;
  parent.add(group);
  return group;
}

function bush(parent, x, y, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  ellipsoid(group, [-0.28, 0.18, 0], [0.38, 0.32, 0.34], COLORS.leafDeep, 14);
  ellipsoid(group, [0.22, 0.2, 0.05], [0.36, 0.34, 0.32], COLORS.leaf, 14);
  ellipsoid(group, [0, 0.36, -0.05], [0.34, 0.3, 0.3], COLORS.leafLight, 14);
  parent.add(group);
  return group;
}

function flowers(parent, x, y, z, count = 3) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const petals = [0xff5f9e, 0xffc93d, 0xff8a3d, 0xffffff];
  for (let i = 0; i < count; i += 1) {
    const a = i * 2.4;
    const center = [Math.cos(a) * 0.22, 0.09, Math.sin(a) * 0.2];
    ellipsoid(group, center, [0.1, 0.06, 0.1], petals[i % petals.length], 10);
    ellipsoid(group, [center[0], 0.13, center[2]], [0.04, 0.03, 0.04], 0xfff1a8, 8);
  }
  parent.add(group);
  return group;
}

function cloud(parent, x, y, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  for (const [cx, cy, r] of [[-1.1, 0, 0.75], [-0.35, 0.35, 1], [0.55, 0.42, 1.08], [1.35, 0.05, 0.78], [0.2, -0.1, 0.9]]) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material(0xffffff, { emissive: 0xe4f6ff, emissiveIntensity: 0.55, roughness: 1 }));
    mesh.position.set(cx, cy, 0);
    mesh.scale.set(r, r * 0.68, r * 0.6);
    group.add(mesh);
  }
  parent.add(group);
  return group;
}

function makeGateway(parent) {
  const group = new THREE.Group();
  const stoneMat = material(COLORS.rock, { flatShading: true, roughness: 0.9 });
  const arch = shade(new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.2, 7, 18, Math.PI * 1.25), stoneMat));
  arch.rotation.z = -Math.PI * 0.125;
  arch.position.y = 1.2;
  const swirl = canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#b9fbff'); g.addColorStop(0.8, '#3fd6f0'); g.addColorStop(1, '#1aa7d8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 7;
    for (let k = 0; k < 3; k += 1) {
      ctx.beginPath();
      for (let t = 0; t < 1; t += 0.01) {
        const a = t * Math.PI * 3 + k * Math.PI * 2 / 3, r = t * w * 0.48;
        ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
      }
      ctx.stroke();
    }
  });
  const inner = new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), new THREE.MeshBasicMaterial({ map: swirl, side: THREE.DoubleSide }));
  inner.position.set(0, 1.2, -0.02);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture([[0, 'rgba(160,250,255,0.9)'], [0.5, 'rgba(120,230,255,0.35)'], [1, 'rgba(120,230,255,0)']]), transparent: true, depthWrite: false }));
  halo.position.set(0, 1.2, 0.05);
  halo.scale.setScalar(2.6);
  const pedestal = shade(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.12, 0.26, 10), stoneMat));
  pedestal.position.y = 0.13;
  const step = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.14, 10), material(COLORS.rockDark, { flatShading: true })));
  step.position.set(0, 0.06, 0.95);
  group.add(arch, inner, halo, pedestal, step);
  group.userData.swirl = inner;
  group.position.set(2.45, 0.38, -0.6);
  group.rotation.y = -0.18;
  parent.add(group);
  return group;
}

function route(parent) {
  for (let i = 0; i < 6; i += 1) {
    const t = i / 5;
    const stone = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.07, 9), material(0xf3e3c0, { flatShading: true })));
    stone.position.set(-0.75 + t * 3.0, 0.4, 0.8 - t * 1.05);
    stone.rotation.y = i;
    parent.add(stone);
  }
}

// Tall mesa with a falling stream; the stream texture scrolls each frame.
function waterfallCliff(parent, x, z, { height = 5.4, radius = 2.2 } = {}) {
  const group = new THREE.Group();
  group.position.set(x, WATER_Y, z);
  const tiers = [[radius, height * 0.55, 0], [radius * 0.72, height * 0.3, height * 0.55], [radius * 0.45, height * 0.18, height * 0.85]];
  tiers.forEach(([r, h, base], i) => {
    const rock = shade(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r, h, 9, 2), material(i % 2 ? COLORS.rockDark : COLORS.rock, { flatShading: true, roughness: 0.95 })));
    rock.position.y = base + h / 2;
    rock.rotation.y = i * 0.7;
    const cap = shade(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.16, 28), material(COLORS.grass)));
    cap.position.y = base + h + 0.05;
    group.add(rock, cap);
    bush(group, r * 0.45, base + h + 0.1, r * 0.2, 0.9 - i * 0.15);
  });
  palm(group, -radius * 0.3, height * 1.03 + 0.1, 0, 0.8, 0.3, 0.6);
  palm(group, radius * 0.42, height * 0.85 + 0.1, -0.2, 0.95, 0.4, 2.4);
  tree(group, -radius * 0.55, height * 0.55 + 0.05, -0.3, 0.85);
  const streamMap = canvasTexture(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#7fe3f5'); g.addColorStop(0.5, '#c9f7ff'); g.addColorStop(1, '#7fe3f5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i += 1) {
      ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.85)' : 'rgba(150,230,250,0.7)';
      ctx.fillRect((i * 11.3) % w, (i * 47) % h, 1.5 + (i % 3), 40 + (i % 6) * 18);
    }
  }, [1, 1.6]);
  const fallHeight = height * 0.55;
  const fall = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.005, radius * 1.005, fallHeight, 24, 1, true, -0.3, 0.6), new THREE.MeshBasicMaterial({ map: streamMap, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
  fall.position.set(0, fallHeight / 2 + 0.02, 0);
  group.add(fall);
  const mist = [];
  for (let i = 0; i < 4; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
    puff.position.set(-0.5 + i * 0.33, 0.1, radius * 1.02 + (i % 2) * 0.15);
    puff.scale.setScalar(0.3 + (i % 2) * 0.12);
    puff.userData.base = puff.scale.x;
    group.add(puff);
    mist.push(puff);
  }
  parent.add(group);
  return { group, streamMap, mist, foam: shoreline(parent, x, z, radius * 1.05) };
}

function distantHills(parent) {
  const tones = [0x3c9a6c, 0x4aa877, 0x348a63];
  for (const [x, z, r, h, i] of [[-30, -58, 10, 7, 0], [-12, -64, 13, 9, 1], [9, -62, 11, 7.5, 2], [28, -56, 10, 6, 0], [44, -66, 13, 8.5, 1]]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), material(tones[i], { flatShading: true, roughness: 1 }));
    hill.scale.set(r, h, r * 0.6);
    hill.position.set(x, WATER_Y - 0.2, z);
    hill.rotation.y = x;
    parent.add(hill);
  }
}

function sparkles(parent, count = 36) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = ((i * 73) % 100) / 100 * 14 - 7;
    positions[i * 3 + 1] = 0.6 + ((i * 37) % 100) / 100 * 3.2;
    positions[i * 3 + 2] = ((i * 29) % 100) / 100 * 6 - 3.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.16, map: radialTexture([[0, 'rgba(255,255,230,1)'], [0.4, 'rgba(255,245,170,0.7)'], [1, 'rgba(255,245,170,0)']]),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  parent.add(points);
  return points;
}

function createScene(host, kind, options) {
  const { onSelect, onPlay, onContextLost, onContextRestored } = options;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = `webgl-canvas webgl-${kind} expedition-canvas`;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_HORIZON);
  scene.fog = new THREE.Fog(SKY_HORIZON, 38, 95);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 180);
  makeSky(scene);
  scene.add(new THREE.HemisphereLight(0xd8f1ff, 0x6c9a4f, 1.35));
  const sun = new THREE.DirectionalLight(0xfff0cf, 2.7);
  sun.position.set(-6, 11, 7);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 35;
  sun.shadow.normalBias = 0.045;
  sun.shadow.bias = -0.0002;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xbfe6ff, 0.55);
  fill.position.set(6, 4, -5);
  scene.add(fill);

  let disposed = false;
  let contextLost = false;
  let restoreTimer = null;
  let raf = 0;
  let reducedMotion = shouldReduceMotion();
  let currentChoices = [];
  let choicesKey = '';
  let bossState = null;
  let nibblerState = null;
  let rescueValue = null;
  let highlighted = null;
  let character = null;
  let mascotAsset = null;
  let frameCount = 0;
  let previousFrame = null;
  let sceneRecorded = false;
  let assetSettled = false;
  let pendingReaction = 'idle';
  let jump = null;
  const clock = new THREE.Clock();
  const startedAt = performance.now();
  const budget = createPerformanceBudget({ rendererSource: () => renderer });
  const longTasks = budget.observeLongTasks();
  const quality = createQualityController(renderer, scene, sun, host);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const stones = [];
  const hitTargets = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clouds = [cloud(scene, -9, 7.5, -16, 1.6), cloud(scene, 6, 9, -20, 2.1), cloud(scene, -1, 6.2, -24, 1.2), cloud(scene, 14, 6.5, -18, 1.3)];
  const ripples = makeWater(scene);
  distantHills(scene);
  const palms = [];
  const foams = [];
  const falls = [];
  const backdrop = kind === 'home'
    ? [waterfallCliff(scene, 5.6, -7.8, { height: 6.2, radius: 2.4 }), waterfallCliff(scene, -7.4, -11, { height: 4.6, radius: 1.9 })]
    : [waterfallCliff(scene, -5.8, -8.6, { height: 5.8, radius: 2.3 }), waterfallCliff(scene, 6.6, -10.5, { height: 4.4, radius: 1.8 })];
  for (const cliff of backdrop) {
    falls.push(cliff);
    foams.push(cliff.foam);
    cliff.group.traverse(child => { if (child.userData.crown) palms.push(child); });
  }
  const islet = island(scene, kind === 'home' ? -4.6 : 3.2, -0.35, kind === 'home' ? -5.2 : -6.4, 1.1, 0.6);
  foams.push(shoreline(scene, islet.position.x, islet.position.z, 1.1));
  palms.push(palm(scene, islet.position.x - 0.2, -0.05, islet.position.z, 0.75, 0.45, 1.2));
  const glints = sparkles(scene);

  let gateway = null;
  let portalButton = null;
  let controls = null;
  let boss = null;
  const mascotPosition = kind === 'home' ? [-1.45, 0.39, 1.05] : [0, 0.4, -0.2];
  const mascotScale = kind === 'home' ? 0.85 : 0.66;
  let mascot = makeMascot({ facing: kind === 'home' ? 0.14 : 0, wave: kind === 'home' });
  mascot.position.fromArray(mascotPosition);
  mascot.scale.setScalar(mascotScale * 1.8);
  scene.add(mascot);

  if (kind === 'home') {
    island(scene, 0, 0, 0, 4.2, 1.65, 0.67);
    foams.push(shoreline(scene, 0, 0, 4.2, 0.67));
    palms.push(palm(scene, -3.3, 0.38, -0.5, 1.05, 0.5, 2.6), palm(scene, -2.6, 0.38, -1.4, 0.8, 0.4, 1.2));
    tree(scene, 3.35, 0.38, -1.2, 0.72);
    bush(scene, -3.4, 0.38, 0.9, 0.9);
    bush(scene, 3.5, 0.38, 0.4, 0.75);
    bush(scene, 1.0, 0.38, -2.2, 0.7);
    route(scene);
    flowers(scene, -2.7, 0.38, 1.2, 5);
    flowers(scene, 2.9, 0.38, 1.1, 4);
    flowers(scene, -0.4, 0.38, -1.9, 3);
    gateway = makeGateway(scene);
    hitTargets.push(...gateway.children);
    portalButton = document.createElement('button');
    portalButton.type = 'button';
    portalButton.className = 'webgl-home-portal expedition-portal-target';
    portalButton.setAttribute('aria-label', 'Enter the adventure gateway');
    portalButton.title = 'Continue adventure';
    portalButton.textContent = 'Enter gateway';
    portalButton.addEventListener('click', () => { if (!disposed) onPlay?.(); });
    host.appendChild(portalButton);
  } else {
    island(scene, 0, 0, -1.3, 3.35, 1.55, 0.6);
    foams.push(shoreline(scene, 0, -1.3, 3.35, 0.6));
    palms.push(palm(scene, -2.6, 0.38, -2.1, 0.9, 0.45, 2.7));
    tree(scene, 2.45, 0.38, -2.15, 0.7);
    bush(scene, 2.7, 0.38, -0.9, 0.7);
    bush(scene, -2.75, 0.38, -0.8, 0.65);
    flowers(scene, -1.85, 0.38, -0.4, 4);
    flowers(scene, 1.7, 0.38, -0.3, 3);
    controls = document.createElement('div');
    controls.className = 'webgl-answer-controls expedition-answer-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Choose an answer');
    host.appendChild(controls);
    boss = new THREE.Group();
    ellipsoid(boss, [0, 0.7, 0], [0.7, 0.75, 0.64], 0xaf90db, 20);
    for (const x of [-0.25, 0.25]) {
      ellipsoid(boss, [x, 0.83, 0.58], [0.15, 0.2, 0.06], 0xffffff, 12);
      ellipsoid(boss, [x, 0.8, 0.64], [0.065, 0.085, 0.04], 0x253951, 12);
    }
    for (let i = 0; i < 5; i += 1) ellipsoid(boss, [-0.7 + i * 0.35, 0.1, 0.23], [0.19, 0.15, 0.47], 0xa584d6, 12);
    boss.position.set(1.9, 0.34, -1.25);
    boss.visible = false;
    scene.add(boss);
  }

  function render() {
    if (disposed || contextLost || renderer.getContext().isContextLost()) return;
    renderer.render(scene, camera);
    if (!sceneRecorded && assetSettled) {
      sceneRecorded = true;
      budget.recordSceneLoad(performance.now() - startedAt);
      budget.sampleRenderer();
      budget.sampleMemory();
    }
  }

  function resize() {
    if (disposed || contextLost) return;
    const width = Math.max(1, host.clientWidth || 720);
    const height = Math.max(1, host.clientHeight || 500);
    const aspect = width / height;
    camera.aspect = aspect;
    // Fit the island in the narrower dimension, with sky above for the question/title.
    const span = kind === 'home' ? 12.4 : 10.1;
    const distance = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.min(aspect, 1.65);
    // A low, gently pitched camera keeps the horizon and sky in frame behind the island.
    const target = new THREE.Vector3(0, kind === 'home' ? 1.75 : 0.95, kind === 'home' ? -0.4 : 0.5);
    camera.position.set(0, target.y + distance * 0.24, target.z + distance * 0.97);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    renderer.setSize(width, height);
    if (portalButton && gateway) {
      const point = gateway.position.clone().add(new THREE.Vector3(0, 1.2, 0)).project(camera);
      portalButton.style.left = `${(point.x + 1) * width / 2}px`;
      portalButton.style.top = `${(1 - point.y) * height / 2}px`;
    }
    render();
  }

  function frame() {
    if (disposed || contextLost) return;
    const now = performance.now();
    if (previousFrame !== null) budget.recordFrame(now - previousFrame);
    previousFrame = now;
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    character?.update(t, reducedMotion);
    if (!character) mascot.position.y = mascotPosition[1];
    if (!reducedMotion) mascot.position.y += Math.sin(t * 2.1) * 0.028;
    if (jump) {
      const k = Math.min(1, (now - jump.at) / 720);
      const envelope = Math.sin(k * Math.PI);
      mascot.position.x = mascotPosition[0] + jump.x * envelope * 0.48;
      mascot.position.z = mascotPosition[2] + (jump.z - mascotPosition[2]) * envelope * 0.5;
      mascot.position.y += envelope * 0.85;
      if (k === 1) { jump = null; mascot.position.fromArray(mascotPosition); }
    }
    clouds.forEach((c, i) => { c.position.x += reducedMotion ? 0 : Math.sin(t * 0.18 + i) * 0.0007; });
    if (!reducedMotion) {
      ripples.offset.set(t * 0.012, t * 0.02);
      for (const cliff of falls) {
        cliff.streamMap.offset.y = t * 0.9;
        cliff.mist.forEach((puff, i) => puff.scale.setScalar(puff.userData.base * (1 + Math.sin(t * 2.4 + i * 1.7) * 0.18)));
      }
      palms.forEach((p, i) => { p.userData.crown.rotation.z = Math.sin(t * 0.9 + i) * 0.05; p.userData.crown.rotation.x = Math.cos(t * 0.7 + i) * 0.04; });
      foams.forEach((f, i) => { const k = 1 + Math.sin(t * 1.3 + i) * 0.02; f.scale.set(f.userData.base.x * k, f.userData.base.y * k, 1); });
      if (gateway) gateway.userData.swirl.rotation.z = -t * 0.8;
      glints.material.opacity = 0.65 + Math.sin(t * 1.6) * 0.3;
      glints.position.y = Math.sin(t * 0.5) * 0.15;
    }
    if (boss?.visible) boss.position.y = 0.34 + Math.sin(t * 1.7) * 0.04;
    render();
    frameCount += 1;
    if (frameCount % 60 === 0) { budget.sampleRenderer(); budget.sampleMemory(); }
    if (!reducedMotion) raf = requestAnimationFrame(frame);
  }

  function syncMotion() {
    if (disposed || contextLost) return;
    const next = shouldReduceMotion();
    if (next === reducedMotion) return;
    reducedMotion = next;
    cancelAnimationFrame(raf);
    jump = null;
    mascot.position.fromArray(mascotPosition);
    if (reducedMotion) clock.stop(); else clock.start();
    previousFrame = null;
    frame();
  }

  function applyStates() {
    stones.forEach((stone, index) => {
      const value = currentChoices[index];
      const blocked = bossState?.blocked != null && String(bossState.blocked) === value;
      const button = controls?.children[index];
      if (button) {
        button.disabled = blocked;
        button.setAttribute('aria-disabled', String(blocked));
        button.title = blocked ? 'Wrapped in a tentacle' : '';
        button.dataset.rescue = String(rescueValue === value);
        button.dataset.nibbler = String(nibblerState?.slot === index);
      }
      stone.userData.top.material.color.setHex(blocked ? 0xb59bd5 : rescueValue === value ? 0xf8d784 : highlighted === value ? 0xc6f77d : COLORS.stoneTop);
      stone.userData.marker.visible = nibblerState?.slot === index;
    });
    host.dataset.bossPhase = bossState?.phase || '';
    host.dataset.inked = String(Boolean(bossState?.inked));
    host.dataset.rescue = rescueValue ?? '';
    host.dataset.nibblerSlot = nibblerState ? String(nibblerState.slot) : '';
    host.dataset.nibblerNext = nibblerState ? String(nibblerState.next ?? '') : '';
    render();
  }

  function setChoices(choices = [], force = false) {
    if (disposed || kind !== 'battle') return;
    const list = [...new Set(choices.map(String))].slice(0, 4);
    const key = JSON.stringify(list);
    if (!force && key === choicesKey) return;
    const focusIndex = [...controls.children].indexOf(document.activeElement);
    choicesKey = key;
    currentChoices = list;
    stones.forEach(stone => { stone.removeFromParent(); disposeObject(stone); });
    stones.length = 0;
    hitTargets.length = 0;
    controls.replaceChildren();
    list.forEach((value, i) => {
      const x = list.length === 1 ? 0 : -3.45 + 6.9 * i / (list.length - 1);
      const stone = island(scene, x, -0.4, 2.45, 0.85, 0.7, 0.84, { rock: 0xc4b294, top: COLORS.stoneTop, boulders: false });
      shoreline(stone, 0, 0, 0.85, 0.84, WATER_Y - stone.position.y);
      stone.userData.value = value;
      const marker = ellipsoid(stone, [0, 0.54, 0], [0.1, 0.1, 0.1], COLORS.coral, 12);
      marker.visible = false;
      stone.userData.marker = marker;
      stones.push(stone);
      hitTargets.push(stone.userData.top);
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.value = value;
      button.textContent = value;
      button.addEventListener('click', () => { if (!disposed && !button.disabled) onSelect?.(value); });
      controls.appendChild(button);
    });
    host.dataset.answerDiscs = String(list.length);
    applyStates();
    if (focusIndex >= 0) (controls.children[focusIndex]?.disabled ? [...controls.children].find(button => !button.disabled) : controls.children[focusIndex])?.focus({ preventScroll: true });
    render();
  }

  function onPointer(event) {
    if (disposed || contextLost) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitTargets, false)[0];
    if (!hit) return;
    if (kind === 'home') onPlay?.();
    else {
      const index = hitTargets.indexOf(hit.object);
      if (!controls.children[index]?.disabled) onSelect?.(currentChoices[index]);
    }
  }

  function react(state) {
    if (disposed || !state) return;
    pendingReaction = state;
    character?.react(state);
    character?.update(reducedMotion ? 0 : clock.getElapsedTime(), reducedMotion);
    host.dataset.characterState = state;
    host.dataset.characterPoseY = String(mascot.position.y);
    render();
  }

  function onAnswer(event) {
    if (disposed || kind !== 'battle') return;
    const { value, correct } = event.detail || {};
    host.dataset.lastAnswer = correct ? 'correct' : 'wrong';
    react(correct ? 'success' : 'mistake');
    const stone = stones.find(item => item.userData.value === String(value));
    if (stone && correct && !reducedMotion) jump = { x: stone.position.x, z: stone.position.z, at: performance.now() };
  }

  function handleContextLost(event) {
    event.preventDefault();
    if (disposed || contextLost) return;
    contextLost = true;
    cancelAnimationFrame(raf);
    clock.stop();
    restoreTimer = setTimeout(() => { if (!disposed && contextLost) onContextLost?.(); }, 1500);
  }

  function handleContextRestored() {
    if (disposed || !contextLost) return;
    clearTimeout(restoreTimer);
    contextLost = false;
    previousFrame = null;
    clock.start();
    resize();
    frame();
    onContextRestored?.();
  }

  renderer.domElement.addEventListener('pointerdown', onPointer);
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);
  window.addEventListener('bb:answer', onAnswer);
  window.addEventListener('resize', resize);
  motion.addEventListener('change', syncMotion);
  const classObserver = new MutationObserver(() => { quality(); syncMotion(); if (reducedMotion) render(); });
  classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  host.dataset.expeditionScene = kind;
  quality();
  resize();
  frame();

  const assetStart = performance.now();
  loadGltfAsset('mascot', { position: mascotPosition, rotation: [0, kind === 'home' ? 0.14 : 0, 0], scale: mascotScale }).then(root => {
    if (disposed) { disposeGltfAsset(root); return; }
    mascot.removeFromParent();
    disposeObject(mascot);
    mascot = root;
    mascotAsset = root;
    scene.add(root);
    character = createCharacterAnimation(root);
    character.react(pendingReaction);
    character.update(reducedMotion ? 0 : clock.getElapsedTime(), reducedMotion);
    host.dataset.characterAnimated = String(character.animated);
  }).catch(() => {
    // The local procedural Bite keeps the prototype usable while the GLB is unavailable.
    if (!disposed) host.dataset.characterAnimated = 'false';
  }).finally(() => {
    if (disposed) return;
    assetSettled = true;
    budget.recordAssetTiming({ name: 'expedition-mascot', startTime: assetStart, duration: performance.now() - assetStart });
    render();
  });

  return {
    kind,
    getPerformanceReport() { return budget.report(); },
    setChoices,
    setEncounter(next = {}) {
      if (disposed || kind !== 'battle') return;
      const fraction = Boolean(next.boss) && next.bossName === 'Fraction Kraken';
      boss.visible = fraction;
      host.dataset.encounter = fraction ? 'fraction-kraken' : next.boss ? 'boss' : 'activity';
      render();
    },
    setNibbler(state) { if (!disposed) { nibblerState = state && Number.isInteger(state.slot) ? state : null; applyStates(); } },
    setBossState(state) { if (!disposed) { bossState = state || null; applyStates(); } },
    setRescue(value) { if (!disposed) { rescueValue = value == null ? null : String(value); applyStates(); } },
    highlight(value) { if (!disposed) { highlighted = value == null ? null : String(value); applyStates(); } },
    react,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(restoreTimer);
      clock.stop();
      character?.dispose();
      longTasks?.disconnect();
      resizeObserver.disconnect();
      classObserver.disconnect();
      window.removeEventListener('bb:answer', onAnswer);
      window.removeEventListener('resize', resize);
      motion.removeEventListener('change', syncMotion);
      renderer.domElement.removeEventListener('pointerdown', onPointer);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      if (mascotAsset) disposeGltfAsset(mascotAsset);
      disposeObject(scene);
      sun.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      controls?.remove();
      portalButton?.remove();
      for (const key of ['expeditionScene', 'characterAnimated', 'characterState', 'characterPoseY', 'graphicsTier', 'shadowSize', 'pixelRatio', 'answerDiscs', 'lastAnswer', 'nibblerSlot', 'nibblerNext', 'bossPhase', 'inked', 'rescue', 'encounter']) delete host.dataset[key];
    },
  };
}

export function createExpeditionHomeScene(host, options = {}) { return createScene(host, 'home', options); }
export function createExpeditionBattleScene(host, options = {}) { return createScene(host, 'battle', options); }
