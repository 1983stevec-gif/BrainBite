/** Gate 8.4 agent-side viewport matrix (not a substitute for real devices) */
import { chromium } from '@playwright/test';
import { openWorld } from './lib/smoke-nav.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, '..', 'docs', 'references', 'spike');
const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'phone-360', width: 360, height: 740 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 1366 },
  { name: 'desktop-1280', width: 1280, height: 800 },
];

async function prep(page) {
  await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem('bb-presentation', 'dom');
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
  await page.reload({ waitUntil: 'load', timeout: 45000 });
}

const browser = await chromium.launch({ headless: true });
const rows = [];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await prep(page);
  const boot = await page.evaluate(() => ({
    title: document.querySelector('h1')?.textContent || '',
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    home: !!document.getElementById('home')?.classList.contains('show'),
    match: document.documentElement.classList.contains('presentation-match'),
  }));
  await openWorld(page, 'Number Nebula');
  await page.locator('#mathList button', { hasText: 'Play' }).first().click();
  await page.waitForSelector('#game.show', { timeout: 10000 });
  const prompt = (await page.locator('#prompt').textContent() || '').slice(0, 60);
  await page.evaluate(() => localStorage.setItem('bb-matrix-smoke', '1'));
  await page.reload({ waitUntil: 'load' });
  const persist = await page.evaluate(() => localStorage.getItem('bb-matrix-smoke') === '1');
  const shot = path.join(outDir, `gate84-${vp.name}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  rows.push({
    ...vp,
    boot,
    prompt,
    persist,
    errors: errors.slice(0, 3),
    shot: path.relative(path.join(root, '..'), shot),
    pass: boot.title.includes('BrainBite') && !boot.overflow && !boot.match && persist && errors.length === 0,
  });
  await page.close();
}

await browser.close();
const report = path.join(outDir, 'gate84-viewport-matrix.json');
fs.writeFileSync(report, JSON.stringify({ at: new Date().toISOString(), rows }, null, 2));
console.log(JSON.stringify(rows, null, 2));
const all = rows.every((r) => r.pass);
console.log(all ? 'MATRIX PASS' : 'MATRIX FAIL');
process.exit(all ? 0 : 1);
