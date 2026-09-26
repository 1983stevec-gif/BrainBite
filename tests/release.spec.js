import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { globalThis.__BRAINBITE_LAB__ = true; });
  await page.goto('/?match=0&webgl=0');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('bb-presentation', 'dom');
  });
  await page.reload();
  // Release suite exercises admin screens; unlock parent gate after fresh profile.
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await page.locator('#parentPinInput').fill('654321');
  await page.locator('#confirmParentPin').fill('654321');
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentContent')).toBeVisible();
  await page.getByRole('button', { name: 'Back to kid hub' }).click();
  await expect(page.locator('#childDock')).toBeVisible();
});

async function unlockViaGate(page) {
  await page.locator('#parentPinInput').fill('654321');
  if (await page.locator('#confirmParentPin').isVisible()) await page.locator('#confirmParentPin').fill('654321');
  await page.locator('#unlockParent').click();
}

// Parent destinations live in the parent shell, which is only present in parent context.
async function enterParentArea(page) {
  if (!(await page.locator('#parentShellNav').isVisible())) {
    const orb = page.getByRole('button', { name: 'Parents', exact: true });
    if (!(await orb.isVisible())) await page.locator('#childDock button[data-screen="home"]').click();
    await orb.click();
    if (await page.locator('#parentPinInput').isVisible()) await unlockViaGate(page);
  }
}

async function unlockParent(page) {
  await enterParentArea(page);
  await expect(page.locator('#parentShellNav')).toBeVisible();
  await page.locator('#parentShellNav').getByRole('button', { name: 'Progress', exact: true }).click();
  if (!(await page.locator('#parentContent').isVisible())) await unlockViaGate(page);
  await expect(page.locator('#parentContent')).toBeVisible();
}

async function parentDestination(page, name) {
  await enterParentArea(page);
  await page.locator('#parentShellNav').getByRole('button', { name, exact: true }).click();
}

async function leaveParentArea(page) {
  await page.getByRole('button', { name: 'Back to kid hub' }).click();
  await expect(page.locator('#childDock')).toBeVisible();
}

async function openLab(page) {
  await unlockParent(page);
  await page.locator('#parentShellNav button[data-screen="advanced"]').click();
  await page.getByRole('button', { name: 'BrainBite Lab', exact: true }).click();
  await expect(page.locator('#qa.show')).toBeVisible();
}

async function openWorld(page, name) {
  await page.locator('#childDock button[data-screen="worlds"]').click();
  await page.getByRole('button', { name, exact: true }).click();
}

async function approveSensitiveAction(page, { pin = '654321', confirmation = null } = {}) {
  const dialog = page.locator('#sensitiveActionDialog');
  await expect(dialog).toBeVisible();
  if (confirmation !== null) await page.locator('#sensitiveActionConfirmation').fill(confirmation);
  await page.locator('#sensitiveActionPin').fill(pin);
  await page.locator('#sensitiveActionConfirm').click();
  await expect(page.locator('#sensitiveActionBackdrop')).toBeHidden({ timeout: 15_000 });
}

async function seedTimeUsage(page, overrides = {}, controls = { dailyMinutes: 30, maxSessionMinutes: 20 }) {
  await page.evaluate(async ({ overrides, controls }) => {
    const now = Date.now();
    const dayKey = value => {
      const date = new Date(value);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    P().controls = { ...P().controls, ...controls };
    await save();
    await PERSISTENCE_CHAIN;
    const entry = {
      profileId: P().id,
      dayKey: dayKey(now),
      dailyActiveMs: 0,
      sessionId: null,
      sessionStartedAt: 0,
      sessionActiveMs: 0,
      lastTickAt: 0,
      lastActivityAt: 0,
      extensionGrantedMs: 0,
      extensionActiveMs: 0,
      updatedAt: now,
      lastSeenWallClock: now,
      recoveryBaselineMs: 0,
      ...overrides,
    };
    const ledger = { version: 1, profiles: { [P().id]: entry }, updatedAt: now, warning: null };
    localStorage.setItem('bb-time-usage-v1', JSON.stringify(ledger));
    localStorage.setItem('bb-time-usage-v1-backup', JSON.stringify(ledger));
  }, { overrides, controls });
  await page.reload();
  await page.waitForFunction(() => !!window.BrainBiteTimeUsage);
}
test('boots without runtime errors and separates the child hub from parent tools', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  await unlockParent(page);
  await leaveParentArea(page);
  await expect(page.getByRole('heading', { name: 'BrainBite' })).toBeVisible();
  // Child hub: six primary tiles plus three utility controls, and one five-target dock.
  const hub = page.locator('#home .home-primary-actions');
  for (const name of ['Continue Adventure','Practice Lab','Worlds','BrainBase','My Bites','Code']) {
    await expect(hub.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(hub.getByRole('button')).toHaveCount(6);
  const utilities = page.locator('#home .dash-quick-actions');
  for (const name of ['Profile','Settings','Parents']) {
    await expect(utilities.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(utilities.getByRole('button')).toHaveCount(3);
  await expect(page.locator('#childDock button')).toHaveCount(5);
  // Parent destinations stay inside the parent shell, never on the child hub.
  await expect(page.locator('#parentShellNav')).toBeHidden();
  for (const name of ['Profiles','Recovery','Account & Sync','Advanced']) {
    await expect(page.locator('#home').getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByRole('button', { name: 'Snap-to-Game', exact: true })).toHaveCount(0);
  await expect(page.locator('#snap, #snapFile, #ocrText, #saveSnap')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('child hub drops placeholder cards, debug badges, and duplicated docks', async ({ page }) => {
  await expect(page.locator('#home .home-primary-actions button')).toHaveCount(6);
  await expect(page.locator('#home .home-news, #home .home-promo, #home .carousel-dots, #home .reward-hat, #home .currency-energy, #home .home-dock')).toHaveCount(0);
  await expect(page.locator('#homeEnergy, #webglBadge')).toHaveCount(0);
  await expect(page.locator('#home')).not.toContainText('DOUBLE BRAINBITES');
  await expect(page.locator('#home')).not.toContainText('SEE WHAT');
  // The scene selector is a parent-only device setting.
  await expect(page.getByRole('combobox', { name: 'Scene presentation' })).toBeHidden();
  // The parent shell only appears inside parent context.
  await expect(page.locator('#parentShellNav')).toBeHidden();
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await expect(page.locator('#parentShellNav')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to kid hub' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to kid hub' }).click();
  await expect(page.locator('#childDock')).toBeVisible();
  await expect(page.locator('#parentShellNav')).toBeHidden();
});

test('launch policy pages are linked and clearly labeled', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'privacy.html');
  await expect(page.getByRole('link', { name: 'Support' })).toHaveAttribute('href', 'support.html');
  await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', 'terms.html');

  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page.getByRole('heading', { name: 'BrainBite Privacy Policy' })).toBeVisible();
  await expect(page.getByText('Legal review required before launch')).toBeVisible();

  await page.goto('/?match=0&webgl=0');
  await page.getByRole('link', { name: 'Support' }).click();
  await expect(page.getByRole('heading', { name: 'BrainBite Support' })).toBeVisible();
  await expect(page.getByText('Production contact required before launch')).toBeVisible();

  await page.goto('/?match=0&webgl=0');
  await page.getByRole('link', { name: 'Terms' }).click();
  await expect(page.getByRole('heading', { name: 'BrainBite Terms of Use' })).toBeVisible();
  await expect(page.getByText('Terms review required before launch')).toBeVisible();
});

test('all 30 missions and all 3 bosses launch and complete through progression', async ({ page }) => {
  test.setTimeout(90_000);
  for (const [world, first, last] of [['Number Nebula',1,10],['Wordwood',11,20],['Spanish Portal',21,30]]) {
    await page.locator('#childDock button[data-screen="worlds"]').click();
    await page.getByRole('button', { name: world, exact: true }).click();
    const list = page.locator(`#${first === 1 ? 'math' : first === 11 ? 'words' : 'spanish'}List`);
    await expect(list.locator('.mission-row')).toHaveCount(10);
    for (let id = first; id <= last; id++) {
      await list.getByRole('button', { name: new RegExp(`^(Play|Replay) mission ${id}:`) }).click();
      await expect(page.locator('#game.show')).toBeVisible();
      if ([10,20,30].includes(id)) {
        await expect(page.locator('#bossBox')).toBeVisible();
        await expect(page.locator('#bossPhase')).toContainText('Phase');
      }
      await page.evaluate(() => complete());
      await expect(page.locator(`#${first === 1 ? 'math' : first === 11 ? 'words' : 'spanish'}.show`)).toBeVisible();
    }
  }
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  expect(state.profiles[0].progression.completedMissionIds).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  expect(state.profiles[0].stars).toBe(90);
  expect(state.profiles[0].spark).toBe(111);
  expect(state.profiles[0].sessions).toHaveLength(30);
});

test('keyboard and touch controls update game state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('button', { name: 'Continue Adventure' }).click();
  const before = await page.evaluate(() => ({ ...G.p }));
  await page.keyboard.press(before.y > 0 ? 'ArrowUp' : 'ArrowDown');
  const afterKey = await page.evaluate(() => ({ ...G.p }));
  expect(afterKey).not.toEqual(before);
  await page.locator(`[data-d="${afterKey.x > 0 ? 'l' : 'r'}"]`).click();
  const afterTouch = await page.evaluate(() => ({ ...G.p }));
  expect(afterTouch).not.toEqual(afterKey);
  await expect(page.locator('#lives')).toHaveText(/\d/);
  await expect(page.locator('#combo')).toHaveText(/\d/);
});

test('profiles are isolated while legacy Snap recovery records remain device-local', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.locator('#largeTargets').check();
  await page.locator('#reducedMotion').check();
  await page.evaluate(() => PERSISTENCE_CHAIN);
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('#largeTargets')).toBeChecked();
  await expect(page.locator('#reducedMotion')).toBeChecked();

  await page.locator('#childDock button[data-screen="home"]').click();
  await page.getByRole('button', { name: 'Practice Lab' }).click();
  await page.locator('#practiceTopic').fill('fractions');
  await page.getByRole('button', { name: 'Build Practice' }).click();
  await expect(page.locator('#practiceResult')).toContainText('Fractions');
  const legacySnap = { id: 'legacy-snap-one', topic: 'multiplication by 7', items: ['7×4=28'], correct: ['28'], wrong: ['27'], image: 'data:image/png;base64,legacy-private', ts: 100 };
  await page.evaluate(async record => { P().snap = [record]; P().controls.requireParentForSnap = true; await save(); }, legacySnap);
  await page.reload();
  const retained = await page.evaluate(() => ({
    memory: P().snap,
    primary: JSON.parse(localStorage.getItem('bb-core-v3')).profiles[0].snap,
    backup: JSON.parse(localStorage.getItem('bb-core-v3-back')).profiles[0].snap,
    recovery: JSON.parse(localStorage.getItem('bb-core-v3-recovery')).profiles[0].snap,
    profileExport: externalizeProfile(P()).snap,
    envelope: exportEnvelope(),
    controls: P().controls,
  }));
  expect(retained.memory).toEqual([legacySnap]);
  expect(retained.primary).toEqual([legacySnap]);
  expect(retained.backup).toEqual([legacySnap]);
  expect(retained.recovery).toEqual([legacySnap]);
  expect(retained.profileExport).toEqual([legacySnap]);
  expect(retained.envelope.version).toBe(3);
  expect(retained.envelope.payload.store.profiles[0].snap).toEqual([legacySnap]);
  expect(retained.controls).not.toHaveProperty('requireParentForSnap');

  await unlockParent(page);
  await parentDestination(page, 'Profiles');
  await page.locator('#newProfile').fill('Second Kid');
  await page.getByRole('button', { name: 'Add Profile' }).click();
  await expect(page.locator('#profileName')).toHaveText('Second Kid');
  await unlockParent(page);
  await parentDestination(page, 'Profiles');
  await page.getByRole('button', { name: 'Delete Active Profile' }).click();
  await approveSensitiveAction(page, { confirmation: 'Second Kid' });
  await expect(page.locator('#profileList')).not.toContainText('Second Kid');
  await page.evaluate(() => PERSISTENCE_CHAIN);
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  const sync = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v6-sync')));
  expect(state.profiles[0].practice).toHaveLength(1);
  expect(state.profiles[0].snap).toHaveLength(1);
  expect(state.profiles).toHaveLength(1);
  expect(sync.queue.some(evt => evt.type === 'store-update' && evt.profileId && evt.schemaVersion === 9)).toBe(true);

  await parentDestination(page, 'Recovery');
  await page.getByRole('button', { name: 'Create Backup' }).click();
  await expect(page.locator('#saveHealth')).toContainText(/Backup created|available/);
});

test('LearningCore evidence stays isolated inside the canonical profile ledger', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteFoundationBridge);
  const result = await page.evaluate(async () => {
    const core = window.BrainBiteCore;
    const firstId = STORE.profiles[0].id;
    let foundation = window.BrainBiteFoundationBridge.load();
    foundation.learners[firstId] = core.recordLearnerAttempt(
      foundation.learners[firstId],
      'math-4-fractions',
      { correct: true, independent: true, assisted: false, hintsUsed: 0, responseTimeMs: 1800 },
      { id: 'math-4-fractions' },
    );
    window.BrainBiteFoundationBridge.persist(foundation);
    await PERSISTENCE_CHAIN;

    const second = blank('Second Learner');
    STORE.profiles.push(second);
    STORE.active = 1;
    save();
    foundation = window.BrainBiteFoundationBridge.load();
    foundation.learners[second.id] = core.recordLearnerAttempt(
      foundation.learners[second.id],
      'word-order',
      { correct: false, independent: true, assisted: false, hintsUsed: 0, responseTimeMs: 2600 },
      { id: 'word-order' },
    );
    window.BrainBiteFoundationBridge.persist(foundation);
    await PERSISTENCE_CHAIN;

    const stored = JSON.parse(localStorage.getItem('bb-core-v3'));
    const first = stored.profiles.find(profile => profile.id === firstId);
    const secondStored = stored.profiles.find(profile => profile.id === second.id);
    return {
      schemaVersion: stored.schemaVersion,
      firstHasFractions: !!first.learningCore.skills['math-4-fractions'],
      firstHasWords: !!first.learningCore.skills['word-order'],
      secondHasFractions: !!secondStored.learningCore.skills['math-4-fractions'],
      secondHasWords: !!secondStored.learningCore.skills['word-order'],
      standaloneKeys: [core.STORAGE_KEY, core.BACKUP_KEY, core.RECOVERY_KEY].map(key => localStorage.getItem(key)),
    };
  });
  expect(result).toEqual({
    schemaVersion: 9,
    firstHasFractions: true,
    firstHasWords: false,
    secondHasFractions: false,
    secondHasWords: true,
    standaloneKeys: [null, null, null],
  });
});

test('legacy standalone LearningCore state imports once into the canonical profile', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore);
  await page.evaluate(() => {
    const core = window.BrainBiteCore;
    const store = JSON.parse(localStorage.getItem('bb-core-v3'));
    const profile = store.profiles[0];
    const canonicalLearner = core.defaultLearner(profile.name, profile.id);
    canonicalLearner.skills['word-order'] = core.createSkillState('word-order');
    profile.learningCore = canonicalLearner;
    localStorage.setItem('bb-core-v3', JSON.stringify(store));
    const learner = core.defaultLearner(profile.name, profile.id);
    learner.hub = { ...learner.hub, variant: 'upgraded', expansionUnlocked: true, upgrades: ['brainbase-upgrade'] };
    learner.skills['math-4-fractions'] = core.createSkillState('math-4-fractions');
    const foundation = core.normalizeFoundationState({ learners: { [profile.id]: learner }, activeLearnerId: profile.id });
    localStorage.setItem(core.STORAGE_KEY, '{}');
    localStorage.setItem(core.BACKUP_KEY, JSON.stringify(foundation));
  });
  await page.reload();
  const result = await page.evaluate(() => {
    const core = window.BrainBiteCore;
    const store = JSON.parse(localStorage.getItem('bb-core-v3'));
    const learner = store.profiles[0].learningCore;
    return {
      hubVariant: learner.hub.variant,
      expansionUnlocked: learner.hub.expansionUnlocked,
      hasFractions: !!learner.skills['math-4-fractions'],
      hasWords: !!learner.skills['word-order'],
      standaloneKeys: [core.STORAGE_KEY, core.BACKUP_KEY, core.RECOVERY_KEY].map(key => localStorage.getItem(key)),
    };
  });
  expect(result).toEqual({
    hubVariant: 'upgraded',
    expansionUnlocked: true,
    hasFractions: true,
    hasWords: true,
    standaloneKeys: [null, null, null],
  });
});

test('cloud profile merge preserves independent LearningCore skills, rewards, and queued events', async ({ page }) => {
  const result = await page.evaluate(() => {
    const base = { id: 'profile-a', name: 'Kid', score: 0, stars: 0, spark: 0, progression: REGISTRY.createProgression(), updatedAt: 100 };
    const local = {
      ...base,
      learningCore: {
        profileId: 'profile-a', name: 'Kid', skills: {
          fractions: { skillId: 'fractions', masteryScore: 44, lastPracticedAt: 100, evidence: { attempts: 2 } },
          shared: { skillId: 'shared', masteryScore: 18, lastPracticedAt: 110, evidence: { attempts: 1, independentSuccesses: 1 }, recentPerformance: [{ id: 'local-shared', correct: true, assisted: false, hintsUsed: 0, responseTimeMs: 1800, at: 110 }] },
        },
        mastery: { fractions: 44 }, rewards: [{ id: 'reward-a', awardedAt: 100 }], rewardLedger: { 'reward-a': true },
        offlineQueue: [{ id: 'event-a', timestamp: 100 }], sentEventIds: [], completedStages: ['target-smash'], hub: { variant: 'starter', upgrades: [] },
      },
    };
    const remote = {
      ...base, updatedAt: 200,
      learningCore: {
        profileId: 'profile-a', name: 'Kid', skills: {
          words: { skillId: 'words', masteryScore: 51, lastPracticedAt: 200, evidence: { attempts: 3 } },
          shared: { skillId: 'shared', masteryScore: 0, lastPracticedAt: 210, evidence: { attempts: 1, incorrectAttempts: 1 }, recentPerformance: [{ id: 'remote-shared', correct: false, assisted: false, hintsUsed: 0, responseTimeMs: 2200, at: 210 }] },
        },
        mastery: { words: 51 }, rewards: [{ id: 'reward-b', awardedAt: 200 }], rewardLedger: { 'reward-b': true },
        offlineQueue: [{ id: 'event-b', timestamp: 200 }, { id: 'event-sent', timestamp: 190 }], sentEventIds: ['event-sent'], completedStages: ['letter-trail'], hub: { variant: 'upgraded', expansionUnlocked: true, upgrades: ['brainbase-upgrade'] },
      },
    };
    return mergeProfiles(local, remote).learningCore;
  });
  expect(Object.keys(result.skills).sort()).toEqual(['fractions', 'shared', 'words']);
  expect(result.skills.shared.evidence.attempts).toBe(2);
  expect(result.skills.shared.evidence.independentSuccesses).toBe(1);
  expect(result.skills.shared.evidence.incorrectAttempts).toBe(1);
  expect(result.rewards.map(reward => reward.id).sort()).toEqual(['reward-a', 'reward-b']);
  expect(result.offlineQueue.map(event => event.id).sort()).toEqual(['event-a', 'event-b']);
  expect(result.sentEventIds).toEqual(['event-sent']);
  expect(result.completedStages.sort()).toEqual(['letter-trail', 'target-smash']);
  expect(result.hub.variant).toBe('upgraded');
});

test('locked missions cannot launch or grant progression rewards', async ({ page }) => {
  const result = await page.evaluate(() => {
    const before = { stars: P().stars, spark: P().spark, lastMissionId: progression().lastMissionId };
    const launched = start(10);
    G = makeGame(REGISTRY.getMission(10));
    const completed = complete();
    return { before, launched, completed, stars: P().stars, spark: P().spark, lastMissionId: progression().lastMissionId, completedIds: progression().completedMissionIds };
  });
  expect(result.launched).toBe(false);
  expect(result.completed).toBe(false);
  expect(result.stars).toBe(result.before.stars);
  expect(result.spark).toBe(result.before.spark);
  expect(result.lastMissionId).toBe(result.before.lastMissionId);
  expect(result.completedIds).not.toContain(10);
});

test('fresh installs keep child play available and enforce verifier setup with persisted lockout', async ({ page }) => {
  await page.evaluate(() => { localStorage.removeItem('bb-parent-auth-v1'); });
  await page.reload();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  expect(JSON.stringify(stored)).not.toContain('1234');
  expect(stored.profiles[0]).not.toHaveProperty('parentPin');
  await openWorld(page, 'Number Nebula');
  await page.getByRole('button', { name: /^Play mission 1:/ }).click();
  await expect(page.locator('#game.show')).toBeVisible();
  await page.locator('#exitBtn').click();
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await page.locator('#parentPinInput').fill('765432');
  await page.locator('#confirmParentPin').fill('765432');
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentContent')).toBeVisible();
  const auth = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-parent-auth-v1')));
  expect(auth).toMatchObject({ version: 1, algorithm: 'PBKDF2-SHA-256', iterations: 600000, failedAttempts: 0, lockedUntil: 0 });
  expect(auth.saltB64).toBeTruthy();
  expect(auth.verifierB64).toBeTruthy();
  expect(JSON.stringify(auth)).not.toContain('765432');
  await page.locator('#lockParent').click();
  for (let attempt = 1; attempt <= 4; attempt++) {
    await page.locator('#parentPinInput').fill('111111');
    await page.locator('#unlockParent').click();
    await expect(page.locator('#parentGateMsg')).toContainText(`${5 - attempt} attempt(s) remaining`);
  }
  await page.locator('#parentPinInput').fill('111111');
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentGateMsg')).toContainText('Too many attempts');
  const lockedUntil = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-parent-auth-v1')).lockedUntil);
  expect(lockedUntil).toBeGreaterThan(Date.now());
  await page.reload();
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await page.locator('#parentPinInput').fill('765432');
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentGateMsg')).toContainText('Too many attempts');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bb-parent-auth-v1')).lockedUntil)).toBe(lockedUntil);
  await expect(page.locator('#parentPinInput')).toHaveValue('');
});

