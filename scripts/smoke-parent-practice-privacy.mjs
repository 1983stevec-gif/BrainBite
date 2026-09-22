/** Shipping-path smoke: parent PIN, Practice Lab, and retired-Snap privacy boundary. */
import { chromium } from '@playwright/test';
import { enterParentArea, leaveParentArea } from './lib/smoke-nav.mjs';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load' });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('bb-presentation', 'dom');
});
await page.reload({ waitUntil: 'load' });

await enterParentArea(page, '654321');
const parentOpen = await page.locator('#parentContent').isVisible();

// Practice Lab is a child destination, reached from the hub.
await leaveParentArea(page);
await page.getByRole('button', { name: 'Practice Lab', exact: true }).click();
await page.locator('#practiceTopic').fill('fractions');
await page.locator('#buildPractice').click();
await page.waitForTimeout(300);
const practiceResult = (await page.locator('#practiceResult').textContent() || '').trim();

const privacy = await page.evaluate(async () => {
  const legacy = { id: 'legacy-snap', topic: 'private worksheet text', image: 'data:image/png;base64,private-image', ts: 1 };
  P().snap = [legacy];
  P().controls.requireParentForSnap = true;
  await save();
  const local = externalizeProfile(P());
  const cloud = externalizeProfile(P(), { cloud: true });
  const snapshot = cloudSnapshot();
  const routeAllowed = show('snap');
  return {
    localSnap: local.snap,
    cloudSnap: cloud.snap,
    snapshotSnap: snapshot.store.profiles[STORE.active].snap,
    hasLocalSetting: Object.hasOwn(P().controls, 'requireParentForSnap'),
    routeAllowed,
    homeVisible: document.getElementById('home').classList.contains('show'),
    snapDom: !!document.getElementById('snap'),
    leakedCloudPayload: /private worksheet text|private-image/.test(JSON.stringify({ cloud, snapshot })),
  };
});

const result = {
  parentOpen,
  practiceResult: practiceResult.slice(0, 100),
  privacy,
  errors: errors.slice(0, 5),
};
console.log(JSON.stringify(result, null, 2));
const pass = result.parentOpen
  && /Mapped|Homework|practice|Fractions/i.test(practiceResult)
  && JSON.stringify(privacy.localSnap).includes('private worksheet text')
  && privacy.cloudSnap.length === 0
  && privacy.snapshotSnap.length === 0
  && !privacy.hasLocalSetting
  && privacy.routeAllowed === false
  && privacy.homeVisible
  && !privacy.snapDom
  && !privacy.leakedCloudPayload
  && errors.length === 0;
console.log(pass ? 'PARENT_PRACTICE_PRIVACY PASS' : 'PARENT_PRACTICE_PRIVACY FAIL');
await browser.close();
process.exit(pass ? 0 : 1);
