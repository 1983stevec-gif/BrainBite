/** Shared procedural props for Batch 9 spike scenes */
import * as THREE from '../vendor/three/three.module.js';

export function makeMascot({ facing = 0, wave = true } = {}) {
  const g = new THREE.Group();
  const blue = new THREE.MeshStandardMaterial({ color: 0x3b9dff, roughness: 0.55, metalness: 0.05 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1f6fd4, roughness: 0.6 });
  const pack = new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 0.7 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x2f6fd6, roughness: 0.45 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.4 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const black = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
  const blush = new THREE.MeshStandardMaterial({ color: 0xff8aa8, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 28, 20), blue);
  body.scale.set(1, 1.08, 0.95);
  body.position.y = 0.95;
  g.add(body);

  // Spikes / quills
  for (let i = 0; i < 9; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 7), dark);
    const a = -0.9 + i * 0.22;
    spike.position.set(Math.sin(a) * 0.38, 1.35 + Math.cos(a * 0.4) * 0.08, -0.28 + Math.cos(a) * 0.12);
    spike.rotation.z = a * 0.35;
    spike.rotation.x = -0.55;
    g.add(spike);
  }

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), blue);
  earL.position.set(-0.38, 1.42, 0.05);
  const earR = earL.clone();
  earR.position.x = 0.38;
  g.add(earL, earR);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), white);
  eyeL.position.set(-0.18, 1.05, 0.42);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.18;
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), black);
  pupilL.position.set(-0.16, 1.05, 0.5);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.16;
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), blush);
  cheekL.position.set(-0.32, 0.9, 0.38);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.32;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), black);
  nose.position.set(0, 0.92, 0.52);
  g.add(eyeL, eyeR, pupilL, pupilR, cheekL, cheekR, nose);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.28), pack);
  backpack.position.set(0, 0.95, -0.52);
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.06), pack);
  strapL.position.set(-0.22, 1.0, -0.2);
  const strapR = strapL.clone();
  strapR.position.x = 0.22;
  g.add(backpack, strapL, strapR);

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 8), blue);
  armL.position.set(-0.62, 0.95, 0.1);
  armL.rotation.z = 0.35;
  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 8), blue);
  armR.position.set(0.62, 1.15, 0.15);
  armR.rotation.z = wave ? -1.1 : -0.25;
  armR.name = 'waveArm';
  g.add(armL, armR);

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.18, 4, 8), blue);
  legL.position.set(-0.2, 0.38, 0.05);
  const legR = legL.clone();
  legR.position.x = 0.2;
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.34), shoe);
  shoeL.position.set(-0.2, 0.12, 0.08);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.2;
  const toeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), accent);
  toeL.position.set(-0.2, 0.12, 0.24);
  const toeR = toeL.clone();
  toeR.position.x = 0.2;
  g.add(legL, legR, shoeL, shoeR, toeL, toeR);

  g.rotation.y = facing;
  g.userData.waveArm = armR;
  return g;
}

let treeAssets;

function getTreeAssets() {
  if (treeAssets) return treeAssets;

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x81502a, roughness: 0.92 });
  const canopyMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x1e6338, roughness: 0.86, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x2f8d43, roughness: 0.82, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x55ad4b, roughness: 0.78, flatShading: true }),
  ];
  const frondMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x267541, roughness: 0.86, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x4b9d43, roughness: 0.8, side: THREE.DoubleSide }),
  ];

  const frondShape = new THREE.Shape();
  frondShape.moveTo(0, -0.52);
  frondShape.quadraticCurveTo(0.17, -0.08, 0.06, 0.52);
  frondShape.quadraticCurveTo(-0.06, 0.18, 0, -0.52);

  treeAssets = {
    trunkGeometry: new THREE.CylinderGeometry(0.14, 0.22, 1.7, 9),
    branchGeometry: new THREE.CylinderGeometry(0.055, 0.09, 0.86, 7),
    canopyGeometry: new THREE.DodecahedronGeometry(1, 1),
    frondGeometry: new THREE.ShapeGeometry(frondShape),
    trunkMaterial,
    branchMaterial,
    canopyMaterials,
    frondMaterials,
  };
  return treeAssets;
}