test('legacy secrets are scrubbed and every external boundary omits forbidden auth material', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const forbiddenKeys = new Set(['parentPin','parentAuth','pinHash','pinSalt','password','idToken','refreshToken','accessToken']);
    const legacy = structuredClone(STORE);
    legacy.profiles[0].score = 321;
    legacy.profiles[0].parentPin = 'legacy-pin-value';
    legacy.profiles[0].learningCore = { ...(legacy.profiles[0].learningCore || {}), password: 'legacy-password-value' };
    for (const key of ['bb-core-v3','bb-core-v3-back','bb-core-v3-recovery']) localStorage.setItem(key, JSON.stringify(legacy));
    STORE = migrateStore(legacy);
    await persistCanonicalState();
    const client = new BrainBiteFirebaseREST('brainbite-test','A'.repeat(24));
    client.session = { localId: 'family-test', idToken: 'session-token' };
    const exportedStore = externalizeStore();
    const activeProfile = externalizeProfile(P());
    const cloudProfile = externalizeProfile(P(), { cloud: true });
    const firestoreBody = client.profilePatchBody(P());
    const snapshot = cloudSnapshot();
    const envelope = exportEnvelope();
    const violations = [];
    const scan = (value, path = '$') => {
      if (Array.isArray(value)) return value.forEach((child, index) => scan(child, `${path}[${index}]`));
      if (!value || typeof value !== 'object') { if (['legacy-pin-value','legacy-password-value','session-token'].includes(value)) violations.push(path); return; }
      for (const [key, child] of Object.entries(value)) { if (forbiddenKeys.has(key)) violations.push(`${path}.${key}`); scan(child, `${path}.${key}`); }
    };
    [exportedStore,activeProfile,cloudProfile,firestoreBody,snapshot,envelope].forEach(value => scan(value));
    const persisted = ['bb-core-v3','bb-core-v3-back','bb-core-v3-recovery'].map(key => JSON.parse(localStorage.getItem(key)));
    persisted.forEach(value => scan(value));
    return { violations, score: STORE.profiles[0].score, cloudKeys: Object.keys(cloudProfile.learningCore).sort(), sentinels: [cloudProfile.equippedCosmetic,cloudProfile.activeProgrammableBitId], maps: [cloudProfile.codeBridgeLessons,cloudProfile.programmableBitLessons,cloudProfile.bubbleReefRewards], snap: cloudProfile.snap };
  });
  expect(result.violations).toEqual([]);
  expect(result.score).toBe(321);
  expect(result.cloudKeys).toEqual(['completedStages','hub','mastery','rewardLedger','rewards','skills','stage','version']);
  expect(result.sentinels).toEqual(['','']);
  expect(result.maps).toEqual([{}, {}, {}]);
  expect(result.snap).toEqual([]);
});

test('Phase 2.4 retires Snap from production while preserving only local recovery records', async ({ page }) => {
  await page.goto('/?match=0&webgl=0&screen=snap&snap=1#snap');
  const result = await page.evaluate(async () => {
    const localLegacy = { id: 'legacy-local', topic: 'PRIVATE_LOCAL_WORKSHEET_TEXT', image: 'data:image/png;base64,PRIVATE_LOCAL_WORKSHEET_IMAGE', ts: 41 };
    const hostileRemote = { id: 'hostile-remote', topic: 'PRIVATE_REMOTE_WORKSHEET_TEXT', image: 'data:image/png;base64,PRIVATE_REMOTE_WORKSHEET_IMAGE', ts: 42 };
    P().snap = [localLegacy];
    P().controls.requireParentForSnap = true;
    P().unexpectedPrivatePayload = { worksheetText: 'PRIVATE_UNEXPECTED_TEXT', image: 'PRIVATE_UNEXPECTED_IMAGE' };
    P().parentAuth = { verifier: 'PRIVATE_VERIFIER' };
    P().timeLedger = { active: 999 };
    await save();
    const migrated = migrateStore(structuredClone(STORE));
    const localProfile = externalizeProfile(migrated.profiles[migrated.active]);
    const localEnvelope = exportEnvelope();
    const cloud = externalizeProfile(P(), { cloud: true });
    const snapshot = cloudSnapshot();
    const client = new BrainBiteFirebaseREST('brainbite-test', 'A'.repeat(24));
    client.session = { localId: 'family-test', idToken: 'PRIVATE_TOKEN' };
    const firestoreBody = client.profilePatchBody(P());
    const remoteInput = { ...cloud, snap: [hostileRemote], worksheetText: 'PRIVATE_REMOTE_TOP_LEVEL', parentPin: '123456', timeLedger: { active: 10 } };
    const sanitized = sanitizeRemoteProfile(remoteInput);
    const merged = mergeProfiles(migrated.profiles[migrated.active], sanitized);
    localStorage.setItem('bb-core-v9-integrations', JSON.stringify({ cloud: { provider: 'none', url: '', key: '' }, ocr: { provider: 'custom', endpoint: 'https://private.example/ocr' } }));
    const integrations = integrationState();
    const routeAllowed = show('snap');
    return {
      dom: {
        screen: !!document.getElementById('snap'),
        file: !!document.getElementById('snapFile'),
        parser: typeof globalThis.parseWorksheetText,
        nav: [...document.querySelectorAll('[data-screen]')].some(node => node.dataset.screen === 'snap'),
      },
      routeAllowed,
      homeVisible: document.getElementById('home').classList.contains('show'),
      localProfileSnap: localProfile.snap,
      envelopeSnap: localEnvelope.payload.store.profiles[0].snap,
      migratedControls: migrated.profiles[migrated.active].controls,
      cloud,
      snapshotSnap: snapshot.store.profiles[snapshot.store.active].snap,
      sanitizedSnap: sanitized.snap,
      mergedSnap: merged.snap,
      cloudText: JSON.stringify({ cloud, snapshot, firestoreBody }),
      cloudKeys: Object.keys(cloud).sort(),
      integrations,
    };
  });
  expect(result.dom).toEqual({ screen: false, file: false, parser: 'undefined', nav: false });
  expect(result.routeAllowed).toBe(false);
  expect(result.homeVisible).toBe(true);
  expect(result.localProfileSnap).toEqual([{ id: 'legacy-local', topic: 'PRIVATE_LOCAL_WORKSHEET_TEXT', image: 'data:image/png;base64,PRIVATE_LOCAL_WORKSHEET_IMAGE', ts: 41 }]);
  expect(result.envelopeSnap).toEqual(result.localProfileSnap);
  expect(result.migratedControls).not.toHaveProperty('requireParentForSnap');
  expect(result.cloud.snap).toEqual([]);
  expect(result.snapshotSnap).toEqual([]);
  expect(result.sanitizedSnap).toEqual([]);
  expect(result.mergedSnap).toEqual(result.localProfileSnap);
  for (const privateValue of ['PRIVATE_LOCAL_WORKSHEET_TEXT','PRIVATE_LOCAL_WORKSHEET_IMAGE','PRIVATE_UNEXPECTED_TEXT','PRIVATE_UNEXPECTED_IMAGE','PRIVATE_VERIFIER','PRIVATE_TOKEN','PRIVATE_REMOTE_WORKSHEET_TEXT','PRIVATE_REMOTE_WORKSHEET_IMAGE','PRIVATE_REMOTE_TOP_LEVEL']) {
    expect(result.cloudText).not.toContain(privateValue);
  }
  expect(result.cloudKeys).toEqual(['activeProgrammableBitId','bestCombo','bite','bubbleReefRewards','codeBridgeLessons','codeLabProjects','controls','cosmetics','equippedCosmetic','id','learningCore','mastery','mistakes','name','practice','programmableBitLessons','programmableBits','progression','score','sessions','settings','skills','snap','spark','stars','unlockedBites','updatedAt']);
  expect(result.integrations).toEqual({ cloud: { provider: 'none', url: '', key: '' } });
});
test('Phase 2.4 nested cloud projections reject adversarial child data while valid progress round-trips', async ({ page }) => {
  const result = await page.evaluate(() => {
    const textMarker = 'ADVERSARIAL_WORKSHEET_SECRET_9f27';
    const imageMarker = 'data:image/png;base64,ADVERSARIAL_IMAGE_9f27';
    const longMarker = `LONG_${'x'.repeat(4096)}`;
    const base = structuredClone(P());
    STORE.active = STORE.profiles.findIndex(profile => profile.id === base.id);
    updateSkill('math-4-fractions', true, { attemptId: 'phase24-valid-attempt', independent: true, responseTimeMs: 1800, source: 'mission' });
    Object.assign(base, structuredClone(P()), {
      unlockedBites: ['Nib', 'Zip'], cosmetics: ['space_trail'], equippedCosmetic: 'space_trail',
      programmableBits: { 'helper-bit': { id: 'helper-bit', name: 'Local Creative Name', behavior: { correct: [{ type: 'glow' }, { type: 'move', amount: 2 }], mistake: [], collect: [{ type: 'collect' }], reset: [] } } },
      activeProgrammableBitId: 'helper-bit',
      practice: [{ subject: 'math', topic: 'fractions', grade: '4', difficulty: 3, missionId: 4, type: 'mission', curriculumSkillId: 'math-4-fractions', ts: 1700000000100, validated: true }],
      sessions: [{ mission: 4, world: 'math', skillId: 'math-4-fractions', combo: 3, accuracy: 100, moves: 3, durationSec: 20, practice: false, homework: false, source: 'mission', ts: 1700000000200 }],
      mistakes: [{ skill: 'math-4-fractions', chosen: 'private answer', ts: 1700000000300 }],
      codeBridgeLessons: { 'code-bridge-open': { masteryScore: 100, completedAt: 1700000000400 } },
      programmableBitLessons: { 'bit-basics': { masteryScore: 80, completedAt: 1700000000500 } },
    });
    const hostile = structuredClone(base);
    const poison = target => Object.assign(target, { unknown: { textMarker, imageMarker, longMarker }, source: textMarker, prompt: imageMarker, score: Infinity });
    poison(hostile.skills['math-4-fractions'] ||= {});
    poison(hostile.learningCore.skills['math-4-fractions']);
    hostile.learningCore.skills['math-4-fractions'].recentPerformance.push({ id: textMarker, at: 1700000000600, source: imageMarker, responseTimeMs: NaN });
    hostile.learningCore.skills['math-4-fractions'].reviewHistory.push({ at: 1700000000700, unknown: imageMarker });
    poison(hostile.practice[0]); poison(hostile.sessions[0]); poison(hostile.mistakes[0]);
    poison(hostile.programmableBits['helper-bit']); hostile.programmableBits['helper-bit'].behavior.correct.push({ type: imageMarker, source: textMarker });
    hostile.codeLabProjects = { project: { source: textMarker, image: imageMarker, nested: [[{ longMarker }]] } };
    poison(hostile.codeBridgeLessons['code-bridge-open']); poison(hostile.programmableBitLessons['bit-basics']);
    hostile.bubbleReefRewards = { profileId: hostile.id, contributionLedger: { [textMarker]: { imageMarker } }, contributions: [{ id: textMarker, name: imageMarker }], rewards: [{ id: textMarker, name: longMarker }] };
    hostile.unlockedBites.push(textMarker, imageMarker); hostile.cosmetics.push(textMarker, imageMarker);
    const projected = cloudProfileProjection(hostile);
    const client = new BrainBiteFirebaseREST('brainbite-test', 'A'.repeat(24));
    client.session = { localId: 'family-test', idToken: 'token' };
    const patch = client.profilePatchBody(hostile);
    const originalProfiles = STORE.profiles; const originalActive = STORE.active;
    STORE.profiles = [hostile]; STORE.active = 0; const snapshot = cloudSnapshot();
    STORE.profiles = originalProfiles; STORE.active = originalActive;
    const sanitized = sanitizeRemoteProfile(hostile);
    const merged = mergeProfiles(base, sanitized, { remoteCloud: true });
    const payloads = { projected, patch, snapshot, sanitized, merged };
    const serialized = Object.fromEntries(Object.entries(payloads).map(([key, value]) => [key, JSON.stringify(value)]));
    return {
      leaks: Object.fromEntries(Object.entries(serialized).map(([key, value]) => [key, [textMarker, imageMarker, longMarker].some(marker => value.includes(marker))])),
      valid: {
        attemptId: sanitized.learningCore.skills['math-4-fractions'].recentPerformance.at(-1)?.id,
        evidence: sanitized.learningCore.skills['math-4-fractions'].evidence,
        practice: sanitized.practice[0], session: sanitized.sessions[0], mistake: sanitized.mistakes[0],
        bit: sanitized.programmableBits['helper-bit'], activeBit: sanitized.activeProgrammableBitId,
        codeBridge: sanitized.codeBridgeLessons['code-bridge-open'], bitLesson: sanitized.programmableBitLessons['bit-basics'],
        unlockedBites: sanitized.unlockedBites, cosmetics: sanitized.cosmetics, equippedCosmetic: sanitized.equippedCosmetic,
        codeLabProjects: sanitized.codeLabProjects, snap: sanitized.snap,
        mergedSkillAttempts: merged.learningCore.skills['math-4-fractions'].evidence.attempts,
        missionOnly: cloudSession({ id: 'stable-record', ts: 1234, mission: 1, privateText: textMarker, nested: { image: imageMarker } }),
      },
    };
  });
  expect(result.leaks).toEqual({ projected: false, patch: false, snapshot: false, sanitized: false, merged: false });
  expect(result.valid.attemptId).toBe('phase24-valid-attempt');
  expect(result.valid.evidence.independentSuccesses).toBeGreaterThanOrEqual(1);
  expect(result.valid.practice).toMatchObject({ subject: 'math', grade: '4', difficulty: 3, missionId: 4, validated: true });
  expect(result.valid.practice).not.toHaveProperty('topic');
  expect(result.valid.session).toMatchObject({ mission: 4, world: 'math', skillId: 'math-4-fractions', accuracy: 100 });
  expect(result.valid.missionOnly).toEqual({ mission: 1, world: '', skillId: '', combo: 0, accuracy: null, moves: 0, durationSec: 0, practice: false, homework: false, source: 'mission', ts: 1234, id: 'stable-record' });
  expect(result.valid.mistake).toEqual({ skill: 'math-4-fractions', ts: 1700000000300 });
  expect(result.valid.bit).toEqual({ id: 'helper-bit', behavior: { correct: [{ type: 'glow' }, { type: 'move', amount: 2 }], mistake: [], collect: [{ type: 'collect' }], reset: [] } });
  expect(result.valid.activeBit).toBe('helper-bit');
  expect(result.valid.codeBridge).toEqual({ masteryScore: 100, completedAt: 1700000000400 });
  expect(result.valid.bitLesson).toEqual({ masteryScore: 80, completedAt: 1700000000500 });
  expect(result.valid).toMatchObject({ unlockedBites: ['Nib','Zip'], cosmetics: ['space_trail'], equippedCosmetic: 'space_trail', codeLabProjects: {}, snap: [] });
  expect(result.valid.mergedSkillAttempts).toBeGreaterThanOrEqual(result.valid.evidence.attempts);
});
test('parent authorization is revoked when the active child profile changes', async ({ page }) => {
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await parentDestination(page, 'Profiles');
  await page.locator('#newProfile').fill('Different Child');
  await page.getByRole('button', { name: 'Add Profile' }).click();
  await expect(page.locator('#childDock')).toBeVisible();
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await expect(page.locator('#parentGate')).toBeVisible();
  await expect(page.locator('#parentContent')).toBeHidden();
});

test('v7 profiles migrate to v9 without losing history, settings, or mastery', async ({ page }) => {
  await page.evaluate(() => {
    const legacy = JSON.parse(localStorage.getItem('bb-core-v3'));
    const profile = legacy.profiles[0];
    delete profile.progression;
    delete profile.learningCore;
    profile.completed = [1, 2, 11];
    profile.unlockedMath = 3;
    profile.unlockedWords = 12;
    profile.unlockedSpanish = 21;
    profile.lastMission = 11;
    profile.sessions = [{ mission: 1, ts: 101 }];
    profile.mistakes = [{ skill: 'addition', chosen: '9', ts: 102 }];
    profile.practice = [{ topic: 'fractions', ts: 103 }];
    profile.mastery = { math: 47, words: 22, spanish: 11 };
    profile.settings = { ...profile.settings, reducedMotion: true, textScale: '1.5' };
    legacy.schemaVersion = 7;
    delete legacy.registryVersion;
    localStorage.setItem('bb-core-v3', JSON.stringify(legacy));
    localStorage.removeItem('bb-core-v3-back');
  });
  await page.reload();
  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  const profile = migrated.profiles[0];
  expect(migrated.schemaVersion).toBe(9);
  expect(migrated.registryVersion).toBe(1);
  expect(profile.progression.completedMissionIds).toEqual([1, 2, 11]);
  expect(profile.progression.unlockedMissionIds).toEqual([1, 2, 3, 11, 12, 21]);
  expect(profile.progression.lastMissionId).toBe(11);
  expect(profile.sessions).toEqual([{ mission: 1, ts: 101 }]);
  expect(profile.mistakes).toEqual([{ skill: 'addition', chosen: '9', ts: 102 }]);
  expect(profile.practice).toEqual([{ topic: 'fractions', ts: 103 }]);
  expect(profile.mastery).toEqual({ math: 47, words: 22, spanish: 11 });
  expect(profile.settings.reducedMotion).toBe(true);
  expect(profile.settings.textScale).toBe('1.5');
  expect(profile).not.toHaveProperty('completed');
  expect(profile).not.toHaveProperty('lastMission');
});

test('curriculum homework mode feeds parent intelligence without disturbing mission practice', async ({ page }) => {
  await page.getByRole('button', { name: 'Practice Lab' }).click();
  await page.locator('#practiceSubject').selectOption('reading');
  await page.locator('#practiceGrade').selectOption('4');
  await page.locator('#practiceTopic').fill('inference');
  await page.locator('#homeworkMode').check();
  await page.getByRole('button', { name: 'Build Practice' }).click();
  await expect(page.locator('#practiceResult')).toContainText('Homework plan ready');
  await page.locator('#childDock button[data-screen="home"]').click();
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await expect(page.locator('#weeklySummary')).toContainText('Practice items');
  await expect(page.locator('#homeworkSummary')).toContainText('reading');
});

test('BrainBite Lab simulates learner mastery, offline replay, isolation, and recovery', async ({ page }) => {
  await openLab(page);
  await page.locator('#labLearnerName').fill('Lab Kid');
  await page.getByRole('button', { name: 'Create Learner', exact: true }).click();
  await page.locator('#labSkill').selectOption('fraction-meaning');
  await page.locator('#labSkillPreset').selectOption('developing');
  await page.getByRole('button', { name: 'Sim Correct', exact: true }).click();
  await expect(page.locator('#labMastery')).toContainText('fraction-meaning');
  await expect.poll(() => page.evaluate(() => P().learningCore.skills['fraction-meaning']?.recentPerformance?.at(-1)?.contentIdentity)).toMatch(/^generated-template:math-4-fractions@sha256:[0-9a-f]{64}$/);
  const labKidId = await page.locator('#labLearnerSelect').inputValue();
  await page.getByRole('button', { name: 'Queue Offline Event', exact: true }).click();
  await page.getByRole('button', { name: 'Queue Offline Event', exact: true }).click();
  await expect(page.locator('#labQueue')).toContainText('Offline queue: 2');
  await page.getByRole('button', { name: 'Replay Offline Queue', exact: true }).click();
  await expect(page.locator('#labQueue')).toContainText('Offline queue: 0');
  await page.getByRole('button', { name: 'Upgrade BrainBase', exact: true }).click();
  await page.getByRole('button', { name: 'Refresh BrainBase', exact: true }).click();
  await expect(page.locator('#brainbase-root')).toContainText('Kraken Brainifact installed');
  await page.getByRole('button', { name: 'Save Recovery Snapshot', exact: true }).click();
  await page.getByRole('button', { name: 'Corrupt Test Save', exact: true }).click();
  await page.reload();
  await openLab(page);
  await expect(page.locator('#labContentCheck')).toContainText('valid');
  await page.locator('#labLearnerName').fill('Other Kid');
  await page.getByRole('button', { name: 'Create Learner', exact: true }).click();
  await expect(page.locator('#labMastery')).toContainText('Unknown');
  await page.locator('#labLearnerSelect').selectOption(labKidId);
  await page.getByRole('button', { name: 'Switch Learner', exact: true }).click();
  await expect(page.locator('#labMastery')).toContainText('fraction-meaning');
  await page.getByRole('button', { name: 'Restore Recovery', exact: true }).click();
  await page.reload();
  await openLab(page);
  await expect(page.locator('#labInspect')).toContainText('Lab Kid');
});

test('corrupt and legacy saves recover and migrate safely', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('bb-core-v3', '{broken'));
  await page.reload();
  await expect(page.locator('#profileName')).toHaveText('Kid 1');
  await page.evaluate(() => localStorage.setItem('bb-core-v3', JSON.stringify({ active: 99, profiles: [{ name: '<unsafe>', score: -4, settings: null }] })));
  await page.reload();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  expect(state.schemaVersion).toBe(9);
  expect(state.registryVersion).toBe(1);
  expect(state.active).toBe(0);
  expect(state.profiles[0].score).toBe(0);
  await expect(page.locator('#profileName')).toHaveText('<unsafe>');
});

test('profile names and parent-entered topics render as text, not markup', async ({ page }) => {
  const payload='<img src=x onerror=window.x=1>';
  await page.evaluate(value => {
    const state=JSON.parse(localStorage.getItem('bb-core-v3'));
    state.profiles[0].name=value;
    state.profiles[0].practice=[{subject:'reading',grade:'4',topic:value,homework:true,type:'homework',ts:Date.now()}];
    localStorage.setItem('bb-core-v3',JSON.stringify(state));
  },payload);
  await page.reload();
  await unlockParent(page);
  await parentDestination(page, 'Profiles');
  await expect(page.locator('#profileList')).toContainText(payload);
  await expect(page.locator('#profileList img')).toHaveCount(0);
  await page.locator('#parentShellNav button[data-screen="parent"]').click();
  await expect(page.locator('#homeworkSummary')).toContainText(payload);
  await expect(page.locator('#homeworkSummary img')).toHaveCount(0);
  expect(await page.evaluate(()=>window.x)).toBeUndefined();
});

