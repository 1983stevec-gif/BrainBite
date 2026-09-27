import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// presentation/platform.js is a classic script; load it into a fresh fake window per case.
const source = readFileSync(new URL('../presentation/platform.js', import.meta.url), 'utf8');
function load(win) {
  const storage = new Map();
  const root = {
    location: { search: '', href: 'https://example.test/app/index.html', origin: 'https://example.test' },
    localStorage: { getItem: key => (storage.has(key) ? storage.get(key) : null), setItem: (key, value) => storage.set(key, String(value)) },
    dispatchEvent: () => true,
    open: () => null,
    ...win,
  };
  new Function('window', `${source}\nreturn window;`)(root);
  return { platform: root.BrainBitePlatform, root, storage };
}

test('plain web build: not native, no mirror, haptics are a no-op', async () => {
  const { platform } = load({});
  assert.equal(platform.kind(), 'web');
  assert.equal(platform.isNativeShell(), false);
  assert.equal(platform.nativeStore.available(), false);
  assert.equal(await platform.nativeStore.get('k'), null);
  assert.equal(await platform.nativeStore.set('k', 'v'), false);
  assert.equal(await platform.haptic('correct'), false);
  assert.equal(await platform.exitApp(), false);
});

test('Capacitor native: detected, Preferences backs the mirror, Haptics and App are used', async () => {
  const prefs = new Map(), calls = [];
  let backListener = null;
  const Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      Preferences: { get: async ({ key }) => ({ value: prefs.has(key) ? prefs.get(key) : null }), set: async ({ key, value }) => { prefs.set(key, value); } },
      Haptics: { impact: async opts => calls.push(['impact', opts.style]), notification: async opts => calls.push(['notification', opts.type]) },
      App: { addListener: (name, fn) => { if (name === 'backButton') backListener = fn; }, exitApp: async () => calls.push(['exit']) },
    },
  };
  const events = [];
  const { platform } = load({ Capacitor, dispatchEvent: event => events.push(event.type), CustomEvent: class { constructor(type) { this.type = type; } } });
  assert.equal(platform.kind(), 'capacitor');
  assert.equal(platform.nativeStore.available(), true);
  await platform.nativeStore.set('bb-core-v3-native-mirror', '{"profiles":[]}');
  assert.equal(await platform.nativeStore.get('bb-core-v3-native-mirror'), '{"profiles":[]}');
  await platform.haptic('correct');
  await platform.haptic('wrong');
  assert.equal(await platform.exitApp(), true);
  assert.deepEqual(calls, [['impact', 'LIGHT'], ['notification', 'ERROR'], ['exit']]);
  assert.equal(typeof backListener, 'function');
  backListener();
  assert.deepEqual(events, ['bb:native-back']);
});

test('Capacitor on the web (isNativePlatform false) is still the web build', () => {
  const { platform } = load({ Capacitor: { isNativePlatform: () => false, Plugins: {} } });
  assert.equal(platform.kind(), 'web');
});

test('Tauri is a native shell without a mirror store', () => {
  const { platform } = load({ __TAURI_INTERNALS__: {} });
  assert.equal(platform.kind(), 'tauri');
  assert.equal(platform.isNativeShell(), true);
  assert.equal(platform.nativeStore.available(), false);
});

test('?native=1 simulation keeps its mirror under a separate localStorage key', async () => {
  const { platform, storage } = load({ location: { search: '?native=1', href: 'https://example.test/?native=1', origin: 'https://example.test' } });
  assert.equal(platform.kind(), 'simulated');
  await platform.nativeStore.set('bb-core-v3-native-mirror', 'x');
  assert.equal(storage.get('bb-native-sim:bb-core-v3-native-mirror'), 'x');
  assert.equal(storage.has('bb-core-v3-native-mirror'), false);
});

test('isExternalUrl: bundled pages stay inside, other origins leave the app', () => {
  const { platform } = load({});
  assert.equal(platform.isExternalUrl('privacy.html'), false);
  assert.equal(platform.isExternalUrl('https://example.test/support.html'), false);
  assert.equal(platform.isExternalUrl('https://github.com/1983stevec-gif/BrainBite/issues'), true);
  assert.equal(platform.isExternalUrl('mailto:help@example.com'), true);
});
