import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// content/storage-copies.js is a classic script that attaches to the global object, so it
// loads here exactly as the browser loads it.
const source = readFileSync(new URL('../content/storage-copies.js', import.meta.url), 'utf8');
const sandbox = {};
new Function('window', 'globalThis', `${source}\nreturn window;`)(sandbox, sandbox);
const { DEFAULT_KEYS, readAll, readEvery, writeRotated, converge } = sandbox.BrainBiteStorageCopies;

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const writes = [];
  return {
    data,
    writes,
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { writes.push(key); data.set(key, String(value)); },
  };
}
const store = name => ({ profiles: [{ id: 'p1', name }] });
const nameOf = raw => JSON.parse(raw).profiles[0].name;
// Mirrors app.js: parse, and treat anything without a profiles array as unreadable.
const readerFor = storage => key => {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.profiles) ? parsed : null;
  } catch { return null; }
};

test('rotation keeps three distinct generations and moves the primary to backup', () => {
  const storage = fakeStorage({
    [DEFAULT_KEYS.primary]: JSON.stringify(store('two')),
    [DEFAULT_KEYS.backup]: JSON.stringify(store('one')),
    [DEFAULT_KEYS.recovery]: JSON.stringify(store('zero')),
  });
  writeRotated(storage, DEFAULT_KEYS, store('three'), readerFor(storage));
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.primary)), 'three');
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.backup)), 'two');
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.recovery)), 'one');
});

test('rotation writes the oldest slot first so an interrupted write leaves a snapshot', () => {
  const storage = fakeStorage({
    [DEFAULT_KEYS.primary]: JSON.stringify(store('one')),
    [DEFAULT_KEYS.backup]: JSON.stringify(store('zero')),
  });
  const order = [];
  const original = storage.setItem;
  storage.setItem = (key, value) => { order.push(key); original(key, value); };
  writeRotated(storage, DEFAULT_KEYS, store('two'), readerFor(storage));
  assert.deepEqual(order, [DEFAULT_KEYS.recovery, DEFAULT_KEYS.backup, DEFAULT_KEYS.primary]);
});

test('rotation survives a corrupt primary and a corrupt backup', () => {
  const storage = fakeStorage({
    [DEFAULT_KEYS.primary]: '{broken',
    [DEFAULT_KEYS.backup]: '{"profiles":null}',
  });
  writeRotated(storage, DEFAULT_KEYS, store('fresh'), readerFor(storage));
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.primary)), 'fresh');
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.backup)), 'fresh');
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.recovery)), 'fresh');
});

test('readAll prefers the primary and falls back only when a copy is unreadable', () => {
  const healthy = fakeStorage({
    [DEFAULT_KEYS.primary]: JSON.stringify(store('primary')),
    [DEFAULT_KEYS.backup]: JSON.stringify(store('backup')),
    [DEFAULT_KEYS.recovery]: JSON.stringify(store('recovery')),
  });
  assert.deepEqual(readAll(readerFor(healthy), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['primary']);

  const corruptPrimary = fakeStorage({
    [DEFAULT_KEYS.primary]: '{broken',
    [DEFAULT_KEYS.backup]: JSON.stringify(store('backup')),
    [DEFAULT_KEYS.recovery]: JSON.stringify(store('recovery')),
  });
  assert.deepEqual(readAll(readerFor(corruptPrimary), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['backup']);

  const onlyRecovery = fakeStorage({ [DEFAULT_KEYS.recovery]: JSON.stringify(store('recovery')) });
  assert.deepEqual(readAll(readerFor(onlyRecovery), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['recovery']);

  assert.deepEqual(readAll(readerFor(fakeStorage()), DEFAULT_KEYS), []);
});

test('readEvery returns every readable generation oldest first', () => {
  const storage = fakeStorage({
    [DEFAULT_KEYS.primary]: JSON.stringify(store('primary')),
    [DEFAULT_KEYS.backup]: '{broken',
    [DEFAULT_KEYS.recovery]: JSON.stringify(store('recovery')),
  });
  assert.deepEqual(readEvery(readerFor(storage), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['recovery', 'primary']);
});

test('converge writes every slot and is idempotent', () => {
  const storage = fakeStorage({ [DEFAULT_KEYS.primary]: JSON.stringify(store('one')) });
  converge(storage, DEFAULT_KEYS, store('merged'));
  for (const key of [DEFAULT_KEYS.primary, DEFAULT_KEYS.backup, DEFAULT_KEYS.recovery]) {
    assert.equal(nameOf(storage.getItem(key)), 'merged');
  }
  storage.writes.length = 0;
  converge(storage, DEFAULT_KEYS, store('merged'));
  assert.deepEqual(storage.writes, [], 'a converged store must not be rewritten');
});

test('a storage that throws propagates so the caller can report it', () => {
  const storage = {
    getItem: () => null,
    setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); },
  };
  assert.throws(() => writeRotated(storage, DEFAULT_KEYS, store('x'), readerFor(storage)), /quota/);
  assert.throws(() => converge(storage, DEFAULT_KEYS, store('x')), /quota/);
});

test('a failed read never produces a partial generation set', () => {
  // Every slot unreadable: rotation must still leave a usable primary.
  const storage = fakeStorage({
    [DEFAULT_KEYS.primary]: 'not json',
    [DEFAULT_KEYS.backup]: '{"profiles":false}',
    [DEFAULT_KEYS.recovery]: '',
  });
  writeRotated(storage, DEFAULT_KEYS, store('only'), readerFor(storage));
  assert.deepEqual(readAll(readerFor(storage), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['only']);
  assert.deepEqual(readEvery(readerFor(storage), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['only', 'only', 'only']);
});

// M2 native save mirror.
const { MIRROR_KEY, shouldRestoreFromMirror, restoreFromMirror } = sandbox.BrainBiteStorageCopies;
const parseStore = raw => { const parsed = JSON.parse(raw); return parsed && Array.isArray(parsed.profiles) ? parsed : null; };

test('the native mirror has its own key, outside the three web generations', () => {
  assert.equal(MIRROR_KEY, 'bb-core-v3-native-mirror');
  assert.ok(!Object.values(DEFAULT_KEYS).includes(MIRROR_KEY));
});

test('the mirror is consulted only when no web generation is readable', () => {
  assert.equal(shouldRestoreFromMirror(readerFor(fakeStorage())), true);
  assert.equal(shouldRestoreFromMirror(readerFor(fakeStorage({ [DEFAULT_KEYS.primary]: '{broken', [DEFAULT_KEYS.backup]: 'null' }))), true);
  assert.equal(shouldRestoreFromMirror(readerFor(fakeStorage({ [DEFAULT_KEYS.recovery]: JSON.stringify(store('old')) }))), false);
});

test('restoreFromMirror accepts only a valid store with at least one profile', () => {
  assert.equal(nameOf(JSON.stringify(restoreFromMirror(JSON.stringify(store('kid')), parseStore))), 'kid');
  assert.equal(restoreFromMirror(null, parseStore), null);
  assert.equal(restoreFromMirror('', parseStore), null);
  assert.equal(restoreFromMirror('{broken', parseStore), null);
  assert.equal(restoreFromMirror(JSON.stringify({ profiles: [] }), parseStore), null);
  assert.equal(restoreFromMirror(JSON.stringify({ nope: true }), parseStore), null);
});
