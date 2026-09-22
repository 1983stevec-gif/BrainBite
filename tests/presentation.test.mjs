import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import { addJungleBanks, fitSceneCamera } from '../presentation/jungle-environment.mjs';
import { disposeObject, makeTree, makeTreeGrove } from '../presentation/props.mjs';
import { graphicsProfile } from '../presentation/graphics-quality.mjs';
import { CHARACTER_STATES, createCharacterAnimation } from '../presentation/character-animation.mjs';
import { createProgrammableBit } from '../presentation/programmable-bit.mjs';
import { readFileSync } from 'node:fs';

test('programmable Bit presentation is reusable, event-reactive, and disposable', () => {
  const bit = createProgrammableBit({ definition: { id: 'reef-helper' } });
  const initialY = bit.group.position.y;
  bit.react('correct');
  bit.update(1, false);
  assert.equal(bit.group.userData.programmableBit, true);
  assert.notEqual(bit.group.scale.x, 1);
  assert.notEqual(bit.group.position.y, initialY);
  bit.dispose();
  assert.equal(bit.group.parent, null);
});

test('jungle scenery is deterministic and uses three instanced batches', () => {
  const first = addJungleBanks(new THREE.Scene());
  const second = addJungleBanks(new THREE.Scene());
  assert.equal(first.children.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(first.children[i].isInstancedMesh, true);
    assert.deepEqual(first.children[i].instanceMatrix.array, second.children[i].instanceMatrix.array);
  }
  assert.deepEqual(first.children.map(mesh => mesh.count), [168, 48, 168]);
  disposeObject(first);
  disposeObject(second);
});

test('scene disposal releases instance buffers and shared resources exactly once', () => {
  const root = new THREE.Group();
  const geometry = new THREE.BoxGeometry();
  const texture = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const instances = new THREE.InstancedMesh(geometry, material, 4);
  root.add(instances, new THREE.Mesh(geometry, material));
  const counts = { geometry: 0, texture: 0, material: 0, instances: 0 };
  for (const [key, resource] of Object.entries({ geometry, texture, material, instances })) {
    resource.addEventListener('dispose', () => counts[key]++);
  }
  disposeObject(root);
  assert.deepEqual(counts, { geometry: 1, texture: 1, material: 1, instances: 1 });
});

test('tree batching preserves every original geometry, material, and world transform', () => {
  const placements = [[-6.2, 2.5, 1.3], [2.6, -3.9, 1.2], [0, -4.5, 1.4]];
  const expected = new Map();
  for (const placement of placements) {
    const tree = makeTree(...placement);
    tree.updateMatrixWorld(true);
    tree.traverse(mesh => {
      if (!mesh.isMesh) return;
      const key = `${mesh.geometry.uuid}:${mesh.material.uuid}`;
      if (!expected.has(key)) expected.set(key, []);
      expected.get(key).push(mesh.matrixWorld.toArray());
    });
  }
  const grove = makeTreeGrove(placements);
  assert.equal(grove.children.length, 7);
  let count = 0;
  for (const batch of grove.children) {
    const matrices = expected.get(`${batch.geometry.uuid}:${batch.material.uuid}`);
    assert.equal(batch.count, matrices.length);
    assert.equal(batch.castShadow, false);
    for (let index = 0; index < batch.count; index++) {
      const actual = new THREE.Matrix4();
      batch.getMatrixAt(index, actual);
      actual.elements.forEach((value, offset) => assert.ok(Math.abs(value - matrices[index][offset]) < 1e-6));
    }
    count += batch.count;
  }
  assert.equal(count, placements.length * 13);
  disposeObject(grove);
});

test('camera fitting retains horizontal landmarks from portrait to widescreen', () => {
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  for (const aspect of [0.7, 1, 1.6, 2.4]) {
    fitSceneCamera(camera, aspect, { span: 10.8, height: 4.6, target: [0, 1.25, 0], distance: 11.5 });
    for (const x of [-4.5, 4.5]) {
      const projected = new THREE.Vector3(x, 1.3, 0).project(camera);
      assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1, `landmark at ${x} / ${aspect}`);
    }
  }
});

test('graphics tiers cap real renderer pixel ratio and shadow allocation', () => {
  assert.deepEqual(graphicsProfile(['quality-ultra'], 3), { tier: 'ultra', pixelRatio: 2, shadowSize: 2048 });
  assert.deepEqual(graphicsProfile(['quality-balanced'], 2), { tier: 'balanced', pixelRatio: 1.5, shadowSize: 1024 });
  for (const tier of ['performance', 'mobile']) {
    assert.deepEqual(graphicsProfile([`quality-${tier}`], 3), { tier, pixelRatio: 1, shadowSize: 0 });
  }
  assert.equal(graphicsProfile(['quality-ultra', 'low-end-device'], 2).shadowSize, 0);
});

