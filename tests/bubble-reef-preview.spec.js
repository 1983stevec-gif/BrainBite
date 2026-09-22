import { test, expect } from '@playwright/test';

test('Bubble Reef preview remounts one home canvas and normalizes invalid profiles', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('ERR_NETWORK_ACCESS_DENIED')) consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/?presentation=webgl&bust=' + Date.now());
  await page.waitForFunction(() => typeof window.BrainBiteWorldPreview?.setProfile === 'function');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);

  await page.evaluate(() => {
    window.__initialHomeCanvas = document.querySelector('#home canvas.webgl-canvas');
  });
  expect(await page.evaluate(() => window.BrainBiteWorldPreview.getProfile())).toBe('jungle-circuit');

  const bubbleProfile = await page.evaluate(() => window.BrainBiteWorldPreview.setProfile('bubble-reef'));
  expect(bubbleProfile).toBe('bubble-reef');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.BrainBiteWorldPreview.getProfile())).toBe('bubble-reef');
  expect(await page.evaluate(() => window.__initialHomeCanvas !== document.querySelector('#home canvas.webgl-canvas'))).toBe(true);

  const invalidProfile = await page.evaluate(() => window.BrainBiteWorldPreview.setProfile('not-a-real-profile'));
  expect(invalidProfile).toBe('jungle-circuit');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.BrainBiteWorldPreview.getProfile())).toBe('jungle-circuit');

  await page.waitForTimeout(100);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('BrainBase gateway opens the live Bubble Reef preview only in internal review', async ({ page }) => {
  await page.goto('/?presentation=webgl&contentMode=internal-review&gateway-bust=' + Date.now());
  await page.waitForFunction(() => typeof window.BrainBiteWorldPreview?.setProfile === 'function');
  await page.evaluate(() => document.querySelector('nav button[data-screen="brainbase"]')?.click());
  await expect(page.locator('#brainbase.show')).toBeVisible();
  await expect(page.locator('.bb-world-gateway')).toBeVisible();
  await page.locator('.bb-world-gateway-card').locator('summary').click();
  await expect(page.locator('#bubbleReefLivePreviewBtn')).toBeVisible();
  await page.locator('#bubbleReefLivePreviewBtn').click();
  await expect(page.locator('#home.show')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.BrainBiteWorldPreview.getProfile())).toBe('bubble-reef');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
});
