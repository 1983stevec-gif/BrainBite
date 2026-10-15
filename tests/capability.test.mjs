import test from 'node:test';
import assert from 'node:assert/strict';

// capability.mjs reads browser globals at call time, so give it a minimal window.
const storage = new Map();
globalThis.location = { search: '' };
globalThis.localStorage = { getItem: key => (storage.has(key) ? storage.get(key) : null), setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key), clear: () => storage.clear() };
const setNavigator = value => Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
setNavigator({});

const { requestedPresentation, constrainedDevice, matchPreviewAllowed, matchNeedsPortraitFallback, shouldEnableMatch } = await import('../presentation/capability.mjs');

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

test('MATCH preview is fail-closed outside the authoritative internal-review mode', () => {
  assert.equal(matchPreviewAllowed(undefined), false);
  assert.equal(matchPreviewAllowed({ getRuntimeMode: () => 'production' }), false);
  assert.equal(matchPreviewAllowed({ getRuntimeMode: () => { throw new Error('unavailable'); } }), false);
  assert.equal(matchPreviewAllowed({ getRuntimeMode: () => 'internal-review' }), true);
});

test('portrait fallback preserves the requested MATCH preference and wide preview contract', () => {
  storage.clear();
  storage.set('bb-presentation', 'match');
  globalThis.location = { search: '' };
  globalThis.BrainBiteContentControl = { getRuntimeMode: () => 'internal-review' };
  for (const [innerWidth, innerHeight, fallback] of [[320, 844, true], [390, 844, true], [768, 1024, true], [1280, 800, false], [1024, 682, false]]) {
    Object.assign(globalThis, { innerWidth, innerHeight });
    assert.equal(matchNeedsPortraitFallback(), fallback);
    assert.equal(shouldEnableMatch(), !fallback);
    assert.equal(requestedPresentation(), 'match');
    assert.equal(storage.get('bb-presentation'), 'match');
  }
  globalThis.BrainBiteContentControl = { getRuntimeMode: () => 'production' };
  assert.equal(shouldEnableMatch(), false);
  globalThis.location = { search: '?presentation=match&release=1' };
  assert.equal(shouldEnableMatch(), false);
});
