import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('boots without runtime errors and exposes the complete product surface', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'BrainBite' })).toBeVisible();
  for (const name of ['Number Nebula','Wordwood','Spanish Portal','Parent','Practice Lab','Snap-to-Game','My Bites','Profiles','Recovery','Account & Sync','BrainBite Lab','Settings']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('home dashboard exposes the screenshot-style news card and dock', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'NEWS & EVENTS' })).toBeVisible();
  await expect(page.getByText('DOUBLE BRAINBITES WEEKEND!')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Profile', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Friends', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Collection', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Badges', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leaderboards', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: "SEE WHAT'S NEW", exact: true })).toBeVisible();
});

test('launch policy pages are linked and clearly labeled', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'privacy.html');
  await expect(page.getByRole('link', { name: 'Support' })).toHaveAttribute('href', 'support.html');
  await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', 'terms.html');

  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page.getByRole('heading', { name: 'BrainBite Privacy Policy' })).toBeVisible();
  await expect(page.getByText('Legal review required before launch')).toBeVisible();

  await page.goto('/');
  await page.getByRole('link', { name: 'Support' }).click();
  await expect(page.getByRole('heading', { name: 'BrainBite Support' })).toBeVisible();
  await expect(page.getByText('Production contact required before launch')).toBeVisible();

  await page.goto('/');
  await page.getByRole('link', { name: 'Terms' }).click();
  await expect(page.getByRole('heading', { name: 'BrainBite Terms of Use' })).toBeVisible();
  await expect(page.getByText('Terms review required before launch')).toBeVisible();
});

