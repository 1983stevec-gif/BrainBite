/** MATCH lifecycle: pause/exit, mission complete → home, dispose passthrough. */
import { chromium } from '@playwright/test';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);

async function openMatch(page) {
  await page.goto(`${base}/?match=1&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(async () => {
    localStorage.setItem('bb-presentation', 'match');
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
  await page.reload({ waitUntil: 'load', timeout: 45000 });
  await page.waitForSelector('.match-home .match-plate', { timeout: 15000 });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await openMatch(page);

// Exit/pause hotspot remounts home
await page.locator('.hs-portal').click();
await page.waitForSelector('.match-battle .hs-pause', { timeout: 10000 });
await page.locator('.hs-pause').click();
await page.waitForSelector('.match-home .match-plate', { timeout: 10000 });
const afterExit = await page.evaluate(() => ({
  homePlate: !!document.querySelector('.match-home .match-plate'),
  battlePlate: !!document.querySelector('.match-battle .match-plate'),
  passthrough: document.documentElement.classList.contains('presentation-match-passthrough'),
  homeShow: !!document.getElementById('home')?.classList.contains('show'),
}));

// Settings hotspot → DOM passthrough with restored nav, then Home remounts MATCH
await page.locator('.hs-settings').click();
await page.waitForTimeout(300);
const onSettings = await page.evaluate(() => ({
  settings: !!document.getElementById('settings')?.classList.contains('show'),
  passthrough: document.documentElement.classList.contains('presentation-match-passthrough'),
  navDisplay: document.querySelector('nav') ? getComputedStyle(document.querySelector('nav')).display : 'none',
  homeLayer: !!document.querySelector('.match-home'),
}));
await page.locator('nav button[data-screen="home"]').click();
await page.waitForSelector('.match-home .match-plate', { timeout: 10000 });
const backHome = await page.evaluate(() => ({
  homePlate: !!document.querySelector('.match-home .match-plate'),
  passthrough: document.documentElement.classList.contains('presentation-match-passthrough'),
}));

// Mission complete under MATCH returns to usable home hub
await page.locator('.hs-portal').click();
await page.waitForSelector('.match-battle .hs-pillar-2', { timeout: 10000 });
await page.evaluate(() => {
  const G = window.BrainBiteGame?.getState?.();
  if (!G) throw new Error('no game state');
  G.eaten = Math.max(0, (G.total || 1) - 1);
  G.correct = G.eaten;
});
await page.locator('.hs-pillar-2').click();
await page.waitForSelector('.match-home .match-plate', { timeout: 10000 });
const afterComplete = await page.evaluate(() => ({
  homePlate: !!document.querySelector('.match-home .match-plate'),
  homeShow: !!document.getElementById('home')?.classList.contains('show'),
  worldShow: ['math', 'words', 'spanish'].some((id) => document.getElementById(id)?.classList.contains('show')),
  completed: (JSON.parse(localStorage.getItem('bb-core-v3') || '{}')?.profiles?.[0]?.completed || []),
  passthrough: document.documentElement.classList.contains('presentation-match-passthrough'),
  feedback: document.getElementById('feedback')?.textContent || '',
}));

await browser.close();

const summary = { afterExit, onSettings, backHome, afterComplete, errors: errors.slice(0, 5) };
console.log(JSON.stringify(summary, null, 2));

const ok =
  afterExit.homePlate &&
  !afterExit.battlePlate &&
  !afterExit.passthrough &&
  onSettings.settings &&
  onSettings.passthrough &&
  onSettings.navDisplay !== 'none' &&
  !onSettings.homeLayer &&
  backHome.homePlate &&
  !backHome.passthrough &&
  afterComplete.homePlate &&
  afterComplete.homeShow &&
  !afterComplete.worldShow &&
  !afterComplete.passthrough &&
  errors.length === 0;

if (!ok) {
  console.error('MATCH LIFECYCLE SMOKE FAIL');
  process.exit(1);
}
console.log('MATCH LIFECYCLE SMOKE PASS');
