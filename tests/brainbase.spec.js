import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/?match=0&webgl=0');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('bb-presentation', 'dom');
  });
  await page.reload();
});

test('BrainBase greybox flow runs end-to-end and persists the hub upgrade', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.locator('#childDock button[data-screen="brainbase"]').click();
  await expect(page.locator('#brainbase-root')).toContainText('BrainBase');
  await expect(page.locator('#brainbase-root')).toContainText('Child profile dock');

  await page.locator('[data-stage="target-smash"]').click();
  for (const answer of ['12', '18', '24']) {
    await page.locator('#brainbase-root').getByRole('button', { name: answer, exact: true }).click();
  }
  await expect(page.locator('#brainbase-root')).toContainText('Letter Trail');

  for (const letter of ['J', 'U', 'N', 'G', 'L', 'E']) {
    await page.locator('#brainbase-root').getByRole('button', { name: letter, exact: true }).click();
  }
  await expect(page.locator('#brainbase-root')).toContainText('Knowledge Platforms');

  for (const platform of ['Count', 'Compare', 'Explain']) {
    await page.locator('#brainbase-root').getByRole('button', { name: platform, exact: true }).click();
  }
  await expect(page.locator('#brainbase-root')).toContainText('Secret / Reward');

  await page.locator('#brainbase-root').getByRole('button', { name: 'Open chest', exact: true }).click();
  await expect(page.locator('#brainbase-root')).toContainText('Fraction Kraken');

  for (let i = 0; i < 3; i += 1) {
    await page.locator('#brainbase-root').getByRole('button', { name: /1\/2|2\/4/ }).first().click();
  }
  await expect(page.locator('#brainbase-root')).toContainText('Kraken Brainifact installed');

  await page.locator('#brainbase-root').getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('#brainbase-root').getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'BrainBite' })).toBeVisible();

  await page.locator('#childDock button[data-screen="brainbase"]').click();
  await expect(page.locator('#brainbase-root')).toContainText('Kraken Brainifact installed');

  expect(errors).toEqual([]);
});
