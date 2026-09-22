import * as THREE from '../vendor/three/three.module.js';

/**
 * Primitive-only reef, about 12 units wide, with an open center facing +Z.
 * Add group to a lit scene. update(timeSeconds, reducedMotion) uses absolute
 * time; pass the host's motion preference each frame. dispose() owns only the
 * kit's resources, is idempotent, and detaches the group. No timers or listeners.
 */
export function createBubbleReefKit({ seed = 731, reducedMotion = false } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('seed must be an unsigned 32-bit integer');
  }
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const group = new THREE.Group();
  group.name = 'BubbleReefKit';
  group.userData.worldProfile = 'bubble-reef';
  group.userData.seed = seed;
  const geometries = new Set();
  const materials = new Set();
  const geometry = value => { geometries.add(value); return value; };
  const material = (color, extra = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
    materials.add(value);
    return value;
  };
  const sphere = geometry(new THREE.SphereGeometry(1, 16, 12));
  const rock = geometry(new THREE.IcosahedronGeometry(1, 0));
  const stalk = geometry(new THREE.CylinderGeometry(0.65, 1, 1, 7));
  const crystal = geometry(new THREE.ConeGeometry(1, 1, 5));
  const shelf = geometry(new THREE.CylinderGeometry(1, 0.88, 1, 12));
  const rim = geometry(new THREE.TorusGeometry(1, 0.025, 6, 24));
  const stone = material(0x175968, { flatShading: true });
  const ledge = material(0x288a91, { flatShading: true });
  const sand = material(0xc5dcb7);
  const coral = material(0xf58579);
  const tips = material(0xffd5a0, { emissive: 0xc77b40, emissiveIntensity: 0.12 });
  const jade = material(0x65e5c7, { metalness: 0.18, roughness: 0.28, flatShading: true,
    emissive: 0x168e91, emissiveIntensity: 0.28 });
  const fanMaterial = material(0xe5b352);
  const pearl = material(0xbcefff, { transparent: true, opacity: 0.26,
    depthWrite: false, roughness: 0.15, metalness: 0.2 });
  const shine = material(0xe3ffff, { emissive: 0x91e6ee, emissiveIntensity: 0.4,
    transparent: true, opacity: 0.7, depthWrite: false });
  function mesh(parent, name, shape, finish, position, scale) {
    const item = new THREE.Mesh(shape, finish);
    item.name = name;
    item.position.set(...position);
    item.scale.set(...scale);
    item.castShadow = !finish.transparent;
    item.receiveShadow = !finish.transparent;
    parent.add(item);
    return item;
  }
  function branch(parent, name, from, to, radius, finish) {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const direction = end.clone().sub(start);
    const item = mesh(parent, name, stalk, finish,
      start.add(end).multiplyScalar(0.5).toArray(), [radius, direction.length(), radius]);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return item;
  }
  const fans = [];
  // Asymmetric banks leave room for a host's character, route, or answer props.
  const banks = [[-4.1, -0.5, 1.25], [4.2, -1.1, 1.05], [-2.8, -3.7, 0.9], [2.1, -4.2, 1.2]];
  banks.forEach(([x, z, size], index) => {
    const bank = new THREE.Group();
    bank.name = `reef-bank-${index}`;
    bank.position.set(x, 0, z);
    bank.rotation.y = (random() - 0.5) * 0.4;
    group.add(bank);
    mesh(bank, 'faceted-foundation', rock, stone, [0, -0.12, 0], [size * 1.35, 0.65, size]);
    mesh(bank, 'turquoise-terrace', shelf, ledge, [0, 0.18, 0], [size * 1.1, 0.3, size * 0.85]);
    mesh(bank, 'sand-cap', shelf, sand, [0, 0.35, 0], [size, 0.08, size * 0.76]);
    const height = 1.15 + random() * 0.5;
    branch(bank, 'coral-trunk', [-0.35, 0.38, 0], [-0.35, height, 0], 0.12, coral);
    for (let j = 0; j < 5; j++) {
      const angle = j * 2.4 + index;
      const y = 0.75 + j * 0.17;
      const elbow = [-0.35 + Math.cos(angle) * 0.38, y, Math.sin(angle) * 0.32];
      const end = [elbow[0] * 1.15, y + 0.32 + random() * 0.2, elbow[2] * 1.3];
      branch(bank, 'coral-branch', [-0.35, y - 0.22, 0], elbow, 0.085, coral);
      branch(bank, 'coral-finger', elbow, end, 0.065, coral);
      mesh(bank, 'coral-pearl-tip', sphere, tips, end, [0.075, 0.095, 0.075]);
    }
    for (let j = 0; j < 4; j++) {
      const height = 0.55 + random() * 0.85;
      const item = mesh(bank, 'reef-crystal', crystal, jade,
        [0.4 + (j % 2) * 0.23, 0.38 + height / 2, -0.1 - Math.floor(j / 2) * 0.24],
        [0.18, height, 0.18]);
      item.rotation.z = (random() - 0.5) * 0.35;
    }
    const fan = new THREE.Group();
    fan.name = 'golden-sea-fan';
    fan.position.set(0.2, 0.4, -0.5);
    bank.add(fan);
    for (let j = -3; j <= 3; j++) {
      const angle = j * 0.25;
      const end = [Math.sin(angle) * 0.85, Math.cos(angle) * 1.05, 0];
      branch(fan, 'fan-ray', [0, 0, 0], end, 0.025, fanMaterial);
      mesh(fan, 'fan-bud', sphere, tips, end, [0.04, 0.06, 0.04]);
    }
    fans.push({ item: fan, phase: random() * Math.PI * 2 });
    for (let j = 0; j < 4; j++) {
      mesh(bank, 'reef-pebble', rock, ledge,
        [(random() - 0.5) * 1.8, 0.43, (random() - 0.5) * 1.1], [0.16, 0.1, 0.12]);
    }
  });
  const bubbles = [];
  for (let i = 0; i < 16; i++) {
    const [x, z] = banks[i % banks.length];
    const bubble = new THREE.Group();
    bubble.name = `pearl-bubble-${i}`;
    const radius = 0.09 + random() * 0.15;
    bubble.position.set(x + (random() - 0.5) * 1.8, 0.9 + random() * 2.7, z + random() * 0.8);
    mesh(bubble, 'bubble-shell', sphere, pearl, [0, 0, 0], [radius, radius, radius]);
    mesh(bubble, 'bubble-rim', rim, shine, [0, 0, 0], [radius, radius, radius]);
    mesh(bubble, 'bubble-glint', sphere, shine, [-radius * 0.32, radius * 0.4, radius * 0.78],
      [radius * 0.15, radius * 0.22, radius * 0.07]);
    group.add(bubble);
    bubbles.push({ item: bubble, base: bubble.position.clone(), phase: random() * Math.PI * 2 });
  }
  let disposed = false;
  function update(timeSeconds = 0, motionReduced = reducedMotion) {
    if (disposed) return;
    const time = Number.isFinite(timeSeconds) ? timeSeconds % (Math.PI * 20) : 0;
    for (const { item, base, phase } of bubbles) {
      item.position.copy(base);
      if (!motionReduced) {
        item.position.x += (Math.sin(time * 0.2 + phase) - Math.sin(phase)) * 0.07;
        item.position.y += (Math.sin(time * 0.4 + phase) - Math.sin(phase)) * 0.18;
      }
    }
    for (const { item, phase } of fans) {
      item.rotation.z = motionReduced ? 0 : (Math.sin(time * 0.3 + phase) - Math.sin(phase)) * 0.035;
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
    fans.length = 0;
    group.clear();
  }
  return { group, update, dispose };
}
