import { test, expect } from '@playwright/test';

// M2 native-shell readiness. `?native=1` makes presentation/platform.js simulate a store
// shell (Capacitor/Tauri) so the native code paths run in a plain browser. The web build
// (no flag) must behave exactly as before.

const NATIVE = '/?native=1&match=0&webgl=0';
const WEB = '/?match=0&webgl=0';
const MIRROR = 'bb-native-sim:bb-core-v3-native-mirror';

async function fresh(page, url) {
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('bb-presentation', 'dom'); });
  await page.reload();
  await page.waitForFunction(() => window.BrainBiteNative && window.BrainBiteGame);
  await page.evaluate(() => window.BrainBiteNative.restore());
}

async function setPin(page) {
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await page.locator('#parentPinInput').fill('654321');
  if (await page.locator('#confirmParentPin').isVisible()) await page.locator('#confirmParentPin').fill('654321');
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentContent')).toBeVisible();
}

const activeScreen = page => page.evaluate(() => document.querySelector('.screen.show')?.id);
const back = page => page.evaluate(() => window.dispatchEvent(new CustomEvent('bb:native-back')));

test('the web build keeps its service worker, open footer links and no native controls', async ({ page }) => {
  await fresh(page, WEB);
  expect(await page.evaluate(() => window.BrainBitePlatform.kind())).toBe('web');
  expect(await page.evaluate(() => window.BrainBiteServiceWorker)).toBe('registered');
  expect(await page.evaluate(() => window.BrainBiteNative.mirrorState())).toBe('unavailable');
  await back(page);
  await expect(page.locator('#leaveDialog')).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('bb:answer', { detail: { correct: true } })));
  expect(await page.evaluate(() => window.BrainBitePlatform.lastHaptic())).toBeNull();
  await page.locator('footer a[href="privacy.html"]').click();
  await expect(page).toHaveURL(/privacy\.html$/);
});

test('a native shell skips the service worker and shows the Vibration setting', async ({ page }) => {
  await fresh(page, NATIVE);
  expect(await page.evaluate(() => window.BrainBitePlatform.isNativeShell())).toBe(true);
  expect(await page.evaluate(() => window.BrainBiteServiceWorker)).toBe('skipped-native');
  await page.evaluate(() => show('settings'));
  await expect(page.locator('#vibrationRow')).toBeVisible();
  await expect(page.locator('#vibrationOn')).toBeChecked();
});

test('in a native shell, footer links need the family PIN first', async ({ page }) => {
  await fresh(page, NATIVE);
  await page.locator('footer a[href="privacy.html"]').click();
  await expect(page).not.toHaveURL(/privacy\.html/);
  expect(await activeScreen(page)).toBe('parent');
  await expect(page.locator('#parentGateMsg')).toContainText('Grown-ups only');
  await page.locator('#parentPinInput').fill('654321');
  await page.locator('#confirmParentPin').fill('654321');
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentContent')).toBeVisible();
  await page.locator('footer a[href="privacy.html"]').click();
  await expect(page).toHaveURL(/privacy\.html\?*$|privacy\.html$/);
});

test('the native mirror restores progress when every web save generation is gone', async ({ page }) => {
  await fresh(page, NATIVE);
  await page.evaluate(async () => { STORE.profiles[0].name = 'Mirror Kid'; await save(); });
  await expect.poll(() => page.evaluate(key => {
    const raw = localStorage.getItem(key); return raw ? JSON.parse(raw).profiles[0].name : null;
  }, MIRROR)).toBe('Mirror Kid');
  // The OS cleared the WebView storage: all three generations are gone, the mirror is not.
  await page.evaluate(() => ['bb-core-v3', 'bb-core-v3-back', 'bb-core-v3-recovery'].forEach(key => localStorage.removeItem(key)));
  await page.reload();
  await page.waitForFunction(() => window.BrainBiteNative);
  expect(await page.evaluate(() => window.BrainBiteNative.restore())).toBe('restored');
  expect(await page.evaluate(() => P().name)).toBe('Mirror Kid');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')).profiles[0].name)).toBe('Mirror Kid');
});

