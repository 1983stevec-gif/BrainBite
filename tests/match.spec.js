import { test, expect } from '@playwright/test';

/** Batch 9 MATCH path — keeps visual presentation functional in CI */
test.describe('MATCH presentation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?match=1&bust=' + Date.now());
    await page.evaluate(async () => {
      localStorage.clear();
      localStorage.setItem('bb-presentation', 'match');
      for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      for (const k of await caches.keys()) await caches.delete(k);
    });
    await page.reload({ waitUntil: 'load' });
  });

  test('home plate mounts and portal starts fraction battle plate', async ({ page }) => {
    await expect(page.locator('html')).toHaveClass(/presentation-match/);
    await expect(page.locator('.match-home .match-plate')).toBeVisible();
    await page.locator('.hs-portal').click();
    await expect(page.locator('.match-battle .match-plate')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.hs-pillar')).toHaveCount(4);
  });

  test('PLAY continues migrated legacy lastMission (DOM for non-fractions)', async ({ page }) => {
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('bb-core-v3') || '{}');
      if (raw.profiles?.[0]) {
        delete raw.profiles[0].progression;
        raw.profiles[0].completed = [1];
        raw.profiles[0].unlockedWords = 11;
        raw.profiles[0].lastMission = 11;
      }
      raw.schemaVersion = 7;
      localStorage.setItem('bb-core-v3', JSON.stringify(raw));
    });
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.match-home .match-plate', { timeout: 15000 });
    await page.locator('.hs-play').click();
    await page.waitForSelector('#game.show', { timeout: 10000 });
    await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains('presentation-match-game-dom'))).toBe(true);
    await expect(page.locator('#prompt')).toContainText(/animal/i);
    const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
    expect(migrated.schemaVersion).toBe(9);
    expect(migrated.registryVersion).toBe(1);
    expect(migrated.profiles[0].progression.lastMissionId).toBe(11);
    expect(migrated.profiles[0]).not.toHaveProperty('lastMission');
    expect(migrated.profiles[0]).not.toHaveProperty('completed');
  });

  test('pillar answers score via LearningCore (hit and miss)', async ({ page }) => {
    await page.locator('.hs-portal').click();
    await page.waitForSelector('.match-battle .hs-pillar-2', { timeout: 10000 });

    await page.locator('.hs-pillar-2').click();
    await expect.poll(async () => page.evaluate(() => window.BrainBiteGame?.getState?.()?.correct || 0)).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.match-toast')).toContainText('Great job');

    await page.locator('.hs-pillar-0').click();
    await expect.poll(async () => page.evaluate(() => window.BrainBiteGame?.getState?.()?.wrong || 0)).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.match-toast')).toContainText('Not 1/3');
  });

  test('pause returns to MATCH home hub', async ({ page }) => {
    await page.locator('.hs-portal').click();
    await page.waitForSelector('.match-battle .hs-pause', { timeout: 10000 });
    await page.locator('.hs-pause').click();
    await expect(page.locator('.match-home .match-plate')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('html')).not.toHaveClass(/presentation-match-passthrough/);
  });

  test('settings passthrough restores nav then Home remounts MATCH', async ({ page }) => {
    await page.locator('.hs-settings').click();
    await expect(page.locator('#settings')).toHaveClass(/show/);
    await expect(page.locator('html')).toHaveClass(/presentation-match-passthrough/);
    await expect(page.locator('#childDock')).toBeVisible();
    await page.locator('nav button[data-screen="home"]').click();
    await expect(page.locator('.match-home .match-plate')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('html')).not.toHaveClass(/presentation-match-passthrough/);
  });

  test('mission complete returns to MATCH home hub', async ({ page }) => {
    await page.locator('.hs-portal').click();
    await page.waitForSelector('.match-battle .hs-pillar-2', { timeout: 10000 });
    await page.evaluate(() => {
      const G = window.BrainBiteGame?.getState?.();
      if (!G) throw new Error('no game state');
      G.eaten = Math.max(0, (G.total || 1) - 1);
      G.correct = G.eaten;
    });
    await page.locator('.hs-pillar-2').click();
    await expect(page.locator('.match-home .match-plate')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#home')).toHaveClass(/show/);
    await expect(page.locator('#math')).not.toHaveClass(/show/);
  });

  test('non-fractions mission uses DOM battle under MATCH', async ({ page }) => {
    await page.evaluate(() => window.BrainBiteGame?.startMission?.(1));
    await page.waitForSelector('#game.show', { timeout: 10000 });
    await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains('presentation-match-game-dom'))).toBe(true);
    await expect(page.locator('#game .battle-shell')).toBeVisible();
    await expect(page.locator('#prompt')).toContainText(/even/i);
    await page.locator('#exitBtn').click();
    await expect(page.locator('.match-home .match-plate')).toBeVisible({ timeout: 10000 });
  });

  test('words and spanish missions also use DOM battle under MATCH', async ({ page }) => {
    for (const [id, re] of [[11, /animal/i], [21, /Spanish greeting/i]]) {
      await page.evaluate((missionId) => window.BrainBiteGame?.startMission?.(missionId), id);
      await page.waitForSelector('#game.show', { timeout: 10000 });
      await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains('presentation-match-game-dom'))).toBe(true);
      await expect(page.locator('#prompt')).toContainText(re);
      await page.locator('#exitBtn').click();
      await expect(page.locator('.match-home .match-plate')).toBeVisible({ timeout: 10000 });
    }
  });

  test('plate dock keeps child destinations open and parent tools behind the gate', async ({ page }) => {
    await page.locator('.hs-worlds').click();
    await expect(page.locator('#math.show')).toBeVisible();
    await expect(page.locator('#parentGate')).toBeHidden();
    await page.locator('nav button[data-screen="home"]').click();
    await expect(page.locator('.match-home .match-plate')).toBeVisible({ timeout: 10000 });
    await page.locator('.hs-dock-collection').click();
    await expect(page.locator('#bites.show')).toBeVisible();
    await page.locator('nav button[data-screen="home"]').click();
    await expect(page.locator('.match-home .match-plate')).toBeVisible({ timeout: 10000 });
    // Achievements and News point at parent tools: the plate must never leak them to a child.
    await page.locator('.hs-achieve').click();
    await expect(page.locator('#parent.show')).toBeVisible();
    await expect(page.locator('#parentGate')).toBeVisible();
  });

  test('keyboard 1-4 selects MATCH pillars', async ({ page }) => {
    await page.locator('.hs-portal').click();
    await page.waitForSelector('.match-battle .hs-pillar-2', { timeout: 10000 });
    await page.keyboard.press('2');
    await expect.poll(async () => page.evaluate(() => window.BrainBiteGame?.getState?.()?.correct || 0)).toBeGreaterThanOrEqual(1);
    await page.keyboard.press('1');
    await expect.poll(async () => page.evaluate(() => window.BrainBiteGame?.getState?.()?.wrong || 0)).toBeGreaterThanOrEqual(1);
  });

  test('captions show on MATCH fraction battle when enabled', async ({ page }) => {
    await page.locator('.hs-settings').click();
    await page.locator('#captions').check();
    await page.locator('nav button[data-screen="home"]').click();
    await expect(page.locator('.match-home .match-plate')).toBeVisible({ timeout: 10000 });
    await page.locator('.hs-portal').click();
    await page.waitForSelector('.match-battle .match-caption-live', { timeout: 10000 });
    await expect(page.locator('.match-caption-live')).toBeVisible();
    await expect(page.locator('.match-prompt-live')).not.toBeEmpty();
    await expect(page.locator('.match-caption-live')).toContainText(/fraction|Bite/i);
  });

  test('live HUD and battle dock sync on MATCH battle', async ({ page }) => {
    await page.locator('.hs-portal').click();
    await page.waitForSelector('.match-battle .match-live-health.on', { timeout: 10000, state: 'attached' });
    await expect(page.locator('.match-live-goal.on')).toHaveCount(1);
    await expect(page.locator('.match-live-boss.on')).toHaveCount(1);
    await expect(page.locator('.match-health-text')).toHaveText('3 / 3');
    await page.locator('.hs-pillar-2').click();
    await expect.poll(async () => page.locator('.match-live-targets').textContent()).toMatch(/Targets/i);
    await expect(page.locator('.match-toast')).toContainText('Great job');
    await page.locator('.hs-battle-settings').click();
    await expect(page.locator('#settings.show')).toBeVisible();
    await expect(page.locator('#parentGate')).toBeHidden();
  });

  test('reduced motion setting disables MATCH FX animations', async ({ page }) => {
    await page.locator('.hs-settings').click();
    await page.locator('#reducedMotion').check();
    await page.locator('nav button[data-screen="home"]').click();
    await expect(page.locator('html')).toHaveClass(/reduced-motion/);
    await page.locator('.hs-portal').click();
    await page.waitForSelector('.match-battle .match-plate', { timeout: 10000 });
    const anim = await page.evaluate(() => {
      const sheen = document.querySelector('.match-sheen');
      return sheen ? getComputedStyle(sheen).animationName : '';
    });
    expect(anim === 'none' || anim === '').toBeTruthy();
  });
});
