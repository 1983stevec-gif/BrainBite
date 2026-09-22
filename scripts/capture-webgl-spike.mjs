import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'docs', 'references', 'spike');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
page.on('console', (msg) => {
  if (['error', 'warning', 'info'].includes(msg.type())) console.log('CONSOLE', msg.type(), msg.text());
});

await page.goto(`http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318) + '/?webgl=1', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const status = await page.evaluate(() => ({
  htmlClass: document.documentElement.className,
  badge: document.getElementById('webglBadge')?.textContent || null,
  canvas: !!document.querySelector('.home-stage canvas.webgl-canvas'),
  canvasSize: (() => {
    const c = document.querySelector('.home-stage canvas.webgl-canvas');
    return c ? { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight } : null;
  })(),
  presentation: !!window.BrainBitePresentation?.enabled,
}));
console.log('STATUS', JSON.stringify(status, null, 2));

await page.screenshot({ path: path.join(out, 'home-webgl.png'), fullPage: false });

// Start mission 1 for battle scene
await page.getByRole('button', { name: 'Continue Adventure' }).click();
await page.waitForSelector('#game.show', { timeout: 5000 });
await page.waitForTimeout(1500);

const battle = await page.evaluate(() => ({
  gameShow: document.getElementById('game')?.classList.contains('show'),
  canvas: !!document.querySelector('.battle-frame canvas.webgl-canvas'),
  canvasSize: (() => {
    const c = document.querySelector('.battle-frame canvas.webgl-canvas');
    return c ? { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight } : null;
  })(),
}));
console.log('BATTLE', JSON.stringify(battle, null, 2));

await page.screenshot({ path: path.join(out, 'battle-webgl.png'), fullPage: false });
await browser.close();
console.log('Wrote screenshots to', out);
