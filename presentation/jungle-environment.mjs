import * as THREE from '../vendor/three/three.module.js';

function makeArchGeometry(width, height) {
  const radius = width / 2;
  const springY = height - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(radius, 0);
  shape.lineTo(radius, springY);
  shape.absarc(0, springY, radius, 0, Math.PI, false);
  shape.lineTo(-radius, 0);
  return new THREE.ShapeGeometry(shape);
}

export function makeBiteHouse() {
  const group = new THREE.Group();
  group.name = 'BiteHouse';

  const timber = new THREE.MeshStandardMaterial({ color: 0xb9783f, roughness: 0.84 });
  const timberLight = new THREE.MeshStandardMaterial({ color: 0xd99b55, roughness: 0.78 });
  const timberDark = new THREE.MeshStandardMaterial({ color: 0x6f3f22, roughness: 0.9 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x355d46, roughness: 0.93, flatShading: true });
  const roofLight = new THREE.MeshStandardMaterial({ color: 0x4e7750, roughness: 0.9, flatShading: true });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x432719, roughness: 0.88 });
  const windowGlow = new THREE.MeshStandardMaterial({
    color: 0xffcf6a,
    emissive: 0xff8f2f,
    emissiveIntensity: 1.35,
    roughness: 0.42,
  });
  const glassFrame = new THREE.MeshStandardMaterial({ color: 0x5b3924, roughness: 0.82 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xf1bd55, roughness: 0.45, metalness: 0.25 });
  const vine = new THREE.MeshStandardMaterial({ color: 0x2d7b43, roughness: 0.86 });
  const vineLeaf = new THREE.MeshStandardMaterial({ color: 0x63ad4b, roughness: 0.78, flatShading: true });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.18, 1.95), timberDark);
  deck.position.y = 0.78;
  deck.name = 'treehouseDeck';
  group.add(deck);

  const supportGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.35, 8);
  for (const x of [-1.02, 1.02]) {
    for (const z of [-0.62, 0.62]) {
      const support = new THREE.Mesh(supportGeometry, timberDark);
      support.position.set(x, 0.36, z);
      group.add(support);
    }
  }

  const walls = new THREE.Mesh(new THREE.BoxGeometry(2.18, 1.38, 1.45), timber);
  walls.position.y = 1.58;
  walls.name = 'timberWalls';
  group.add(walls);

  const beamGeometry = new THREE.BoxGeometry(0.12, 1.48, 0.13);
  for (const x of [-1.02, 1.02]) {
    const beam = new THREE.Mesh(beamGeometry, timberLight);
    beam.position.set(x, 1.58, 0.76);
    group.add(beam);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.13, 0.14), timberLight);
  lintel.position.set(0, 2.15, 0.76);
  group.add(lintel);

  const crossBeamGeometry = new THREE.BoxGeometry(0.1, 1.08, 0.12);
  const crossBeamLeft = new THREE.Mesh(crossBeamGeometry, timberDark);
  crossBeamLeft.position.set(-0.79, 1.55, 0.79);
  crossBeamLeft.rotation.z = -0.58;
  const crossBeamRight = crossBeamLeft.clone();
  crossBeamRight.position.x = 0.79;
  crossBeamRight.rotation.z = 0.58;
  group.add(crossBeamLeft, crossBeamRight);

  const outerDoor = new THREE.Mesh(makeArchGeometry(0.9, 1.24), timberLight);
  outerDoor.position.set(-0.42, 0.91, 0.775);
  outerDoor.name = 'archedDoorTrim';
  const door = new THREE.Mesh(makeArchGeometry(0.68, 1.05), doorMaterial);
  door.position.set(-0.42, 0.91, 0.795);
  door.name = 'archedDoor';
  group.add(outerDoor, door);

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), brass);
  handle.position.set(-0.17, 1.4, 0.84);
  group.add(handle);

  const window = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.44), windowGlow);
  window.position.set(0.72, 1.63, 0.79);
  window.name = 'windowGlow';
  group.add(window);
  const windowVertical = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.08), glassFrame);
  windowVertical.position.set(0.72, 1.63, 0.83);
  const windowHorizontal = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.08), glassFrame);
  windowHorizontal.position.set(0.72, 1.63, 0.83);
  group.add(windowVertical, windowHorizontal);

  const eave = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.68, 0.14, 8), roof);
  eave.position.y = 2.31;
  eave.scale.z = 0.78;
  eave.name = 'roofEave';
  const lowerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.62, 0.62, 8), roof);
  lowerRoof.position.y = 2.6;
  lowerRoof.scale.z = 0.78;
  const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(1.38, 0.58, 8), roofLight);
  upperRoof.position.y = 2.98;
  upperRoof.scale.z = 0.78;
  const roofCap = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.3, 8), roof);
  roofCap.position.y = 3.36;
  roofCap.scale.z = 0.78;
  group.add(eave, lowerRoof, upperRoof, roofCap);

  const stepGeometry = new THREE.BoxGeometry(1, 0.16, 0.34);
  for (let index = 0; index < 4; index++) {
    const step = new THREE.Mesh(stepGeometry, index % 2 ? timber : timberLight);
    step.position.set(0, 0.1 + index * 0.17, 1.42 - index * 0.27);
    step.scale.x = 1.08 - index * 0.05;
    group.add(step);
  }

  const vineStemGeometry = new THREE.CylinderGeometry(0.025, 0.035, 0.82, 5);
  const vineLeafGeometry = new THREE.DodecahedronGeometry(0.11, 0);
  const vineSpecs = [
    [-1.04, 1.78, 0.84, 0.14],
    [-0.98, 1.24, 0.86, -0.12],
    [1.03, 1.8, 0.8, -0.16],
    [0.98, 1.27, 0.82, 0.1],
  ];
  for (let index = 0; index < vineSpecs.length; index++) {
    const [x, y, z, rotation] = vineSpecs[index];
    const stem = new THREE.Mesh(vineStemGeometry, vine);
    stem.position.set(x, y, z);
    stem.rotation.z = rotation;
    group.add(stem);
    for (const [offsetY, offsetX] of [[-0.2, -0.1], [0.12, 0.1]]) {
      const leaf = new THREE.Mesh(vineLeafGeometry, vineLeaf);
      leaf.position.set(x + offsetX * (index % 2 ? -1 : 1), y + offsetY, z + 0.02);
      leaf.scale.set(1.15, 0.62, 0.72);
      leaf.rotation.z = rotation + offsetY;
      group.add(leaf);
    }
  }

  return group;
}

