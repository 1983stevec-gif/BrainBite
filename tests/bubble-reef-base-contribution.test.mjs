import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import { BUBBLE_REEF_BASE_CONTRIBUTION } from '../content/bubble-reef/rewards.mjs';
import { createBubbleReefBaseContribution } from '../presentation/bubble-reef-base-contribution.mjs';

function snapshot(group) {
  const result = [];
  group.traverse(item => result.push([item.name, item.visible, item.position.toArray(),
    item.quaternion.toArray(), item.scale.toArray(), item.material?.opacity]));
  return result;
}

test('contribution matches reward identity and attaches in BrainBase local space', () => {
  const effect = createBubbleReefBaseContribution();
  const base = new THREE.Group();
  base.position.set(10, 2, -4);
  base.scale.setScalar(2);
  base.add(effect.group);
  effect.group.position.set(1, 0, 2);
  const pose = [base.position.toArray(), base.scale.toArray(), effect.group.position.toArray()];
  effect.update(effect.duration);
  assert.equal(effect.group.userData.contributionId, BUBBLE_REEF_BASE_CONTRIBUTION.id);
  assert.deepEqual(effect.group.getWorldPosition(new THREE.Vector3()).toArray(), [12, 2, 0]);
  assert.deepEqual([base.position.toArray(), base.scale.toArray(), effect.group.position.toArray()], pose);
  effect.dispose();
});

test('reveal rises, grows coral, reveals the pearl and settles without ongoing motion', () => {
  const effect = createBubbleReefBaseContribution();
  try {
    const ornament = effect.group.getObjectByName('restored-current');
    assert.equal(ornament.visible, false);
    effect.update(effect.duration * 0.5);
    assert.equal(ornament.visible, true);
    assert.ok(ornament.position.y < 0);
    assert.ok(effect.group.getObjectByName('coral-crown').scale.y < 1);
    assert.ok(effect.group.getObjectByName('current-pearl').scale.x > 0);
    assert.ok(effect.group.getObjectByName('reveal-bubble').material.opacity > 0.4);
    effect.update(effect.duration);
    assert.equal(ornament.position.y, 0);
    assert.equal(ornament.scale.x, 1);
    assert.equal(effect.group.getObjectByName('coral-crown').scale.y, 1);
    assert.equal(effect.group.getObjectByName('current-pearl').scale.x, 0.3);
    assert.equal(effect.group.getObjectByName('reveal-bubble').visible, false);
    const settled = snapshot(effect.group);
    effect.update(1e100);
    assert.deepEqual(snapshot(effect.group), settled);
  } finally { effect.dispose(); }
});

test('seed and absolute time reproduce the same transforms regardless of frame history', () => {
  const a = createBubbleReefBaseContribution();
  const b = createBubbleReefBaseContribution();
  const c = createBubbleReefBaseContribution({ seed: 0 });
  try {
    assert.deepEqual(snapshot(a.group), snapshot(b.group));
    assert.notDeepEqual(snapshot(a.group), snapshot(c.group));
    a.update(1.3);
    const expected = snapshot(a.group);
    a.update(200);
    a.update(0.1);
    a.update(1.3);
    b.update(1.3);
    assert.deepEqual(snapshot(a.group), expected);
    assert.deepEqual(snapshot(b.group), expected);
  } finally { [a, b, c].forEach(effect => effect.dispose()); }
});

test('reduced motion immediately shows the completed pose and supports live overrides', () => {
  const effect = createBubbleReefBaseContribution({ reducedMotion: true });
  try {
    const complete = snapshot(effect.group);
    assert.equal(effect.group.getObjectByName('restored-current').visible, true);
    for (const time of [0, 1, 50, NaN]) {
      effect.update(time);
      assert.deepEqual(snapshot(effect.group), complete);
    }
    effect.update(0.7, false);
    assert.notDeepEqual(snapshot(effect.group), complete);
    effect.update(0.7, true);
    assert.deepEqual(snapshot(effect.group), complete);
    effect.update(effect.duration, false);
    assert.deepEqual(snapshot(effect.group), complete);
  } finally { effect.dispose(); }
});

test('invalid times reset safely; custom duration and boundary seeds are supported', () => {
  const effect = createBubbleReefBaseContribution({ duration: 4, seed: 0xffffffff });
  try {
    const initial = snapshot(effect.group);
    for (const time of [-1, NaN, Infinity, -Infinity, '2', null]) {
      effect.update(2);
      effect.update(time);
      assert.deepEqual(snapshot(effect.group), initial);
    }
    effect.update(4);
    assert.equal(effect.group.getObjectByName('current-pearl').scale.x, 0.3);
  } finally { effect.dispose(); }
  for (const seed of [-1, 1.5, NaN, Infinity, '733', null, 0x100000000]) {
    assert.throws(() => createBubbleReefBaseContribution({ seed }), RangeError);
  }
  for (const duration of [0, -1, NaN, Infinity, '2', null]) {
    assert.throws(() => createBubbleReefBaseContribution({ duration }), RangeError);
  }
});

test('primitive ornament fits a bounded attachment and shares a small resource budget', () => {
  const effect = createBubbleReefBaseContribution();
  try {
    effect.update(effect.duration);
    const shapes = new Set();
    let meshes = 0;
    let triangles = 0;
    effect.group.traverse(item => {
      if (!item.isMesh) return;
      shapes.add(item.geometry);
      meshes++;
      triangles += item.geometry.index.count / 3;
      for (const value of Object.values(item.material)) assert.ok(!value?.isTexture);
    });
    assert.equal(shapes.size, 3);
    assert.equal(meshes, 26);
    assert.ok(triangles < 10000, `triangles: ${triangles}`);
    const bounds = new THREE.Box3().setFromObject(effect.group);
    assert.ok(bounds.min.x >= -1 && bounds.max.x <= 1);
    assert.ok(bounds.min.z >= -1 && bounds.max.z <= 1);
    assert.ok(bounds.min.y >= 0 && bounds.max.y < 2);
  } finally { effect.dispose(); }
});

test('dispose releases only owned resources exactly once and preserves host and siblings', () => {
  const a = createBubbleReefBaseContribution();
  const b = createBubbleReefBaseContribution();
  const base = new THREE.Group();
  const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  base.add(a.group, b.group, foreign);
  const owned = new Set();
  a.group.traverse(item => {
    if (item.isMesh) { owned.add(item.geometry); owned.add(item.material); }
  });
  const counts = new Map();
  for (const resource of owned) resource.addEventListener('dispose', () => {
    counts.set(resource, (counts.get(resource) ?? 0) + 1);
  });
  let foreignDisposals = 0;
  base.traverse(item => {
    for (const resource of [item.geometry, item.material]) {
      if (resource && !owned.has(resource)) resource.addEventListener('dispose', () => foreignDisposals++);
    }
  });
  const sibling = snapshot(b.group);
  a.dispose();
  a.dispose();
  a.update(1);
  assert.equal(counts.size, owned.size);
  assert.ok([...counts.values()].every(count => count === 1));
  assert.equal(foreignDisposals, 0);
  assert.equal(a.group.parent, null);
  assert.equal(a.group.children.length, 0);
  assert.deepEqual(base.children, [b.group, foreign]);
  assert.deepEqual(snapshot(b.group), sibling);
  b.dispose();
  foreign.geometry.dispose();
  foreign.material.dispose();
});
