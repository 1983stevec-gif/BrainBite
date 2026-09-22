import * as THREE from '../vendor/three/three.module.js';

/**
 * Add group to a lit scene; the route runs from +Z to -Z, about 6 x 11 units.
 * landmarks exposes stable local anchors and labels for host UI/raycasting.
 * This is presentation only: the host owns input, accessibility, and progression.
 * update takes absolute seconds and the current reduced-motion preference.
 * dispose detaches the group and releases only kit-owned resources, once.
 */
export function createBubbleReefRouteKit({ seed = 731, reducedMotion = false } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('seed must be an unsigned 32-bit integer');
  }
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const group = new THREE.Group();
  group.name = 'BubbleReefRouteKit';
  group.userData = { worldProfile: 'bubble-reef', routeId: 'bubble-reef-preview-route', seed };
  const geometries = new Set();
  const materials = new Set();
  const ownGeometry = value => { geometries.add(value); return value; };
  const finish = (color, extra = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
    materials.add(value);
    return value;
  };
  const disc = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 20));
  const sphere = ownGeometry(new THREE.SphereGeometry(1, 12, 8));
  const rock = ownGeometry(new THREE.IcosahedronGeometry(1, 0));
  const ring = ownGeometry(new THREE.TorusGeometry(1, 0.055, 6, 32));
  const arch = ownGeometry(new THREE.TorusGeometry(1, 0.12, 8, 24, Math.PI));
  const arrow = ownGeometry(new THREE.ConeGeometry(1, 1, 3));
  const teal = finish(0x196875);
  const sand = finish(0xe5d7a1);
  const coral = finish(0xf58579);
  const pearl = finish(0xe6ffff, { metalness: 0.18, roughness: 0.25 });
  const glow = finish(0x6de8df, { emissive: 0x176d75, emissiveIntensity: 0.5 });
  const bubbleFinish = finish(0xbcefff, {
    transparent: true, opacity: 0.35, depthWrite: false, roughness: 0.15,
  });
  function mesh(parent, name, shape, material, position, scale = [1, 1, 1]) {
    const item = new THREE.Mesh(shape, material);
    item.name = name;
    item.position.set(...position);
    item.scale.set(...scale);
    parent.add(item);
    return item;
  }
  function landmark(id, label, kind, position) {
    const anchor = new THREE.Group();
    anchor.name = id;
    anchor.position.set(...position);
    anchor.userData = { waypointId: id, label, kind };
    group.add(anchor);
    return anchor;
  }
  const entry = landmark('reef-entry', 'Reef Entry', 'landmark', [0, 0, 4]);
  const current = landmark('bubble-current', 'Bubble Current', 'interaction', [0, 0, 0]);
  const exit = landmark('pearl-arch', 'Pearl Arch', 'landmark', [0, 0, -4]);
  const landmarks = Object.freeze({ 'reef-entry': entry, 'bubble-current': current, 'pearl-arch': exit });

  mesh(entry, 'entry-landing', disc, teal, [0, -0.12, 0], [1.65, 0.24, 1]);
  mesh(entry, 'entry-sand', disc, sand, [0, 0.025, 0], [1.5, 0.05, 0.9]);
  for (const x of [-1.45, 1.45]) {
    mesh(entry, 'entry-coral-post', disc, coral, [x, 0.45, 0], [0.13, 0.9, 0.13]);
    mesh(entry, 'entry-pearl', sphere, pearl, [x, 0.95, 0], [0.2, 0.2, 0.2]);
  }
  // Flat triangular arrows point down-route; stepping stones preserve an open center.
  for (const z of [3, 2, -2, -3]) {
    mesh(group, 'route-stepping-stone', disc, sand, [0, 0, z], [0.52, 0.1, 0.35]);
    const pointer = mesh(group, 'route-arrow', arrow, teal, [0, 0.08, z], [0.2, 0.04, 0.24]);
    pointer.rotation.y = Math.PI;
  }
  mesh(current, 'current-plinth', disc, teal, [0, 0.06, 0], [1.3, 0.18, 1.3]);
  mesh(current, 'current-sand', disc, sand, [0, 0.17, 0], [1.16, 0.04, 1.16]);
  const target = mesh(current, 'current-interaction-target', disc, glow, [0, 0.23, 0], [0.7, 0.08, 0.7]);
  target.userData = { interactionId: 'bubble-current', label: 'Bubble Current' };
  for (let i = 0; i < 3; i++) {
    const halo = mesh(current, 'current-halo', ring, glow, [0, 0.45 + i * 0.75, 0],
      [0.85 - i * 0.12, 0.85 - i * 0.12, 0.85 - i * 0.12]);
    halo.rotation.x = Math.PI / 2;
  }
  const bubbles = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI * 2 / 12;
    const radius = 0.1 + random() * 0.08;
    const item = mesh(current, 'current-bubble', sphere, bubbleFinish,
      [Math.cos(angle) * 0.55, 0.6 + random() * 1.8, Math.sin(angle) * 0.55],
      [radius, radius, radius]);
    bubbles.push({ item, base: item.position.clone(), phase: random() * Math.PI * 2 });
  }

  // A raised semicircle and side pillars leave a real, unobstructed exit opening.
  mesh(exit, 'pearl-arch-crown', arch, pearl, [0, 1.25, 0], [1.5, 1.5, 1.5]);
  for (const x of [-1.5, 1.5]) {
    mesh(exit, 'pearl-arch-pillar', disc, pearl, [x, 0.625, 0], [0.18, 1.25, 0.18]);
    mesh(exit, 'pearl-arch-foot', rock, teal, [x, 0, 0], [0.42, 0.2, 0.42]);
  }
  for (let i = 0; i <= 8; i++) {
    const angle = i * Math.PI / 8;
    mesh(exit, 'arch-pearl', sphere, glow,
      [Math.cos(angle) * 1.5, 1.25 + Math.sin(angle) * 1.5, 0.13], [0.14, 0.14, 0.14]);
  }
  for (let i = 0; i < 12; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const height = 0.18 + random() * 0.3;
    mesh(group, 'route-bank-pebble', rock, i % 3 === 0 ? coral : teal,
      [side * (2.05 + random() * 0.3), height * 0.5, 4 - Math.floor(i / 2) * 1.6],
      [0.25 + random() * 0.15, height, 0.3]);
  }
  let disposed = false;
  function update(timeSeconds = 0, motionReduced = reducedMotion) {
    if (disposed) return;
    const time = Number.isFinite(timeSeconds) ? timeSeconds % (Math.PI * 10) : 0;
    for (const { item, base, phase } of bubbles) {
      item.position.copy(base);
      if (!motionReduced) {
        item.position.y += (Math.sin(time * 0.4 + phase) - Math.sin(phase)) * 0.16;
      }
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    group.removeFromParent();
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    geometries.clear();
    materials.clear();
    bubbles.length = 0;
    Object.values(landmarks).forEach(anchor => anchor.clear());
    group.clear();
  }
  return { group, landmarks, update, dispose };
}
