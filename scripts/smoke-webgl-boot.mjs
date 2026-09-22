/** WebGL presentation boot + offline reload (vendor Three via SW). */
import { chromium } from '@playwright/test';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${base}/?webgl=1&match=0&bust=${Date.now()}`, { waitUntil: 'load', timeout: 60000 });
await page.evaluate(async () => {
  localStorage.setItem('bb-presentation', 'webgl');
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
});
await page.reload({ waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => document.documentElement.classList.contains('presentation-webgl'), null, { timeout: 20000 });
await page.evaluate(async () => {
  try { await navigator.serviceWorker.ready; } catch { /* ignore */ }
});
await page.waitForTimeout(1200);

const home = await page.evaluate(() => ({
  mode: document.documentElement.classList.contains('presentation-webgl'),
  canvas: !!document.querySelector('#home canvas'),
}));

await page.evaluate(() => window.BrainBiteGame?.startMission?.(1));
await page.waitForSelector('#game.show', { timeout: 15000 });
await page.waitForTimeout(1000);

const battleOnline = await page.evaluate(() => ({
  mode: document.documentElement.classList.contains('presentation-webgl'),
  canvas: !!document.querySelector('#game canvas'),
  prompt: (document.getElementById('prompt')?.textContent || '').slice(0, 80),
}));

// Warm SW caches then go offline and reload WebGL home
await page.goto(`${base}/?webgl=1&match=0&bust=${Date.now()}`, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2000);
await page.context().setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
const offline = await page.evaluate(() => ({
  mode: document.documentElement.classList.contains('presentation-webgl'),
  canvas: !!document.querySelector('#home canvas'),
}));
await page.context().setOffline(false);

await browser.close();
const summary = { home, battleOnline, offline, errors: errors.slice(0, 5) };
console.log(JSON.stringify(summary, null, 2));

if (!home.mode || !home.canvas || !battleOnline.canvas || !offline.mode || !offline.canvas || errors.length) {
  console.error('WEBGL BOOT SMOKE FAIL');
  process.exit(1);
}
console.log('WEBGL BOOT SMOKE PASS');