export function makeTree(x, z, scale = 1) {
  const assets = getTreeAssets();
  const g = new THREE.Group();
  g.name = 'TropicalTree';
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);

  const trunk = new THREE.Mesh(assets.trunkGeometry, assets.trunkMaterial);
  trunk.position.y = 0.85;
  g.add(trunk);

  const branchSpecs = [
    [-0.28, 1.03, -0.08, -0.58, 0.2],
    [0.24, 1.13, -0.02, 0.54, -0.16],
    [-0.04, 1.28, -0.12, -0.2, 0.6],
  ];
  for (const [xOffset, y, zOffset, zRotation, xRotation] of branchSpecs) {
    const branch = new THREE.Mesh(assets.branchGeometry, assets.branchMaterial);
    branch.position.set(xOffset, y, zOffset);
    branch.rotation.set(xRotation, 0, zRotation);
    g.add(branch);
  }

  const variation = Math.abs(Math.sin(x * 4.71 + z * 2.17));
  const canopySpecs = [
    { position: [0, 1.52, 0.04], scale: [0.93, 0.48, 0.72], material: 0, rotation: 0.2 },
    { position: [-0.42, 1.88, 0.01], scale: [0.76, 0.6, 0.62], material: 1, rotation: -0.24 },
    { position: [0.39, 1.98, -0.1], scale: [0.72, 0.66, 0.58], material: 1, rotation: 0.36 },
    { position: [-0.12, 2.34, -0.04], scale: [0.57, 0.65, 0.5], material: 2, rotation: -0.12 },
  ];
  for (const spec of canopySpecs) {
    const canopy = new THREE.Mesh(assets.canopyGeometry, assets.canopyMaterials[spec.material]);
    canopy.position.set(...spec.position);
    canopy.scale.set(...spec.scale);
    canopy.rotation.y = spec.rotation + variation * 0.12;
    g.add(canopy);
  }

  const frondSpecs = [
    [-0.72, 1.72, 0.12, -0.92, -0.14, 0.86],
    [-0.5, 2.12, 0.1, -0.52, 0.16, 0.72],
    [0.58, 1.78, 0.14, 0.88, 0.12, 0.8],
    [0.42, 2.22, -0.02, 0.56, -0.12, 0.68],
    [0.03, 2.63, -0.04, 0.08, 0.06, 0.6],
  ];
  for (let index = 0; index < frondSpecs.length; index++) {
    const [xOffset, y, zOffset, zRotation, yRotation, length] = frondSpecs[index];
    const frond = new THREE.Mesh(assets.frondGeometry, assets.frondMaterials[index % 2]);
    frond.position.set(xOffset, y, zOffset);
    frond.rotation.set(0, yRotation + variation * 0.08, zRotation);
    frond.scale.set(0.72, length, 1);
    g.add(frond);
  }

  return g;
}

export function makeTreeGrove(placements) {
  const grove = new THREE.Group();
  grove.name = 'TropicalTreeGrove';
  const batches = new Map();
  for (const [x, z, scale] of placements) {
    const tree = makeTree(x, z, scale);
    tree.updateMatrixWorld(true);
    tree.traverse(mesh => {
      if (!mesh.isMesh) return;
      const key = `${mesh.geometry.uuid}:${mesh.material.uuid}`;
      if (!batches.has(key)) batches.set(key, { geometry: mesh.geometry, material: mesh.material, matrices: [] });
      batches.get(key).matrices.push(mesh.matrixWorld.clone());
    });
  }
  // Bake the original tree transforms, retaining every branch and frond.
  for (const { geometry, material, matrices } of batches.values()) {
    const batch = new THREE.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((matrix, index) => batch.setMatrixAt(index, matrix));
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    grove.add(batch);
  }
  return grove;
}

export function makeRock(x, z, s = 1) {
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.55 * s, 0),
    new THREE.MeshStandardMaterial({ color: 0x8b9088, roughness: 0.95 })
  );
  mesh.position.set(x, 0.28 * s, z);
  mesh.scale.set(1.2, 0.7, 1);
  mesh.rotation.y = x + z;
  return mesh;
}

export function makeLabelSprite(text, { w = 256, h = 128, font = 'bold 44px system-ui,sans-serif' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255, 245, 220, 0.96)';
  ctx.strokeStyle = '#3a2918';
  ctx.lineWidth = 10;
  roundRect(ctx, 14, 22, w - 28, h - 44, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1a120a';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(1.7, 0.85, 1);
  return sprite;
}

export function makeWorldSign(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const wood = ctx.createLinearGradient(0, 16, 0, 112);
  wood.addColorStop(0, '#906137');
  wood.addColorStop(0.48, '#4e301d');
  wood.addColorStop(1, '#2b2116');
  ctx.fillStyle = wood;
  roundRect(ctx, 8, 16, 496, 96, 14);
  ctx.fill();
  ctx.strokeStyle = '#d7af61';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(242,205,130,0.18)';
  ctx.lineWidth = 2;
  for (const y of [34, 94]) {
    ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(484, y - 4); ctx.stroke();
  }
  ctx.fillStyle = '#f9d890';
  ctx.shadowColor = '#171b10';
  ctx.shadowOffsetY = 3;
  ctx.shadowBlur = 3;
  ctx.font = 'bold 46px Trebuchet MS,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  for (const x of [30, 482]) {
    ctx.beginPath(); ctx.arc(x, 64, 6, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(2.6, 0.65, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function disposeObject(obj) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  obj.traverse((child) => {
    if (child.isInstancedMesh) child.dispose();
    if (child.geometry) geometries.add(child.geometry);
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        materials.add(m);
        for (const value of Object.values(m)) if (value?.isTexture) textures.add(value);
      }
    }
    if (child.skeleton?.boneTexture?.isTexture) textures.add(child.skeleton.boneTexture);
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}
