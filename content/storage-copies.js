/* BrainBite save-generation policy.
 *
 * These are the rules that decide which of the three local slots (primary, backup,
 * recovery) is written, in which order, and how a load reconciles them. They are the most
 * safety-critical logic in the app and used to be testable only through slow browser
 * tests, so the policy lives here as pure functions over an injected storage and reader.
 *
 * `read(key)` must return the parsed, validated store for that key, or null. It is
 * supplied by app.js so parsing and migration stay in one place.
 */
(function (root) {
  'use strict';

  const DEFAULT_KEYS = Object.freeze({
    primary: 'bb-core-v3',
    backup: 'bb-core-v3-back',
    recovery: 'bb-core-v3-recovery',
  });

  // Newest first: the primary is authoritative when it is readable.
  function readAll(read, keys = DEFAULT_KEYS) {
    for (const key of [keys.primary, keys.backup, keys.recovery]) {
      const copy = read(key);
      if (copy) return [copy];
    }
    return [];
  }

  // Every readable generation, oldest first, so the newest wins any overlapping scalar.
  function readEvery(read, keys = DEFAULT_KEYS) {
    const copies = [];
    for (const key of [keys.recovery, keys.backup, keys.primary]) {
      const copy = read(key);
      if (copy) copies.push(copy);
    }
    return copies;
  }

  // Ordinary autosave: rotate distinct generations so a corrupt primary always has a
  // distinct known-good sibling. The oldest slot is written first so an interrupted
  // write still leaves a usable snapshot behind.
  function writeRotated(storage, keys, store, read) {
    const payload = JSON.stringify(store);
    const primary = read(keys.primary);
    const backup = read(keys.backup);
    const validPrimary = primary ? JSON.stringify(primary) : null;
    const validBackup = backup ? JSON.stringify(backup) : null;
    storage.setItem(keys.recovery, validBackup || validPrimary || payload);
    storage.setItem(keys.backup, validPrimary || payload);
    storage.setItem(keys.primary, payload);
    return payload;
  }

  // Reconciliation: only safe once the generations have been unioned, because the merged
  // state is then a superset of every slot. Skips writes that would change nothing.
  function converge(storage, keys, store) {
    const payload = JSON.stringify(store);
    for (const key of [keys.recovery, keys.backup, keys.primary]) {
      if (storage.getItem(key) !== payload) storage.setItem(key, payload);
    }
    return payload;
  }

  // Native save mirror (store apps only). The WebView's storage can be cleared by the OS
  // or on reinstall, so native shells keep one more copy outside it. It is a last resort:
  // it is used only when none of the three web generations is readable, so it can never
  // roll back a newer web save.
  const MIRROR_KEY = 'bb-core-v3-native-mirror';

  function shouldRestoreFromMirror(read, keys = DEFAULT_KEYS) {
    return readAll(read, keys).length === 0;
  }

  // `parse(raw)` is app.js's validating reader. Returns the store to restore, or null.
  function restoreFromMirror(raw, parse) {
    if (typeof raw !== 'string' || !raw) return null;
    let store = null;
    try { store = parse(raw); } catch { return null; }
    return store && Array.isArray(store.profiles) && store.profiles.length > 0 ? store : null;
  }

  root.BrainBiteStorageCopies = Object.freeze({ DEFAULT_KEYS, MIRROR_KEY, readAll, readEvery, writeRotated, converge, shouldRestoreFromMirror, restoreFromMirror });
})(typeof window !== 'undefined' ? window : globalThis);
