/** Local Gate 8.5/8.6 prep: export buttons + axe a11y on shipping path */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { leaveParentArea, openWorld, parentDestination } from './lib/smoke-nav.mjs';

const base = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318);

async function clearCaches(page) {
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
}

const browser = await chromium.launch({ headless: true });
// Axe requires a BrowserContext so it can attach its page instrumentation safely.
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));

await page.goto(`${base}/?match=0&webgl=0&bust=${Date.now()}`, { waitUntil: 'load' });
await clearCaches(page);
await page.reload({ waitUntil: 'load' });

const exportIds = ['exportActiveProfile', 'exportBtn', 'exportCloudSnapshot', 'deleteActiveProfile', 'deleteCloudAccount'];
const controls = await page.evaluate((ids) => Object.fromEntries(ids.map((id) => {
  const el = document.getElementById(id);
  return [id, { exists: !!el, disabled: !!el?.disabled, label: (el?.textContent || el?.getAttribute('aria-label') || '').trim().slice(0, 80) }];
})), exportIds);

// Trigger local profile export download from the parent area.
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  (async () => {
    await parentDestination(page, 'Profiles', '654321');
    await page.locator('#exportActiveProfile').click();
  })(),
]);

// Scan the child hub while it is actually visible, then the battle HUD.
await leaveParentArea(page);
const homeAxe = await new AxeBuilder({ page }).include('#home').analyze();
await openWorld(page, 'Number Nebula');
await page.locator('#mathList button', { hasText: 'Play' }).first().click();
await page.waitForSelector('#game.show');
const gameAxe = await new AxeBuilder({ page }).include('#game').analyze();

const summary = {
  controls,
  download: download ? download.suggestedFilename() : null,
  axe: {
    homeViolations: homeAxe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
    gameViolations: gameAxe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
  },
};

console.log(JSON.stringify(summary, null, 2));
const critical = [...homeAxe.violations, ...gameAxe.violations].filter((v) => v.impact === 'critical' || v.impact === 'serious');
const exportOk = controls.exportActiveProfile?.exists && controls.exportBtn?.exists && controls.deleteCloudAccount?.exists;
if (!exportOk || !download || critical.length) {
  console.error('EXPORT/A11Y PREP FAIL', { exportOk, download: !!download, critical: critical.map((c) => c.id) });
  process.exit(1);
}
console.log('EXPORT/A11Y PREP PASS');
await browser.close();
