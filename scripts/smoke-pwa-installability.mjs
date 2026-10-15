/** Gate 8.4 PWA installability evidence: manifest + icons + SW + install UI hook */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);
// Derived from this module so the check works on any checkout. It used to hardcode
// `D:/Codex/Brainbite`, which made every icon lookup fail on the Linux CI runner.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function run(channel) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  } catch (e) {
    const error = String(e.message || e);
    // A skip is only possible here, before a browser exists. Navigation, runtime,
    // and other launch failures must fail even when Edge is optional on this host.
    const missingExecutable = /^(?:browserType\.launch: )?(?:Chromium distribution 'msedge' is not found at [^\r\n]*[\\/]msedge(?:\.exe)?|Executable doesn't exist at [^\r\n]*[\\/]msedge(?:\.exe)?)(?:\r?\n|$)/i.test(error);
    if (channel === 'msedge' && missingExecutable) return { channel, skipped: true, reason: error };
    throw e;
  }
  try {
    const page = await browser.newPage();
    const phase = message => console.log(`[${channel || 'chromium'}] ${message}`);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    phase('opening app');
    await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
    phase('clearing worker and cache');
    await page.evaluate(async () => {
      for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      for (const k of await caches.keys()) await caches.delete(k);
    });
    await page.reload({ waitUntil: 'load', timeout: 45000 });
    phase('checking manifest and worker readiness');

    const manifestRes = await page.request.get(`${base}/manifest.webmanifest`);
    const manifest = await manifestRes.json();
    const iconsOk = (manifest.icons || []).every((icon) => fs.existsSync(path.join(root, icon.src)));
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return Boolean(registration?.active && navigator.serviceWorker.controller);
    }, null, { timeout: 45000 });
    const sw = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return { ready: !!reg, controlling: !!navigator.serviceWorker.controller };
    });
    const hasInstallBtn = await page.evaluate(() => !!document.getElementById('installBtn'));

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
  } finally {
    await browser.close();
  }
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
if (!ok(edge) && !edge.skipped) {
  console.error('PWA INSTALLABILITY EDGE FAIL');
  process.exit(1);
}
console.log(ok(edge) ? 'PWA INSTALLABILITY CHROME+EDGE PASS' : 'PWA INSTALLABILITY CHROME PASS (Edge executable unavailable: SKIPPED)');
