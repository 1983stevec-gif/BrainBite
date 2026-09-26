/** One-shot Completion Pusher smoke: shipping DOM + MATCH pillars */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorld } from './lib/smoke-nav.mjs';
import { referenceCaptureDir } from './lib/evidence-paths.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = referenceCaptureDir;
await import('node:fs').then(fs => fs.mkdirSync(out, { recursive: true }));
const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);

async function clearCaches(page) {
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
}

async function open(page, qs) {
  await page.goto(`${base}/?${qs}&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
  await clearCaches(page);
  await page.reload({ waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });
const results = [];

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, 'match=0&webgl=0');
  const mode = await page.evaluate(() => document.documentElement.className);
  const nav = await page.locator('#childDock').isVisible();
  await openWorld(page, 'Number Nebula');
  await page.locator('#mathList button', { hasText: 'Play' }).first().click();
  await page.waitForSelector('#game.show', { timeout: 10000 });
  const prompt = (await page.locator('#prompt').textContent() || '').slice(0, 80);
  await page.evaluate(() => localStorage.setItem('bb-8-4-smoke', '1'));
  await page.reload({ waitUntil: 'load' });
  const persist = await page.evaluate(() => localStorage.getItem('bb-8-4-smoke') === '1');
  results.push({ path: 'dom', mode, nav, prompt, persist, errors: errors.slice(0, 3) });
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, 'match=1');
  await page.waitForSelector('.match-home .match-plate', { timeout: 15000 });
  await page.locator('.hs-portal').click();
  await page.waitForSelector('.match-battle .hs-pillar-2', { timeout: 10000 });
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => ({
    fallsBox: (() => {
      const el = document.querySelector('.match-falls');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), spans: el.querySelectorAll('span').length };
    })(),
    choices: window.BrainBiteGame?.pillarChoices?.() || [],
    correct: window.BrainBiteGame?.getState?.()?.correct ?? null,
  }));
  await page.locator('.hs-pillar-2').click();
  await page.waitForTimeout(500);
  const hit = await page.evaluate(() => {
    const G = window.BrainBiteGame?.getState?.();
    return {
      toast: document.querySelector('.match-toast')?.textContent || '',
      show: !!document.querySelector('.match-toast')?.classList.contains('show'),
      ok: !!document.querySelector('.match-stage')?.classList.contains('match-ok'),
      correct: G?.correct ?? 0,
      combo: G?.combo ?? 0,
      liveCombo: document.querySelector('.match-live-combo')?.textContent || '',
      feedback: document.getElementById('feedback')?.textContent || '',
    };
  });
  await page.locator('.hs-pillar-0').click();
  await page.waitForTimeout(400);
  const miss = await page.evaluate(() => ({
    toast: document.querySelector('.match-toast')?.textContent || '',
    lives: window.BrainBiteGame?.getState?.()?.lives,
    wrong: window.BrainBiteGame?.getState?.()?.wrong,
  }));
  await page.screenshot({ path: path.join(out, 'battle-fx-hit.png') });
  results.push({ path: 'match', before, hit, miss, errors: errors.slice(0, 5) });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
const domOk = results[0]?.nav && results[0]?.persist && !results[0]?.mode?.includes('presentation-match');
const matchOk = results[1]?.hit?.correct >= 1 && results[1]?.hit?.show && results[1]?.miss?.wrong >= 1;
if (!domOk || !matchOk) {
  console.error('SMOKE FAIL', { domOk, matchOk });
  process.exit(1);
}
console.log('SMOKE PASS');