test('all 30 missions and all 3 bosses launch and complete through progression', async ({ page }) => {
  for (const [world, first, last] of [['Number Nebula',1,10],['Wordwood',11,20],['Spanish Portal',21,30]]) {
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
  expect(state.profiles[0].completed).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
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

test('profiles are isolated and settings, practice, Snap review, and recovery persist', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.locator('#largeTargets').check();
  await page.locator('#reducedMotion').check();
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('#largeTargets')).toBeChecked();
  await expect(page.locator('#reducedMotion')).toBeChecked();

  await page.getByRole('button', { name: 'Practice Lab' }).click();
  await page.locator('#practiceTopic').fill('fractions');
  await page.getByRole('button', { name: 'Build Practice' }).click();
  await expect(page.locator('#practiceResult')).toContainText('Fractions');

  await page.getByRole('button', { name: 'Snap-to-Game' }).click();
  await page.locator('#ocrText').fill('7×4=28\n7×5=35');
  await page.getByRole('button', { name: 'Parse Reviewed Text' }).click();
  await expect(page.locator('#parseResult')).toContainText('2 equation');
  await page.locator('#snapTopic').fill('multiplication by 7');
  await page.locator('#snapWrong').fill('27, 34');
  await page.getByRole('button', { name: 'Validate & Save Practice' }).click();
  await expect(page.locator('#snapResult')).toContainText('Validated and saved');

  await page.getByRole('button', { name: 'Profiles' }).click();
  await page.locator('#newProfile').fill('Second Kid');
  await page.getByRole('button', { name: 'Add Profile' }).click();
  await expect(page.locator('#profileName')).toHaveText('Second Kid');
  page.on('dialog', async dialog => { await dialog.accept(); });
  await page.getByRole('button', { name: 'Delete Active Profile' }).click();
  await expect(page.locator('#profileList')).not.toContainText('Second Kid');
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  const sync = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v6-sync')));
  expect(state.profiles[0].practice).toHaveLength(1);
  expect(state.profiles[0].snap).toHaveLength(1);
  expect(state.profiles).toHaveLength(1);
  expect(sync.queue.some(evt => evt.type === 'store-update' && evt.profileId && evt.schemaVersion === 7)).toBe(true);

  await page.getByRole('button', { name: 'Recovery' }).click();
  await page.getByRole('button', { name: 'Create Backup' }).click();
  await expect(page.locator('#saveHealth')).toContainText('available');
});

test('curriculum homework mode feeds parent intelligence without disturbing mission practice', async ({ page }) => {
  await page.getByRole('button', { name: 'Practice Lab' }).click();
  await page.locator('#practiceSubject').selectOption('reading');
  await page.locator('#practiceGrade').selectOption('4');
  await page.locator('#practiceTopic').fill('inference');
  await page.locator('#homeworkMode').check();
  await page.getByRole('button', { name: 'Build Practice' }).click();
  await expect(page.locator('#practiceResult')).toContainText('Homework plan ready');
  await page.getByRole('button', { name: 'Parent', exact: true }).click();
  await expect(page.locator('#weeklySummary')).toContainText('Practice items');
  await expect(page.locator('#homeworkSummary')).toContainText('reading');
});

test('BrainBite Lab simulates learner mastery, offline replay, isolation, and recovery', async ({ page }) => {
  await page.getByRole('button', { name: 'BrainBite Lab', exact: true }).click();
  await page.locator('#labLearnerName').fill('Lab Kid');
  await page.getByRole('button', { name: 'Create Learner', exact: true }).click();
  await page.locator('#labSkill').selectOption('fraction-meaning');
  await page.locator('#labSkillPreset').selectOption('developing');
  await page.getByRole('button', { name: 'Sim Correct', exact: true }).click();
  await expect(page.locator('#labMastery')).toContainText('fraction-meaning');
  const labKidId = await page.locator('#labLearnerSelect').inputValue();
  await page.getByRole('button', { name: 'Queue Offline Event', exact: true }).click();
  await page.getByRole('button', { name: 'Queue Offline Event', exact: true }).click();
  await expect(page.locator('#labQueue')).toContainText('Offline queue: 1');
  await page.getByRole('button', { name: 'Replay Offline Queue', exact: true }).click();
  await expect(page.locator('#labQueue')).toContainText('Offline queue: 0');
  await page.getByRole('button', { name: 'Upgrade BrainBase', exact: true }).click();
  await page.getByRole('button', { name: 'Refresh BrainBase', exact: true }).click();
  await expect(page.locator('#brainbase-root')).toContainText('Kraken Brainifact installed');
  await page.getByRole('button', { name: 'Save Recovery Snapshot', exact: true }).click();
  await page.getByRole('button', { name: 'Corrupt Test Save', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'BrainBite Lab', exact: true }).click();
  await expect(page.locator('#labContentCheck')).toContainText('valid');
  await page.locator('#labLearnerName').fill('Other Kid');
  await page.getByRole('button', { name: 'Create Learner', exact: true }).click();
  await expect(page.locator('#labMastery')).toContainText('Unknown');
  await page.locator('#labLearnerSelect').selectOption(labKidId);
  await page.getByRole('button', { name: 'Switch Learner', exact: true }).click();
  await expect(page.locator('#labMastery')).toContainText('fraction-meaning');
  await page.getByRole('button', { name: 'Restore Recovery', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'BrainBite Lab', exact: true }).click();
  await expect(page.locator('#labInspect')).toContainText('Lab Kid');
});

test('corrupt and legacy saves recover and migrate safely', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('bb-core-v3', '{broken'));
  await page.reload();
  await expect(page.locator('#profileName')).toHaveText('Kid 1');
  await page.evaluate(() => localStorage.setItem('bb-core-v3', JSON.stringify({ active: 99, profiles: [{ name: '<unsafe>', score: -4, settings: null }] })));
  await page.reload();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  expect(state.schemaVersion).toBe(7);
  expect(state.active).toBe(0);
  expect(state.profiles[0].score).toBe(0);
  await expect(page.locator('#profileName')).toHaveText('<unsafe>');
});

