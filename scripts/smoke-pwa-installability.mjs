/** Gate 8.4 PWA installability evidence (Windows): manifest + icons + SW + install UI hook */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);
const root = path.resolve('D:/Codex/Brainbite');

async function run(channel) {
  const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
  await page.reload({ waitUntil: 'load', timeout: 45000 });

  const manifestRes = await page.request.get(`${base}/manifest.webmanifest`);
  const manifest = await manifestRes.json();
  const iconsOk = (manifest.icons || []).every((icon) => fs.existsSync(path.join(root, icon.src)));
  const sw = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const reg = await navigator.serviceWorker.getRegistration();
    return { ready: !!reg, controlling: !!navigator.serviceWorker.controller };
  });
  const hasInstallBtn = await page.evaluate(() => !!document.getElementById('installBtn'));

  await browser.close();
  return {
    channel: channel || 'chromium',
    manifestOk: manifestRes.ok(),
    name: manifest.name || manifest.short_name,
    display: manifest.display,
    startUrl: manifest.start_url,
    iconsOk,
    iconCount: (manifest.icons || []).length,
    sw,
    hasInstallBtn,
    errors: errors.slice(0, 3),
  };
}

const chrome = await run(undefined);
let edge = null;
try {
  edge = await run('msedge');
} catch (e) {
  edge = { channel: 'msedge', error: String(e.message || e) };
}

console.log(JSON.stringify({ chrome, edge }, null, 2));

const ok = (r) =>
  r &&
  !r.error &&
  r.manifestOk &&
  r.display === 'standalone' &&
  r.iconsOk &&
  r.iconCount >= 2 &&
  r.sw?.ready &&
  r.hasInstallBtn &&
  !r.errors?.length;

if (!ok(chrome)) {
  console.error('PWA INSTALLABILITY CHROME FAIL');
  process.exit(1);
}
console.log(ok(edge) ? 'PWA INSTALLABILITY CHROME+EDGE PASS' : 'PWA INSTALLABILITY CHROME PASS (Edge partial)');
