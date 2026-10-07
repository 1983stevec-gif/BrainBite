import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { globalThis.__BRAINBITE_LAB__ = true; });
  await page.goto('/?match=0&webgl=0');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('bb-presentation', 'dom'); });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!P().currencyLedger)).toBe(true);
});

async function finishMission(page, id) {
  return page.evaluate(async missionId => {
    await PERSISTENCE_CHAIN;
    if (!window.BrainBiteGame.startMission(missionId)) throw new Error('Mission did not launch');
    let accepted = 0;
    for (let index = 0; index < 30; index += 1) {
      const cell = G.cells.find(item => !item.eaten && item.correct);
      const challenge = G.activity?.challenge, values = activityValues(challenge), progress = activityProgress(challenge);
      const answer = challenge ? challenge.family === 'Target Smash'
        ? values.find(value => !progress.map(String).includes(String(value))) : values[progress.length] : cell?.value;
      if (answer === undefined) break;
      if (!window.BrainBiteGame.tryAnswer(String(answer))) throw new Error('Correct answer was refused: ' + JSON.stringify({ missionId, answer, activity: G?.activity, feedback: document.getElementById('feedback')?.textContent }));
      accepted += 1;
      if (progression().completedMissionIds.includes(missionId) && G.correct >= G.total) break;
    }
    await save();
    if (!progression().completedMissionIds.includes(missionId)) throw new Error('Mission did not complete');
    return { accepted, profile: externalizeProfile(P()) };
  }, id);
}

async function offlineReplica(browser, seed, missionId) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto('/?match=0&webgl=0');
    await page.waitForFunction(() => !!P().currencyLedger);
    await page.evaluate(() => PERSISTENCE_CHAIN);
    await page.evaluate(store => { localStorage.clear(); localStorage.setItem('bb-presentation', 'dom'); localStorage.setItem('bb-core-v3', JSON.stringify(store)); }, seed);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!P().currencyLedger)).toBe(true);
    await page.evaluate(() => PERSISTENCE_CHAIN);
    await context.setOffline(true);
    return (await finishMission(page, missionId)).profile;
  } finally { await context.close(); }
}

test('first and repeated real missions keep unique completion rewards and profile isolation', async ({ page }) => {
  const first = await finishMission(page, 1);
  expect(first.accepted).toBeGreaterThan(0);
  expect(first.profile).toMatchObject({ stars: 3, spark: 3 });
  const repeated = await finishMission(page, 1);
  expect(repeated.profile.stars).toBe(3);
  expect(repeated.profile.spark).toBe(3);
  expect(repeated.profile.score).toBeGreaterThan(first.profile.score);
  await page.reload();
  const persisted = await page.evaluate(() => ({ stars: P().stars, spark: P().spark, score: P().score, sibling: core().projectProfileCurrency(blank('Sibling')) }));
  expect(persisted).toMatchObject({ stars: 3, spark: 3, score: repeated.profile.score, sibling: { score: 0, stars: 0, spark: 0 } });
});

test('two actual offline replicas retain distinct mission rewards and every independent page score writer', async ({ page, browser }) => {
  const shared = await finishMission(page, 21);
  const seed = await page.evaluate(() => externalizeStore());
  const left = await offlineReplica(browser, seed, 1);
  const right = await offlineReplica(browser, seed, 11);
  const result = await page.evaluate(({ left, right }) => {
    const merged = mergeProfiles(left, right, { remoteCloud: true });
    return { profile: merged, repeated: mergeProfiles(merged, right, { remoteCloud: true }) };
  }, { left, right });
  expect(result.profile.progression.completedMissionIds).toEqual([1, 11, 21]);
  expect(result.profile.stars).toBe(9);
  expect(result.profile.spark).toBe(9);
  expect(result.profile.score).toBe(left.score + right.score - shared.profile.score);
  expect(result.repeated.currencyLedger).toEqual(result.profile.currencyLedger);
  expect(Object.keys(JSON.parse(result.profile.currencyLedger.writers)).length).toBe(3);
});

test('shared completion on independent offline replicas grants one mission reward and preserves each played score', async ({ page, browser }) => {
  const seed = await page.evaluate(() => externalizeStore());
  const left = await offlineReplica(browser, seed, 1);
  const right = await offlineReplica(browser, seed, 1);
  const merged = await page.evaluate(({ left, right }) => mergeProfiles(left, right, { remoteCloud: true }), { left, right });
  expect(merged.progression.completedMissionIds).toEqual([1]);
  expect(merged).toMatchObject({ stars: 3, spark: 3, score: left.score + right.score });
});

