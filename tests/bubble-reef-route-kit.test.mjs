import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import { createBubbleReefRouteKit } from '../presentation/bubble-reef-route-kit.mjs';

function snapshot(group) {
  const result = [];
  group.traverse(item => result.push([item.name, item.position.toArray(), item.quaternion.toArray(),
    item.scale.toArray(), item.geometry?.type, item.material?.color.getHex()]));
  return result;
}

test('route has ordered, addressable landmarks and a clear Pearl Arch opening', () => {
  const kit = createBubbleReefRouteKit();
  try {
    assert.equal(kit.group.userData.routeId, 'bubble-reef-preview-route');
    assert.equal(kit.group.userData.worldProfile, 'bubble-reef');
    assert.deepEqual(Object.keys(kit.landmarks), ['reef-entry', 'bubble-current', 'pearl-arch']);
    const [entry, current, exit] = Object.values(kit.landmarks);
    assert.deepEqual([entry.position.z, current.position.z, exit.position.z], [4, 0, -4]);
    assert.deepEqual([entry.userData.label, current.userData.label, exit.userData.label],
      ['Reef Entry', 'Bubble Current', 'Pearl Arch']);
    assert.equal(current.userData.kind, 'interaction');
    assert.equal(current.getObjectByName('current-interaction-target').userData.interactionId, 'bubble-current');
    assert.ok(entry.getObjectByName('entry-landing'));
    kit.group.updateMatrixWorld(true);
    const opening = new THREE.Box3(new THREE.Vector3(-1, 0.3, -4.1), new THREE.Vector3(1, 1.2, -3.9));
    exit.traverse(item => {
      if (item.isMesh) assert.equal(new THREE.Box3().setFromObject(item).intersectsBox(opening), false, item.name);
    });
    kit.group.position.set(10, 2, 1);
    assert.deepEqual(exit.getWorldPosition(new THREE.Vector3()).toArray(), [10, 2, -3]);
  } finally { kit.dispose(); }
});

test('layout is seeded, deterministic, bounded, and uses shared primitive resources only', () => {
  const kits = [createBubbleReefRouteKit(), createBubbleReefRouteKit(), createBubbleReefRouteKit({ seed: 0 })];
  try {
    assert.deepEqual(snapshot(kits[0].group), snapshot(kits[1].group));
    assert.notDeepEqual(snapshot(kits[0].group), snapshot(kits[2].group));
    const geometries = new Set();
    let triangles = 0;
    let meshes = 0;
    kits[0].group.traverse(item => {
      if (!item.isMesh) return;
      meshes++;
      assert.match(item.geometry.type, /^(Cylinder|Sphere|Icosahedron|Torus|Cone)Geometry$/);
      for (const value of Object.values(item.material)) assert.ok(!value?.isTexture);
      geometries.add(item.geometry);
      triangles += (item.geometry.index?.count ?? item.geometry.attributes.position.count) / 3;
    });
    assert.equal(geometries.size, 6);
    assert.ok(meshes < 80, `meshes: ${meshes}`);
    assert.ok(triangles < 15000, `triangles: ${triangles}`);
    const bounds = new THREE.Box3().setFromObject(kits[0].group);
    assert.ok(bounds.min.x > -3 && bounds.max.x < 3);
    assert.ok(bounds.min.y > -0.5 && bounds.max.y < 3.1);
    assert.ok(bounds.min.z > -5 && bounds.max.z < 5.1);
  } finally { kits.forEach(kit => kit.dispose()); }
});

test('absolute-time updates are repeatable and reduced motion restores a static pose', () => {
  const kit = createBubbleReefRouteKit();
  try {
    const resting = snapshot(kit.group);
    kit.update(7);
    const moving = snapshot(kit.group);
    assert.notDeepEqual(moving, resting);
    kit.update(12);
    kit.update(7);
    assert.deepEqual(snapshot(kit.group), moving);
    for (const time of [0, 8, 100]) {
      kit.update(time, true);
      assert.deepEqual(snapshot(kit.group), resting);
    }
    for (const time of [NaN, Infinity, -Infinity]) {
      kit.update(time);
      assert.deepEqual(snapshot(kit.group), resting);
    }
    for (const time of [-3, 1e100, Number.MAX_VALUE]) {
      kit.update(time);
      kit.group.traverse(item => assert.ok(item.position.toArray().every(Number.isFinite)));
    }
    kit.update(7, false);
    assert.deepEqual(snapshot(kit.group), moving);
  } finally { kit.dispose(); }
});

test('construction motion preference can be overridden per frame', () => {
  const kit = createBubbleReefRouteKit({ reducedMotion: true });
  try {
    const resting = snapshot(kit.group);
    kit.update(8);
    assert.deepEqual(snapshot(kit.group), resting);
    kit.update(8, false);
    assert.notDeepEqual(snapshot(kit.group), resting);
    kit.update(9);
    assert.deepEqual(snapshot(kit.group), resting);
  } finally { kit.dispose(); }
});

test('disposal is idempotent, detaches the route, and preserves foreign resources', () => {
  const a = createBubbleReefRouteKit();
  const b = createBubbleReefRouteKit();
  const scene = new THREE.Scene();
  const foreign = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  scene.add(a.group, b.group, foreign);
  const owned = new Set();
  a.group.traverse(item => {
    if (item.isMesh) { owned.add(item.geometry); owned.add(item.material); }
  });
  const calls = new Map();
  owned.forEach(resource => resource.addEventListener('dispose', () => {
    calls.set(resource, (calls.get(resource) ?? 0) + 1);
  }));
  let foreignDisposals = 0;
  scene.traverse(item => {
    for (const resource of [item.geometry, item.material]) {
      if (resource && !owned.has(resource)) resource.addEventListener('dispose', () => foreignDisposals++);
    }
  });
  const before = snapshot(b.group);
  a.landmarks['bubble-current'].add(foreign);
  a.dispose();
  a.dispose();
  a.update(100);
  assert.equal(calls.size, owned.size);
  assert.ok([...calls.values()].every(count => count === 1));
  assert.equal(foreignDisposals, 0);
  assert.equal(a.group.parent, null);
  assert.equal(a.group.children.length, 0);
  assert.ok(Object.values(a.landmarks).every(anchor => anchor.children.length === 0));
  assert.equal(b.group.parent, scene);
  assert.deepEqual(snapshot(b.group), before);
  b.dispose();
  foreign.geometry.dispose();
  foreign.material.dispose();
});

test('invalid seeds are rejected and unsigned boundary seeds work', () => {
  for (const seed of [-1, 0.5, NaN, Infinity, '731', null, 0x100000000]) {
    assert.throws(() => createBubbleReefRouteKit({ seed }), RangeError);
  }
  for (const seed of [0, 0xffffffff]) createBubbleReefRouteKit({ seed }).dispose();
});
