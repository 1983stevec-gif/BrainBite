/* BrainBite platform bridge (M2 mobile runtime readiness).
 *
 * One place that knows whether the game runs inside a native store shell (Capacitor on
 * iOS/Android, Tauri on Windows) or as the web/PWA build, and that wraps the few native
 * services the game uses. Everything here degrades to a no-op on the web, so app.js can
 * call it unconditionally.
 *
 * Classic script: it must run before sw-register.js and app.js, which are classic too.
 *
 * `?native=1` simulates a native shell for tests only: it enables the native code paths
 * (no service worker, gated outbound links, back-button handling) and backs the native
 * save mirror with a separate localStorage key, so a test can wipe the three web
 * generations and prove the mirror restores them.
 */
(function (root) {
  'use strict';

  const SIMULATED_MIRROR_PREFIX = 'bb-native-sim:';

  function capacitor() {
    try { return root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform() ? root.Capacitor : null; } catch { return null; }
  }
  function tauri() {
    try { return root.__TAURI_INTERNALS__ ? root.__TAURI_INTERNALS__ : null; } catch { return null; }
  }
  function simulated() {
    try { return new URLSearchParams(root.location && root.location.search || '').get('native') === '1'; } catch { return false; }
  }
  function kind() {
    if (capacitor()) return 'capacitor';
    if (tauri()) return 'tauri';
    if (simulated()) return 'simulated';
    return 'web';
  }
  function isNativeShell() { return kind() !== 'web'; }
  function plugin(name) {
    const cap = capacitor();
    return cap && cap.Plugins ? cap.Plugins[name] || null : null;
  }

  // A web URL that leaves the app. Relative links (privacy.html) stay inside the bundle.
  function isExternalUrl(href) {
    try {
      const url = new URL(href, root.location.href);
      return url.origin !== root.location.origin;
    } catch { return false; }
  }

  // Opens a link outside the game. Callers must already have passed the parental gate.
  async function openExternal(href) {
    const browser = plugin('Browser');
    if (browser && browser.open) { await browser.open({ url: href }); return 'native-browser'; }
    try { root.open(href, '_blank', 'noopener,noreferrer'); } catch {}
    return 'window';
  }

  // Native key-value mirror of the save, outside the WebView's storage (which the OS can
  // clear). Capacitor Preferences on iOS/Android; a separate key when simulated; none on web.
  const nativeStore = {
    available() { return !!plugin('Preferences') || kind() === 'simulated'; },
    async get(key) {
      const prefs = plugin('Preferences');
      if (prefs) { const result = await prefs.get({ key }); return result && typeof result.value === 'string' ? result.value : null; }
      if (kind() === 'simulated') { try { return root.localStorage.getItem(SIMULATED_MIRROR_PREFIX + key); } catch { return null; } }
      return null;
    },
    async set(key, value) {
      const prefs = plugin('Preferences');
      if (prefs) { await prefs.set({ key, value: String(value) }); return true; }
      if (kind() === 'simulated') { try { root.localStorage.setItem(SIMULATED_MIRROR_PREFIX + key, String(value)); return true; } catch { return false; } }
      return false;
    },
  };

  // Light tap for a correct answer, double buzz for a wrong one. Native only; the caller
  // decides whether the player allowed it (Vibration setting, reduced motion).
  let lastHaptic = null;
  async function haptic(type) {
    lastHaptic = type;
    const haptics = plugin('Haptics');
    if (!haptics) return false;
    try {
      if (type === 'wrong') {
        if (haptics.notification) await haptics.notification({ type: 'ERROR' });
        else { await haptics.vibrate({ duration: 40 }); await haptics.vibrate({ duration: 40 }); }
      } else if (haptics.impact) await haptics.impact({ style: 'LIGHT' });
      return true;
    } catch { return false; }
  }

  async function exitApp() {
    const app = plugin('App');
    if (app && app.exitApp) { await app.exitApp(); return true; }
    return false;
  }

  // Android hardware back: the shell's default would close the WebView mid-game. Route it
  // to the game as an event instead; app.js decides what "back" means on each screen.
  function installBackButton() {
    const app = plugin('App');
    if (!app || !app.addListener) return false;
    try { app.addListener('backButton', () => root.dispatchEvent(new CustomEvent('bb:native-back'))); return true; } catch { return false; }
  }
  installBackButton();

  root.BrainBitePlatform = Object.freeze({
    kind,
    isNativeShell,
    isExternalUrl,
    openExternal,
    nativeStore,
    haptic,
    lastHaptic: () => lastHaptic,
    exitApp,
  });
})(typeof window !== 'undefined' ? window : globalThis);
