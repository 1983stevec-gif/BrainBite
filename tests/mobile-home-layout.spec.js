import { test, expect } from '@playwright/test';

const phoneViewports = [{ width: 375, height: 667 }, { width: 390, height: 844 }];

async function openFreshDomHome(page) {
  await page.goto('/?presentation=dom');
  await expect(page.locator('#firstRunCard')).toBeVisible();
  await expect(page.locator('#continueBtn')).toBeEnabled();
  await expect(page.locator('html')).not.toHaveClass(/presentation-(webgl|match)/);
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1);
}

async function expectInitiallyActionable(page, selector) {
  const target = page.locator(selector);
  await expect(target).toBeVisible();
  await expect(target).toBeEnabled();
  const geometry = await target.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
      width: innerWidth, height: innerHeight, unobstructed: element.contains(hit) };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.height);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.width);
  expect(geometry.unobstructed).toBe(true);
}

for (const viewport of phoneViewports) {
  test(`DOM home exposes Play and Parents in initial ${viewport.width}x${viewport.height} viewport`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await openFreshDomHome(page);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expectInitiallyActionable(page, '#continueBtn');
    await expectInitiallyActionable(page, '#parentNav');
    await expect(page.locator('#childDock')).toBeVisible();
    await expect(page.locator('header')).toBeHidden();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('dom-mobile-home.png') });

    // Exercise the actual action with the keyboard after checking geometry; focus cannot
    // rescue a below-fold control by scrolling it into view before the assertion.
    await page.locator('#continueBtn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#game.show')).toBeVisible();
    await expect(page.locator('#prompt')).not.toBeEmpty();
    await expect(page.locator('#board .cell').first()).toBeVisible();

    await page.reload();
    await expect(page.locator('#home.show')).toBeVisible();
    await page.locator('#parentNav').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#parentGate')).toBeVisible();
    await expect(page.locator('#parentPinInput')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test(`DOM home retains readable controls without overflow at 150% text in ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openFreshDomHome(page);
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('bb-core-v3'));
      raw.profiles[0].name = 'AlexandriaLongLearnerName';
      raw.profiles[0].settings.textScale = '1.5';
      localStorage.setItem('bb-core-v3', JSON.stringify(raw));
    });
    await page.reload();
    await expect(page.locator('#homeProfileName')).toHaveText('AlexandriaLongLearnerName');
    await expectNoHorizontalOverflow(page);
    for (const selector of ['#continueBtn', '#parentNav', '#home [data-screen="settings"]', '#home [data-screen="profile"]']) {
      const target = page.locator(selector);
      await expect(target).toBeVisible();
      const size = await target.boundingBox();
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
    await page.locator('#parentNav').click();
    await expect(page.locator('#parentPinInput')).toBeVisible();
  });
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 1024, height: 682 }]) {
  test(`DOM desktop exposes adventure status and actions at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await openFreshDomHome(page);
    await expect(page.locator('header')).toBeHidden();
    await expect(page.locator('#childDock')).toBeHidden();
    await expect(page.locator('#home .dash-top')).toBeVisible();
    await expect(page.locator('#home .adventure-destinations')).toBeVisible();
    await expectInitiallyActionable(page, '#continueBtn');
    await expectInitiallyActionable(page, '#parentNav');
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('dom-desktop-home.png') });
    await page.locator('#parentNav').click();
    await expect(page.locator('#parentPinInput')).toBeVisible();
  });
}

test('DOM narrow 320px home keeps activities and parent entry usable without overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openFreshDomHome(page);
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('#childDock')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dom-narrow-home.png'), fullPage: true });
  await page.locator('#continueBtn').click();
  await expect(page.locator('#game.show')).toBeVisible();
  await page.reload();
  await page.locator('#parentNav').click();
  await expect(page.locator('#parentPinInput')).toBeVisible();
});