test('character animation freezes at rest under reduced motion and releases actions', () => {
  const root = new THREE.Group();
  const bone = new THREE.Bone(); bone.name = 'head'; root.add(bone);
  root.animations = [new THREE.AnimationClip('Bite_Idle', 2, [
    new THREE.NumberKeyframeTrack('head.position[x]', [0, 1, 2], [0, 1, 0]),
  ])];
  const animation = createCharacterAnimation(root);
  assert.equal(animation.animated, true);
  animation.update(1); assert.equal(bone.position.x, 1);
  animation.update(1, true); assert.equal(bone.position.x, 0);
  animation.dispose(); animation.update(1);
  assert.equal(bone.position.x, 0);
});

test('character animation exposes semantic states without requiring extra clips', () => {
  const root = new THREE.Group();
  root.position.set(2, 3, 4);
  root.animations = [new THREE.AnimationClip('Bite_Idle', 2, [])];
  const animation = createCharacterAnimation(root);

  assert.deepEqual(CHARACTER_STATES, ['idle', 'success', 'mistake', 'recovery', 'discovery', 'celebrate']);
  assert.equal(animation.state, 'idle');
  assert.equal(animation.setState('success'), 'success');
  animation.update(10);
  assert.ok(root.position.y > 3, 'success lifts Bite above its baseline');
  animation.update(10);
  assert.equal(root.position.y, 3.08, 'repeated updates do not accumulate procedural offsets');
  animation.react('success');
  animation.update(11);
  assert.equal(root.position.y, 3.08, 'react restarts a repeated semantic reaction');
  assert.equal(animation.react('discovery/celebrate'), 'celebrate');
  assert.equal(animation.state, 'celebrate');
  assert.throws(() => animation.setState('victory'), /Unknown Bite character state/);
});

test('reduced-motion reactions are deterministic for every semantic state', () => {
  for (const state of CHARACTER_STATES) {
    const root = new THREE.Group();
    const bone = new THREE.Bone(); bone.name = 'head'; root.add(bone);
    root.animations = [new THREE.AnimationClip('Bite_Idle', 2, [
      new THREE.NumberKeyframeTrack('head.position[x]', [0, 1, 2], [0, 1, 0]),
    ])];
    const animation = createCharacterAnimation(root);
    animation.setState(state);
    animation.update(2, true);
    const first = [root.position.y, root.rotation.x, root.rotation.y, root.rotation.z, root.scale.x, bone.position.x];
    animation.update(200, true);
    const second = [root.position.y, root.rotation.x, root.rotation.y, root.rotation.z, root.scale.x, bone.position.x];
    assert.deepEqual(second, first, `${state} reduced-motion pose should ignore elapsed time`);
    animation.dispose();
  }
});

test('character reaction disposal restores transforms and is safe without an idle clip', () => {
  const root = new THREE.Group();
  root.position.set(1, 2, 3);
  root.rotation.set(0.1, 0.2, 0.3);
  root.scale.setScalar(0.75);
  const animation = createCharacterAnimation(root);
  assert.equal(animation.animated, false);
  root.position.x = 5;
  animation.setState('mistake');
  animation.update(4);
  assert.equal(root.position.x, 5, 'reaction preserves position channels it does not own');
  assert.ok(root.position.y < 2);
  animation.dispose();
  animation.dispose();
  animation.update(8);
  animation.setState('success');
  assert.deepEqual(root.position.toArray(), [5, 2, 3]);
  assert.deepEqual(root.rotation.toArray().slice(0, 3), [0.1, 0.2, 0.3]);
  assert.deepEqual(root.scale.toArray(), [0.75, 0.75, 0.75]);
  assert.equal(animation.state, 'mistake');
});

test('shipped Bite GLB contains the six-bone rig, idle clip, and no starter hat', () => {
  const bytes = readFileSync(new URL('../assets/generated/blender/glb/brainbite_mascot.glb', import.meta.url));
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
  assert.equal(gltf.skins.length, 1);
  assert.ok(gltf.skins[0].joints.length >= 6);
  assert.ok(gltf.animations.some(clip => clip.name === 'Bite_Idle'));
  assert.ok(gltf.nodes.some(node => node.name === 'Bite_Crest_1'));
  assert.ok(!gltf.nodes.some(node => /HatBrim|HatCrown/.test(node.name)));
  assert.ok(bytes.length < 2 * 1024 * 1024, 'Bite asset must stay within its 2 MiB budget');
});