test('the native mirror never overrides a readable web save', async ({ page }) => {
  await fresh(page, NATIVE);
  await page.evaluate(async () => { STORE.profiles[0].name = 'Current Kid'; await save(); });
  await page.evaluate(key => {
    const stale = JSON.parse(localStorage.getItem('bb-core-v3'));
    stale.profiles[0].name = 'Stale Kid';
    localStorage.setItem(key, JSON.stringify(stale));
  }, MIRROR);
  await page.reload();
  await page.waitForFunction(() => window.BrainBiteNative);
  expect(await page.evaluate(() => window.BrainBiteNative.restore())).toBe('web-intact');
  expect(await page.evaluate(() => P().name)).toBe('Current Kid');
  // And mirroring resumes, replacing the stale copy.
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).profiles[0].name, MIRROR)).toBe('Current Kid');
});

test('a fresh first boot does not overwrite an existing mirror before the restore check', async ({ page }) => {
  await fresh(page, NATIVE);
  await page.evaluate(async () => { STORE.profiles[0].name = 'Saved Kid'; await save(); });
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').profiles?.[0]?.name, MIRROR)).toBe('Saved Kid');
  // Wipe every web generation AND corrupt nothing else: the blank boot store must not win.
  await page.evaluate(() => ['bb-core-v3', 'bb-core-v3-back', 'bb-core-v3-recovery'].forEach(key => localStorage.removeItem(key)));
  await page.reload();
  await page.waitForFunction(() => window.BrainBiteNative);
  await page.evaluate(() => window.BrainBiteNative.restore());
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).profiles[0].name, MIRROR)).toBe('Saved Kid');
});

test('Android back: home asks before leaving, other screens step back, battle exits safely', async ({ page }) => {
  await fresh(page, NATIVE);
  expect(await activeScreen(page)).toBe('home');
  await back(page);
  await expect(page.locator('#leaveDialog')).toBeVisible();
  await expect(page.locator('#leaveStay')).toBeFocused();
  await back(page);
  await expect(page.locator('#leaveDialog')).toBeHidden();
  await back(page);
  await page.locator('#leaveStay').click();
  await expect(page.locator('#leaveDialog')).toBeHidden();

  await page.evaluate(() => show('settings'));
  await back(page);
  expect(await activeScreen(page)).toBe('home');

  await page.evaluate(() => window.BrainBiteGame.startMission(1));
  await expect.poll(() => activeScreen(page)).toBe('game');
  await back(page);
  await expect.poll(() => activeScreen(page)).not.toBe('game');

  await setPin(page);
  await page.evaluate(() => show('controls'));
  expect(await activeScreen(page)).toBe('controls');
  expect(await page.evaluate(() => window.BrainBiteNative.back())).toBe('parent');
  expect(await activeScreen(page)).toBe('parent');
});

test('Android back does nothing on the time-up screen', async ({ page }) => {
  await fresh(page, NATIVE);
  await page.evaluate(() => show('timeup'));
  expect(await page.evaluate(() => window.BrainBiteNative.back())).toBe('ignored-timeup');
  expect(await activeScreen(page)).toBe('timeup');
});

test('haptics follow the Vibration setting and reduced motion, and only in a native shell', async ({ page }) => {
  await fresh(page, NATIVE);
  const fire = correct => page.evaluate(value => window.dispatchEvent(new CustomEvent('bb:answer', { detail: { correct: value } })), correct);
  const last = () => page.evaluate(() => window.BrainBitePlatform.lastHaptic());
  await fire(true);
  expect(await last()).toBe('correct');
  await fire(false);
  expect(await last()).toBe('wrong');
  await page.evaluate(() => { P().settings.reducedMotion = true; });
  await fire(true);
  expect(await last()).toBe('wrong');
  await page.evaluate(() => { P().settings.reducedMotion = false; P().settings.vibrationOn = false; });
  await fire(true);
  expect(await last()).toBe('wrong');
});
