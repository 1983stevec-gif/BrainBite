/** MATCH: non-fractions worlds play via DOM battle shell */
import { chromium } from '@playwright/test';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${base}/?match=1&bust=${Date.now()}`, { waitUntil: 'load' });
await page.evaluate(async () => {
  localStorage.clear();
  localStorage.setItem('bb-presentation', 'match');
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
});
await page.reload({ waitUntil: 'load' });
await page.waitForSelector('.match-home .match-plate');

const rows = [];
for (const id of [1, 11, 21]) {
  await page.evaluate((missionId) => window.BrainBiteGame?.startMission?.(missionId), id);
  await page.waitForSelector('#game.show', { timeout: 10000 });
  const info = await page.evaluate(() => ({
    domBattle: document.documentElement.classList.contains('presentation-match-game-dom'),
    shell: !!document.querySelector('#game .battle-shell') && getComputedStyle(document.querySelector('#game .battle-shell')).opacity !== '0',
    prompt: (document.getElementById('prompt')?.textContent || '').slice(0, 60),
    skill: window.BrainBiteGame?.getState?.()?.m?.skill || '',
  }));
  await page.locator('#exitBtn').click();
  await page.waitForSelector('.match-home .match-plate', { timeout: 10000 });
  rows.push({ id, ...info, backHome: true });
}

const result = { rows, errors: errors.slice(0, 5) };
console.log(JSON.stringify(result, null, 2));
const pass = rows.length === 3
  && rows.every((r) => r.domBattle && r.shell && r.backHome && r.prompt)
  && errors.length === 0;
console.log(pass ? 'MATCH_MULTIWORLD PASS' : 'MATCH_MULTIWORLD FAIL');
await browser.close();
process.exit(pass ? 0 : 1);