test('Firebase parent auth, two-session sync, retry targeting, and family isolation', async ({ browser }) => {
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
        if (request.method() === 'PATCH') { docs.set(`${uid}:${url.split('/').pop()}`, request.postDataJSON()); return route.fulfill({ json: {} }); }
        if (request.method() === 'GET') return route.fulfill({ json: { documents: [...docs.entries()].filter(([key]) => key.startsWith(`${uid}:`)).map(([key, body]) => ({ name: `projects/brainbite-test/databases/(default)/documents/families/${uid}/profiles/${key.split(':')[1]}`, fields: body.fields, updateTime: new Date().toISOString() })) } });
      }
      return route.fulfill({ status: 404 });
    });
  };
  const configure = async page => {
    await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload();
    await page.getByRole('button', { name: 'Integrations' }).click();
    await page.locator('#cloudProvider').selectOption('firebase');
    await page.locator('#cloudUrl').fill('brainbite-test');
    await page.locator('#cloudKey').fill('AIza-test-public-web-key-123456789');
    await page.getByRole('button', { name: 'Save Cloud Config' }).click();
    await page.getByRole('button', { name: 'Account & Sync' }).click();
    await page.locator('#localAccountEmail').fill('parent@example.com');
    await page.locator('#parentPassword').fill('correct-horse');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.locator('#localAccountStatus')).toContainText('Signed in');
  };
  const a = await browser.newContext(); await installMock(a, 'family-a'); const pageA = await a.newPage(); await configure(pageA);
  await pageA.getByRole('button', { name: 'Profiles' }).click(); await pageA.locator('#newProfile').fill('Cloud Kid'); await pageA.getByRole('button', { name: 'Add Profile' }).click();
  await pageA.getByRole('button', { name: 'Account & Sync' }).click(); await pageA.getByRole('button', { name: 'Push to Cloud' }).click(); await expect(pageA.locator('#mergeResult')).toContainText('upload complete');
  const b = await browser.newContext(); await installMock(b, 'family-a'); const pageB = await b.newPage(); await configure(pageB);
  await pageB.getByRole('button', { name: 'Pull from Cloud' }).click(); await expect(pageB.locator('#mergeResult')).toContainText('download and merge complete'); await pageB.getByRole('button', { name: 'Profiles' }).click(); await expect(pageB.locator('#profileList')).toContainText('Cloud Kid');
  const intruder = await browser.newContext(); await installMock(intruder, 'family-b'); const pageC = await intruder.newPage(); await configure(pageC); await pageC.getByRole('button', { name: 'Pull from Cloud' }).click(); await pageC.getByRole('button', { name: 'Profiles' }).click(); await expect(pageC.getByText('Cloud Kid')).toHaveCount(0);
  await Promise.all([a.close(), b.close(), intruder.close()]);
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

  await page.getByRole('button', { name: 'Number Nebula', exact: true }).click();
  await page.getByRole('button', { name: /Play mission 1:/ }).click();
  await expect(page.locator('#captionText')).toContainText('Bite all even numbers');
  await expect(page.getByRole('button', { name: 'Repeat Prompt' })).toBeVisible();
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
  await page.getByRole('button', { name: 'Recovery' }).click();
  await page.getByRole('button', { name: 'Restore Backup' }).click();
  await expect(page.locator('#profileName')).toHaveText('Restore Kid');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v3')));
  expect(state.profiles[0].name).toBe('Restore Kid');
});

test('duplicate sync events are rejected even when separated by other queued events', async ({ page }) => {
  await page.evaluate(() => {
    SYNC.queue = [];
    queueSyncEvent({ type: 'store-update', profileId: 'profile-a', payload: { active: 0, schemaVersion: 7 }, schemaVersion: 7, ts: 1 });
    queueSyncEvent({ type: 'heartbeat', profileId: 'profile-a', payload: { ok: true }, schemaVersion: 7, ts: 2 });
    queueSyncEvent({ type: 'store-update', profileId: 'profile-a', payload: { active: 0, schemaVersion: 7 }, schemaVersion: 7, ts: 3 });
    saveSync();
  });
  const sync = await page.evaluate(() => JSON.parse(localStorage.getItem('bb-core-v6-sync')));
  expect(sync.queue.filter(evt => evt.type === 'store-update')).toHaveLength(1);
  expect(sync.queue).toHaveLength(2);
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

test('automated WCAG scan has no serious or critical violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const blocking = results.violations.filter(item => ['serious', 'critical'].includes(item.impact));
  expect(blocking, blocking.map(item => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
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
