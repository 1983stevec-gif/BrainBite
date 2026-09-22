import * as THREE from '../vendor/three/three.module.js';

const EVENT_COLORS = Object.freeze({
  correct: 0x5cff9a,
  mistake: 0xffb45c,
  collect: 0x77d7ff,
  reset: 0xb7a6ff,
});

function makeMaterial(color, emissive = 0x000000, intensity = 0) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.42, metalness: 0.12 });
}

export function createProgrammableBit({ definition = null, baseY = 1.25 } = {}) {
  const group = new THREE.Group();
  group.name = 'BrainBiteProgrammableBit';
  const shell = makeMaterial(0x22b8d6, 0x063b57, 0.35);
  const accent = makeMaterial(0xffcf5a, 0x6a3f00, 0.3);
  const dark = makeMaterial(0x12314b);
  const glow = makeMaterial(0x5cff9a, 0x5cff9a, 1.2);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), shell);
  body.scale.set(1, 0.86, 0.92);
  body.position.y = baseY;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), dark);
  visor.scale.set(1.15, 0.68, 0.28);
  visor.position.set(0, baseY + 0.02, 0.28);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.3, 8), accent);
  antenna.position.set(0, baseY + 0.42, 0);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), glow);
  beacon.position.set(0, baseY + 0.59, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 8, 32), glow);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = baseY - 0.22;
  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.22), accent);
  footL.position.set(-0.16, baseY - 0.34, 0.04);
  const footR = footL.clone();
  footR.position.x = 0.16;
  group.add(body, visor, antenna, beacon, ring, footL, footR);
  group.userData.programmableBit = true;
  group.userData.definition = definition || null;

  let pulse = 0;
  let disposed = false;
  function react(event = 'correct') {
    if (disposed) return;
    pulse = 1;
    const color = EVENT_COLORS[event] || EVENT_COLORS.correct;
    glow.color.setHex(color);
    glow.emissive.setHex(color);
  }
  function update(time = 0, reducedMotion = false) {
    if (disposed) return;
    group.position.y = reducedMotion ? 0 : Math.sin(time * 2.6) * 0.045;
    ring.rotation.z = reducedMotion ? 0 : time * 1.5;
    pulse = Math.max(0, pulse - (reducedMotion ? 0.2 : 0.035));
    group.scale.setScalar(1 + pulse * 0.12);
    glow.emissiveIntensity = 0.32 + pulse * 1.2;
  }
  function dispose() {
    disposed = true;
    group.traverse(child => {
      child.geometry?.dispose?.();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => material?.dispose?.());
    });
    group.removeFromParent();
  }
  return { group, definition, react, update, dispose };
}

