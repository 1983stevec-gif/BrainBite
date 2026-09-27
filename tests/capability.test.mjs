import test from 'node:test';
import assert from 'node:assert/strict';

// capability.mjs reads browser globals at call time, so give it a minimal window.
const storage = new Map();
globalThis.location = { search: '' };
globalThis.localStorage = { getItem: key => (storage.has(key) ? storage.get(key) : null), setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key), clear: () => storage.clear() };
const setNavigator = value => Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
setNavigator({});

const { requestedPresentation, constrainedDevice } = await import('../presentation/capability.mjs');

test('constrainedDevice is conservative: only Save-Data or very low memory/cores', () => {
  assert.equal(constrainedDevice({}), false);
  assert.equal(constrainedDevice({ deviceMemory: 4, hardwareConcurrency: 4 }), false);
  assert.equal(constrainedDevice({ deviceMemory: 2 }), true);
  assert.equal(constrainedDevice({ hardwareConcurrency: 2 }), true);
  assert.equal(constrainedDevice({ connection: { saveData: true } }), true);
  assert.equal(constrainedDevice(undefined), false);
});

test('an unconstrained device with no choice defaults to webgl', () => {
  storage.clear();
  setNavigator({ deviceMemory: 8, hardwareConcurrency: 8 });
  globalThis.location = { search: '' };
  assert.equal(requestedPresentation(), 'webgl');
});

test('a constrained device with no choice defaults to dom, but explicit and stored choices still win', () => {
  storage.clear();
  setNavigator({ deviceMemory: 2, hardwareConcurrency: 2 });
  globalThis.location = { search: '' };
  assert.equal(requestedPresentation(), 'dom');
  globalThis.location = { search: '?webgl=1' };
  assert.equal(requestedPresentation(), 'webgl');
  globalThis.location = { search: '' };
  storage.set('bb-presentation', 'webgl');
  assert.equal(requestedPresentation(), 'webgl');
});
