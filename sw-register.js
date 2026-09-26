// Inside a native store shell (Capacitor/Tauri) every asset is bundled with the app, so a
// service worker can only serve stale copies after an app update. Skip it there and
// remove any worker an earlier build registered. The web/PWA build registers as before.
(function () {
  if (!('serviceWorker' in navigator)) return;
  const native = window.BrainBitePlatform && window.BrainBitePlatform.isNativeShell();
  if (native) {
    window.BrainBiteServiceWorker = 'skipped-native';
    navigator.serviceWorker.getRegistrations?.().then(list => list.forEach(registration => registration.unregister())).catch(() => {});
    return;
  }
  window.BrainBiteServiceWorker = 'registered';
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
})();