test('real shop purchase persists deduction across reload and stale replica merge', async ({ page }) => {
  const before = await page.evaluate(async () => {
    delete P().currencyLedger;
    P().spark = 30;
    Object.assign(P(), core().projectProfileCurrency(P()));
    await save();
    const stale = externalizeProfile(P());
    show('bites'); renderBites();
    return stale;
  });
  await page.locator('#shopList .shop-row').filter({ hasText: 'Space Trail' }).getByRole('button', { name: 'Buy', exact: true }).click();
  await expect.poll(() => page.evaluate(() => P().spark)).toBe(24);
  await page.evaluate(() => PERSISTENCE_CHAIN);
  await page.reload();
  const result = await page.evaluate(stale => ({ spark: P().spark, owned: P().cosmetics, merged: mergeProfiles(P(), stale).spark }), before);
  expect(result).toEqual({ spark: 24, owned: ['space_trail'], merged: 24 });
});

test('exports retain provenance, invalid imports reject and tombstones cannot resurrect profile currency', async ({ page }) => {
  await finishMission(page, 1);
  const result = await page.evaluate(() => {
    const exported = exportEnvelope(), imported = importedStoreFromText(JSON.stringify(exported));
    const before = structuredClone(P().currencyLedger);
    const hostile = JSON.parse(JSON.stringify(exported));
    hostile.payload.store.profiles[0].currencyLedger.profileId = 'different-learner';
    hostile.digest = checksum(JSON.stringify(hostile.payload.store));
    let rejected = false;
    try { importedStoreFromText(JSON.stringify(hostile)); } catch { rejected = true; }
    const deleted = { ...imported, profiles: [], deletedProfiles: [{ id: imported.profiles[0].id, deletedAt: Date.now() }] };
    const merged = mergeStores(deleted, [imported]);
    return { before, imported: imported.profiles[0].currencyLedger, rejected, resurrected: merged.profiles.some(profile => profile.id === imported.profiles[0].id) };
  });
  expect(result.imported).toEqual(result.before);
  expect(result.rejected).toBe(true);
  expect(result.resurrected).toBe(false);
});

test('legacy cloud bootstrap proves original baseline and ambiguous sync refuses all partial incoming changes', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const snapshot = externalizeProfile(P());
    const legacy = { ...snapshot }; delete legacy.currencyLedger;
    const upgraded = mergeProfiles(snapshot, legacy, { remoteCloud: true });
    const malformed = { ...snapshot, currencyLedger: { ...snapshot.currencyLedger, profileId: 'sibling' } };
    let malformedRejected = false;
    try { sanitizeRemoteProfile(malformed); } catch { malformedRejected = true; }
    const earlier = blank('Unrelated incoming learner');
    const ambiguous = { ...legacy, score: 100, progression: { ...legacy.progression, completedMissionIds: [1] } };
    const before = JSON.stringify(STORE);
    const previous = cloudClient;
    cloudClient = () => ({ configured: () => true, pullProfiles: async () => [{ progress: earlier }, { progress: ambiguous }] });
    let message;
    try { await pullAllFromFirebase(); } catch (error) { message = error.message; }
    finally { cloudClient = previous; }
    return { attached: upgraded.currencyLedger, original: snapshot.currencyLedger, unchanged: JSON.stringify(STORE) === before, message, malformedRejected };
  });
  expect(result.attached).toEqual(result.original);
  expect(result.message).toContain('Update every device');
  expect(result.unchanged).toBe(true);
  expect(result.malformedRejected).toBe(true);
});

test('locked parent setup and PIN gates provide a keyboard-accessible child exit without parent access', async ({ page }) => {
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  const exit = page.locator('#parentGate').getByRole('button', { name: 'Back to kid hub', exact: true });
  await expect(exit).toBeVisible();
  await exit.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#home')).toBeVisible();
  expect(await page.evaluate(() => hasParentAccess())).toBe(false);
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await page.locator('#parentPinInput').fill('654321');
  await page.locator('#confirmParentPin').fill('654321');
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentContent')).toBeVisible();
  await page.locator('#parentExitToChild').click();
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await expect(exit).toBeVisible();
  await exit.click();
  await expect(page.locator('#home')).toBeVisible();
  expect(await page.evaluate(() => hasParentAccess())).toBe(false);
});