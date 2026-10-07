/** Gate 8.4 Windows columns: a11y prefs and offline reload — Chrome + Edge; audio is diagnostic only. */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { openSettings, openWorld } from './lib/smoke-nav.mjs';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);

async function clearCaches(page) {
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
}

async function runMatrix(channel) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  } catch (e) {
    const error = String(e.message || e);
    // Only classify a missing executable at launch, never after a browser exists.
    const missingExecutable = /^(?:browserType\.launch: )?(?:Chromium distribution 'msedge' is not found at [^\r\n]*[\\/]msedge(?:\.exe)?|Executable doesn't exist at [^\r\n]*[\\/]msedge(?:\.exe)?)(?:\r?\n|$)/i.test(error);
    if (channel === 'msedge' && missingExecutable) return { channel, skipped: true, reason: error };
    throw e;
  }
  try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const label=channel||'chromium',startedAt=Date.now(),pendingRequests=new Set();
  let currentPhase='opening app';
  const phase=message=>{currentPhase=message;console.log(`[${label} +${Date.now()-startedAt}ms] ${message}`)};
  page.on('request',request=>pendingRequests.add(request.url()));
  page.on('requestfinished',request=>pendingRequests.delete(request.url()));
  page.on('requestfailed',request=>{pendingRequests.delete(request.url());console.error(`[${label}] request failed: ${request.url()} ${request.failure()?.errorText||''}`)});
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
  phase('opening app');
  await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
  phase('clearing worker and cache');
  await clearCaches(page);
  phase('reloading after cache reset');
  await page.reload({ waitUntil: 'load', timeout: 45000 });

  const ua = await page.evaluate(() => navigator.userAgent);
  phase('opening visible home Settings control');
  await openSettings(page);
  phase('enabling accessibility preferences');
  await page.locator('#reducedMotion').check();
  await page.locator('#largeTargets').check();
  await page.locator('#soundOn').check();
  await page.locator('#childDock button[data-screen="home"]').click();

  const a11y = await page.evaluate(() => ({
    reduced: document.documentElement.classList.contains('reduced-motion'),
    large: document.documentElement.classList.contains('large-targets'),
  }));

  phase('opening visible home Worlds control');
  await openWorld(page,'Number Nebula');
  phase('launching first mission');
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

  phase('exercising keyboard and audio diagnostic');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  audioPlay = await page.evaluate(() => !!window.__bbAudioPlay);
  const feedback = await page.locator('#feedback').textContent();

  await page.evaluate(() => localStorage.setItem('bb-gate84-win', '1'));
  // Cache reset above starts a fresh worker install. User interactions are not
  // evidence that it has finished: wait for control and the offline shell.
  phase('waiting for worker control and cached offline shell');
  await page.waitForFunction(async () => {
    if (!navigator.serviceWorker.controller) return false;
    return Boolean(await caches.match(new URL('./index.html', location.href).href));
  }, null, { timeout: 45000 });
  phase('reloading offline');
  await page.context().setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  // Cached HTML contains the home shell even if app.js never runs.
  phase('checking offline runtime and local persistence');
  await page.waitForFunction(() => typeof window.BrainBiteGame?.getState === 'function', null, { timeout: 15000 });
  await page.waitForSelector('#home.show', { state: 'visible', timeout: 15000 });
  const offline = await page.evaluate(() => ({
    persist: localStorage.getItem('bb-gate84-win') === '1',
    hasApp: !!document.querySelector('.app') && !!document.querySelector('#home.show'),
    runtimeBooted: typeof window.BrainBiteGame?.getState === 'function',
  }));
  await page.context().setOffline(false);
  phase('matrix checks complete');
  return {
    channel: channel || 'chromium',
    ua: ua.slice(0, 120),
    a11y,
    audioPlayDiagnostic: audioPlay,
    feedback: (feedback || '').slice(0, 80),
    offline,
    errors: errors.slice(0, 3),
  };
  } catch(error) {
    console.error(`[${label}] failed phase: ${currentPhase}; pending requests: ${JSON.stringify([...pendingRequests])}`);
    const state=await Promise.race([
      page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();return {readyState:document.readyState,runtimeBooted:typeof window.BrainBiteGame?.getState==='function',controller:navigator.serviceWorker.controller?.scriptURL||null,active:registration?.active?.state||null,installing:registration?.installing?.state||null,waiting:registration?.waiting?.state||null,caches:await caches.keys()}}).catch(e=>({diagnosticError:String(e.message||e)})),
      new Promise(resolve=>setTimeout(()=>resolve({diagnosticError:'Page state unavailable after 5 seconds'}),5000)),
    ]);
    console.error(`[${label}] failure state: ${JSON.stringify(state)}; page errors: ${JSON.stringify(errors)}`);
    await mkdir('.ui-captures/windows-smoke-2026-10-03',{recursive:true});
    await page.screenshot({path:`.ui-captures/windows-smoke-2026-10-03/${label}-failure.png`,fullPage:true,timeout:5000}).catch(()=>{});
    throw error;
  }
  } finally {
    await browser.close();
  }
}

let chrome = null;
try {
  chrome = await runMatrix(undefined);
} catch (e) {
  chrome = { channel: 'chromium', error: String(e.stack || e.message || e) };
}
let edge = null;
try {
  edge = await runMatrix('msedge');
} catch (e) {
  edge = { channel: 'msedge', error: String(e.stack || e.message || e) };
}

const summary = { chrome, edge };
console.log(JSON.stringify(summary, null, 2));

const chromeOk =
  !chrome.error &&
  chrome.a11y?.reduced &&
  chrome.a11y?.large &&
  chrome.offline?.persist &&
  chrome.offline?.hasApp &&
  chrome.offline?.runtimeBooted &&
  !chrome.errors?.length;
const edgeOk =
  edge &&
  !edge.error &&
  edge.a11y?.reduced &&
  edge.a11y?.large &&
  edge.offline?.persist &&
  edge.offline?.hasApp &&
  edge.offline?.runtimeBooted &&
  !edge.errors?.length;

if (!chromeOk) {
  console.error('GATE84 WINDOWS CHROME FAIL');
  process.exit(1);
}
if (!edgeOk && !edge.skipped) {
  console.error('GATE84 WINDOWS EDGE FAIL');
  process.exit(1);
}
console.log(edgeOk ? 'GATE84 WINDOWS CHROME+EDGE PASS' : 'GATE84 WINDOWS CHROME PASS (Edge executable unavailable: SKIPPED)');
