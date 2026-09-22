import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import { createBubbleReefKit } from '../presentation/bubble-reef-kit.mjs';

function snapshot(group) {
  const result = [];
  group.traverse(item => result.push([item.name, item.position.toArray(), item.quaternion.toArray(),
    item.scale.toArray(), item.geometry?.type, item.material?.color.getHex()]));
  return result;
}

test('reef composition is deterministic, seeded, bounded, and primitive-only', () => {
  const a = createBubbleReefKit();
  const b = createBubbleReefKit();
  const c = createBubbleReefKit({ seed: 0 });
  try {
    assert.deepEqual(snapshot(a.group), snapshot(b.group));
    assert.notDeepEqual(snapshot(a.group), snapshot(c.group));
    assert.equal(a.group.userData.worldProfile, 'bubble-reef');
    const counts = new Map();
    const geometries = new Set();
    let triangles = 0;
    a.group.traverse(item => {
      counts.set(item.name, (counts.get(item.name) || 0) + 1);
      if (!item.isMesh) return;
      assert.match(item.geometry.type, /^(Sphere|Icosahedron|Cylinder|Cone|Torus)Geometry$/);
      assert.equal(item.material.map, null);
      geometries.add(item.geometry);
      triangles += (item.geometry.index?.count ?? item.geometry.attributes.position.count) / 3;
    });
    assert.equal(counts.get('coral-trunk'), 4);
    assert.equal(counts.get('reef-crystal'), 16);
    assert.equal(counts.get('bubble-shell'), 16);
    assert.equal(counts.get('golden-sea-fan'), 4);
    assert.equal(geometries.size, 6);
    assert.ok(triangles < 50000, `triangle budget: ${triangles}`);
    const bounds = new THREE.Box3().setFromObject(a.group);
    assert.ok(bounds.min.x > -7 && bounds.max.x < 7);
    assert.ok(bounds.min.y > -1 && bounds.max.y < 5);
  } finally { [a, b, c].forEach(kit => kit.dispose()); }
});

test('absolute-time animation is repeatable and reduced motion restores the resting pose', () => {
  const kit = createBubbleReefKit();
  try {
    const resting = snapshot(kit.group);
    kit.update(7);
    const animated = snapshot(kit.group);
    assert.notDeepEqual(animated, resting);
    kit.update(15);
    kit.update(7);
    assert.deepEqual(snapshot(kit.group), animated);
    kit.update(99, true);
    assert.deepEqual(snapshot(kit.group), resting);
    kit.update(100, true);
    assert.deepEqual(snapshot(kit.group), resting);
    for (const time of [NaN, Infinity, -Infinity, 1e100]) {
      kit.update(time);
      kit.group.traverse(item => assert.ok(item.position.toArray().every(Number.isFinite)));
    }
    kit.update(NaN);
    assert.deepEqual(snapshot(kit.group), resting);
  } finally { kit.dispose(); }
  const reduced = createBubbleReefKit({ reducedMotion: true });
  const resting = snapshot(reduced.group);
  reduced.update(8);
  assert.deepEqual(snapshot(reduced.group), resting);
  reduced.dispose();
});

test('disposal releases each owned resource once and preserves other kit and host resources', () => {
  const a = createBubbleReefKit();
  const b = createBubbleReefKit();
  const scene = new THREE.Scene();
  scene.add(a.group, b.group);
  const resources = new Set();
  a.group.traverse(item => {
    if (item.geometry) resources.add(item.geometry);
    if (item.material) resources.add(item.material);
  });
  const calls = new Map();
  resources.forEach(resource => resource.addEventListener('dispose', () => {
    calls.set(resource, (calls.get(resource) || 0) + 1);
  }));
  let otherDisposals = 0;
  b.group.traverse(item => item.material?.addEventListener('dispose', () => otherDisposals++));
  const before = snapshot(b.group);
  a.dispose();
  a.dispose();
  a.update(4);
  assert.equal(calls.size, resources.size);
  assert.ok([...calls.values()].every(count => count === 1));
  assert.equal(a.group.parent, null);
  assert.equal(a.group.children.length, 0);
  assert.equal(b.group.parent, scene);
  assert.deepEqual(snapshot(b.group), before);
  assert.equal(otherDisposals, 0);
  b.dispose();
});

test('invalid seeds fail before resources are allocated', () => {
  for (const seed of [-1, 0.5, NaN, Infinity, 'reef', 0x100000000]) {
    assert.throws(() => createBubbleReefKit({ seed }), RangeError);
  }
});
