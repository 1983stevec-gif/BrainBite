/** Shipping-path PWA offline reload smoke (`?match=0&webgl=0`). */
import { chromium } from '@playwright/test';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });

await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready, null, {
  timeout: 20000,
}).catch(() => null);

await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  // Force install cache to settle
  await reg.update().catch(() => {});
});
await page.waitForTimeout(800);

// Warm shell assets while online so runtime cache has CSS/JS
await page.reload({ waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(500);

const online = await page.evaluate(() => ({
  mode: document.documentElement.className,
  nav: !!document.querySelector('nav'),
  home: !!document.getElementById('home')?.classList.contains('show'),
  sw: !!navigator.serviceWorker.controller,
  caches: typeof caches !== 'undefined',
}));

await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(700);

const offline = await page.evaluate(() => ({
  mode: document.documentElement.className,
  navVisible: !!document.querySelector('nav') && getComputedStyle(document.querySelector('nav')).display !== 'none',
  home: !!document.getElementById('home')?.classList.contains('show'),
  title: document.title || '',
  hasApp: !!document.querySelector('.app'),
  matchForced: document.documentElement.classList.contains('presentation-match'),
}));

await context.setOffline(false);
await browser.close();

const summary = { online, offline, errors: errors.slice(0, 5) };
console.log(JSON.stringify(summary, null, 2));

const ok =
  online.home &&
  offline.home &&
  offline.hasApp &&
  offline.navVisible &&
  !offline.matchForced &&
  !String(offline.mode || '').includes('presentation-match') &&
  errors.length === 0;

if (!ok) {
  console.error('OFFLINE RELOAD SMOKE FAIL');
  process.exit(1);
}
console.log('OFFLINE RELOAD SMOKE PASS');