test('Firebase sync is idempotent, propagates profile deletion, and preserves family isolation', async ({ browser }) => {
  test.setTimeout(120_000);
  const canonicalAttemptCount = 3000;
  const docs = new Map();
  const installMock = async (context, uid) => {
    await context.route('https://**/*', async route => {
      const request = route.request();
      const url = request.url();
      if (url.includes('accounts:signInWithPassword') || url.includes('accounts:signUp')) {
        const body = request.postDataJSON();
        return route.fulfill({ json: { idToken: `token-${uid}`, refreshToken: `refresh-${uid}`, localId: uid, email: body.email, expiresIn: '3600' } });
      }
      if (url.includes('firestore.googleapis.com')) {
        if (!url.includes(`/families/${uid}/`)) return route.fulfill({ status: 403, json: { error: 'forbidden' } });
        if (request.method() === 'PATCH') { const profileId = new URL(url).pathname.split('/').pop(); docs.set(`${uid}:${profileId}`, request.postDataJSON()); return route.fulfill({ json: {} }); }
        if (request.method() === 'GET') return route.fulfill({ json: { documents: [...docs.entries()].filter(([key]) => key.startsWith(`${uid}:`)).map(([key, body]) => ({ name: `projects/brainbite-test/databases/(default)/documents/families/${uid}/profiles/${key.split(':')[1]}`, fields: body.fields, updateTime: new Date().toISOString() })) } });
      }
      return route.fulfill({ status: 404 });
    });
  };
  const configure = async page => {
    await page.goto('/?match=0&webgl=0'); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('bb-presentation', 'dom'); localStorage.setItem('bb-core-v6-sync', JSON.stringify({ account: null, queue: [], lastSync: null, provider: 'local-only' })); }); await page.reload();
    await page.getByRole('button', { name: 'Parents', exact: true }).click();
    await page.locator('#parentPinInput').fill('654321');
    await page.locator('#confirmParentPin').fill('654321');
    await page.locator('#unlockParent').click();
    await expect(page.locator('#parentContent')).toBeVisible();
    await page.locator('#parentShellNav button[data-screen="advanced"]').click();
    await page.getByRole('button', { name: 'Integrations' }).click();
    await page.locator('#cloudProvider').selectOption('firebase');
    await page.locator('#cloudUrl').fill('brainbite-test');
    await page.locator('#cloudKey').fill('AIza-test-public-web-key-123456789');
    await page.getByRole('button', { name: 'Save Cloud Config' }).click();
    await parentDestination(page, 'Account & Sync');
    await page.locator('#localAccountEmail').fill('parent@example.com');
    await page.locator('#parentPassword').fill('correct-horse');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.locator('#localAccountStatus')).toContainText('Signed in');
    await expect(page.locator('#parentPassword')).toHaveValue('');
  };
  const a = await browser.newContext(); await installMock(a, 'family-a'); const pageA = await a.newPage(); await configure(pageA);
  await parentDestination(pageA, 'Profiles'); await pageA.locator('#newProfile').fill('Cloud Kid'); await pageA.getByRole('button', { name: 'Add Profile' }).click();
  const generated=await pageA.evaluate(async count=>{
   const p=P(),c=window.BrainBiteCore;
    window.BrainBiteGame.startMission(1);
    const record={id:'stable-record',ts:1234};
    p.sessions=[{...record,mission:1}];p.mistakes=[{...record,skill:'addition',chosen:'3'}];p.practice=[{...record,subject:'math',topic:'addition'}];p.snap=[{...record,topic:'PRIVATE_WORKSHEET_TEXT_2_4',image:'data:image/png;base64,PRIVATE_WORKSHEET_IMAGE_2_4',correct:['4'],wrong:['3']}];
    for(let index=1;index<=2;index++)updateSkill('math-4-fractions',true,{attemptId:`cloud-bounded-provenance-${index}`,independent:true,responseTimeMs:1800,source:'mission'});
    let learner=p.learningCore;
    for(let index=3;index<=count;index++)learner=c.recordLearnerAttempt(learner,'math-4-fractions',{id:`cloud-bounded-provenance-${index}`,...nextAttemptOrigin(),correct:true,independent:true,responseTimeMs:1800,source:'mission',at:index},{id:'math-4-fractions'});
    projectLearningCore(p,learner);await save();
    const sync=JSON.parse(localStorage.getItem('bb-core-v6-sync'));
    const skill=p.learningCore.skills['math-4-fractions'];
    return {profileId:p.id,installationId:sync.installationId,attemptSequence:sync.attemptSequence,evidence:skill.evidence,provenance:skill.evidenceProvenance,provenanceSources:c.evidenceProvenanceSources(skill),recentOrigins:skill.recentPerformance.map(attempt=>({originId:attempt.originId,originSequence:attempt.originSequence})),offlineEvents:skill&&p.learningCore.offlineQueue.map(event=>({id:event.id,type:event.type,contentIdentity:event.payload.contentIdentity,attemptId:event.payload.attemptId,originId:event.payload.originId,originSequence:event.payload.originSequence}))};
  },canonicalAttemptCount);
  const cloudProfileId=generated.profileId;
  const generatedOriginId=generated.provenanceSources[0].id;
  const [sourceInstallationId,sourceWriterId,...extraSourceParts]=generatedOriginId.split(':');
  expect(generated.installationId).toMatch(UUID_PATTERN);
  expect(sourceInstallationId).toBe(generated.installationId);
  expect(sourceWriterId).toMatch(UUID_PATTERN);
  expect(extraSourceParts).toEqual([]);
  expect(generated.attemptSequence).toBe(canonicalAttemptCount);
  expect(generated.evidence).toMatchObject({attempts:canonicalAttemptCount,independentSuccesses:canonicalAttemptCount});
  expect(generated.provenance.version).toBe(5);
  expect(typeof generated.provenance.packed).toBe('string');
  expect(generated.provenance).not.toHaveProperty('sources');
  expect(generated.provenance).not.toHaveProperty('retired');
  expect(generated.provenanceSources).toHaveLength(1);
  expect(generated.provenanceSources[0]).toMatchObject({id:generatedOriginId,sequence:canonicalAttemptCount,attempts:canonicalAttemptCount,independentSuccesses:canonicalAttemptCount});
  expect(generated.recentOrigins.every(attempt=>attempt.originId===generatedOriginId)).toBe(true);
  expect(generated.recentOrigins.every((attempt,index,attempts)=>index===0||attempt.originSequence>attempts[index-1].originSequence)).toBe(true);
   expect(generated.offlineEvents).toHaveLength(2);
   expect(generated.offlineEvents.map(({type,contentIdentity,attemptId,originId,originSequence})=>({type,contentIdentity,attemptId,originId,originSequence}))).toEqual([1,2].map(originSequence=>({type:'LearningAttemptRecorded',contentIdentity:'registry-mission:1',attemptId:`cloud-bounded-provenance-${originSequence}`,originId:undefined,originSequence:undefined})));
   const offlineEventIds=generated.offlineEvents.map(event=>event.id);
   expect(offlineEventIds.every(id=>typeof id==='string'&&id.length>0&&UUID_PATTERN.test(id))).toBe(true);
   expect(new Set(offlineEventIds).size).toBe(offlineEventIds.length);
   generated.offlineEvents.forEach(event=>{
     expect(event.id).not.toContain(cloudProfileId);
     expect(event.id).not.toContain(event.attemptId);
   });
  await pageA.reload();
  expect(await pageA.evaluate(()=>{const {installationId,attemptSequence}=JSON.parse(localStorage.getItem('bb-core-v6-sync'));return {installationId,attemptSequence}})).toEqual({installationId:generated.installationId,attemptSequence:canonicalAttemptCount});
  const pageConcurrent = await a.newPage();
  await pageConcurrent.goto('/?match=0&webgl=0');
  await pageConcurrent.evaluate(() => PERSISTENCE_CHAIN);
  const reloadAttemptCount = 20;
  for (let index = 0; index < reloadAttemptCount - 1; index += 1) {
    await pageA.evaluate(async attemptIndex => { updateSkill('math-4-fractions', true, { attemptId: `cloud-reload-${attemptIndex}`, independent: true, responseTimeMs: 1750, source: 'mission' }); await save(); }, index);
    await pageA.reload();
  }
  await Promise.all([
    pageA.evaluate(async attemptIndex => { updateSkill('math-4-fractions', true, { attemptId: `cloud-reload-${attemptIndex}`, independent: true, responseTimeMs: 1750, source: 'mission' }); await save(); }, reloadAttemptCount - 1),
    pageConcurrent.evaluate(async () => { updateSkill('math-4-fractions', false, { attemptId: 'cloud-independent-concurrent', independent: true, responseTimeMs: 2400, source: 'mission' }); await save(); }),
  ]);
  const totalCloudAttemptCount = canonicalAttemptCount + reloadAttemptCount + 1;
  const cloudReady = await pageA.evaluate(id => {
    const skill = STORE.profiles.find(profile => profile.id === id).learningCore.skills['math-4-fractions'];
    return { evidence: skill.evidence, provenance: skill.evidenceProvenance, provenanceSources: window.BrainBiteCore.evidenceProvenanceSources(skill), bytes: new TextEncoder().encode(JSON.stringify(STORE.profiles.find(profile => profile.id === id))).length };
  }, cloudProfileId);
  expect(cloudReady.evidence).toMatchObject({ attempts: totalCloudAttemptCount, independentSuccesses: totalCloudAttemptCount - 1, incorrectAttempts: 1 });
  expect(cloudReady.provenanceSources).toHaveLength(2);
  expect(cloudReady.bytes).toBeLessThan(512 * 1024);
  await pageConcurrent.close();
  await unlockParent(pageA);
  await parentDestination(pageA, 'Account & Sync'); await pageA.getByRole('button', { name: 'Push to Cloud' }).click(); await expect(pageA.locator('#mergeResult')).toContainText('upload complete');
  const hasNestedFirestoreArray = (value, insideArray = false) => {
    if (!value || typeof value !== 'object') return false;
    if (value.arrayValue) {
      if (insideArray) return true;
      return (value.arrayValue.values || []).some(child => hasNestedFirestoreArray(child, true));
    }
    if (value.mapValue) return Object.values(value.mapValue.fields || {}).some(child => hasNestedFirestoreArray(child, false));
    return Object.values(value).some(child => hasNestedFirestoreArray(child, insideArray));
  };
  const firestorePayload=docs.get(`family-a:${cloudProfileId}`);
  expect(hasNestedFirestoreArray(firestorePayload)).toBe(false);
  expect(Buffer.byteLength(JSON.stringify(firestorePayload),'utf8')).toBeLessThan(512*1024);
  expect(JSON.stringify(firestorePayload)).not.toContain('PRIVATE_WORKSHEET_TEXT_2_4');
  expect(JSON.stringify(firestorePayload)).not.toContain('PRIVATE_WORKSHEET_IMAGE_2_4');
  const b = await browser.newContext(); await installMock(b, 'family-a'); const pageB = await b.newPage(); await configure(pageB);
  await pageB.getByRole('button', { name: 'Pull from Cloud' }).click(); await expect(pageB.locator('#mergeResult')).toContainText('download and merge complete'); await parentDestination(pageB, 'Profiles'); await expect(pageB.locator('#profileList')).toContainText('Cloud Kid');
  const firstPulledEvidence=await pageB.evaluate(id=>{const skill=STORE.profiles.find(profile=>profile.id===id)?.learningCore?.skills?.['math-4-fractions'];return {evidence:skill?.evidence,provenance:skill?.evidenceProvenance}},cloudProfileId);
  await parentDestination(pageB, 'Account & Sync'); await pageB.getByRole('button', { name: 'Pull from Cloud' }).click();
  const pulled=await pageB.evaluate(id=>{const p=STORE.profiles.find(profile=>profile.id===id);const skill=p.learningCore.skills['math-4-fractions'];return {histories:{sessions:p.sessions.length,mistakes:p.mistakes.length,practice:p.practice.length,snap:p.snap.length},evidence:skill.evidence,provenance:skill.evidenceProvenance}},cloudProfileId);
  expect(firstPulledEvidence.evidence).toMatchObject({attempts:totalCloudAttemptCount,independentSuccesses:totalCloudAttemptCount-1,incorrectAttempts:1});
  expect(firstPulledEvidence.provenance).toEqual(cloudReady.provenance);
  expect(pulled.evidence).toEqual(firstPulledEvidence.evidence);
  expect(pulled.provenance).toEqual(firstPulledEvidence.provenance);
  const histories=pulled.histories;
  expect(histories).toEqual({sessions:1,mistakes:1,practice:1,snap:0});
  await pageA.evaluate(() => lockParentAccess()); await unlockParent(pageA); await parentDestination(pageA, 'Profiles'); await pageA.getByRole('button',{name:'Delete Active Profile'}).click(); await approveSensitiveAction(pageA,{confirmation:'Cloud Kid'});
  await expect(pageA.locator('#profileList')).not.toContainText('Cloud Kid');
  await expect.poll(()=>docs.get(`family-a:${cloudProfileId}`)?.fields?.progress?.mapValue?.fields?.deleted?.booleanValue).toBe(true);
  await parentDestination(pageB, 'Account & Sync'); await pageB.getByRole('button', { name: 'Pull from Cloud' }).click(); await parentDestination(pageB, 'Profiles'); await expect(pageB.locator('#profileList')).not.toContainText('Cloud Kid');
  const deletionState=await pageB.evaluate(id=>({present:STORE.profiles.some(profile=>profile.id===id),tombstoned:STORE.deletedProfiles.some(item=>item.id===id)}),cloudProfileId);
  expect(deletionState).toEqual({present:false,tombstoned:true});
  await parentDestination(pageB, 'Account & Sync'); await pageB.getByRole('button', { name: 'Pull from Cloud' }).click();
  expect(await pageB.evaluate(id=>STORE.profiles.some(profile=>profile.id===id),cloudProfileId)).toBe(false);
  const intruder = await browser.newContext(); await installMock(intruder, 'family-b'); const pageC = await intruder.newPage(); await configure(pageC); await pageC.getByRole('button', { name: 'Pull from Cloud' }).click(); await parentDestination(pageC, 'Profiles'); await expect(pageC.getByText('Cloud Kid')).toHaveCount(0);
  await Promise.all([a.close(), b.close(), intruder.close()]);
});

test('Firebase concurrent device pushes merge remote evidence before write', async ({ browser }) => {
  test.setTimeout(60_000);
  const documents=new Map(),conflictOnce=new Set();
  let version=0,conflictResponses=0,createPreconditions=0,updatePreconditions=0;
  const installVersionedMock=async(context,uid)=>{
    await context.route('https://**/*',async route=>{
      const request=route.request(),url=new URL(request.url());
      if(url.pathname.includes('accounts:signInWithPassword')||url.pathname.includes('accounts:signUp')){
        const body=request.postDataJSON();
        return route.fulfill({json:{idToken:`token-${uid}`,refreshToken:`refresh-${uid}`,localId:uid,email:body.email,expiresIn:'3600'}});
      }
      if(!url.hostname.includes('firestore.googleapis.com'))return route.fulfill({status:404});
      if(!url.pathname.includes(`/families/${uid}/`))return route.fulfill({status:403,json:{error:'forbidden'}});
      const segments=url.pathname.split('/').filter(Boolean),profilesIndex=segments.lastIndexOf('profiles'),profileId=profilesIndex>=0?segments[profilesIndex+1]:null;
      const key=profileId?`${uid}:${profileId}`:null;
      if(request.method()==='PATCH'){
        const current=documents.get(key),expectedTime=url.searchParams.get('currentDocument.updateTime'),expectedExists=url.searchParams.get('currentDocument.exists');
        if(current){
          if(expectedExists==='false')return route.fulfill({status:409,json:{error:'already exists'}});
          if(expectedTime!==current.updateTime)return route.fulfill({status:412,json:{error:'stale update time'}});
          updatePreconditions++;
        }else{
          if(expectedExists!=='false')return route.fulfill({status:412,json:{error:'missing create precondition'}});
          createPreconditions++;
        }
        if(conflictOnce.delete(key)){current.updateTime=new Date(Date.UTC(2026,8,12,0,0,0,++version)).toISOString();conflictResponses++;return route.fulfill({status:412,json:{error:'forced retry'}})}
        const body=request.postDataJSON(),updateTime=new Date(Date.UTC(2026,8,12,0,0,0,++version)).toISOString();
        documents.set(key,{body,updateTime});
        return route.fulfill({json:{name:`projects/brainbite-test/databases/(default)/documents/families/${uid}/profiles/${profileId}`,fields:body.fields,updateTime}});
      }
      if(request.method()==='GET'&&profileId){
        const current=documents.get(key);
        if(!current)return route.fulfill({status:404});
        return route.fulfill({json:{name:`projects/brainbite-test/databases/(default)/documents/families/${uid}/profiles/${profileId}`,fields:current.body.fields,updateTime:current.updateTime}});
      }
      if(request.method()==='GET')return route.fulfill({json:{documents:[...documents.entries()].filter(([entryKey])=>entryKey.startsWith(`${uid}:`)).map(([entryKey,current])=>({name:`projects/brainbite-test/databases/(default)/documents/families/${uid}/profiles/${entryKey.slice(uid.length+1)}`,fields:current.body.fields,updateTime:current.updateTime}))}});
      return route.fulfill({status:404});
    });
  };
  const configure=async page=>{
    await page.goto('/?match=0&webgl=0');
    await page.evaluate(()=>{localStorage.clear();localStorage.setItem('bb-presentation','dom')});
    await page.reload();
    await unlockParent(page);
    await page.locator('#parentShellNav button[data-screen="advanced"]').click();
    await page.getByRole('button',{name:'Integrations'}).click();await page.locator('#cloudProvider').selectOption('firebase');await page.locator('#cloudUrl').fill('brainbite-test');await page.locator('#cloudKey').fill('AIza-test-public-web-key-123456789');await page.getByRole('button',{name:'Save Cloud Config'}).click();
    await parentDestination(page, 'Account & Sync');await page.locator('#localAccountEmail').fill('parent@example.com');await page.locator('#parentPassword').fill('correct-horse');await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page.locator('#localAccountStatus')).toContainText('Signed in');await expect(page.locator('#parentPassword')).toHaveValue('');
  };
  const uid='family-concurrent';
  const contextA=await browser.newContext();await installVersionedMock(contextA,uid);const pageA=await contextA.newPage();await configure(pageA);
  await parentDestination(pageA, 'Profiles');await pageA.locator('#newProfile').fill('Concurrent Kid');await pageA.getByRole('button',{name:'Add Profile'}).click();
  const sharedProfileId=await pageA.evaluate(()=>P().id);
  await pageA.evaluate(()=>pushAllToFirebase());

  const contextB=await browser.newContext();await installVersionedMock(contextB,uid);const pageB=await contextB.newPage();await configure(pageB);await pageB.evaluate(()=>pullAllFromFirebase());
  expect(await pageB.evaluate(id=>STORE.profiles.some(profile=>profile.id===id),sharedProfileId)).toBe(true);
  const recordAttempt=(page,profileId,attemptId)=>page.evaluate(({profileId,attemptId})=>{STORE.active=STORE.profiles.findIndex(profile=>profile.id===profileId);updateSkill('math-4-fractions',true,{attemptId,independent:true,responseTimeMs:1800,source:'mission'});save();const attempt=P().learningCore.skills['math-4-fractions'].recentPerformance.at(-1);return {id:attempt.id,originId:attempt.originId}}, {profileId,attemptId});
  const attemptA=await recordAttempt(pageA,sharedProfileId,'firebase-device-a-attempt');
  const attemptB=await recordAttempt(pageB,sharedProfileId,'firebase-device-b-attempt');
  expect(attemptA.originId).not.toBe(attemptB.originId);

  await pageA.evaluate(()=>pushAllToFirebase());
  conflictOnce.add(`${uid}:${sharedProfileId}`);
  await pageB.evaluate(()=>pushAllToFirebase());
  const localAfterSecondPush=await pageB.evaluate(id=>{
    const summarize=store=>{const skill=store.profiles.find(profile=>profile.id===id).learningCore.skills['math-4-fractions'];return {attempts:skill.evidence.attempts,independentSuccesses:skill.evidence.independentSuccesses,sources:window.BrainBiteCore.evidenceProvenanceSources(skill).map(source=>source.id).sort(),attemptIds:skill.recentPerformance.map(attempt=>attempt.id).sort()}};
    return {memory:summarize(STORE),primary:summarize(JSON.parse(localStorage.getItem('bb-core-v3'))),backup:summarize(JSON.parse(localStorage.getItem('bb-core-v3-back'))),recovery:summarize(JSON.parse(localStorage.getItem('bb-core-v3-recovery')))};
  },sharedProfileId);
  const expectedMerged={attempts:2,independentSuccesses:2,sources:[attemptA.originId,attemptB.originId].sort(),attemptIds:['firebase-device-a-attempt','firebase-device-b-attempt']};
  expect(localAfterSecondPush).toEqual({memory:expectedMerged,primary:expectedMerged,backup:expectedMerged,recovery:expectedMerged});

  const contextC=await browser.newContext();await installVersionedMock(contextC,uid);const pageC=await contextC.newPage();await configure(pageC);await pageC.evaluate(()=>pullAllFromFirebase());
  const freshPull=await pageC.evaluate(id=>{const skill=STORE.profiles.find(profile=>profile.id===id).learningCore.skills['math-4-fractions'];return {attempts:skill.evidence.attempts,independentSuccesses:skill.evidence.independentSuccesses,sources:window.BrainBiteCore.evidenceProvenanceSources(skill).map(source=>source.id).sort(),attemptIds:skill.recentPerformance.map(attempt=>attempt.id).sort()}},sharedProfileId);
  expect(freshPull).toEqual(expectedMerged);
  expect(conflictResponses).toBe(1);
  expect(createPreconditions).toBeGreaterThan(0);
  expect(updatePreconditions).toBeGreaterThan(0);
  await Promise.all([contextA.close(),contextB.close(),contextC.close()]);
});

test('same-installation tabs use distinct bounded provenance writers', async ({ browser }) => {
  const context=await browser.newContext();
  const pageA=await context.newPage();
  await pageA.goto('/?match=0&webgl=0');
  await pageA.evaluate(()=>{localStorage.clear();localStorage.setItem('bb-presentation','dom');localStorage.setItem('bb-core-v6-sync',JSON.stringify({account:null,queue:[],lastSync:null,provider:'local-only'}))});
  await pageA.reload();
  const pageB=await context.newPage();
  // A fresh tab must not inherit another tab's writer identity.
  await pageB.addInitScript(()=>{try{sessionStorage.clear()}catch{}});
  await pageB.goto('/?match=0&webgl=0');
  await Promise.all([pageA.waitForFunction(()=>!!window.BrainBiteCore),pageB.waitForFunction(()=>!!window.BrainBiteCore)]);

  const [installationA,installationB]=await Promise.all([pageA,pageB].map(page=>page.evaluate(()=>JSON.parse(localStorage.getItem('bb-core-v6-sync')).installationId)));
  expect(installationA).toBe(installationB);
  expect(installationA).toMatch(UUID_PATTERN);

  const recordAttempt=(page,attemptId)=>page.evaluate(async id=>{
    updateSkill('math-4-fractions',true,{attemptId:id,independent:true,responseTimeMs:1800,source:'mission'});
    await save();
    const skill=P().learningCore.skills['math-4-fractions'];
    // Cross-tab sync can merge the sibling tab's attempt into this store, so read back
    // the attempt this tab recorded by identity instead of taking the newest record.
    const attempt=skill.recentPerformance.find(entry=>entry.id===id)||skill.recentPerformance.at(-1);
    return {skill,attempt:{id:attempt.id,originId:attempt.originId,originSequence:attempt.originSequence}};
  },attemptId);
  const [left,right]=await Promise.all([recordAttempt(pageA,'same-installation-tab-a'),recordAttempt(pageB,'same-installation-tab-b')]);
  expect(left.attempt.originId).not.toBe(right.attempt.originId);
  expect(left.attempt.originId.startsWith(`${installationA}:`)).toBe(true);
  expect(right.attempt.originId.startsWith(`${installationA}:`)).toBe(true);
  expect(left.attempt.originSequence).toBe(1);
  expect(right.attempt.originSequence).toBe(1);

  const merged=await pageA.evaluate(({leftSkill,rightSkill})=>{
    const skill=window.BrainBiteCore.mergeSkillStates(leftSkill,rightSkill);
    return {evidence:skill.evidence,sources:window.BrainBiteCore.evidenceProvenanceSources(skill),recentAttemptIds:skill.recentPerformance.map(attempt=>attempt.id)};
  },{leftSkill:left.skill,rightSkill:right.skill});
  expect(merged.evidence).toMatchObject({attempts:2,independentSuccesses:2});
  expect(merged.sources).toHaveLength(2);
  expect(merged.sources.map(source=>source.id).sort()).toEqual([left.attempt.originId,right.attempt.originId].sort());
  expect(merged.recentAttemptIds.sort()).toEqual(['same-installation-tab-a','same-installation-tab-b']);

  await pageA.reload();
  await pageA.waitForFunction(()=>!!window.BrainBiteCore);
  const reloaded=await recordAttempt(pageA,'same-installation-tab-a-reload');
  expect(reloaded.attempt.originId.startsWith(`${installationA}:`)).toBe(true);
  expect(reloaded.attempt.originId).toBe(left.attempt.originId);
  expect(reloaded.attempt.originId).not.toBe(right.attempt.originId);
  expect(reloaded.attempt.originSequence).toBeGreaterThan(left.attempt.originSequence);
  await context.close();
});

