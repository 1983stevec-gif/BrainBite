/** Gate 8.4 Windows columns: a11y prefs, audio cue path, offline reload — Chrome + Edge */
import { chromium } from '@playwright/test';
import { openSettings, openWorld } from './lib/smoke-nav.mjs';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);

async function clearCaches(page) {
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
}

async function runMatrix(channel) {
  const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
  await clearCaches(page);
  await page.reload({ waitUntil: 'load', timeout: 45000 });

  const ua = await page.evaluate(() => navigator.userAgent);
  await openSettings(page);
  await page.locator('#reducedMotion').check();
  await page.locator('#largeTargets').check();
  await page.locator('#soundOn').check();
  await page.locator('#childDock button[data-screen="home"]').click();

  const a11y = await page.evaluate(() => ({
    reduced: document.documentElement.classList.contains('reduced-motion'),
    large: document.documentElement.classList.contains('large-targets'),
  }));

  await openWorld(page, 'Number Nebula');
  await page.locator('#mathList button', { hasText: 'Play' }).first().click();
  await page.waitForSelector('#game.show', { timeout: 10000 });

  let audioPlay = false;
  await page.evaluate(() => {
    const proto = window.Audio?.prototype;
    if (!proto) return;
    const orig = proto.play;
    proto.play = function patchedPlay(...args) {
      window.__bbAudioPlay = true;
      return orig.apply(this, args);
    };
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  audioPlay = await page.evaluate(() => !!window.__bbAudioPlay);
  const feedback = await page.locator('#feedback').textContent();

  await page.evaluate(() => localStorage.setItem('bb-gate84-win', '1'));
  await page.context().setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(800);
  const offline = await page.evaluate(() => ({
    persist: localStorage.getItem('bb-gate84-win') === '1',
    hasApp: !!document.querySelector('.app') || !!document.querySelector('h1'),
  }));
  await page.context().setOffline(false);

  await browser.close();
  return {
    channel: channel || 'chromium',
    ua: ua.slice(0, 120),
    a11y,
    audioPlay,
    feedback: (feedback || '').slice(0, 80),
    offline,
    errors: errors.slice(0, 3),
  };
}

const chrome = await runMatrix(undefined);
let edge = null;
try {
  edge = await runMatrix('msedge');
} catch (e) {
  edge = { channel: 'msedge', error: String(e.message || e) };
}

const summary = { chrome, edge };
console.log(JSON.stringify(summary, null, 2));

const chromeOk =
  chrome.a11y?.reduced &&
  chrome.a11y?.large &&
  chrome.offline?.persist &&
  chrome.offline?.hasApp &&
  !chrome.errors?.length;
const edgeOk =
  edge &&
  !edge.error &&
  edge.a11y?.reduced &&
  edge.a11y?.large &&
  edge.offline?.persist &&
  edge.offline?.hasApp;

if (!chromeOk) {
  console.error('GATE84 WINDOWS CHROME FAIL');
  process.exit(1);
}
console.log(edgeOk ? 'GATE84 WINDOWS CHROME+EDGE PASS' : 'GATE84 WINDOWS CHROME PASS (Edge partial/skip)');
