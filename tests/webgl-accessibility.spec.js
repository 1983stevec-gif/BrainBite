import { test, expect } from '@playwright/test';

const APP_PORT = Number(process.env.BRAINBITE_TEST_PORT || 4318);
const APP_ORIGIN = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${APP_PORT}`;

async function clearRuntimeState(page) {
  await page.evaluate(async () => {
    localStorage.clear();
    for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
    for (const key of await caches.keys()) await caches.delete(key);
  });
}

async function instrumentRaf(page) {
  await page.addInitScript(() => {
    window.__bbAccessibilityRafCount = 0;
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
      window.__bbAccessibilityRafCount += 1;
      return original(callback);
    };
  });
}

test.describe('WebGL accessibility and motion controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${APP_ORIGIN}/?presentation=webgl&bust=${Date.now()}`);
    await clearRuntimeState(page);
    await page.reload({ waitUntil: 'load' });
  });

  test('3D home portal is accessible and bridges to the existing PLAY action', async ({ page }) => {
    await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
    const portal = page.locator('.webgl-home-portal');
    await expect(portal).toHaveAttribute('aria-label', /play/i);
    await portal.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#game.show')).toBeVisible();
    await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(0);
    await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
  });

  test('prefers-reduced-motion stops the home animation loop', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await instrumentRaf(page);
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('.webgl-home-portal')).toBeVisible();
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__bbAccessibilityRafCount)).toBe(0);
  });

  test('profile reduced-motion and camera-motion reduction stop the battle loop', async ({ page }) => {
    await instrumentRaf(page);
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('bb-core-v3'));
      raw.profiles[0].settings.reducedMotion = true;
      raw.profiles[0].settings.cameraMotionReduction = true;
      localStorage.setItem('bb-core-v3', JSON.stringify(raw));
    });
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => window.BrainBiteGame?.startPracticeMission?.(8));
    await expect(page.locator('#game.show')).toBeVisible();
    await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
    await page.waitForTimeout(150);
    const status = await page.evaluate(() => ({
      reduced: document.documentElement.classList.contains('reduced-motion'),
      cameraReduced: document.documentElement.classList.contains('camera-motion-reduction'),
      canvas: document.querySelector('#game canvas.webgl-canvas')?.getAttribute('aria-hidden'),
      raf: window.__bbAccessibilityRafCount,
    }));
    expect(status.reduced).toBe(true);
    expect(status.cameraReduced).toBe(true);
    expect(status.canvas).toBe('true');
    expect(status.raf).toBe(0);
  });

  test('service worker defers optional presentation assets to runtime caching', async ({ request }) => {
    const response = await request.get(`${APP_ORIGIN}/service-worker.js`);
    expect(response.ok()).toBe(true);
    const source = await response.text();
    expect(source).not.toContain("'./presentation/webgl-home.mjs'");
    expect(source).not.toContain("'./presentation/webgl-battle.mjs'");
    expect(source).toContain('cache.put(request, response.clone())');
  });
});