for (const lockMode of ['web-locks', 'indexed-db', 'local-storage']) {
  test(`concurrent tabs reconcile distinct attempts into memory and every recovery copy with ${lockMode}`, async ({ browser }) => {
    test.setTimeout(30_000);
    const context = await browser.newContext();
    if (lockMode !== 'web-locks') await context.addInitScript(mode => {
      Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true });
      if (mode === 'local-storage') Object.defineProperty(globalThis, 'indexedDB', { value: undefined, configurable: true });
    }, lockMode);
    const pageA = await context.newPage();
    await pageA.goto('/?match=0&webgl=0');
    await pageA.evaluate(() => { localStorage.clear(); localStorage.setItem('bb-presentation', 'dom'); });
    await pageA.reload();
    await pageA.evaluate(() => PERSISTENCE_CHAIN);
    const pageB = await context.newPage();
    await pageB.goto('/?match=0&webgl=0');
    await pageB.evaluate(() => PERSISTENCE_CHAIN);
    const profileId = await pageA.evaluate(() => P().id);

    await Promise.all([
      pageA.evaluate(async id => { updateSkill('math-4-fractions', true, { attemptId: `tab-a-${id}`, independent: true, responseTimeMs: 1700, source: 'mission' }); await save(); }, profileId),
      pageB.evaluate(async id => { updateSkill('math-4-fractions', false, { attemptId: `tab-b-${id}`, independent: true, responseTimeMs: 2300, source: 'mission' }); await save(); }, profileId),
    ]);

    const summarizeMemory = (page, id) => page.evaluate(profileIdValue => {
      const skill = STORE.profiles.find(profile => profile.id === profileIdValue).learningCore.skills['math-4-fractions'];
      return { attempts: skill.evidence.attempts, independentSuccesses: skill.evidence.independentSuccesses, incorrectAttempts: skill.evidence.incorrectAttempts, attemptIds: skill.recentPerformance.map(attempt => attempt.id).sort() };
    }, id);
    const expected = { attempts: 2, independentSuccesses: 1, incorrectAttempts: 1 };
    const memoryA = await expect.poll(() => summarizeMemory(pageA, profileId)).toMatchObject(expected);
    const memoryB = await expect.poll(() => summarizeMemory(pageB, profileId)).toMatchObject(expected);
    const ids = (await summarizeMemory(pageA, profileId)).attemptIds;
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every(id => /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))).toBe(true);
    expect(ids.every(id => !id.includes(profileId))).toBe(true);

    await Promise.all([pageA.reload(), pageB.reload()]);
    const copies = await pageA.evaluate(id => {
      const summarize = store => {
        const skill = store.profiles.find(profile => profile.id === id).learningCore.skills['math-4-fractions'];
        return { attempts: skill.evidence.attempts, independentSuccesses: skill.evidence.independentSuccesses, incorrectAttempts: skill.evidence.incorrectAttempts, attemptIds: skill.recentPerformance.map(attempt => attempt.id).sort() };
      };
      return Object.fromEntries(['bb-core-v3', 'bb-core-v3-back', 'bb-core-v3-recovery'].map(key => [key, summarize(JSON.parse(localStorage.getItem(key)))]));
    }, profileId);
    expect(Object.values(copies).map(copy => ({ attempts: copy.attempts, independentSuccesses: copy.independentSuccesses, incorrectAttempts: copy.incorrectAttempts }))).toEqual([expected, expected, expected]);
    expect(Object.values(copies).map(copy => copy.attemptIds)).toEqual([ids, ids, ids]);
    await context.close();
  });
}

test('localStorage fallback keeps tombstones and queue IDs while defeating a stale tab', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true });
    Object.defineProperty(globalThis, 'indexedDB', { value: undefined, configurable: true });
  });
  const pageA = await context.newPage();
  await pageA.goto('/?match=0&webgl=0');
  await pageA.evaluate(() => { localStorage.clear(); localStorage.setItem('bb-presentation', 'dom'); });
  await pageA.reload();
  await pageA.evaluate(async () => { STORE.profiles.push(blank('Delete Me')); STORE.active = STORE.profiles.length - 1; await save(); });
  const ids = await pageA.evaluate(() => ({ deletedId: P().id, survivorId: STORE.profiles[0].id }));
  const pageB = await context.newPage();
  await pageB.goto('/?match=0&webgl=0');
  await pageB.evaluate(() => PERSISTENCE_CHAIN);
  await pageB.evaluate(() => { window.__staleStoreForDeletion = structuredClone(STORE); });

  await pageA.evaluate(async id => {
    const deletedAt = Date.now();
    rememberProfileDeletion(id, deletedAt);
    queueSyncEvent({ id: 'cross-tab-delete', eventId: 'cross-tab-delete', type: 'profile-delete', profileId: id, payload: { deletedAt }, schemaVersion: STORE.schemaVersion, ts: deletedAt });
    await save();
  }, ids.deletedId);
  await pageB.evaluate(async id => {
    STORE = window.__staleStoreForDeletion;
    STORE.active = STORE.profiles.findIndex(profile => profile.id === id);
    updateSkill('math-4-fractions', true, { attemptId: 'stale-deleted-attempt', independent: true, responseTimeMs: 1800, source: 'mission' });
    await save();
  }, ids.deletedId);
  await pageB.evaluate(async id => {
    STORE.active = STORE.profiles.findIndex(profile => profile.id === id);
    updateSkill('math-4-fractions', true, { attemptId: 'post-delete-survivor-attempt', independent: true, responseTimeMs: 1800, source: 'mission' });
    queueSyncEvent({ id: 'cross-tab-later', eventId: 'cross-tab-later', type: 'store-update', profileId: id, payload: { reason: 'post-delete-attempt' }, schemaVersion: STORE.schemaVersion, ts: Date.now() });
    await persistCanonicalState();
  }, ids.survivorId);

  const summarize = (page, values) => page.evaluate(({ deletedId, survivorId }) => ({
    present: STORE.profiles.some(profile => profile.id === deletedId),
    tombstones: STORE.deletedProfiles.filter(item => item.id === deletedId).length,
    laterAttempts: STORE.profiles.find(profile => profile.id === survivorId).learningCore.skills['math-4-fractions'].recentPerformance.filter(attempt => attempt.id === 'post-delete-survivor-attempt').length,
    deleteEvents: SYNC.queue.filter(event => event.eventId === 'cross-tab-delete').length,
    laterEvents: SYNC.queue.filter(event => event.eventId === 'cross-tab-later').length,
  }), values);
  const expected = { present: false, tombstones: 1, laterAttempts: 1, deleteEvents: 1, laterEvents: 1 };
  await expect.poll(() => summarize(pageA, ids)).toEqual(expected);
  await expect.poll(() => summarize(pageB, ids)).toEqual(expected);
  await Promise.all([pageA.reload(), pageB.reload()]);
  const copies = await pageA.evaluate(({ deletedId, survivorId }) => Object.fromEntries(['bb-core-v3', 'bb-core-v3-back', 'bb-core-v3-recovery'].map(key => {
    const store = JSON.parse(localStorage.getItem(key));
    return [key, { present: store.profiles.some(profile => profile.id === deletedId), tombstones: store.deletedProfiles.filter(item => item.id === deletedId).length, laterAttempts: store.profiles.find(profile => profile.id === survivorId).learningCore.skills['math-4-fractions'].recentPerformance.filter(attempt => attempt.id === 'post-delete-survivor-attempt').length }];
  })), ids);
  expect(Object.values(copies)).toEqual(Array(3).fill({ present: false, tombstones: 1, laterAttempts: 1 }));
  const reloadedQueue = await pageA.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v6-sync')).queue.map(event => event.eventId));
  expect(reloadedQueue.filter(id => id === 'cross-tab-delete')).toHaveLength(1);
  expect(reloadedQueue.filter(id => id === 'cross-tab-later')).toHaveLength(1);
  await context.close();
});

