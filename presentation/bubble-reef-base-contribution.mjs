import * as THREE from '../vendor/three/three.module.js';

/**
 * Attach group to a BrainBase Object3D and position/scale it in local space.
 * The host owns earned state: call update(elapsedSeconds, reducedMotion) with
 * seconds since reveal, or duration for an already-earned contribution.
 * No timers, reward writes, scene lights, or host transform changes are made.
 * Reduced motion shows the completed ornament immediately. Disposal is final.
 */
export function createBubbleReefBaseContribution({ seed = 733, reducedMotion = false, duration = 2.4 } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('seed must be an unsigned 32-bit integer');
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new RangeError('duration must be a positive finite number');
  }
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const group = new THREE.Group();
  group.name = 'BubbleReefBaseContribution';
  group.userData = {
    contributionId: 'bubble-reef-base-current-restored',
    worldProfile: 'bubble-reef', label: 'Restore the Bubble Current', seed,
  };
  const ornament = new THREE.Group();
  ornament.name = 'restored-current';
  group.add(ornament);
  const geometries = new Set();
  const materials = new Set();
  const geometry = value => { geometries.add(value); return value; };
  const material = (color, extra = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: 0.48, ...extra });
    materials.add(value);
    return value;
  };
  const disc = geometry(new THREE.CylinderGeometry(1, 1, 1, 24));
  const sphere = geometry(new THREE.SphereGeometry(1, 16, 10));
  const ring = geometry(new THREE.TorusGeometry(1, 0.045, 8, 40));
  const teal = material(0x196875);
  const sand = material(0xe5d7a1);
  const coral = material(0xf58579);
  const pearl = material(0xe6ffff, { metalness: 0.25, roughness: 0.22 });
  const glow = material(0x6de8df, { emissive: 0x176d75, emissiveIntensity: 0.65 });
  const shimmer = material(0xbcefff, { transparent: true, opacity: 0, depthWrite: false });
  function mesh(parent, name, shape, finish, position, scale) {
    const item = new THREE.Mesh(shape, finish);
    item.name = name;
    item.position.set(...position);
    item.scale.set(...scale);
    parent.add(item);
    return item;
  }
  mesh(ornament, 'current-plinth', disc, teal, [0, 0.12, 0], [0.95, 0.24, 0.95]);
  mesh(ornament, 'sand-inlay', disc, sand, [0, 0.255, 0], [0.83, 0.03, 0.83]);
  const crown = new THREE.Group();
  crown.name = 'coral-crown';
  crown.position.y = 0.27;
  ornament.add(crown);
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;
    const height = 0.32 + random() * 0.32;
    const x = Math.cos(angle) * 0.57;
    const z = Math.sin(angle) * 0.57;
    mesh(crown, 'coral-stem', disc, coral, [x, height / 2, z], [0.07, height, 0.07]);
    mesh(crown, 'coral-tip', sphere, coral, [x, height, z], [0.11, 0.14, 0.11]);
  }
  const heart = mesh(ornament, 'current-pearl', sphere, pearl, [0, 1.12, 0], [0.3, 0.3, 0.3]);
  const halo = mesh(ornament, 'current-halo', ring, glow, [0, 0.92, 0], [0.62, 0.62, 0.62]);
  halo.rotation.x = Math.PI / 2;
  const bubbles = [];
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4 + random() * 0.2;
    const radius = 0.055 + random() * 0.035;
    const item = mesh(ornament, 'reveal-bubble', sphere, shimmer,
      [Math.cos(angle) * 0.76, 0.4 + random() * 0.35, Math.sin(angle) * 0.76],
      [radius, radius, radius]);
    bubbles.push({ item, base: item.position.clone(), radius });
  }
  const smooth = value => {
    const x = Math.min(1, Math.max(0, value));
    return x * x * (3 - 2 * x);
  };
  let disposed = false;
  function update(elapsedSeconds = 0, motionReduced = reducedMotion) {
    if (disposed) return;
    const time = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
    const progress = motionReduced ? 1 : Math.min(1, time / duration);
    const rise = smooth(progress / 0.65);
    const bloom = smooth((progress - 0.15) / 0.65);
    const reveal = smooth((progress - 0.35) / 0.65);
    ornament.visible = progress > 0;
    ornament.position.y = 0.3 * (rise - 1);
    ornament.scale.setScalar(0.65 + 0.35 * rise);
    ornament.rotation.y = Math.PI / 3 * (rise - 1);
    crown.scale.set(1, 0.05 + 0.95 * bloom, 1);
    heart.scale.setScalar(0.3 * reveal);
    heart.position.y = 0.65 + 0.47 * reveal;
    halo.scale.setScalar(0.2 + 0.42 * reveal);
    halo.visible = reveal > 0;
    shimmer.opacity = progress === 1 ? 0 : 0.5 * Math.sin(Math.PI * progress);
    for (const { item, base, radius } of bubbles) {
      item.visible = progress > 0 && progress < 1;
      item.position.copy(base);
      item.position.y += progress * 1.1;
      item.scale.setScalar(radius * (0.6 + 0.4 * rise));
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
    crown.clear();
    ornament.clear();
    group.clear();
  }
  update(0);
  return { group, duration, update, dispose };
}
