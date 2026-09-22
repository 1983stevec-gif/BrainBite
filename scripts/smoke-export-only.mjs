/** Local Gate 8.6 export + local profile delete smoke (no cloud account wipe) */
import { chromium } from '@playwright/test';
import { enterParentArea, parentDestination } from './lib/smoke-nav.mjs';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load' });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('bb-presentation', 'dom');
});
await page.reload({ waitUntil: 'load' });

// A fresh install has no family PIN, so this also exercises PIN setup.
await enterParentArea(page, '654321');
await parentDestination(page, 'Profiles', '654321');
await page.waitForSelector('#exportActiveProfile', { state: 'visible' });
const profileDl = page.waitForEvent('download', { timeout: 15000 });
await page.locator('#exportActiveProfile').click();
const profileFile = await profileDl;

await parentDestination(page, 'Recovery', '654321');
const recoveryDl = page.waitForEvent('download', { timeout: 15000 });
await page.locator('#exportBtn').click();
const recoveryFile = await recoveryDl;

await parentDestination(page, 'Account & Sync', '654321');
await page.waitForSelector('#account.show', { timeout: 5000 });
const exportCloud = await page.locator('#exportCloudSnapshot').isVisible();
const deleteCloud = await page.locator('#deleteCloudAccount').isVisible();

await parentDestination(page, 'Profiles', '654321');
await page.locator('#newProfile').fill('DeleteMe');
await page.locator('#addProfile').click();
// Adding a profile revokes parent authorization by design, so the parent area must be
// re-entered before the destructive action.
await parentDestination(page, 'Profiles', '654321');
const before = await page.locator('#profileList .profile-row').count();
// Destructive actions now use the themed, focus-trapping dialog with an exact-name
// confirmation and a fresh PIN, not a native confirm().
await page.locator('#deleteActiveProfile').click();
const dialog = page.locator('#sensitiveActionDialog');
await dialog.waitFor({ state: 'visible' });
await page.locator('#sensitiveActionConfirmation').fill('DeleteMe');
await page.locator('#sensitiveActionPin').fill('654321');
await page.locator('#sensitiveActionConfirm').click();
await page.locator('#sensitiveActionBackdrop').waitFor({ state: 'hidden', timeout: 15000 });
await page.waitForTimeout(300);
const after = await page.locator('#profileList .profile-row').count();

const result = {
  profileExport: profileFile.suggestedFilename(),
  recoveryExport: recoveryFile.suggestedFilename(),
  exportCloudVisible: exportCloud,
  deleteCloudVisible: deleteCloud,
  profilesBeforeDelete: before,
  profilesAfterDelete: after,
  errors,
};
console.log(JSON.stringify(result, null, 2));
const pass =
  !!profileFile &&
  !!recoveryFile &&
  exportCloud &&
  deleteCloud &&
  before >= 2 &&
  after === before - 1 &&
  errors.length === 0;
console.log(pass ? 'EXPORT_SMOKE PASS' : 'EXPORT_SMOKE FAIL');
await browser.close();
process.exit(pass ? 0 : 1);