for (const viewport of [{ width: 360, height: 740 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`responsive layout has no page overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport); await page.reload();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test('accessibility preferences, labels, focus, and 200% zoom remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Continue Adventure' }).focus();
  await expect(page.getByRole('button', { name: 'Continue Adventure' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#board')).toHaveAttribute('role', 'grid');
  await expect(page.locator('[data-d="u"]')).toHaveAttribute('aria-label', 'Move up');
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible();
});

test('battle asks short landscape phones to rotate, and the request is dismissible', async ({ page }) => {
  // Portrait phone: no prompt.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('button', { name: 'Continue Adventure' }).click();
  await expect(page.locator('#game.show')).toBeVisible();
  await expect(page.locator('#landscapePrompt')).toBeHidden();
  // Tall landscape (desktop): still no prompt.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('#landscapePrompt')).toBeHidden();
  // Short landscape phone: prompt appears and can be dismissed for the session.
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#landscapePrompt')).toBeVisible();
  await expect(page.locator('#landscapePromptStatus')).toContainText('upright');
  await page.getByRole('button', { name: 'Play anyway' }).click();
  await expect(page.locator('#landscapePrompt')).toBeHidden();
  // The prompt never leaks onto child screens other than the battle.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#exitBtn').click();
  await expect(page.locator('#home.show')).toBeVisible();
  await expect(page.locator('#landscapePrompt')).toBeHidden();
});

test('a first-time learner is guided from name to world to a completed first mission', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('bb-presentation', 'dom');
  });
  await page.reload();
  await expect(page.locator('#home.show')).toBeVisible();
  // Step 1: the name card is the first thing offered, and it is not a gate.
  await expect(page.locator('#firstRunCard')).toBeVisible();
  await expect(page.locator('#firstRunTitle')).toContainText('call you');
  await page.locator('#firstRunName').fill('Nova');
  await page.getByRole('button', { name: "Let's go" }).click();
  await expect(page.locator('#profileName')).toHaveText('Nova');
  await expect(page.locator('#firstRunTitle')).toContainText('first adventure');
  // Step 2: PLAY starts the first mission and the guided prompt appears.
  await page.getByRole('button', { name: 'Continue Adventure' }).click();
  await expect(page.locator('#game.show')).toBeVisible();
  await expect(page.locator('#firstRunHint')).toBeVisible();
  await expect(page.locator('#firstRunHint')).toContainText('answer');
  // Step 3: the first correct answer retires the prompt for good.
  await page.evaluate(() => {
    const cell = G.cells.find(entry => !entry.eaten && entry.correct);
    G.p = { x: cell.x ?? G.p.x, y: cell.y ?? G.p.y };
    const index = G.cells.indexOf(cell);
    G.p = { x: index % 5, y: Math.floor(index / 5) };
    bite();
  });
  await expect(page.locator('#firstRunHint')).toBeHidden();
  await page.reload();
  await page.waitForFunction(() => Boolean(window.BrainBiteGame?.getState));
  await expect(page.locator('#firstRunCard')).toBeHidden();
  await page.getByRole('button', { name: 'Continue Adventure' }).click();
  await expect(page.locator('#game.show')).toBeVisible();
  await expect(page.locator('#firstRunHint')).toBeHidden();
});

test('a first-time learner reaches the first mission without parent help', async ({ page }) => {
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('bb-presentation', 'dom'); });
  await page.reload();
  await expect(page.locator('#home.show')).toBeVisible();
  // One tap from a clean profile reaches a playable mission.
  await page.getByRole('button', { name: 'Continue Adventure' }).click();
  await expect(page.locator('#game.show')).toBeVisible();
  await expect(page.locator('#prompt')).not.toBeEmpty();
  await expect(page.locator('#board [role="gridcell"]')).toHaveCount(25);
  expect(await page.evaluate(() => Boolean(window.BrainBiteGame.getState()?.m?.id))).toBe(true);
});

test('accessibility settings persist and expose captions and repeat prompt controls', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.locator('#cameraMotionReduction').check();
  await page.locator('#captions').check();
  await page.locator('#dyslexicFont').check();
  await page.locator('#textScale').selectOption('1.25');
  await page.locator('#qualityTier').selectOption('performance');
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('#cameraMotionReduction')).toBeChecked();
  await expect(page.locator('#captions')).toBeChecked();
  await expect(page.locator('#dyslexicFont')).toBeChecked();
  await expect(page.locator('#textScale')).toHaveValue('1.25');
  await expect(page.locator('#qualityTier')).toHaveValue('performance');
  expect(await page.evaluate(() => document.documentElement.classList.contains('quality-performance'))).toBe(true);

  await openWorld(page, 'Number Nebula');
  await page.getByRole('button', { name: /Play mission 1:/ }).click();
  await expect(page.locator('#captionText')).toContainText('Bite all even numbers');
  await expect(page.getByRole('button', { name: 'Repeat Prompt' })).toBeVisible();
});

test('LearningCore readiness reconciles saved generations exactly once', async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__coreReadySeen = 0;
    window.addEventListener('bb:core-ready', () => { globalThis.__coreReadySeen += 1; });
  });
  await page.goto('/?match=0&webgl=0');
  await page.waitForFunction(() => Boolean(window.BrainBiteGame?.getState));
  await page.waitForFunction(() => window.BrainBiteCanonicalState?.reconciled?.() === true);
  const result = await page.evaluate(() => ({
    seen: globalThis.__coreReadySeen,
    runs: window.BrainBiteCanonicalState.reconcileRuns(),
    reconciled: window.BrainBiteCanonicalState.reconciled(),
  }));
  expect(result.seen).toBe(1);
  expect(result.runs).toBe(1);
  expect(result.reconciled).toBe(true);
});

test('the local issue log is bounded, survives reload, and stores no learner data', async ({ page }) => {
  const result = await page.evaluate(async () => {
    // Names and answers must never reach the log, so record only what the app records.
    P().name = 'Secret Learner Name';
    const before = window.__BRAINBITE_PERSISTENCE_ERROR__ ?? null;
    for (let index = 0; index < 70; index += 1) recordDiagnostic('test-issue', `issue ${index}`, 'unit');
    recordDiagnostic('persistence', 'storage is unavailable', 'QuotaExceededError');
    await save();
    const stored = JSON.parse(localStorage.getItem('bb-diagnostics-v1'));
    return {
      before,
      length: stored.length,
      first: stored[0],
      last: stored.at(-1),
      keys: [...new Set(stored.flatMap(entry => Object.keys(entry)))].sort(),
      raw: localStorage.getItem('bb-diagnostics-v1'),
      bundleHasIssues: Array.isArray(diagnosticBundle().recentIssues),
    };
  });
  expect(result.length).toBe(50);
  // The oldest pushes were evicted, which is what "bounded" means.
  const firstIndex = Number(/issue (\d+)/.exec(result.first.message)?.[1]);
  expect(Number.isFinite(firstIndex)).toBe(true);
  expect(firstIndex).toBeGreaterThan(0);
  expect(result.raw).not.toContain('"issue 0"');
  expect(result.last.type).toBe('persistence');
  expect(result.keys).toEqual(['context', 'message', 'ts', 'type']);
  expect(result.raw).not.toContain('Secret Learner Name');
  expect(result.bundleHasIssues).toBe(true);

  await page.reload();
  const afterReload = await page.evaluate(() => ({ length: recentDiagnostics().length, last: recentDiagnostics().at(-1)?.type }));
  expect(afterReload.length).toBe(50);
  expect(afterReload.last).toBe('persistence');
});

test('recovery snapshot restores when primary and backup saves are corrupt', async ({ page }) => {
  await page.evaluate(() => {
    const current = JSON.parse(localStorage.getItem('bb-core-v3'));
    current.profiles[0].name = 'Recovery Kid';
    localStorage.setItem('bb-core-v3-recovery', JSON.stringify(current));
    localStorage.setItem('bb-core-v3-back', '{broken');
    localStorage.setItem('bb-core-v3', '{broken');
  });
  await page.reload();
  await expect(page.locator('#profileName')).toHaveText('Recovery Kid');
});

test('manual restore recovers from the latest valid recovery snapshot when backup is corrupt', async ({ page }) => {
  await page.evaluate(() => {
    const current = JSON.parse(localStorage.getItem('bb-core-v3'));
    current.profiles[0].name = 'Restore Kid';
    localStorage.setItem('bb-core-v3-recovery', JSON.stringify(current));
    localStorage.setItem('bb-core-v3-back', '{broken');
    localStorage.setItem('bb-core-v3', '{broken');
  });
  await parentDestination(page, 'Recovery');
  await page.getByRole('button', { name: 'Restore Backup' }).click();
  await approveSensitiveAction(page);
  await expect(page.locator('#profileName')).toHaveText('Restore Kid');
  await page.evaluate(() => PERSISTENCE_CHAIN);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  expect(state.profiles[0].name).toBe('Restore Kid');
});

test('autosave rotates distinct generations and explicit restore replaces a newer valid primary', async ({ page }) => {
  const generations = await page.evaluate(async () => {
    P().name = 'Generation One';
    await save();
    P().name = 'Generation Two';
    await save();
    const readName = key => JSON.parse(localStorage.getItem(key)).profiles[0].name;
    return {
      primary: readName('bb-core-v3'),
      backup: readName('bb-core-v3-back'),
      recovery: readName('bb-core-v3-recovery'),
    };
  });
  expect(generations.primary).toBe('Generation Two');
  expect(generations.backup).toBe('Generation One');
  expect(new Set(Object.values(generations)).size).toBeGreaterThan(1);

  await parentDestination(page, 'Recovery');
  await page.getByRole('button', { name: 'Restore Backup' }).click();
  await approveSensitiveAction(page);
  await expect(page.locator('#profileName')).toHaveText('Generation One');
  await page.evaluate(() => PERSISTENCE_CHAIN);
  const restored = await page.evaluate(() => ({
    memory: P().name,
    primary: JSON.parse(localStorage.getItem('bb-core-v3')).profiles[0].name,
    backup: JSON.parse(localStorage.getItem('bb-core-v3-back')).profiles[0].name,
  }));
  expect(restored).toEqual({ memory: 'Generation One', primary: 'Generation One', backup: 'Generation One' });
});

test('storage quota failure is visible and keeps the current session available', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItemWithQuotaFailure(key, value) {
      if (key === 'bb-core-v3') {
        throw new DOMException('Test quota exhausted', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    };
    try {
      P().name = 'Unsaved Session Kid';
      await save();
      return {
        memoryName: P().name,
        error: globalThis.__BRAINBITE_PERSISTENCE_ERROR__,
        status: document.getElementById('saveHealth').textContent,
      };
    } finally {
      Storage.prototype.setItem = originalSetItem;
    }
  });

  expect(result.memoryName).toBe('Unsaved Session Kid');
  expect(result.error).toMatchObject({ name: 'QuotaExceededError' });
  expect(result.status).toContain('Save failed: device storage is full');
  expect(result.status).toContain('current session is still open');
});

test('duplicate sync events are rejected even when separated by other queued events', async ({ page }) => {
  await page.evaluate(async () => {
    acknowledgeSyncEvents(SYNC.queue.map(event => event.eventId || event.id));
    SYNC.queue = [];
    queueSyncEvent({ type: 'store-update', profileId: 'profile-a', payload: { active: 0, schemaVersion: 8 }, schemaVersion: 8, ts: 1 });
    queueSyncEvent({ type: 'heartbeat', profileId: 'profile-a', payload: { ok: true }, schemaVersion: 8, ts: 2 });
    queueSyncEvent({ type: 'store-update', profileId: 'profile-a', payload: { active: 0, schemaVersion: 8 }, schemaVersion: 8, ts: 3 });
    await saveSync();
  });
  const sync = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v6-sync')));
  expect(sync.queue.filter(evt => evt.type === 'store-update')).toHaveLength(1);
  expect(sync.queue).toHaveLength(2);
});

test('sync history stays bounded, prioritizes deletes, and deterministically normalizes legacy events', async ({ page }) => {
  const result = await page.evaluate(async () => {
    SYNC.queue = [];
    SYNC.acknowledgedEventIds = [];
    for (let index = 0; index < SYNC_QUEUE_LIMIT + 40; index += 1) {
      queueSyncEvent({ id: `heartbeat-${index}`, type: 'heartbeat', profileId: 'profile-a', payload: { index }, ts: index + 1 });
    }
    for (let index = 0; index < 20; index += 1) {
      queueSyncEvent({ id: `store-${index}`, type: 'store-update', profileId: 'profile-b', payload: { revision: index }, ts: 1000 + index });
    }
    queueSyncEvent({ id: 'delete-a', type: 'profile-delete', profileId: 'profile-a', payload: { deletedAt: 2000 }, ts: 2000 });
    acknowledgeSyncEvents(Array.from({ length: SYNC_ACKNOWLEDGED_LIMIT + 10 }, (_, index) => `ack-${index}`));
    const legacy = { type: 'heartbeat', profileId: 'legacy-profile', payload: { stable: true }, ts: 77 };
    const legacyFirst = normalizeSyncQueue([legacy, legacy], []);
    const legacySecond = normalizeSyncQueue(legacyFirst, []);
    await saveSync();
    return {
      queueLength: SYNC.queue.length,
      firstType: SYNC.queue[0]?.type,
      deleteCount: SYNC.queue.filter(event => event.type === 'profile-delete').length,
      deletedProfileUpdates: SYNC.queue.filter(event => event.type === 'store-update' && event.profileId === 'profile-a').length,
      profileBUpdates: SYNC.queue.filter(event => event.type === 'store-update' && event.profileId === 'profile-b').length,
      acknowledgedLength: SYNC.acknowledgedEventIds.length,
      firstAcknowledged: SYNC.acknowledgedEventIds[0],
      legacyIds: [legacyFirst[0]?.eventId, legacySecond[0]?.eventId],
      legacyLength: legacyFirst.length,
    };
  });
  expect(result).toEqual({
    queueLength: 500,
    firstType: 'profile-delete',
    deleteCount: 1,
    deletedProfileUpdates: 0,
    profileBUpdates: 1,
    acknowledgedLength: 2000,
    firstAcknowledged: 'ack-10',
    legacyIds: [result.legacyIds[0], result.legacyIds[0]],
    legacyLength: 1,
  });
  expect(result.legacyIds[0]).toMatch(/^legacy-sync-/);
});

test('canonical tombstones remain retryable beyond the bounded sync queue', async ({ page }) => {
  const result = await page.evaluate(async () => {
    INTEGRATIONS.cloud = { provider: 'firebase', url: 'brainbite-test', key: 'AIza-test-public-web-key-123456789' };
    localStorage.setItem('bb-firebase-session', JSON.stringify({ idToken: 'token', localId: 'family-delete-overflow', email: 'parent@example.com' }));
    SYNC.queue = [];
    SYNC.acknowledgedEventIds = [];
    STORE.deletedProfiles = Array.from({ length: SYNC_QUEUE_LIMIT + 20 }, (_, index) => ({ id: `deleted-${index}`, deletedAt: index + 1 }));
    for (const tombstone of STORE.deletedProfiles) queueSyncEvent({ type: 'profile-delete', profileId: tombstone.id, payload: { deletedAt: tombstone.deletedAt }, ts: tombstone.deletedAt });
    const queuedBefore = SYNC.queue.length;
    const seen = [];
    const original = BrainBiteFirebaseREST.prototype.pushProfileDeletion;
    BrainBiteFirebaseREST.prototype.pushProfileDeletion = async function pushProfileDeletion(profileId) { seen.push(profileId); };
    try {
      const summary = await retryPendingSync();
      return { queuedBefore, summary, uniqueDeletes: new Set(seen).size, first: seen[0], last: seen.at(-1), queueAfter: SYNC.queue.length };
    } finally {
      BrainBiteFirebaseREST.prototype.pushProfileDeletion = original;
    }
  });
  expect(result).toEqual({ queuedBefore: 500, summary: { ok: 520, failed: 0 }, uniqueDeletes: 520, first: 'deleted-0', last: 'deleted-519', queueAfter: 0 });
});

test('retry pending sync applies merged remote evidence to memory and recovery copies', async ({ page }) => {
  const result=await page.evaluate(async()=>{
    INTEGRATIONS.cloud={provider:'firebase',url:'brainbite-test',key:'AIza-test-public-web-key-123456789'};
    localStorage.setItem('bb-firebase-session',JSON.stringify({idToken:'token',refreshToken:'refresh',localId:'family-retry',email:'parent@example.com'}));
    SYNC.queue=[];
    const c=window.BrainBiteCore,profile=P(),profileId=profile.id;
    const remote=structuredClone(profile);
    let remoteLearner=ensureProfileLearningCore(remote);
    remoteLearner=c.recordLearnerAttempt(remoteLearner,'math-4-fractions',{id:'retry-remote-attempt',originId:'11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222',originSequence:1,correct:true,independent:true,responseTimeMs:1700,at:1},{id:'math-4-fractions'});
    projectLearningCore(remote,remoteLearner);remote.updatedAt=Date.now()-100;
    updateSkill('math-4-fractions',true,{attemptId:'retry-local-attempt',independent:true,responseTimeMs:1800,source:'mission'});await save();
    const localOrigin=P().learningCore.skills['math-4-fractions'].recentPerformance.at(-1).originId,queuedBefore=SYNC.queue.length;
    const client=cloudClient(),remoteFields={progress:client.wrapValue(remote)};
    let patchAttempts=0,usedUpdatePrecondition=false;
    const originalFetch=window.fetch;
    window.fetch=async(url,options={})=>{
      if(options.method==='PATCH'){
        patchAttempts++;usedUpdatePrecondition=new URL(String(url)).searchParams.get('currentDocument.updateTime')==='2026-09-12T00:00:00.000Z';
        return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
      }
      return new Response(JSON.stringify({fields:remoteFields,updateTime:'2026-09-12T00:00:00.000Z'}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    try{
      const summary=await retryPendingSync();
      const summarize=store=>{const skill=store.profiles.find(item=>item.id===profileId).learningCore.skills['math-4-fractions'];return {attempts:skill.evidence.attempts,independentSuccesses:skill.evidence.independentSuccesses,sources:window.BrainBiteCore.evidenceProvenanceSources(skill).map(source=>source.id).sort(),attemptIds:skill.recentPerformance.map(attempt=>attempt.id).sort()}};
      return {summary,queuedBefore,queueAfter:SYNC.queue.map(event=>event.eventId),patchAttempts,usedUpdatePrecondition,localOrigin,memory:summarize(STORE),primary:summarize(JSON.parse(localStorage.getItem('bb-core-v3'))),backup:summarize(JSON.parse(localStorage.getItem('bb-core-v3-back'))),recovery:summarize(JSON.parse(localStorage.getItem('bb-core-v3-recovery')))};
    }finally{window.fetch=originalFetch}
  });
  const expected={attempts:2,independentSuccesses:2,sources:['11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222',result.localOrigin].sort(),attemptIds:['retry-local-attempt','retry-remote-attempt']};
  expect(result.summary).toEqual({ok:1,failed:0});
  expect(result.queuedBefore).toBe(1);
  expect(result.queueAfter).toEqual([]);
  expect(result.patchAttempts).toBe(1);
  expect(result.usedUpdatePrecondition).toBe(true);
  expect({memory:result.memory,primary:result.primary,backup:result.backup,recovery:result.recovery}).toEqual({memory:expected,primary:expected,backup:expected,recovery:expected});
});

test('retry pending sync applies remote tombstone immediately without pulling', async ({ page }) => {
  const childName='Retry Tombstoned Child';
  const result=await page.evaluate(async childName=>{
    INTEGRATIONS.cloud={provider:'firebase',url:'brainbite-test',key:'AIza-test-public-web-key-123456789'};
    localStorage.setItem('bb-firebase-session',JSON.stringify({idToken:'token',refreshToken:'refresh',localId:'family-retry-delete',email:'parent@example.com'}));
    const stale=blank(childName);stale.id='retry-remote-tombstone-child';STORE.profiles.push(stale);STORE.active=STORE.profiles.length-1;await writeStoreCopies(STORE);render();
    SYNC.queue=[];queueSyncEvent({id:'retry-tombstone-event',eventId:'retry-tombstone-event',type:'store-update',profileId:stale.id,payload:{active:STORE.active,schemaVersion:STORE.schemaVersion},schemaVersion:STORE.schemaVersion,ts:1});await saveSync();
    const client=cloudClient(),fields={progress:client.wrapValue({id:stale.id,deleted:true,deletedAt:12345})};
    let patchAttempts=0;
    const originalFetch=window.fetch;
    window.fetch=async(url,options={})=>{if(options.method==='PATCH'){patchAttempts++;return new Response('{}',{status:200})}return new Response(JSON.stringify({fields,updateTime:'2026-09-12T00:00:00.000Z'}),{status:200,headers:{'Content-Type':'application/json'}})};
    try{
      const summary=await retryPendingSync();
      const summarize=store=>({present:store.profiles.some(profile=>profile.id===stale.id),tombstoned:store.deletedProfiles.some(item=>item.id===stale.id&&item.deletedAt===12345),activeValid:store.active>=0&&store.active<store.profiles.length,profileCount:store.profiles.length});
      return {summary,patchAttempts,queue:SYNC.queue.map(event=>event.eventId),memory:summarize(STORE),primary:summarize(JSON.parse(localStorage.getItem('bb-core-v3'))),backup:summarize(JSON.parse(localStorage.getItem('bb-core-v3-back'))),recovery:summarize(JSON.parse(localStorage.getItem('bb-core-v3-recovery')))};
    }finally{window.fetch=originalFetch}
  },childName);
  const expected={present:false,tombstoned:true,activeValid:true,profileCount:1};
  expect(result).toEqual({summary:{ok:1,failed:0},patchAttempts:0,queue:[],memory:expected,primary:expected,backup:expected,recovery:expected});
  await expect(page.locator('body')).not.toContainText(childName);
  await parentDestination(page, 'Profiles');
  await expect(page.locator('#profileList')).not.toContainText(childName);
});

test('sync preserves events queued while a retry is in flight', async ({ page }) => {
  const result = await page.evaluate(async () => {
    INTEGRATIONS.cloud = { provider: 'firebase', url: 'brainbite-test', key: 'AIza-test-public-web-key-123456789' };
    localStorage.setItem('bb-firebase-session', JSON.stringify({ idToken: 'token', localId: 'family-a', email: 'parent@example.com' }));
    SYNC.queue = [];
    const profileId = P().id;
    queueSyncEvent({ id: 'old-event', eventId: 'old-event', type: 'store-update', profileId, payload: { active: 0, schemaVersion: 8 }, schemaVersion: 8, ts: 1 });
    saveSync();
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      await new Promise(resolve => setTimeout(resolve, 40));
      if (String(url).includes('firestore') && options.method !== 'PATCH') return new Response('', { status: 404 });
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    try {
      const retry = retryPendingSync();
      await new Promise(resolve => setTimeout(resolve, 10));
      queueSyncEvent({ id: 'new-event', eventId: 'new-event', type: 'store-update', profileId, payload: { active: 0, schemaVersion: 8 }, schemaVersion: 8, ts: 2 });
      saveSync();
      const summary = await retry;
      return { summary, queue: SYNC.queue.map(event => event.eventId) };
    } finally {
      window.fetch = originalFetch;
    }
  });
  expect(result.summary).toEqual({ ok: 1, failed: 0 });
  expect(result.queue).toEqual(['new-event']);
});

test('low-end devices surface the reduced-cost mode hint and class', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });
  });
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/low-end-device/);
  await expect(page.locator('#launchHint')).toContainText('This device may feel smoother on Performance mode.');
});

test('production fonts are self-hosted, precached, and the content security policy is restrictive', async ({ page }) => {
  const externalHosts = [];
  page.on('request', request => {
    const host = new URL(request.url()).hostname;
    if (!['127.0.0.1', 'localhost', '::1'].includes(host)) externalHosts.push(host);
  });
  await page.reload();
  // Nunito is only the fallback after Fredoka, so a page whose text Fredoka fully covers
  // never needs it. It used to load only because double-encoded glyphs in styles.css fell
  // through to it; load it explicitly so this test proves self-hosting, not that accident.
  await page.evaluate(() => Promise.all([document.fonts.load('700 16px Fredoka'), document.fonts.load('800 16px Nunito')]));
  await page.evaluate(() => document.fonts.ready);
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("script-src 'self'");
  expect(policy).toContain("style-src 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("base-uri 'none'");
  await expect(page.locator('link[href*="fonts.googleapis"], link[href*="fonts.gstatic"]')).toHaveCount(0);
  const faces = await page.evaluate(() => [...document.fonts].map(face => `${face.family}:${face.status}`));
  expect(faces).toContain('Fredoka:loaded');
  expect(faces).toContain('Nunito:loaded');
  const fontRequests = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /\.woff2?($|\?)/.test(entry.name)).map(entry => entry.name.split('/').pop()));
  expect(fontRequests).toEqual(expect.arrayContaining(['fredoka-variable.woff2', 'nunito-variable.woff2']));
  expect(externalHosts.filter(host => /fonts\.|gstatic/.test(host))).toEqual([]);
  // The install cache must carry the fonts so offline play keeps its typography.
  const cached = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const keys = await caches.keys();
    for (const key of keys) {
      const cache = await caches.open(key);
      const fredoka = await cache.match('./assets/fonts/fredoka-variable.woff2');
      const nunito = await cache.match('./assets/fonts/nunito-variable.woff2');
      const sheet = await cache.match('./fonts.css');
      if (fredoka && nunito && sheet) return true;
    }
    return false;
  });
  expect(cached).toBe(true);
});

test('automated WCAG scan has no serious or critical violations on primary screens', async ({ page }) => {
  test.setTimeout(180_000);
  const screens = ['home','brainbase','worlds','math','words','spanish','code','codebridge','codelab','bites','practice','settings','parent','controls','profiles','recovery','account','integrations','diagnostics','release','advanced'];
  const findings = [];
  for (const screen of screens) {
    await page.evaluate(id => { show(id); }, screen);
    await page.waitForTimeout(120);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const blocking = results.violations.filter(item => ['serious', 'critical'].includes(item.impact));
    if (blocking.length) findings.push(`${screen}: ${blocking.map(item => `${item.id} (${item.impact})`).join(', ')}`);
  }
  // The battle HUD carries the answer surface, so scan it mid-mission too.
  await page.evaluate(() => window.BrainBiteGame.startPracticeMission(1));
  await expect(page.locator('#game.show')).toBeVisible();
  await page.waitForTimeout(150);
  const battle = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  for (const item of battle.violations.filter(v => ['serious', 'critical'].includes(v.impact))) findings.push(`game: ${item.id} (${item.impact})`);
  expect(findings, findings.join('\n')).toEqual([]);
});

test('PWA manifest, service worker, cache boundary, and offline reload work', async ({ page, context }) => {
  const manifest = await page.request.get('/manifest.webmanifest'); expect(manifest.ok()).toBeTruthy();
  const sw = await page.request.get('/service-worker.js'); const source = await sw.text();
  expect(source).toContain("url.origin !== self.location.origin");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'BrainBite' })).toBeVisible();
  await context.setOffline(false);
});

test('content review gate launches exact-digest registry missions and internal-review curriculum', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteContentControl && !!window.BrainBiteGame && !!window.BrainBiteCore);
  const result = await page.evaluate(() => {
    const missionLaunch = window.BrainBiteGame.startMission(1);
    const missionState = window.BrainBiteGame.getState();
    const curriculum = window.BrainBiteCore.createApprovedCurriculumChallenge('math-1-addition', { seed: 3, family: 'Target Smash' });
    const curriculumLaunch = window.BrainBiteGame.startCurriculumChallenge(curriculum.challenge, { assisted: false });
    const curriculumState = window.BrainBiteGame.getState();
    return {
      mode: window.BrainBiteGame.getContentControl(),
      missionLaunch,
      missionIdentity: missionState?.contentControl?.telemetry?.contentIdentity,
      curriculumLaunch,
      curriculumIdentity: curriculumState?.contentControl?.telemetry?.contentIdentity,
    };
  });
  expect(result.mode).toMatchObject({ mode: 'internal-review', manifestLoaded: true, manifestVersion: '3.3.0' });
  expect(result.missionLaunch).toBe(true);
  expect(result.missionIdentity).toBe('registry-mission:1');
  expect(result.curriculumLaunch).toBe(true);
  expect(result.curriculumIdentity).toMatch(/^generated-template:math-1-addition@sha256:[0-9a-f]{64}$/);
});

test('release mode overrides an internal-review URL request while allowing canonical registry missions', async ({ page }) => {
  await page.goto('/?match=0&webgl=0&release=1&contentMode=internal-review');
  await page.waitForFunction(() => !!window.BrainBiteContentControl && !!window.BrainBiteGame);
  expect(await page.evaluate(() => window.BrainBiteGame.getContentControl().mode)).toBe('production');
  expect(await page.evaluate(() => window.BrainBiteGame.startMission(1))).toBe(true);
});

test('Phase 3.2 frozen gate API resists post-bootstrap monkey-patching', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/?release=1&contentMode=internal-review');
  const result = await page.evaluate(() => {
    const gate = window.BrainBiteContentControl;
    const manifest = window.BrainBiteContentReviewManifest;
    const originalMode = gate.getRuntimeMode;
    const originalLaunch = gate.evaluateLaunch;
    const originalRecord = manifest.getReviewRecord;
    const originalReview = manifest.evaluateReview;
    try { gate.getRuntimeMode = () => 'internal-review'; } catch {}
    try { gate.evaluateLaunch = () => ({ approved: true, eligible: true }); } catch {}
    try { manifest.getReviewRecord = () => ({ runtime: { production: true } }); } catch {}
    try { manifest.evaluateReview = () => ({ eligible: true, reasons: [] }); } catch {}
    return {
      frozen: Object.isFrozen(gate),
      modeUnchanged: gate.getRuntimeMode === originalMode && gate.getRuntimeMode() === 'production',
      launchUnchanged: gate.evaluateLaunch === originalLaunch,
      manifestFrozen: Object.isFrozen(manifest),
      manifestUnchanged: manifest.getReviewRecord === originalRecord && manifest.evaluateReview === originalReview,
    };
  });
  expect(result).toEqual({ frozen: true, modeUnchanged: true, launchUnchanged: true, manifestFrozen: true, manifestUnchanged: true });
  await context.close();
});

test('Phase 3.2 altered generated payloads cannot borrow a reviewed template identity', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteGame);
  const result = await page.evaluate(() => {
    const approved = window.BrainBiteCore.createApprovedCurriculumChallenge('math-1-addition', { seed: 23, family: 'Target Smash' });
    const altered = structuredClone(approved.challenge);
    altered.prompt = 'Altered prompt with a borrowed template identity.';
    return window.BrainBiteGame.startCurriculumChallenge(altered, { assisted: false });
  });
  expect(result).toBe(false);
  await expect(page.locator('#game')).not.toHaveClass(/show/);
});

test('production mode allows canonical registry missions but fails closed for generated prototypes', async ({ page }) => {
  await page.goto('/?match=0&webgl=0&contentMode=production');
  await page.waitForFunction(() => !!window.BrainBiteContentControl && !!window.BrainBiteGame && !!window.BrainBiteCore);
  const result = await page.evaluate(() => {
    const curriculum = window.BrainBiteCore.createApprovedCurriculumChallenge('math-1-addition', { seed: 4, family: 'Target Smash' });
    const missionLaunch = window.BrainBiteGame.startMission(1);
    const curriculumLaunch = window.BrainBiteGame.startCurriculumChallenge(curriculum.challenge, { assisted: false });
    return {
      mode: window.BrainBiteGame.getContentControl().mode,
      missionLaunch,
      curriculumLaunch,
      gameVisible: document.getElementById('game').classList.contains('show'),
      launchHint: document.getElementById('launchHint').textContent,
      practiceResult: document.getElementById('practiceResult').textContent,
    };
  });
  expect(result.mode).toBe('production');
  expect(result.missionLaunch).toBe(true);
  expect(result.curriculumLaunch).toBe(false);
  expect(result.gameVisible).toBe(true);
  expect(result.practiceResult).toContain('not available yet');
});

test('non-localhost production host launches and completes a canonical registry mission', async ({ page }) => {
  await page.goto('http://brainbite.localhost:4318/?match=0&webgl=0');
  await page.waitForFunction(() => !!window.BrainBiteGame && !!window.BrainBiteContentControl);
  const result = await page.evaluate(async () => {
    const mode = window.BrainBiteGame.getContentControl().mode;
    const launched = window.BrainBiteGame.startMission(1);
    for (let guard = 0; guard < 25 && G && !progression().completedMissionIds.includes(1); guard += 1) {
      const next = G.cells.find(cell => cell && !cell.eaten && cell.correct);
      if (!next) break;
      window.BrainBiteGame.tryAnswer(next.value);
    }
    await PERSISTENCE_CHAIN;
    return {
      mode,
      launched,
      completed: progression().completedMissionIds.includes(1),
      stars: P().stars,
    };
  });
  expect(result).toMatchObject({ mode: 'production', launched: true, completed: true, stars: 3 });
});

test('cloud authorization retries once and then requires a fresh sign-in', async ({ page }) => {
  let firestoreRequests = 0;
  let refreshRequests = 0;
  await page.route('https://firestore.googleapis.com/**', async route => {
    firestoreRequests += 1;
    await route.fulfill({ status: 401, json: { error: { message: 'expired' } } });
  });
  await page.route('https://securetoken.googleapis.com/**', async route => {
    refreshRequests += 1;
    await route.fulfill({ json: { id_token: 'refreshed-token', refresh_token: 'refresh-2', user_id: 'family-auth-cap' } });
  });
  const result = await page.evaluate(async () => {
    localStorage.setItem('bb-firebase-session', JSON.stringify({
      idToken: 'expired-token',
      refreshToken: 'refresh-1',
      localId: 'family-auth-cap',
      email: 'parent@example.com',
    }));
    const client = new BrainBiteFirebaseREST('brainbite-test', 'AIza-test-public-web-key-123456789');
    try {
      await client.pullProfiles();
      return { resolved: true, message: '' };
    } catch (error) {
      return { resolved: false, message: error.message };
    }
  });
  expect(result).toEqual({ resolved: false, message: 'Cloud authorization expired. Sign in again.' });
  expect(firestoreRequests).toBe(2);
  expect(refreshRequests).toBe(1);
});

test('Firestore size preflight rejects oversized profile and tombstone before any fetch', async ({ page }) => {
  const result = await page.evaluate(async () => {
    localStorage.setItem('bb-firebase-session', JSON.stringify({
      idToken: 'token', refreshToken: 'refresh', localId: 'family-size-cap', email: 'parent@example.com',
    }));
    const client = new BrainBiteFirebaseREST('brainbite-test', 'AIza-test-public-web-key-123456789');
    const originalFetch = window.fetch;
    let fetches = 0;
    window.fetch = async () => { fetches += 1; return new Response('{}', { status: 200 }); };
    try {
      let profileMessage = '';
      let tombstoneMessage = '';
      // The structural cloud projection bounds every synced field, so an oversized
      // local record is minimized before the push path is reached.
      const projected = client.profilePatchBody({ id: 'oversized-profile', name: 'Large', history: 'é'.repeat(500000) });
      const projectedBytes = new TextEncoder().encode(JSON.stringify(projected)).byteLength;
      // The serializer preflight is the last line of defence before any network call.
      try { client.serializeSafePatch({ fields: { progress: { stringValue: 'A'.repeat(1_100_000) } } }, 'profile'); } catch (error) { profileMessage = error.message; }
      try { await client.pushProfileDeletion('x'.repeat(500000), 1234); } catch (error) { tombstoneMessage = error.message; }
      return { fetches, projectedBytes, profileMessage, tombstoneMessage };
    } finally {
      window.fetch = originalFetch;
    }
  });
  expect(result.fetches).toBe(0);
  expect(result.projectedBytes).toBeLessThan(100_000);
  expect(result.profileMessage).toContain('Cloud profile is too large to sync safely');
  expect(result.profileMessage).toContain('UTF-8 bytes');
  expect(result.tombstoneMessage).toContain('Cloud deletion marker is too large to sync safely');
});

test('Phase 3.2 review manifest and gate helper remain available through the offline cache', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  try {
    const result = await page.evaluate(async () => {
      const response = await fetch('/content/content-review-manifest.js');
      return {
        ok: response.ok,
        hasManifestApi: typeof window.BrainBiteContentReviewManifest?.getReviewRecord === 'function',
        hasGateApi: typeof window.BrainBiteContentControl?.evaluateLaunch === 'function',
        manifestVersion: window.BrainBiteContentReviewManifest?.getReviewManifest?.().version,
      };
    });
    expect(result).toEqual({ ok: true, hasManifestApi: true, hasGateApi: true, manifestVersion: '3.3.0' });
  } finally {
    await context.setOffline(false);
  }
});

test('attempt events retain the active profile identity while excluding child or answer data', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteGame && !!window.BrainBiteCore);
  const result = await page.evaluate(() => {
    window.BrainBiteGame.startMission(1);
    const game = window.BrainBiteGame.getState();
    const correct = game.cells.find(cell => !cell.eaten && cell.correct)?.value;
    window.BrainBiteGame.tryAnswer(correct);
    const skill = P().learningCore.skills[game.m.skill];
    const attempt = skill.recentPerformance.at(-1);
    const event = P().learningCore.offlineQueue.find(item => item.type === 'LearningAttemptRecorded');
    const telemetry = P().learningCore.telemetry.find(item => item.type === 'ContentAttemptRecorded');
    return { profileId: P().id, profileName: P().name, answer: String(correct), prompt: game.m.prompt, attempt, event, telemetry };
  });
  for (const value of [result.attempt, result.event?.payload, result.telemetry?.payload]) {
    expect(value).toMatchObject({
      contentIdentity: 'registry-mission:1',
      manifestStatus: 'production-reviewed',
      gateMode: 'internal-review',
      provenance: { sourceFile: 'content/experience-registry.js', authority: 'experience-registry.js' },
    });
    expect(value).not.toHaveProperty('prompt');
    expect(value).not.toHaveProperty('selected');
  }
  expect(result.event.profileId).toBe(result.profileId);
  expect(result.event.payload).not.toHaveProperty('profileId');
  expect(JSON.stringify(result.event)).toContain(result.profileId);
  expect(JSON.stringify(result.telemetry)).not.toContain(result.profileId);
  for (const event of [result.event, result.telemetry]) {
    expect(event.id).toMatch(UUID_PATTERN);
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain(result.profileName);
    const forbiddenKeys = [];
    const scalarStrings = [];
    const visit = value => {
      if (typeof value === 'string') { scalarStrings.push(value); return; }
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (/^(?:answer|answers|prompt|selected|selectedAnswer)$/i.test(key)) forbiddenKeys.push(key);
        visit(child);
      }
    };
    visit(event);
    expect(forbiddenKeys).toEqual([]);
    expect(scalarStrings).not.toContain(result.answer);
    expect(scalarStrings).not.toContain(result.prompt);
  }
  expect(result.attempt.id).toMatch(UUID_PATTERN);
  expect(result.attempt.id).not.toContain(result.profileId);
});

test('single-learner struggle records review telemetry without quarantine or retry lock', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteGame && !!window.BrainBiteCore);
  const result = await page.evaluate(() => {
    window.BrainBiteGame.startMission(1);
    const wrong = String(G.cells.find(cell => !cell.eaten && !cell.correct).value);
    for (let count = 0; count < 3; count += 1) window.BrainBiteGame.tryAnswer(wrong);
    const before = { lives: G.lives, mastery: P().mastery.math, mistakes: P().mistakes.length, attempts: P().learningCore.skills[G.m.skill].evidence.attempts };
    window.BrainBiteGame.tryAnswer(wrong);
    const identity = G.contentControl.telemetry.contentIdentity;
    const observed = P().learningCore.offlineQueue.find(event => event.type === 'ContentOutcomeObserved');
    const observedTelemetry = P().learningCore.telemetry.find(event => event.type === 'ContentOutcomeObserved');
    const flagged = P().learningCore.offlineQueue.find(event => event.type === 'ContentOutcomeFlagged');
    const after = { lives: G.lives, mastery: P().mastery.math, mistakes: P().mistakes.length, attempts: P().learningCore.skills[G.m.skill].evidence.attempts };
    return { before, after, identity, profileId: P().id, profileName: P().name, quarantine: P().learningCore.contentQuarantine[identity], observed, observedTelemetry, flagged, relaunch: window.BrainBiteGame.startMission(1) };
  });
  expect(result.after.attempts).toBe(result.before.attempts + 1);
  expect(result.after.mistakes).toBe(result.before.mistakes + 1);
  expect(result.after.lives).toBe(result.before.lives - 1);
  expect(result.after.mastery).toBeLessThanOrEqual(result.before.mastery);
  expect(result.observed).toBeTruthy();
  expect(result.observed.payload).toMatchObject({ contentIdentity: result.identity, action: 'review-telemetry', learnerPunishment: 'none' });
  expect(result.observed.payload.signals).toEqual(expect.arrayContaining(['high-miss-rate', 'high-retry-count']));
  expect(result.observed.profileId).toBe(result.profileId);
  expect(result.observed.payload).not.toHaveProperty('profileId');
  expect(result.observed.id).toMatch(UUID_PATTERN);
  expect(result.observedTelemetry).toBeTruthy();
  expect(result.observedTelemetry.payload).toMatchObject({ contentIdentity: result.identity, action: 'review-telemetry', learnerPunishment: 'none' });
  expect(result.observedTelemetry.id).toMatch(UUID_PATTERN);
  expect(result.flagged).toBeUndefined();
  expect(result.quarantine).toBeUndefined();
  expect(result.relaunch).toBe(true);
  expect(JSON.stringify(result.observed)).toContain(result.profileId);
  expect(JSON.stringify(result.observedTelemetry)).not.toContain(result.profileId);
  for (const event of [result.observed, result.observedTelemetry]) expect(JSON.stringify(event)).not.toContain(result.profileName);
  const forbiddenKeys = [];
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (/^(?:answer|answers|prompt|selected|selectedAnswer)$/i.test(key)) forbiddenKeys.push(key);
      visit(child);
    }
  };
  for (const event of [result.observed, result.observedTelemetry]) visit(event);
  expect(forbiddenKeys).toEqual([]);
});

test('BrainBite Lab remains hidden and inert in release mode despite public URL flags', async ({ page }) => {
  await page.goto('/?match=0&webgl=0&release=1&lab=1&mode=internal-review');
  await page.waitForFunction(() => !!window.BrainBiteGame && !!window.BrainBiteCore);
  await expect(page.getByRole('button', { name: 'BrainBite Lab', exact: true })).toBeHidden();
  const state = await page.evaluate(() => {
    const before = structuredClone(P().learningCore);
    document.getElementById('labSimCorrect').click();
    document.getElementById('labJumpKraken').click();
    return { before, after: P().learningCore, game: window.BrainBiteGame.getState(), qaHidden: document.getElementById('qa').hidden };
  });
  expect(state.after).toEqual(state.before);
  expect(state.game).toBeNull();
  expect(state.qaHidden).toBe(true);
});

test('quarantined records remain rejected by the runtime gate', async ({ page }) => {
  const result = await page.evaluate(() => {
    const identity = 'json-pack-item:math-question-bank-v1.7.json::$.sets[2]';
    const record = window.BrainBiteContentReviewManifest.getReviewRecord(identity);
    const evaluation = window.BrainBiteGame.evaluateContentRecord(identity, { mode: 'internal-review', currentDigest: record.digest.value });
    return { eligible: evaluation.eligible, reasons: evaluation.reasons, quarantine: record.quarantine };
  });
  expect(result.eligible).toBe(false);
  expect(result.reasons).toContain('quarantine-active');
  expect(result.quarantine.status).toBe('quarantined');
});

test('live mission answers record canonical evidence and profile-scoped offline events', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteGame);
  const result = await page.evaluate(() => {
    const launched = window.BrainBiteGame.startMission(1);
    const game = window.BrainBiteGame.getState();
    const correct = game.cells.find(cell => !cell.eaten && cell.correct)?.value;
    const incorrect = game.cells.find(cell => !cell.eaten && !cell.correct)?.value;
    const correctResult = window.BrainBiteGame.tryAnswer(correct);
    const incorrectResult = window.BrainBiteGame.tryAnswer(incorrect);
    const profile = P();
    const skill = profile.learningCore.skills[game.m.skill];
    let streak = 0;
    for (const attempt of [...skill.recentPerformance].reverse()) {
      if (!attempt.correct) break;
      streak += 1;
    }
    return {
      launched,
      correctResult,
      incorrectResult,
      missionSkill: game.m.skill,
      evidence: skill.evidence,
      recent: skill.recentPerformance,
      reviewCount: skill.reviewHistory.length,
      queue: profile.learningCore.offlineQueue,
      profileId: profile.id,
      legacy: profile.skills[game.m.skill],
      projection: {
        mastery: Number(skill.masteryScore) || 0,
        streak,
        lastSeen: skill.lastPracticedAt || null,
        nextReview: skill.nextReviewAt || null,
        masteryState: skill.masteryState,
        confidence: Number(skill.confidence) || 0,
      },
    };
  });
  expect(result.launched).toBe(true);
  expect(result.correctResult).toBe(true);
  expect(result.incorrectResult).toBe(true);
  expect(result.evidence).toMatchObject({ attempts: 2, independentSuccesses: 1, incorrectAttempts: 1 });
  expect(result.recent.map(attempt => attempt.correct)).toEqual([true, false]);
  expect(result.recent.every(attempt => attempt.source === 'mission')).toBe(true);
  expect(result.reviewCount).toBe(2);
  expect(result.queue).toHaveLength(2);
  expect(result.queue.every(event => event.type === 'LearningAttemptRecorded' && event.profileId === result.profileId && !event.payload.profileId && !event.payload.prompt && !event.payload.selectedAnswer)).toBe(true);
  expect(result.queue.map(event => event.payload.attemptId)).toEqual(result.recent.map(attempt => attempt.id));
  expect(result.queue.every(event => !event.payload.originId && !event.payload.originSequence)).toBe(true);
  expect(result.legacy).toEqual(result.projection);
});

test('Phase 3.1 activity evidence, sessions, and practice stay isolated between profiles', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteGame);
  const profileA = await page.evaluate(() => {
    window.BrainBiteGame.startMission(1);
    const game = window.BrainBiteGame.getState();
    const correct = game.cells.find(cell => !cell.eaten && cell.correct)?.value;
    window.BrainBiteGame.tryAnswer(correct);
    const timestamp = Date.now();
    recordLearningSession({ id: 'phase31-session-a', mission: 1, world: 'math', accuracy: 100, ts: timestamp });
    recordPracticeItem({ id: 'phase31-practice-a', subject: 'math', topic: 'fractions', type: 'mission', missionId: 8, ts: timestamp });
    save();
    return { id: P().id, skillId: game.m.skill };
  });

  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await parentDestination(page, 'Profiles');
  await page.locator('#newProfile').fill('Phase 3.1 Profile B');
  await page.getByRole('button', { name: 'Add Profile', exact: true }).click();

  const isolation = await page.evaluate(({ id, skillId }) => {
    const active = P();
    const storedA = STORE.profiles.find(profile => profile.id === id);
    return {
      profileB: { id: active.id, name: active.name, skills: Object.keys(active.learningCore?.skills || {}), sessions: active.sessions, practice: active.practice },
      profileA: {
        skillAttempts: storedA.learningCore.skills[skillId].evidence.attempts,
        sessions: storedA.sessions.map(session => session.id),
        practice: storedA.practice.map(item => item.id),
      },
    };
  }, profileA);
  expect(isolation.profileB.id).not.toBe(profileA.id);
  expect(isolation.profileB.name).toBe('Phase 3.1 Profile B');
  expect(isolation.profileB.skills).toEqual([]);
  expect(isolation.profileB.sessions).toEqual([]);
  expect(isolation.profileB.practice).toEqual([]);
  expect(isolation.profileA).toEqual({ skillAttempts: 1, sessions: ['phase31-session-a'], practice: ['phase31-practice-a'] });
});

test('Phase 3.1 Practice Lab locked missions complete as non-progression practice', async ({ page }) => {
  await page.clock.install();
  await page.getByRole('button', { name: 'Practice Lab', exact: true }).click();
  await page.locator('#practiceSubject').selectOption('math');
  await page.locator('#practiceTopic').fill('fractions');
  await page.getByRole('button', { name: 'Build Practice', exact: true }).click();
  await expect(page.locator('#practiceResult')).toContainText('Fractions');

  const before = await page.evaluate(() => {
    const p = P();
    const progress = progression();
    return {
      completed: [...progress.completedMissionIds],
      unlocked: [...progress.unlockedMissionIds],
      lastMissionId: progress.lastMissionId,
      stars: p.stars,
      spark: p.spark,
      sessions: p.sessions.length,
    };
  });
  await page.locator('#playPractice').click();
  await expect(page.locator('#game.show')).toBeVisible();
  await page.evaluate(() => {
    const correctCells = [...new Set(G.cells.filter(cell => !cell.eaten && cell.correct).map(cell => String(cell.value)))];
    for (const value of correctCells) window.BrainBiteGame.tryAnswer(value);
  });

  const completed = await page.evaluate(() => {
    const p = P();
    const progress = progression();
    return {
      completed: [...progress.completedMissionIds],
      unlocked: [...progress.unlockedMissionIds],
      lastMissionId: progress.lastMissionId,
      stars: p.stars,
      spark: p.spark,
      sessions: p.sessions.length,
      session: p.sessions.at(-1),
    };
  });
  expect(completed.completed).toEqual(before.completed);
  expect(completed.unlocked).toEqual(before.unlocked);
  expect(completed.lastMissionId).toBe(before.lastMissionId);
  expect(completed.stars).toBe(before.stars);
  expect(completed.spark).toBe(before.spark);
  expect(completed.sessions).toBe(before.sessions + 1);
  expect(completed.session).toMatchObject({ mission: 8, practice: true, source: 'mission', homework: false });

  await page.clock.runFor(650);
  await page.getByRole('button', { name: 'Practice Lab', exact: true }).click();
  await page.locator('#practiceTopic').fill('fractions');
  await page.getByRole('button', { name: 'Build Practice', exact: true }).click();
  await page.locator('#playPractice').click();
  await expect(page.locator('#game.show')).toBeVisible();
  await page.evaluate(() => {
    const wrong = String(G.cells.find(cell => !cell.eaten && !cell.correct).value);
    for (let life = 0; life < 3; life += 1) window.BrainBiteGame.tryAnswer(wrong);
  });
  await page.clock.runFor(650);

  const afterFailedRetry = await page.evaluate(() => {
    const p = P();
    const progress = progression();
    return {
      completed: [...progress.completedMissionIds],
      unlocked: [...progress.unlockedMissionIds],
      lastMissionId: progress.lastMissionId,
      stars: p.stars,
      spark: p.spark,
      sessions: p.sessions,
      practiceRetry: G?.progressionEligible === false,
    };
  });
  expect(afterFailedRetry.completed).toEqual(before.completed);
  expect(afterFailedRetry.unlocked).toEqual(before.unlocked);
  expect(afterFailedRetry.lastMissionId).toBe(before.lastMissionId);
  expect(afterFailedRetry.stars).toBe(before.stars);
  expect(afterFailedRetry.spark).toBe(before.spark);
  expect(afterFailedRetry.sessions).toHaveLength(before.sessions + 1);
  expect(afterFailedRetry.sessions.every(session => session.practice === true)).toBe(true);
  expect(afterFailedRetry.practiceRetry).toBe(true);
});

test('P1 non-progression practice never awards progression currency, including retries', async ({ page }) => {
  await page.clock.install();
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteGame);

  const baseline = await page.evaluate(() => {
    const profile = P();
    profile.score = 299;
    profile.stars = 2;
    profile.spark = 4;
    profile.progression = REGISTRY.createProgression();
    save();
    return {
      snapshot: (() => {
        const xp = profileXp();
        const progress = progression();
        return {
          score: profile.score,
          level: profileLevel(),
          xp,
          stars: profile.stars,
          spark: profile.spark,
          unlockedBites: [...profile.unlockedBites],
          completed: [...progress.completedMissionIds],
          unlocked: [...progress.unlockedMissionIds],
        };
      })(),
      started: window.BrainBiteGame.startPracticeMission(8),
      progressionEligible: G.progressionEligible,
    };
  });
  const practiceStarted = await page.evaluate(() => {
    const correct = [...new Set(G.cells.filter(cell => !cell.eaten && cell.correct).map(cell => String(cell.value)))];
    correct.forEach(value => window.BrainBiteGame.tryAnswer(value));
    return { progressionEligible: G.progressionEligible };
  });
  await page.clock.runFor(650);
  const afterPractice = await page.evaluate(() => ({
    score: P().score,
    level: profileLevel(),
    xp: profileXp(),
    stars: P().stars,
    spark: P().spark,
    unlockedBites: [...P().unlockedBites],
    completed: [...progression().completedMissionIds],
    unlocked: [...progression().unlockedMissionIds],
  }));

  const curriculumStarted = await page.evaluate(() => {
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('math-4-fractions', {
      subject: 'math', grade: '4', topic: 'fractions', seed: 41,
    });
    if (!route.approved) throw new Error(`Expected an approved curriculum challenge: ${route.errors.join(', ')}`);
    const started = window.BrainBiteGame.startCurriculumChallenge(route.challenge, { assisted: false });
    const accepted = window.BrainBiteGame.tryAnswer(String(G.m.correct[0]));
    return { started, accepted, progressionEligible: G.progressionEligible };
  });
  await page.clock.runFor(650);
  const retryStarted = await page.evaluate(() => {
    const route = window.BrainBiteCore.createApprovedCurriculumChallenge('math-4-fractions', {
      subject: 'math', grade: '4', topic: 'fractions', seed: 42,
    });
    if (!route.approved) throw new Error(`Expected an approved curriculum challenge: ${route.errors.join(', ')}`);
    const started = window.BrainBiteGame.startCurriculumChallenge(route.challenge, { assisted: false });
    const wrong = String(G.cells.find(cell => !cell.eaten && !cell.correct).value);
    for (let life = 0; life < 3; life += 1) window.BrainBiteGame.tryAnswer(wrong);
    return { started, progressionEligible: G.progressionEligible };
  });
  await page.clock.runFor(550);
  const afterRetry = await page.evaluate(() => {
    const correct = [...new Set(G.cells.filter(cell => !cell.eaten && cell.correct).map(cell => String(cell.value)))];
    correct.forEach(value => window.BrainBiteGame.tryAnswer(value));
    return {
      score: P().score,
      level: profileLevel(),
      xp: profileXp(),
      stars: P().stars,
      spark: P().spark,
      unlockedBites: [...P().unlockedBites],
      completed: [...progression().completedMissionIds],
      unlocked: [...progression().unlockedMissionIds],
      progressionEligible: G.progressionEligible,
    };
  });

  expect(baseline.started).toBe(true);
  expect(baseline.progressionEligible).toBe(false);
  expect(practiceStarted.progressionEligible).toBe(false);
  expect(afterPractice).toEqual(baseline.snapshot);
  expect(curriculumStarted).toEqual({ started: true, accepted: true, progressionEligible: false });
  expect(retryStarted.started).toBe(true);
  expect(retryStarted.progressionEligible).toBe(false);
  expect(afterRetry).toMatchObject(baseline.snapshot);
});

test('P1 Foundation imports never resurrect tombstoned profiles', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteFoundationBridge);
  const ids = await page.evaluate(() => {
    const core = window.BrainBiteCore;
    const store = JSON.parse(localStorage.getItem('bb-core-v3'));
    const existing = store.profiles[0];
    const tombstonedId = 'p1-foundation-tombstoned';
    const cachedValidId = 'p1-foundation-cached-valid';
    existing.score = 17;
    existing.stars = 2;
    existing.spark = 5;
    store.deletedProfiles = [{ id: tombstonedId, deletedAt: 1234 }];
    store.profiles = store.profiles.filter(profile => profile.id !== tombstonedId);
    localStorage.setItem('bb-core-v3', JSON.stringify(store));

    const tombstoned = core.defaultLearner('Deleted import', tombstonedId);
    const cachedValid = core.defaultLearner('Cached valid import', cachedValidId);
    cachedValid.hub = { ...cachedValid.hub, variant: 'upgraded', expansionUnlocked: true };
    const foundation = core.normalizeFoundationState({
      learners: { [tombstonedId]: tombstoned, [cachedValidId]: cachedValid },
      activeLearnerId: cachedValidId,
    });
    for (const key of [core.STORAGE_KEY, core.BACKUP_KEY, core.RECOVERY_KEY]) {
      localStorage.setItem(key, JSON.stringify(foundation));
    }
    return { existingId: existing.id, tombstonedId, cachedValidId };
  });

  await page.reload();
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteFoundationBridge);
  const migrated = await page.evaluate(({ existingId, tombstonedId, cachedValidId }) => {
    const core = window.BrainBiteCore;
    const store = JSON.parse(localStorage.getItem('bb-core-v3'));
    const existing = store.profiles.find(profile => profile.id === existingId);
    const cachedValid = store.profiles.find(profile => profile.id === cachedValidId);
    const foundation = window.BrainBiteFoundationBridge.load();
    return {
      profileIds: store.profiles.map(profile => profile.id),
      deletedProfiles: store.deletedProfiles,
      cachedValid: { name: cachedValid?.name, hub: cachedValid?.learningCore?.hub?.variant },
      existing: { score: existing?.score, stars: existing?.stars, spark: existing?.spark },
      foundationIds: Object.keys(foundation.learners),
      cacheKeys: [core.STORAGE_KEY, core.BACKUP_KEY, core.RECOVERY_KEY].map(key => localStorage.getItem(key)),
      tombstonedId,
    };
  }, ids);

  const applied = await page.evaluate(async ({ existingId, tombstonedId }) => {
    const core = window.BrainBiteCore;
    const appliedValidId = 'p1-foundation-applied-valid';
    const tombstoned = core.defaultLearner('Deleted direct apply', tombstonedId);
    const appliedValid = core.defaultLearner('Direct valid import', appliedValidId);
    const foundation = core.normalizeFoundationState({
      learners: { [tombstonedId]: tombstoned, [appliedValidId]: appliedValid },
      activeLearnerId: tombstonedId,
    });
    const returned = window.BrainBiteFoundationBridge.persist(foundation);
    await PERSISTENCE_CHAIN;
    const store = JSON.parse(localStorage.getItem('bb-core-v3'));
    const existing = store.profiles.find(profile => profile.id === existingId);
    return {
      profileIds: store.profiles.map(profile => profile.id),
      existing: { score: existing?.score, stars: existing?.stars, spark: existing?.spark },
      tombstonedId,
      tombstonedName: tombstoned.name,
      appliedValidId,
      returnedProfileIds: Object.values(returned.learners).map(learner => learner.profileId),
      returnedActiveId: returned.activeLearnerId,
      returnedActiveLearnerId: returned.learners[returned.activeLearnerId]?.profileId,
      renderedText: document.getElementById('brainbase-root').textContent,
    };
  }, ids);

  expect(migrated.profileIds).toContain(ids.cachedValidId);
  expect(migrated.profileIds).not.toContain(ids.tombstonedId);
  expect(migrated.foundationIds).toContain(ids.cachedValidId);
  expect(migrated.foundationIds).not.toContain(ids.tombstonedId);
  expect(migrated.cachedValid).toEqual({ name: 'Cached valid import', hub: 'upgraded' });
  expect(migrated.existing).toEqual({ score: 17, stars: 2, spark: 5 });
  expect(migrated.deletedProfiles).toEqual([{ id: ids.tombstonedId, deletedAt: 1234 }]);
  expect(migrated.cacheKeys).toEqual([null, null, null]);
  expect(applied.profileIds).toContain(applied.appliedValidId);
  expect(applied.profileIds).not.toContain(applied.tombstonedId);
  expect(applied.existing).toEqual(migrated.existing);
  expect(applied.returnedProfileIds).toContain(applied.appliedValidId);
  expect(applied.returnedProfileIds).not.toContain(applied.tombstonedId);
  expect(applied.returnedActiveId).toBe(ids.existingId);
  expect(applied.returnedActiveLearnerId).toBe(ids.existingId);
  expect(applied.renderedText).not.toContain(applied.tombstonedName);
});

test('Phase 3.1 parent weekly and priority UI uses canonical LearningCore evidence', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore);
  await page.evaluate(() => {
    const c = window.BrainBiteCore;
    const profile = P();
    const skillId = 'math-4-fractions';
    const timestamp = Date.now();
    let learner = ensureProfileLearningCore(profile);
    learner = c.recordLearnerAttempt(learner, skillId, {
      id: 'phase31-parent-incorrect', correct: false, independent: false, assisted: false,
      hintsUsed: 0, responseTimeMs: 2200, at: timestamp,
    }, { id: skillId });
    learner.sessions = [{ id: 'phase31-parent-session', mission: 4, world: 'math', accuracy: 20, ts: timestamp }];
    learner.practice = [{ id: 'phase31-parent-practice', subject: 'math', topic: 'fractions', type: 'adaptive-practice', ts: timestamp }];
    profile.learningCore = learner;
    profile.skills[skillId] = { mastery: 99, streak: 9, lastSeen: timestamp, nextReview: timestamp + 7 * 24 * 60 * 60 * 1000 };
    profile.mastery.math = 99;
    renderParent();
  });
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await page.evaluate(() => renderParent());
  await expect(page.locator('#weeklySummary')).toContainText('Sessions this week: 1');
  await expect(page.locator('#weeklySummary')).toContainText('Practice items: 1');
  await expect(page.locator('#skillPriority')).toContainText('Fractions · mastery 0%');
  await expect(page.locator('#skillPriority')).not.toContainText('99%');
});

test('P1 parent Words mastery card projects canonical reading evidence', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore);
  const projection = await page.evaluate(() => {
    const c = window.BrainBiteCore;
    const profile = P();
    const skillId = 'reading-4-inference';
    const timestamp = Date.now();
    let learner = ensureProfileLearningCore(profile);
    learner = c.recordLearnerAttempt(learner, skillId, {
      id: 'p1-parent-reading-incorrect', correct: false, independent: true, assisted: false,
      hintsUsed: 0, responseTimeMs: 2200, at: timestamp,
    }, { id: skillId });
    profile.learningCore = learner;
    profile.mastery.words = 99;
    render();
    return {
      words: profile.mastery.words,
      reading: profile.learningCore.skills[skillId].masteryScore,
    };
  });

  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  expect(projection).toEqual({ words: 0, reading: 0 });
  await expect(page.locator('#parentWords')).toHaveText('0%');
  await expect(page.locator('#parentWords')).not.toHaveText('99%');
  await expect(page.locator('#skillPriority')).toContainText('Inference · mastery 0%');
  await expect(page.locator('#skillPriority')).not.toContainText('99%');
});

test('Phase 3.1 legacy profile skills, sessions, and practice import once across reloads', async ({ page }) => {
  const legacyTimestamp = Date.now() - 1000;
  await page.evaluate(timestamp => {
    const store = JSON.parse(localStorage.getItem('bb-core-v3'));
    const profile = store.profiles[0];
    delete profile.learningCore;
    profile.skills = {
      'math-4-fractions': { mastery: 64, streak: 4, lastSeen: timestamp, nextReview: timestamp + 60 * 60 * 1000 },
    };
    profile.sessions = [{ id: 'phase31-legacy-session', mission: 2, world: 'math', accuracy: 80, ts: timestamp }];
    profile.practice = [{ id: 'phase31-legacy-practice', subject: 'math', topic: 'fractions', type: 'mission', ts: timestamp }];
    localStorage.setItem('bb-core-v3', JSON.stringify(store));
  }, legacyTimestamp);
  await page.reload();
  await page.waitForFunction(() => {
    const store = JSON.parse(localStorage.getItem('bb-core-v3'));
    return !!store.profiles[0].learningCore?.legacyProjectionImportedAt;
  });
  const first = await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('bb-core-v3')).profiles[0];
    const learner = profile.learningCore;
    const skill = learner.skills['math-4-fractions'];
    return {
      imported: typeof learner.legacyProjectionImportedAt === 'number',
      skill: { masteryScore: skill.masteryScore, lastPracticedAt: skill.lastPracticedAt, nextReviewAt: skill.nextReviewAt, legacyImported: skill.legacyImported },
      sessions: learner.sessions.map(session => session.id),
      practice: learner.practice.map(item => item.id),
    };
  });
  await page.reload();
  await page.waitForFunction(() => {
    const store = JSON.parse(localStorage.getItem('bb-core-v3'));
    return !!store.profiles[0].learningCore?.legacyProjectionImportedAt;
  });
  const second = await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('bb-core-v3')).profiles[0];
    const learner = profile.learningCore;
    const skill = learner.skills['math-4-fractions'];
    return {
      imported: typeof learner.legacyProjectionImportedAt === 'number',
      skill: { masteryScore: skill.masteryScore, lastPracticedAt: skill.lastPracticedAt, nextReviewAt: skill.nextReviewAt, legacyImported: skill.legacyImported },
      sessions: learner.sessions.map(session => session.id),
      practice: learner.practice.map(item => item.id),
    };
  });
  expect(first).toEqual({
    imported: true,
    skill: { masteryScore: 64, lastPracticedAt: legacyTimestamp, nextReviewAt: legacyTimestamp + 60 * 60 * 1000, legacyImported: true },
    sessions: ['phase31-legacy-session'],
    practice: ['phase31-legacy-practice'],
  });
  expect(second).toEqual(first);
});

test('Phase 3.1 guided homework and independent curriculum practice record canonical evidence without rewards', async ({ page }) => {
  await page.waitForFunction(() => !!window.BrainBiteCore && !!window.BrainBiteGame);
  const before = await page.evaluate(() => {
    const profile = P();
    const progress = progression();
    return {
      completed: [...progress.completedMissionIds],
      unlocked: [...progress.unlockedMissionIds],
      lastMissionId: progress.lastMissionId,
      stars: profile.stars,
      spark: profile.spark,
    };
  });

  await page.getByRole('button', { name: 'Practice Lab', exact: true }).click();
  await page.locator('#practiceSubject').selectOption('reading');
  await page.locator('#practiceGrade').selectOption('4');
  await page.locator('#practiceTopic').fill('inference');
  await page.locator('#homeworkMode').check();
  await page.getByRole('button', { name: 'Build Practice', exact: true }).click();

  await expect(page.locator('#practiceResult')).toContainText('Homework plan ready for Inference (4)');
  await expect(page.locator('#guidedPractice')).toHaveText('Start guided homework');
  await expect(page.locator('#independentPractice')).toHaveText('Try independently');
  const practiceItem = await page.evaluate(() => P().learningCore.practice.at(-1));
  expect(practiceItem).toMatchObject({
    subject: 'reading',
    grade: '4',
    topic: 'inference',
    homework: true,
    type: 'homework',
    curriculumSkillId: 'reading-4-inference',
    validated: true,
    quarantined: false,
  });

  await page.locator('#guidedPractice').click();
  await expect(page.locator('#game.show')).toBeVisible();
  await expect(page.locator('#prompt')).toContainText('Lena zipped her coat');
  await expect(page.locator('#prompt')).toContainText('What can you infer about the weather?');
  await expect(page.locator('#prompt')).not.toContainText('BrainBite Lab simulation');
  await expect(page.locator('#feedback')).toContainText('Guided support is on.');
  await expect(page.locator('#feedback')).toContainText('Combine the clothing and breath clues.');

  const guided = await page.evaluate(() => {
    const game = window.BrainBiteGame.getState();
    const challenge = game.m.curriculumChallenge;
    const correct = challenge.platformOrder?.[0] ?? challenge.targetSequence?.[0] ?? challenge.answers?.[0];
    const offered = game.cells.some(cell => !cell.eaten && cell.correct && String(cell.value) === String(correct));
    const accepted = window.BrainBiteGame.tryAnswer(String(correct));
    const profile = P();
    const progress = progression();
    const skill = profile.learningCore.skills['reading-4-inference'];
    return {
      correct,
      offered,
      accepted,
      evidence: skill.evidence,
      attempt: skill.recentPerformance.at(-1),
      progression: {
        completed: [...progress.completedMissionIds],
        unlocked: [...progress.unlockedMissionIds],
        lastMissionId: progress.lastMissionId,
        stars: profile.stars,
        spark: profile.spark,
      },
    };
  });
  expect(guided.correct).toBe('It is cold outside.');
  expect(guided.offered).toBe(true);
  expect(guided.accepted).toBe(true);
  expect(guided.evidence).toMatchObject({ attempts: 1, assistedSuccesses: 1, independentSuccesses: 0 });
  expect(guided.attempt).toMatchObject({ correct: true, assisted: true, hintsUsed: 1, source: 'homework' });
  expect(guided.progression).toEqual(before);

  await page.waitForFunction(() => document.getElementById('home').classList.contains('show'));
  await page.getByRole('button', { name: 'Practice Lab', exact: true }).click();
  await page.getByRole('button', { name: 'Build Practice', exact: true }).click();
  await expect(page.locator('#independentPractice')).toBeVisible();
  await page.locator('#independentPractice').click();
  await expect(page.locator('#game.show')).toBeVisible();

  const independent = await page.evaluate(() => {
    const game = window.BrainBiteGame.getState();
    const challenge = game.m.curriculumChallenge;
    const correct = challenge.platformOrder?.[0] ?? challenge.targetSequence?.[0] ?? challenge.answers?.[0];
    const accepted = window.BrainBiteGame.tryAnswer(String(correct));
    const profile = P();
    const progress = progression();
    const skill = profile.learningCore.skills['reading-4-inference'];
    return {
      accepted,
      evidence: skill.evidence,
      attempts: skill.recentPerformance.slice(-2),
      progression: {
        completed: [...progress.completedMissionIds],
        unlocked: [...progress.unlockedMissionIds],
        lastMissionId: progress.lastMissionId,
        stars: profile.stars,
        spark: profile.spark,
      },
    };
  });
  expect(independent.accepted).toBe(true);
  expect(independent.evidence).toMatchObject({ attempts: 2, assistedSuccesses: 1, independentSuccesses: 1 });
  expect(independent.attempts).toMatchObject([
    { correct: true, assisted: true, source: 'homework' },
    { correct: true, assisted: false, source: 'adaptive-practice' },
  ]);
  expect(independent.progression).toEqual(before);

  await page.waitForFunction(() => document.getElementById('home').classList.contains('show'));
  const canonicalHomework = await page.evaluate(() => {
    const profile = P();
    const row = profile.learningCore.practice.find(item => item.curriculumSkillId === 'reading-4-inference' && item.homework);
    profile.practice = [];
    renderParent();
    return row;
  });
  expect(canonicalHomework).toMatchObject({ subject: 'reading', grade: '4', topic: 'inference', homework: true, validated: true });
  await page.getByRole('button', { name: 'Parents', exact: true }).click();
  await expect(page.locator('#homeworkSummary')).toContainText('reading grade 4 · inference · homework');
});

test('Phase 2.2 child play works before PIN setup and an expired limit blocks launch without mutation', async ({ page }) => {
  const ordinary = await page.evaluate(() => {
    localStorage.removeItem('bb-parent-auth-v1'); lockParentAccess();
    const started = window.BrainBiteGame.startMission(1), screen = document.querySelector('.screen.show')?.id;
    G = null; show('home'); return { started, screen };
  });
  expect(ordinary).toEqual({ started: true, screen: 'game' });
  await seedTimeUsage(page, { dailyActiveMs: 5 * 60_000 }, { dailyMinutes: 5, maxSessionMinutes: 5 });
  const blocked = await page.evaluate(() => {
    const profile = P(), before = { progression: structuredClone(profile.progression), stars: profile.stars, spark: profile.spark, sessions: profile.sessions.length, mistakes: profile.mistakes.length };
    const started = window.BrainBiteGame.startMission(1);
    return { started, screen: document.querySelector('.screen.show')?.id, before, after: { progression: structuredClone(profile.progression), stars: profile.stars, spark: profile.spark, sessions: profile.sessions.length, mistakes: profile.mistakes.length } };
  });
  expect(blocked).toMatchObject({ started: false, screen: 'timeup' });
  expect(blocked.after).toEqual(blocked.before);
});

test('Phase 2.2 session expiry stops safely and active checkpoints are capped', async ({ page }) => {
  const now = Date.now();
  await seedTimeUsage(page, { dailyActiveMs: 60_000, sessionId: 'phase22-expiry', sessionStartedAt: now - 60_000, sessionActiveMs: 5 * 60_000 - 10, lastTickAt: now, lastActivityAt: now }, { dailyMinutes: 30, maxSessionMinutes: 5 });
  const result = await page.evaluate(async () => {
    const profile = P(), before = { stars: profile.stars, spark: profile.spark, sessions: profile.sessions.length, mistakes: profile.mistakes.length, progression: structuredClone(profile.progression) };
    const started = window.BrainBiteGame.startMission(1); TIME_RUNTIME.lastTickAt = Date.now() - 60_000;
    const allowed = window.BrainBiteTimeUsage.checkpoint({ forceActive: true, reason: 'activity' }); await PERSISTENCE_CHAIN;
    return { started, allowed, timeExpired: G?.timeExpired, screen: document.querySelector('.screen.show')?.id, before, after: { stars: profile.stars, spark: profile.spark, sessions: profile.sessions.length, mistakes: profile.mistakes.length, progression: structuredClone(profile.progression) }, usage: window.BrainBiteTimeUsage.read() };
  });
  expect(result).toMatchObject({ started: true, allowed: false, timeExpired: true, screen: 'timeup' });
  expect(result.after).toEqual(result.before);
  expect(result.usage.sessionActiveMs).toBe(5 * 60_000 - 10 + 15_000);
});

test('Phase 2.2 visibility checkpoint records the active edge and excludes hidden time', async ({ page }) => {
  await seedTimeUsage(page);
  const usage = await page.evaluate(async () => {
    window.BrainBiteGame.startMission(1);
    let hidden = true;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => hidden ? 'hidden' : 'visible' });
    TIME_RUNTIME.lastTickAt = Date.now() - 5_000;
    document.dispatchEvent(new Event('visibilitychange'));
    const afterHide = window.BrainBiteTimeUsage.read().dailyActiveMs;
    TIME_RUNTIME.lastTickAt = Date.now() - 60_000;
    window.BrainBiteTimeUsage.checkpoint({ reason: 'interval' });
    const afterHiddenInterval = window.BrainBiteTimeUsage.read().dailyActiveMs;
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await PERSISTENCE_CHAIN;
    return { afterHide, afterHiddenInterval };
  });
  expect(usage.afterHide).toBeGreaterThanOrEqual(4_900);
  expect(usage.afterHide).toBeLessThanOrEqual(5_100);
  expect(usage.afterHiddenInterval).toBe(usage.afterHide);
});

test('Phase 2.2 reload continuity, inactivity rollover, and parent extension persist', async ({ page }) => {
  const now = Date.now();
  await seedTimeUsage(page, { dailyActiveMs: 100_000, sessionId: 'phase22-resume', sessionStartedAt: now - 120_000, sessionActiveMs: 40_000, lastTickAt: now, lastActivityAt: now - 1_000 });
  await page.evaluate(async () => { window.BrainBiteGame.startMission(1); await PERSISTENCE_CHAIN; });
  await page.reload();
  const resumed = await page.evaluate(async () => { window.BrainBiteGame.startMission(1); await PERSISTENCE_CHAIN; return window.BrainBiteTimeUsage.read(); });
  expect(resumed.sessionId).toBe('phase22-resume');
  await page.evaluate(async () => {
    G = null; TIME_RUNTIME = { profileId: null, sessionId: null, lastTickAt: 0 };
    queueTimeUsageMutation(P().id, (entry, now) => ({ ...entry, lastActivityAt: now - 15 * 60_000 - 1, updatedAt: now }));
    await PERSISTENCE_CHAIN;
  });
  await page.reload();
  const restarted = await page.evaluate(async () => { window.BrainBiteGame.startMission(1); await PERSISTENCE_CHAIN; return window.BrainBiteTimeUsage.read(); });
  expect(restarted.sessionId).not.toBe('phase22-resume'); expect(restarted.dailyActiveMs).toBeGreaterThanOrEqual(resumed.dailyActiveMs); expect(restarted.dailyActiveMs - resumed.dailyActiveMs).toBeLessThan(15_000);

  await seedTimeUsage(page, { dailyActiveMs: 5 * 60_000 }, { dailyMinutes: 5, maxSessionMinutes: 5 });
  await page.evaluate(async () => { const verified = await verifyParentPin('654321'); if (!verified.ok) throw new Error('Expected existing parent PIN'); unlockParentAccess(); window.BrainBiteGame.startMission(1); });
  await page.locator('#timeUpParentOverride').click();
  await expect(page.locator('#timeup.show')).toBeVisible();
  await expect(page.locator('#timeUpStatus')).toContainText('Incorrect PIN');
  expect((await page.evaluate(() => window.BrainBiteTimeUsage.read())).extensionGrantedMs).toBe(0);
  await page.locator('#timeUpParentPin').fill('654321'); await page.locator('#timeUpParentOverride').click();
  await expect(page.locator('#game.show')).toBeVisible();
  const extended = await page.evaluate(async () => { TIME_RUNTIME.lastTickAt = Date.now() - 15_000; window.BrainBiteTimeUsage.checkpoint({ forceActive: true, reason: 'activity' }); await PERSISTENCE_CHAIN; return window.BrainBiteTimeUsage.read(); });
  expect(extended.extensionGrantedMs).toBe(15 * 60_000); expect(extended.extensionActiveMs).toBeGreaterThanOrEqual(14_900);
  await page.reload(); const reloadedExtension = await page.evaluate(() => window.BrainBiteTimeUsage.read()); expect(reloadedExtension.extensionActiveMs).toBeGreaterThanOrEqual(extended.extensionActiveMs); expect(reloadedExtension.extensionActiveMs - extended.extensionActiveMs).toBeLessThan(15_000);
});

test('Phase 2.2 storage recovery and backward clocks cannot reduce usage or enter exports', async ({ page }) => {
  const now = Date.now(), future = now + 24 * 60 * 60_000;
  const futureDate = new Date(future), futureDay = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
  await seedTimeUsage(page, { dayKey: futureDay, dailyActiveMs: 123_000, sessionId: 'phase22-clock', sessionStartedAt: future - 60_000, sessionActiveMs: 50_000, lastTickAt: future, lastActivityAt: future, lastSeenWallClock: future, updatedAt: future });
  await page.evaluate(() => localStorage.setItem('bb-time-usage-v1', '{corrupt')); await page.reload();
  expect((await page.evaluate(() => window.BrainBiteTimeUsage.read())).dailyActiveMs).toBe(123_000);
  const protectedUsage = await page.evaluate(async () => {
    const before = window.BrainBiteTimeUsage.read(), replacement = structuredClone(STORE); replacement.profiles[replacement.active].score = 999;
    await replaceCanonicalState(replacement, { renderAfter: false }); window.BrainBiteGame.startMission(1); await PERSISTENCE_CHAIN;
    return { before, after: window.BrainBiteTimeUsage.read(), exported: JSON.stringify(exportEnvelope()).includes('bb-time-usage-v1') };
  });
  expect(protectedUsage.after.dailyActiveMs).toBeGreaterThanOrEqual(protectedUsage.before.dailyActiveMs); expect(protectedUsage.after.dayKey).toBe(futureDay); expect(protectedUsage.after.sessionId).toBe('phase22-clock'); expect(protectedUsage.exported).toBe(false);
  await page.evaluate(async () => { P().controls = { ...P().controls, dailyMinutes: 5, maxSessionMinutes: 5 }; P().sessions = [{ mission: 1, ts: Date.now(), durationSec: 300 }]; G = null; await save(); await PERSISTENCE_CHAIN; localStorage.setItem('bb-time-usage-v1', '{bad'); localStorage.setItem('bb-time-usage-v1-backup', '{bad'); });
  await page.reload();
  const reconstructed = await page.evaluate(() => { const before = { progression: structuredClone(P().progression), stars: P().stars, mistakes: P().mistakes.length }; const started = window.BrainBiteGame.startMission(1); return { usage: window.BrainBiteTimeUsage.read(), warning: TIME_USAGE_WARNING, started, screen: document.querySelector('.screen.show')?.id, before, after: { progression: structuredClone(P().progression), stars: P().stars, mistakes: P().mistakes.length } }; });
  expect(reconstructed.usage.dailyActiveMs).toBeGreaterThanOrEqual(300_000); expect(reconstructed.usage.recoveryBaselineMs).toBe(300_000); expect(reconstructed.warning).toContain('rebuilt from completed sessions'); expect(reconstructed).toMatchObject({ started: false, screen: 'timeup' }); expect(reconstructed.after).toEqual(reconstructed.before);
});

test('Phase 2.2 a newer valid backup cannot be reduced by a stale primary', async ({ page }) => {
  await seedTimeUsage(page, { dailyActiveMs: 0 }, { dailyMinutes: 5, maxSessionMinutes: 5 });
  await page.evaluate(() => {
    const primary = JSON.parse(localStorage.getItem('bb-time-usage-v1')), backup = structuredClone(primary), entry = backup.profiles[P().id];
    entry.dailyActiveMs = 5 * 60_000; entry.updatedAt += 1_000; entry.lastSeenWallClock += 1_000; backup.updatedAt += 1_000;
    localStorage.setItem('bb-time-usage-v1', JSON.stringify(primary)); localStorage.setItem('bb-time-usage-v1-backup', JSON.stringify(backup));
  });
  await page.reload();
  const result = await page.evaluate(() => ({ usage: window.BrainBiteTimeUsage.read(), started: window.BrainBiteGame.startMission(1), screen: document.querySelector('.screen.show')?.id }));
  expect(result.usage.dailyActiveMs).toBe(5 * 60_000); expect(result).toMatchObject({ started: false, screen: 'timeup' });
});

test('Phase 2.2 profile ledgers stay isolated and controls correct session limits', async ({ page }) => {
  await seedTimeUsage(page, { dailyActiveMs: 45_000 });
  const isolation = await page.evaluate(async () => {
    const firstId = P().id; STORE.profiles.push(blank('Second Kid')); STORE.active = 1; await save(); window.BrainBiteGame.startMission(1); TIME_RUNTIME.lastTickAt = Date.now() - 1_000;
    window.BrainBiteTimeUsage.checkpoint({ forceActive: true, reason: 'activity' }); await PERSISTENCE_CHAIN; const secondId = P().id;
    return { first: window.BrainBiteTimeUsage.read(firstId), second: window.BrainBiteTimeUsage.read(secondId) };
  });
  expect(isolation.first.dailyActiveMs).toBe(45_000); expect(isolation.second.dailyActiveMs).toBeGreaterThanOrEqual(900); expect(isolation.second.profileId).not.toBe(isolation.first.profileId);
  await page.evaluate(() => { G = null; show('home'); }); await unlockParent(page); await page.locator('#parentShellNav button[data-screen="controls"]').click();
  await page.locator('#dailyMinutes').fill('10'); await page.locator('#maxSessionMinutes').fill('120'); await page.locator('#saveControls').click();
  await expect(page.locator('#maxSessionMinutes')).toHaveValue('10'); await expect(page.locator('#controlsStatus')).toContainText('corrected to 10 minutes');
});

test('Phase 2.2 fallback lock keeps concurrent tab checkpoints additive', async ({ page, context }) => {
  await seedTimeUsage(page, { dailyActiveMs: 1_000 });
  const second = await context.newPage();
  await second.goto('/?match=0&webgl=0');
  await Promise.all([page, second].map(tab => tab.evaluate(() => { Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }); Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: undefined }); })));
  const starts = await Promise.all([
    page.evaluate(() => ({ id: P().id, started: window.BrainBiteGame.startMission(1), locks: !!navigator.locks })),
    second.evaluate(() => ({ id: P().id, started: window.BrainBiteGame.startMission(1), locks: !!navigator.locks })),
  ]);
  await Promise.all([
    page.evaluate(async () => { TIME_RUNTIME.lastTickAt = Date.now() - 15_000; window.BrainBiteTimeUsage.checkpoint({ forceActive: true, reason: 'activity' }); const immediate = window.BrainBiteTimeUsage.read(); await PERSISTENCE_CHAIN; return { immediate, persisted: JSON.parse(localStorage.getItem('bb-time-usage-v1')).profiles[P().id] }; }),
    second.evaluate(async () => { TIME_RUNTIME.lastTickAt = Date.now() - 15_000; window.BrainBiteTimeUsage.checkpoint({ forceActive: true, reason: 'activity' }); const immediate = window.BrainBiteTimeUsage.read(); await PERSISTENCE_CHAIN; return { immediate, persisted: JSON.parse(localStorage.getItem('bb-time-usage-v1')).profiles[P().id] }; }),
  ]);
  expect(starts[0]).toMatchObject({ started: true, locks: false }); expect(starts[1]).toMatchObject({ id: starts[0].id, started: true, locks: false });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('bb-time-usage-v1')).profiles[P().id].dailyActiveMs)).toBeGreaterThanOrEqual(31_000);
  await second.close();
});

test('Phase 2.2 simultaneous page exits reconcile additively exactly once', async ({ page, context }) => {
  await seedTimeUsage(page, { dailyActiveMs: 1_000 });
  const second = await context.newPage(); await second.goto('/?match=0&webgl=0');
  await Promise.all([page, second].map(tab => tab.evaluate(() => window.BrainBiteGame.startMission(1))));
  await Promise.all([page, second].map(tab => tab.evaluate(() => { TIME_RUNTIME.lastTickAt = Date.now() - 15_000; window.dispatchEvent(new PageTransitionEvent('pagehide')); })));
  const first = await page.evaluate(async () => { G = null; queueTimeUsageMutation(P().id, entry => entry); await PERSISTENCE_CHAIN; return JSON.parse(localStorage.getItem('bb-time-usage-v1')).profiles[P().id].dailyActiveMs; });
  expect(first).toBeGreaterThanOrEqual(31_000);
  const replay = await page.evaluate(async () => { queueTimeUsageMutation(P().id, entry => entry); await PERSISTENCE_CHAIN; return { daily: JSON.parse(localStorage.getItem('bb-time-usage-v1')).profiles[P().id].dailyActiveMs, pending: Object.keys(localStorage).filter(key => key.startsWith('bb-time-usage-v1-exit:')).length }; });
  expect(replay).toEqual({ daily: first, pending: 0 });
  await second.close();
});

test('Phase 2.2 hidden then pagehide preserves the active edge while the persistence lock is held', async ({ page, context }) => {
  await seedTimeUsage(page, { dailyActiveMs: 1_000 });
  const blocker = await context.newPage(); await blocker.goto('/?match=0&webgl=0'); await blocker.evaluate(() => PERSISTENCE_CHAIN);
  await blocker.evaluate(() => {
    globalThis.__phase22LockHeld = false; globalThis.__phase22LockDone = false;
    globalThis.__phase22ReleaseLock = null;
    void navigator.locks.request('brainbite:canonical-local-state:v1', { mode: 'exclusive' }, async () => {
      globalThis.__phase22LockHeld = true;
      await new Promise(resolve => { globalThis.__phase22ReleaseLock = resolve; });
    }).then(() => { globalThis.__phase22LockDone = true; });
  });
  await blocker.waitForFunction(() => globalThis.__phase22LockHeld === true);
  await page.evaluate(() => {
    window.BrainBiteGame.startMission(1);
    TIME_RUNTIME.lastTickAt = Date.now() - 15_000;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  await page.close();
  await blocker.evaluate(() => globalThis.__phase22ReleaseLock());
  await blocker.waitForFunction(() => globalThis.__phase22LockDone === true);
  const first = await blocker.evaluate(async () => { queueTimeUsageMutation(P().id, entry => entry); await PERSISTENCE_CHAIN; return JSON.parse(localStorage.getItem('bb-time-usage-v1')).profiles[P().id].dailyActiveMs; });
  expect(first).toBeGreaterThanOrEqual(16_000);
  const replay = await blocker.evaluate(async () => { queueTimeUsageMutation(P().id, entry => entry); await PERSISTENCE_CHAIN; return { daily: JSON.parse(localStorage.getItem('bb-time-usage-v1')).profiles[P().id].dailyActiveMs, pending: Object.keys(localStorage).filter(key => key.startsWith('bb-time-usage-v1-exit:')).length }; });
  expect(replay).toEqual({ daily: first, pending: 0 });
  await blocker.close();
});

test('Phase 2.3 profile deletion cancels safely, checks name and fresh PIN, then preserves profile isolation', async ({ page }) => {
  await page.evaluate(async () => { STORE.profiles.push(blank('Second Kid')); STORE.active = STORE.profiles.length - 1; await save(); });
  await parentDestination(page, 'Profiles');
  const before = await page.evaluate(() => ({ profiles: STORE.profiles.map(profile => profile.id), tombstones: STORE.deletedProfiles.length }));

  await page.getByRole('button', { name: 'Delete Active Profile' }).click();
  await page.locator('#sensitiveActionCancel').click();
  expect(await page.evaluate(() => ({ profiles: STORE.profiles.map(profile => profile.id), tombstones: STORE.deletedProfiles.length }))).toEqual(before);

  await page.getByRole('button', { name: 'Delete Active Profile' }).click();
  await page.locator('#sensitiveActionConfirmation').fill('second kid');
  await page.locator('#sensitiveActionPin').fill('654321');
  await page.locator('#sensitiveActionConfirm').click();
  await expect(page.locator('#sensitiveActionStatus')).toContainText('Type Second Kid exactly');
  expect(await page.evaluate(() => readParentAuth().failedAttempts)).toBe(0);
  expect(await page.evaluate(() => STORE.profiles.length)).toBe(2);

  await page.locator('#sensitiveActionConfirmation').fill('Second Kid');
  await page.locator('#sensitiveActionPin').fill('000000');
  await page.locator('#sensitiveActionConfirm').click();
  await expect(page.locator('#sensitiveActionStatus')).toContainText('Incorrect PIN');
  expect(await page.evaluate(() => STORE.profiles.length)).toBe(2);
  await page.locator('#sensitiveActionPin').fill('654321');
  await page.locator('#sensitiveActionConfirm').click();
  await expect(page.locator('#sensitiveActionBackdrop')).toBeHidden();
  await page.evaluate(() => PERSISTENCE_CHAIN);
  const after = await page.evaluate(() => ({ names: STORE.profiles.map(profile => profile.name), tombstones: STORE.deletedProfiles.map(item => item.id), queueTypes: SYNC.queue.map(item => item.type) }));
  expect(after.names).toEqual(['Kid 1']);
  expect(after.tombstones).toHaveLength(1);
  expect(after.queueTypes).toContain('profile-delete');
});

test('Phase 2.3 fresh destructive step-up shares the persisted five-attempt lockout', async ({ page }) => {
  await page.evaluate(async () => { STORE.profiles.push(blank('Locked Kid')); STORE.active = STORE.profiles.length - 1; await save(); });
  await parentDestination(page, 'Profiles');
  await page.getByRole('button', { name: 'Delete Active Profile' }).click();
  await page.locator('#sensitiveActionConfirmation').fill('Locked Kid');
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.locator('#sensitiveActionPin').fill('000000');
    await page.locator('#sensitiveActionConfirm').click();
  }
  await expect(page.locator('#sensitiveActionStatus')).toContainText('Too many attempts');
  await page.locator('#sensitiveActionPin').fill('654321');
  await page.locator('#sensitiveActionConfirm').click();
  await expect(page.locator('#sensitiveActionStatus')).toContainText('Too many attempts');
  expect(await page.evaluate(() => ({ count: STORE.profiles.length, locked: readParentAuth().lockedUntil > Date.now() }))).toEqual({ count: 2, locked: true });
  await page.locator('#sensitiveActionCancel').click();
});

test('Phase 2.3 dialog traps focus, cancels with Escape, clears secrets, and restores its invoker', async ({ page }) => {
  await parentDestination(page, 'Recovery');
  await page.getByRole('button', { name: 'Create Backup' }).click();
  const invoker = page.getByRole('button', { name: 'Restore Backup' });
  await invoker.focus(); await invoker.click();
  await expect(page.locator('#sensitiveActionDialog')).toHaveAttribute('role', 'dialog');
  await expect(page.locator('#sensitiveActionDialog')).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#sensitiveActionPin')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#sensitiveActionConfirm')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#sensitiveActionPin')).toBeFocused();
  await page.locator('#sensitiveActionPin').fill('654321');
  await page.keyboard.press('Escape');
  await expect(page.locator('#sensitiveActionBackdrop')).toBeHidden();
  await expect(invoker).toBeFocused();
  expect(await page.locator('#sensitiveActionPin').inputValue()).toBe('');
});

test('Phase 2.3 announces PBKDF2 verification and cannot mutate while fresh PIN approval is busy', async ({ page }) => {
  await page.evaluate(async () => {
    STORE.profiles.push(blank('Busy Kid')); STORE.active = STORE.profiles.length - 1; await save();
    globalThis.__phase23DeriveBits = SubtleCrypto.prototype.deriveBits;
    SubtleCrypto.prototype.deriveBits = async function delayedDeriveBits(...args) { await new Promise(resolve => setTimeout(resolve, 800)); return globalThis.__phase23DeriveBits.apply(this, args); };
  });
  await parentDestination(page, 'Profiles');
  await page.getByRole('button', { name: 'Delete Active Profile' }).click();
  await page.locator('#sensitiveActionConfirmation').fill('Busy Kid'); await page.locator('#sensitiveActionPin').fill('654321');
  await page.locator('#sensitiveActionConfirm').click();
  await expect(page.locator('#sensitiveActionStatus')).toHaveText('Verifying parent PIN…');
  await expect(page.locator('#sensitiveActionDialog')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#sensitiveActionCancel')).toBeDisabled(); await expect(page.locator('#sensitiveActionConfirm')).toBeDisabled();
  expect(await page.evaluate(() => STORE.profiles.map(profile => profile.name))).toContain('Busy Kid');
  await expect(page.locator('#sensitiveActionBackdrop')).toBeHidden({ timeout: 15_000 });
  await page.evaluate(() => { SubtleCrypto.prototype.deriveBits = globalThis.__phase23DeriveBits; });
  expect(await page.evaluate(() => STORE.profiles.map(profile => profile.name))).not.toContain('Busy Kid');
});

test('Phase 2.3 restore keeps a distinct rollback snapshot and a failed replacement preserves current state', async ({ page }) => {
  await page.evaluate(async () => {
    P().name = 'Current Kid'; await save();
    const backup = structuredClone(STORE); backup.profiles[backup.active].name = 'Backup Kid';
    localStorage.setItem(BACK, JSON.stringify(backup));
  });
  await parentDestination(page, 'Recovery');
  await page.getByRole('button', { name: 'Restore Backup' }).click(); await approveSensitiveAction(page);
  await expect(page.locator('#profileName')).toHaveText('Backup Kid');
  const successful = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3-pre-operation-rollback')));
  expect(successful).toMatchObject({ version: 1, operation: 'restore' });
  expect(successful.store.profiles[successful.store.active].name).toBe('Current Kid');

  await page.evaluate(async () => {
    P().name = 'Current Failure Kid'; await save();
    const backup = structuredClone(STORE); backup.profiles[backup.active].name = 'Should Not Replace';
    localStorage.setItem(BACK, JSON.stringify(backup));
    globalThis.__phase23OriginalCopies = Object.fromEntries([KEY, BACK, RECOVERY_KEY, SYNC_KEY].map(key => [key, localStorage.getItem(key)]));
    globalThis.__phase23SetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function phase23Quota(key, value) { if (key === KEY) throw new DOMException('quota', 'QuotaExceededError'); return globalThis.__phase23SetItem.call(this, key, value); };
  });
  await page.getByRole('button', { name: 'Restore Backup' }).click(); await approveSensitiveAction(page);
  await expect(page.locator('#saveHealth')).toContainText('Restore failed; current progress was kept');
  const failed = await page.evaluate(() => {
    Storage.prototype.setItem = globalThis.__phase23SetItem;
    const copies = Object.fromEntries([KEY, BACK, RECOVERY_KEY, SYNC_KEY].map(key => [key, localStorage.getItem(key)]));
    const rollback = JSON.parse(localStorage.getItem(PRE_OPERATION_ROLLBACK_KEY));
    return { memory: P().name, primary: JSON.parse(localStorage.getItem(KEY)).profiles[STORE.active].name, backup: JSON.parse(localStorage.getItem(BACK)).profiles[STORE.active].name, copiesMatch: JSON.stringify(copies) === JSON.stringify(globalThis.__phase23OriginalCopies), rollbackName: rollback.store.profiles[rollback.store.active].name };
  });
  expect(failed).toEqual({ memory: 'Current Failure Kid', primary: 'Current Failure Kid', backup: 'Should Not Replace', copiesMatch: true, rollbackName: 'Current Failure Kid' });
});

test('Phase 2.3 import rejects invalid identities before rollback mutation and supports valid modern and legacy stores', async ({ page }) => {
  await page.evaluate(async () => { P().name = 'Before Import'; await save(); });
  await parentDestination(page, 'Recovery');
  const before = await page.evaluate(() => ({ store: structuredClone(STORE), copies: Object.fromEntries([KEY, BACK, RECOVERY_KEY, PRE_OPERATION_ROLLBACK_KEY, SYNC_KEY].map(key => [key, localStorage.getItem(key)])), sync: structuredClone(SYNC) }));
  const invalidImports = [
    ['duplicate.json', { schemaVersion: 9, active: 0, profiles: [{ id: 'duplicate-profile-id', name: 'Injected A' }, { id: 'duplicate-profile-id', name: 'Injected B' }] }, 'duplicate profile IDs'],
    ['missing.json', { schemaVersion: 9, active: 0, profiles: [{ name: 'Missing identity' }] }, 'missing profile ID'],
    ['unsafe.json', { schemaVersion: 9, active: 0, profiles: [{ id: '../profile', name: 'Unsafe identity' }] }, 'unsafe profile ID'],
    ['deleted.json', { schemaVersion: 9, active: 0, deletedProfiles: [{ id: 'deleted-profile-id', deletedAt: 1 }], profiles: [{ id: 'deleted-profile-id', name: 'Resurrected' }] }, 'reuses a deleted profile ID'],
    ['active.json', { schemaVersion: 9, active: 4, profiles: [{ id: 'profile-one', name: 'Bad active' }] }, 'invalid active profile index'],
  ];
  for (const [name, value, message] of invalidImports) {
    await page.locator('#importFile').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
    await expect(page.locator('#saveHealth')).toContainText(message);
    await expect(page.locator('#sensitiveActionBackdrop')).toBeHidden();
    expect(await page.locator('#importFile').inputValue()).toBe('');
    expect(await page.evaluate(() => ({ store: structuredClone(STORE), copies: Object.fromEntries([KEY, BACK, RECOVERY_KEY, PRE_OPERATION_ROLLBACK_KEY, SYNC_KEY].map(key => [key, localStorage.getItem(key)])), sync: structuredClone(SYNC) }))).toEqual(before);
  }

  const valid = await page.evaluate(() => { const replacement = structuredClone(STORE), second = blank('Imported Two'); replacement.profiles[0].name = 'Imported One'; replacement.profiles.push(second); replacement.active = 1; return JSON.stringify(replacement); });
  await page.locator('#importFile').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(valid) });
  await approveSensitiveAction(page);
  await expect(page.locator('#profileName')).toHaveText('Imported Two');
  expect(await page.evaluate(() => STORE.profiles.map(profile => profile.name))).toEqual(['Imported One', 'Imported Two']);
  const rollback = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3-pre-operation-rollback')));
  expect(rollback.operation).toBe('import'); expect(rollback.store.profiles[rollback.store.active].name).toBe('Before Import');

  const legacy = JSON.stringify({ schemaVersion: 7, active: 0, profiles: [{ name: 'Legacy Import', completed: [1], mastery: { math: 20 } }] });
  await parentDestination(page, 'Recovery');
  await page.locator('#importFile').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(legacy) }); await approveSensitiveAction(page);
  const migratedLegacy = await page.evaluate(() => ({ name: P().name, id: P().id, schemaVersion: STORE.schemaVersion, completed: progression().completedMissionIds }));
  expect(migratedLegacy.name).toBe('Legacy Import'); expect(migratedLegacy.id).toMatch(/^legacy-/); expect(migratedLegacy.schemaVersion).toBe(9); expect(migratedLegacy.completed).toContain(1);
});

test('Phase 2.3 production excludes debug controls and locked parent tools cannot be opened directly', async ({ page }) => {
  await page.goto('/?match=0&webgl=0&release=1&lab=1&contentMode=internal-review');
  for (const id of ['simulateSync','testConflictMerge','clearSyncQueue','runSelfCheck','runLaunchCheck','labSimulateSync','labTestConflictMerge','labDiscardSyncQueue']) await expect(page.locator(`#${id}`)).toHaveCount(0);
  const screen = await page.evaluate(() => { lockParentAccess(); show('recovery'); return document.querySelector('.screen.show')?.id; });
  expect(screen).toBe('parent');
  await page.locator('#restoreBtn').dispatchEvent('click');
  await expect(page.locator('#sensitiveActionBackdrop')).toBeHidden();
});

test('Phase 2.3 Lab queue discard requires exact confirmation and a fresh PIN', async ({ page }) => {
  test.setTimeout(120_000);
  await page.evaluate(() => { queueSyncEvent({ type: 'store-update', profileId: P().id, payload: { phase: 23 }, schemaVersion: STORE.schemaVersion }); render(); });
  await openLab(page);
  await page.locator('#labDiscardSyncQueue').click();
  await page.locator('#sensitiveActionCancel').click();
  expect(await page.evaluate(() => SYNC.queue.length)).toBeGreaterThan(0);
  await page.locator('#labDiscardSyncQueue').click();
  await page.locator('#sensitiveActionConfirmation').fill('discard'); await page.locator('#sensitiveActionPin').fill('654321'); await page.locator('#sensitiveActionConfirm').click();
  await expect(page.locator('#sensitiveActionStatus')).toContainText('Type DISCARD exactly');
  await page.locator('#sensitiveActionConfirmation').fill('DISCARD'); await page.locator('#sensitiveActionConfirm').click();
  await expect(page.locator('#sensitiveActionBackdrop')).toBeHidden({ timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => SYNC.queue.length)).toBe(0);
  for (let iteration = 0; iteration < 20; iteration++) {
    await page.evaluate(index => { queueSyncEvent({ type: 'store-update', profileId: P().id, payload: { phase: 23, index }, schemaVersion: STORE.schemaVersion }); renderSync(); }, iteration);
    await page.locator('#labDiscardSyncQueue').click(); await page.locator('#sensitiveActionConfirmation').fill('DISCARD'); await page.locator('#sensitiveActionPin').fill('654321'); await page.locator('#sensitiveActionConfirm').click();
    await expect(page.locator('#sensitiveActionBackdrop')).toBeHidden({ timeout: 15_000 }); await expect.poll(() => page.evaluate(() => SYNC.queue.length)).toBe(0);
  }
});

test('Phase 2.3 cloud deletion reports a partial remote outcome and defers local cleanup until retry succeeds', async ({ page }) => {
  await page.evaluate(() => {
    INTEGRATIONS.cloud = { provider: 'firebase', url: 'phase23-project', key: 'x'.repeat(24) };
    localStorage.setItem('bb-firebase-session', JSON.stringify({ idToken: 'token', refreshToken: 'refresh', localId: 'family-phase23', email: 'parent@example.com' }));
    queueSyncEvent({ type: 'store-update', profileId: P().id, payload: { phase: 23 }, schemaVersion: STORE.schemaVersion });
    BrainBiteFirebaseREST.prototype.deleteFamily = async () => ({ profilesDeleted: 1 });
    BrainBiteFirebaseREST.prototype.deleteAuthAccount = async () => { throw new Error('AUTH_DELETE_RETRY'); };
    render();
  });
  await parentDestination(page, 'Account & Sync');
  await page.getByRole('button', { name: 'Delete Cloud Data & Account' }).click(); await approveSensitiveAction(page);
  await expect(page.locator('#mergeResult')).toContainText('family data was deleted, but Firebase account deletion failed');
  const partial = await page.evaluate(() => ({ queue: SYNC.queue.length, session: !!localStorage.getItem('bb-firebase-session') }));
  expect(partial.queue).toBeGreaterThan(0); expect(partial.session).toBe(true);

  await page.evaluate(() => { BrainBiteFirebaseREST.prototype.deleteAuthAccount = async function phase23DeleteAccount() { this.saveSession(null); return true; }; });
  await page.getByRole('button', { name: 'Delete Cloud Data & Account' }).click(); await approveSensitiveAction(page);
  await expect(page.locator('#mergeResult')).toContainText('Cloud family data and Firebase account were deleted');
  expect(await page.evaluate(() => ({ queue: SYNC.queue.length, session: localStorage.getItem('bb-firebase-session') }))).toEqual({ queue: 0, session: null });
});