// Deterministic, shared scenery: no downloaded textures or per-leaf draw calls.
export function addJungleBanks(scene) {
  const group = new THREE.Group();
  group.name = 'JungleBanks';
  const transform = new THREE.Object3D();
  const stone = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x7c8260, roughness: 0.96 }), 168,
  );
  const moss = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0x477843, roughness: 0.94 }), 48,
  );
  const leaves = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x34774b, roughness: 0.88 }), 168,
  );
  const rowSpans = [17.2, 16.2, 14.7, 12.7, 10.4, 7.4];
  const stoneColor = new THREE.Color();
  let block = 0;
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column < 28; column++) {
      const normalized = (column - 13.5) / 13.5;
      const x = normalized * rowSpans[row] / 2 + (row % 2) * 0.08;
      const tower = Math.abs(x) > 4.7;
      const front = -6.35 + row * 0.16;
      transform.position.set(x, row * 0.53 + 0.1, front + (tower ? 0.18 : 0));
      transform.rotation.set(0, Math.sin(block * 1.7) * 0.05, 0);
      transform.scale.set(Math.max(0.26, Math.min(0.62, rowSpans[row] / 28 * 1.12)),
        0.49 + (row === 5 ? 0.05 : 0), 0.8 + (tower ? 0.45 : 0));
      transform.updateMatrix();
      stone.setMatrixAt(block, transform.matrix);
      const cap = row === 5;
      const center = Math.abs(normalized) < 0.24;
      stoneColor.setHSL(cap ? 0.12 : 0.17, cap ? 0.19 : 0.13,
        0.28 + (column % 4) * 0.025 + (center ? 0.025 : 0) + (cap ? 0.035 : 0));
      stone.setColorAt(block++, stoneColor);
    }
  }
  for (let i = 0; i < 48; i++) {
    const tier = Math.floor(i / 8);
    const slot = i % 8;
    const side = slot % 2 ? 1 : -1;
    const span = rowSpans[tier];
    const offset = 0.18 + Math.floor(slot / 2) * 0.18;
    const x = side * (span / 2 - offset);
    transform.position.set(x, tier * 0.53 + 0.4 + (slot % 3) * 0.04, -6.12 + tier * 0.16);
    transform.rotation.set(0, i * 0.7, 0);
    transform.scale.set(0.38 + (slot % 3) * 0.08, 0.25 + (slot % 2) * 0.1, 0.3);
    transform.updateMatrix();
    moss.setMatrixAt(i, transform.matrix);
  }
  for (let i = 0; i < 168; i++) {
    const plant = Math.floor(i / 7), angle = i % 7 * Math.PI * 2 / 7;
    const side = plant % 2 ? 1 : -1;
    transform.position.set(side * (5.6 + Math.sin(plant) * 0.55) + Math.cos(angle) * 0.28,
      0.52, -5.6 + Math.floor(plant / 2) * 0.88 + Math.sin(angle) * 0.28);
    transform.rotation.set(Math.sin(angle) * 0.7, angle, Math.cos(angle) * 0.7);
    transform.scale.set(0.16, 0.8, 0.27);
    transform.updateMatrix();
    leaves.setMatrixAt(i, transform.matrix);
    leaves.setColorAt(i, new THREE.Color().setHSL(0.25 + (plant % 3) * 0.03, 0.46, 0.32 + (i % 4) * 0.035));
  }
  stone.instanceMatrix.needsUpdate = true;
  moss.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;
  if (stone.instanceColor) stone.instanceColor.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  stone.receiveShadow = moss.receiveShadow = leaves.receiveShadow = true;
  group.add(stone, moss, leaves);
  scene.add(group);
  return group;
}

export function makeWaterMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  const depth = context.createLinearGradient(0, 0, 256, 256);
  depth.addColorStop(0, '#123f48');
  depth.addColorStop(0.5, '#167580');
  depth.addColorStop(1, '#205657');
  context.fillStyle = depth;
  context.fillRect(0, 0, 256, 256);
  for (let row = -1; row < 17; row++) {
    context.beginPath();
    for (let x = 0; x <= 256; x += 4) {
      const y = row * 17 + Math.sin(x * Math.PI / 64 + row * 1.8) * 5
        + Math.sin(x * Math.PI / 27 + row * 2.3) * 2;
      if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.strokeStyle = row % 3 === 0 ? 'rgba(147,230,204,0.25)' : 'rgba(92,195,183,0.14)';
    context.lineWidth = row % 3 === 0 ? 0.8 : 1.4;
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.36, metalness: 0.22 });
}

export function fitSceneCamera(camera, aspect, { span, height, target, distance }) {
  camera.aspect = aspect;
  const horizontalDistance = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
  camera.position.set(0, height, Math.max(distance, horizontalDistance));
  camera.lookAt(...target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
