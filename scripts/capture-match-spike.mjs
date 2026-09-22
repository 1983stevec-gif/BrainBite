/** Capture MATCH home + battle proofs into docs/references/spike/ */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs', 'references', 'spike');
fs.mkdirSync(out, { recursive: true });
const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));

await page.goto(`${base}/?match=1&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
await page.evaluate(async () => {
  localStorage.clear();
  localStorage.setItem('bb-presentation', 'match');
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
});
await page.reload({ waitUntil: 'load', timeout: 45000 });
await page.waitForSelector('.match-home .match-plate', { timeout: 15000 });
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(out, 'home-live.png'), fullPage: false });

await page.locator('.hs-portal').click();
await page.waitForSelector('.match-battle .match-plate', { timeout: 10000 });
await page.waitForSelector('.match-live-health.on', { timeout: 10000 });
await page.locator('.hs-pillar-2').click();
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(out, 'battle-live.png'), fullPage: false });
await page.screenshot({ path: path.join(out, 'battle-fx-hit.png'), fullPage: false });

await browser.close();
console.log('Wrote', path.join(out, 'home-live.png'), path.join(out, 'battle-live.png'));
