const PROFILE_VERSION = 1;

const profiles = {
  'jungle-circuit': {
    id: 'jungle-circuit',
    name: 'Jungle Circuit',
    version: PROFILE_VERSION,
    palette: { sky: 0x72afab, fog: 0x7fafa0, water: 0x2f9ea8, accent: 0xffc85c },
    lighting: { key: 0xffdfa6, fill: 0x9ad7ff },
    decor: 'jungle',
  },
  'bubble-reef': {
    id: 'bubble-reef',
    name: 'Bubble Reef',
    version: PROFILE_VERSION,
    palette: { sky: 0x6cb7c7, fog: 0x78abb8, water: 0x168fa8, accent: 0xffd66b },
    lighting: { key: 0xffe0b2, fill: 0x8ae7ff },
    decor: 'reef',
  },
};

function cloneProfile(profile) {
  return {
    ...profile,
    palette: { ...profile.palette },
    lighting: { ...profile.lighting },
  };
}

export function getWorldProfile(id = 'jungle-circuit') {
  return cloneProfile(profiles[id] || profiles['jungle-circuit']);
}

export function validateWorldProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object') return { valid: false, errors: ['Profile must be an object.'] };
  if (typeof profile.id !== 'string' || !profile.id) errors.push('Profile id is required.');
  else if (!Object.hasOwn(profiles, profile.id)) errors.push('Profile id is not registered.');
  if (profile.version !== PROFILE_VERSION) errors.push(`Profile version must be ${PROFILE_VERSION}.`);
  if (typeof profile.name !== 'string' || !profile.name.trim()) errors.push('Profile name is required.');
  for (const key of ['sky', 'fog', 'water', 'accent']) {
    if (!Number.isInteger(profile.palette?.[key])) errors.push(`Palette value ${key} must be an integer.`);
  }
  if (!Number.isInteger(profile.lighting?.key) || !Number.isInteger(profile.lighting?.fill)) errors.push('Lighting colors must be integers.');
  if (!['jungle', 'reef'].includes(profile.decor)) errors.push('Profile decor is not supported.');
  return { valid: errors.length === 0, errors };
}

export function listWorldProfiles() {
  return Object.values(profiles).map(cloneProfile);
}

// Keep the preview geometry deliberately small and disposable: it proves the
// world-kit seam without adding a second renderer or external asset dependency.
export function createWorldProfileDecor(THREE, profileId = 'jungle-circuit') {
  const profile = getWorldProfile(profileId);
  const group = new THREE.Group();
  group.name = `${profile.id}-decor`;
  group.userData.worldProfile = profile.id;
  if (profile.decor !== 'reef') return group;

  const bubbleGeometry = new THREE.SphereGeometry(0.12, 10, 8);
  const bubbleMaterial = new THREE.MeshStandardMaterial({ color: 0x9ef2ff, transparent: true, opacity: 0.42, roughness: 0.2, metalness: 0.05 });
  for (const [x, y, z, scale] of [[-4.6, 0.7, -2.4, 1], [-3.8, 1.15, -2.1, 0.7], [4.2, 0.8, -2.5, 1.25], [4.8, 1.35, -2.15, 0.65], [0.1, 0.55, -4.1, 0.8]]) {
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    bubble.position.set(x, y, z);
    bubble.userData.baseY = y;
    bubble.scale.setScalar(scale);
    bubble.castShadow = false;
    group.add(bubble);
  }

  const coralGeometry = new THREE.CylinderGeometry(0.08, 0.16, 0.7, 7);
  const coralMaterial = new THREE.MeshStandardMaterial({ color: 0xf27e88, roughness: 0.78 });
  for (const [x, z, rotation] of [[-5.1, -1.8, -0.2], [5.2, -1.65, 0.25], [3.8, -3.2, -0.15]]) {
    const coral = new THREE.Mesh(coralGeometry, coralMaterial);
    coral.position.set(x, 0.42, z);
    coral.rotation.z = rotation;
    coral.castShadow = true;
    group.add(coral);
  }
  return group;
}

export const WORLD_PROFILE_VERSION = PROFILE_VERSION;
