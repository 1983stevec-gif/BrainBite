// Shared navigation for the smoke scripts.
//
// These helpers mirror how a real user reaches each area, so a smoke check keeps working
// when the information architecture changes. Before this module the scripts navigated by
// raw selectors (`nav button[data-screen="settings"]`, `getByRole('button', { name:
// 'Parent' })`) and silently rotted when the child/parent split landed.

/** Enter the parent area and land on the parent dashboard. */
export async function enterParentArea(page, pin = '654321') {
  const shell = page.locator('#parentShellNav');
  if (!(await shell.isVisible())) {
    const orb = page.getByRole('button', { name: 'Parents', exact: true });
    if (!(await orb.isVisible())) await page.locator('#childDock button[data-screen="home"]').click();
    await orb.click();
  }
  if (await page.locator('#parentPinInput').isVisible()) {
    await page.locator('#parentPinInput').fill(pin);
    if (await page.locator('#confirmParentPin').isVisible()) await page.locator('#confirmParentPin').fill(pin);
    await page.locator('#unlockParent').click();
  }
  await shell.waitFor({ state: 'visible' });
  await shell.getByRole('button', { name: 'Progress', exact: true }).click();
  await page.locator('#parentContent').waitFor({ state: 'visible' });
}

/** Open a parent destination by its shell label. */
export async function parentDestination(page, name, pin = '654321') {
  await enterParentArea(page, pin);
  await page.locator('#parentShellNav').getByRole('button', { name, exact: true }).click();
}

/** Return to the child hub from the parent area. */
export async function leaveParentArea(page) {
  await page.getByRole('button', { name: 'Back to kid hub' }).click();
  await page.locator('#childDock').waitFor({ state: 'visible' });
}

/** Open a world list (Number Nebula, Wordwood, Spanish Portal). */
export async function openWorld(page, name) {
  await page.locator('#childDock button[data-screen="worlds"]').click();
  await page.getByRole('button', { name, exact: true }).click();
}

/** Open the child Settings screen. */
export async function openSettings(page) {
  await page.locator('#childDock button[data-screen="home"]').click();
  await page.locator('.dash-quick-actions button[data-screen="settings"]').click();
  await page.locator('#settings.show').waitFor();
}
