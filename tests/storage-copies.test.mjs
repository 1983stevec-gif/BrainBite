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
// Mirrors app.js: legacy saves remain migration-readable, while modern boot
// generations need a bounded identity/shape check before selection. Import validation
// remains a separate app-level contract.
const modernId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const readerFor = storage => key => {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) return null;
    if (Object.hasOwn(parsed, 'schemaVersion') && (!Number.isInteger(parsed.schemaVersion) || parsed.schemaVersion < 1 || parsed.schemaVersion > 9)) return null;
    if (parsed.schemaVersion >= 8) {
      if (!Number.isInteger(parsed.active) || parsed.active < 0 || parsed.active >= parsed.profiles.length) return null;
      const ids = new Set();
      if (Object.hasOwn(parsed, 'deletedProfiles') && !Array.isArray(parsed.deletedProfiles)) return null;
      for (const profile of parsed.profiles) {
        if (!profile || typeof profile !== 'object' || Array.isArray(profile) || typeof profile.id !== 'string' || !modernId.test(profile.id) || ids.has(profile.id) || typeof profile.name !== 'string' || !profile.name.trim()) return null;
        ids.add(profile.id);
      }
      for (const tombstone of parsed.deletedProfiles || []) if (!tombstone || typeof tombstone.id !== 'string' || !modernId.test(tombstone.id) || ids.has(tombstone.id)) return null;
    }
    return parsed;
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

test('malformed modern primary falls back to a healthy backup before rotation', () => {
  const storage = fakeStorage({
    [DEFAULT_KEYS.primary]: JSON.stringify({ schemaVersion: 9, active: 0, profiles: [{}], deletedProfiles: [] }),
    [DEFAULT_KEYS.backup]: JSON.stringify({ schemaVersion: 9, active: 0, profiles: [{ id: 'backup-id', name: 'backup learner' }], deletedProfiles: [] }),
    [DEFAULT_KEYS.recovery]: JSON.stringify({ schemaVersion: 9, active: 0, profiles: [{ id: 'recovery-id', name: 'recovery learner' }], deletedProfiles: [] }),
  });
  assert.deepEqual(readAll(readerFor(storage), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['backup learner']);
  writeRotated(storage, DEFAULT_KEYS, { schemaVersion: 9, active: 0, profiles: [{ id: 'next-id', name: 'next learner' }], deletedProfiles: [] }, readerFor(storage));
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.primary)), 'next learner');
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.backup)), 'next learner');
  assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.recovery)), 'backup learner');
});

for (const [label, schemaVersion] of [['nonnumeric string', 'corrupt'], ['null', null], ['fraction', 7.5], ['future version', 10]]) {
  test(`declared ${label} schema falls back to backup and survives rotation`, () => {
    const storage = fakeStorage({
      [DEFAULT_KEYS.primary]: JSON.stringify({ schemaVersion, active: 0, profiles: [{}], deletedProfiles: [] }),
      [DEFAULT_KEYS.backup]: JSON.stringify({ schemaVersion: 9, active: 0, profiles: [{ id: 'backup-id', name: 'saved learner' }], deletedProfiles: [] }),
    });
    assert.deepEqual(readAll(readerFor(storage), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['saved learner']);
    writeRotated(storage, DEFAULT_KEYS, { schemaVersion: 9, active: 0, profiles: [{ id: 'backup-id', name: 'rotated learner' }], deletedProfiles: [] }, readerFor(storage));
    assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.primary)), 'rotated learner');
    assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.backup)), 'rotated learner');
    assert.equal(nameOf(storage.getItem(DEFAULT_KEYS.recovery)), 'saved learner');
  });
}

test('legacy generations remain readable for migration', () => {
  const storage = fakeStorage({
    [DEFAULT_KEYS.primary]: JSON.stringify({ active: 0, profiles: [{ name: 'legacy learner' }] }),
  });
  assert.deepEqual(readAll(readerFor(storage), DEFAULT_KEYS).map(entry => entry.profiles[0].name), ['legacy learner']);
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
