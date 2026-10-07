import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { projectProfileCurrency, recordCurrencyPreview } from '../brainbite-core.mjs';
import { createRequire } from 'node:module';
import { chromium } from '@playwright/test';
import { createBrainBiteServer } from '../scripts/serve.mjs';
import {
  BUBBLE_REEF_BASE_CONTRIBUTION,
  createBubbleReefRewardState,
  grantBubbleReefContribution,
} from '../content/bubble-reef/rewards.mjs';

const require = createRequire(import.meta.url);
const registry = require('../content/experience-registry.js');
const appSource = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function extractFunction(name) {
  const declaration = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const match = declaration.exec(appSource);
  assert.ok(match, `${name} must remain defined in app.js`);

  const parametersStart = appSource.indexOf('(', match.index);
  let parameterDepth = 0;
  let bodyStart = -1;
  for (let index = parametersStart; index < appSource.length; index += 1) {
    if (appSource[index] === '(') parameterDepth += 1;
    if (appSource[index] === ')') parameterDepth -= 1;
    if (parameterDepth === 0) {
      bodyStart = appSource.indexOf('{', index + 1);
      break;
    }
  }
  assert.notEqual(bodyStart, -1, `Could not find the body of ${name} in app.js`);

  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === '{') depth += 1;
    if (appSource[index] === '}') depth -= 1;
    if (depth === 0) return appSource.slice(match.index, index + 1);
  }
  throw new Error(`Could not extract ${name} from app.js`);
}

function completedProgression() {
  let progression = registry.createProgression();
  for (let missionId = 1; missionId <= BUBBLE_REEF_BASE_CONTRIBUTION.missionId; missionId += 1) {
    progression = registry.completeMission(progression, missionId);
  }
  return progression;
}

function normalize(value) {
  return JSON.parse(JSON.stringify(value));
}

function createGrantHarness(profiles) {
  const context = vm.createContext({
    fixtureStore: { profiles },
    currencyCore: { projectProfileCurrency, recordCurrencyPreview },
    rewards: {
      BUBBLE_REEF_BASE_CONTRIBUTION,
      createBubbleReefRewardState,
      grantBubbleReefContribution,
    },
    persistenceCalls: [],
    structuredClone,
  });
  vm.runInContext(`
    const STORE = fixtureStore;
    const core = () => currencyCore;
    const bubbleReefRewards = async () => rewards;
    const persistCanonicalState = async options => persistenceCalls.push(structuredClone(options));
    ${extractFunction('grantBubbleReefPreviewReward')}
    globalThis.grantAtAppBoundary = grantBubbleReefPreviewReward;
  `, context);
  return context;
}

function mergeAtAppBoundary(local, remote) {
  const context = vm.createContext({ local, remote, structuredClone });
  vm.runInContext(`
    ${extractFunction('mergeBubbleReefRewardState')}
    globalThis.result = mergeBubbleReefRewardState(local, remote);
  `, context);
  return normalize(context.result);
}

test('app reward grant is scoped to the requested profile and replaces foreign state', async () => {
  const foreignReward = grantBubbleReefContribution(createBubbleReefRewardState('profile-b'), {
    progression: completedProgression(),
    awardedAt: 50,
  }).state;
  const profiles = [
    { id: 'profile-a', stars: 10, spark: 20, updatedAt: 1, bubbleReefRewards: foreignReward },
    { id: 'profile-b', stars: 7, spark: 8, updatedAt: 2, bubbleReefRewards: foreignReward },
  ];
  const profileBBefore = structuredClone(profiles[1]);
  const harness = createGrantHarness(profiles);

  const result = await harness.grantAtAppBoundary({
    profileId: 'profile-a',
    missionId: BUBBLE_REEF_BASE_CONTRIBUTION.missionId,
    progression: completedProgression(),
    awardedAt: 100,
    canonicalRewardGranted: false,
  });

  assert.equal(result.status, 'granted');
  assert.equal(result.receipt.profileId, 'profile-a');
  assert.equal(profiles[0].bubbleReefRewards.profileId, 'profile-a');
  assert.equal(profiles[0].bubbleReefRewards.rewards[0].awardedAt, 100);
  assert.deepEqual({ stars: profiles[0].stars, spark: profiles[0].spark }, { stars: 13, spark: 23 });
  assert.deepEqual(profiles[1], profileBBefore);
  assert.deepEqual(normalize(harness.persistenceCalls), [{ renderAfter: true }]);
});

test('app reward replay is idempotent and canonical mission credit is not duplicated', async () => {
  const profiles = [{ id: 'profile-a', stars: 13, spark: 23, updatedAt: 1 }];
  const harness = createGrantHarness(profiles);
  const request = {
    profileId: 'profile-a',
    missionId: BUBBLE_REEF_BASE_CONTRIBUTION.missionId,
    progression: completedProgression(),
    canonicalRewardGranted: true,
  };

  const first = await harness.grantAtAppBoundary({ ...request, awardedAt: 100 });
  const stateAfterFirst = structuredClone(profiles[0].bubbleReefRewards);
  const second = await harness.grantAtAppBoundary({ ...request, awardedAt: 999 });

  assert.equal(first.status, 'granted');
  assert.equal(second.status, 'replayed');
  assert.equal(second.granted, false);
  assert.deepEqual(profiles[0].bubbleReefRewards, stateAfterFirst);
  assert.deepEqual({ stars: profiles[0].stars, spark: profiles[0].spark }, { stars: 13, spark: 23 });
  assert.equal(harness.persistenceCalls.length, 2);
});

test('app reward merge deduplicates records and is idempotent', () => {
  const progression = completedProgression();
  const profileAState = grantBubbleReefContribution(createBubbleReefRewardState('profile-a'), {
    progression,
    awardedAt: 100,
  }).state;
  const profileA = { id: 'profile-a', bubbleReefRewards: profileAState };

  const deduplicated = mergeAtAppBoundary(profileA, structuredClone(profileA));
  assert.equal(deduplicated.contributions.length, 1);
  assert.equal(deduplicated.rewards.length, 1);
  assert.deepEqual(mergeAtAppBoundary({ id: 'profile-a', bubbleReefRewards: deduplicated }, profileA), deduplicated);
});

test('app reward merge cannot import another profile reward payload', () => {
  const progression = completedProgression();
  const profileAState = grantBubbleReefContribution(createBubbleReefRewardState('profile-a'), {
    progression,
    awardedAt: 100,
  }).state;
  const profileBState = grantBubbleReefContribution(createBubbleReefRewardState('profile-b'), {
    progression,
    awardedAt: 999,
  }).state;
  const profileA = { id: 'profile-a', bubbleReefRewards: profileAState };

  const hostileRemote = { id: 'profile-a', bubbleReefRewards: profileBState };
  const isolated = mergeAtAppBoundary(profileA, hostileRemote);
  assert.deepEqual(isolated, normalize(profileAState));
  assert.equal(isolated.profileId, 'profile-a');
  assert.equal(isolated.rewards[0].awardedAt, 100);
});

test('Bubble Reef preview completion grants and persists the active profile reward through the shipping trigger', { timeout: 120_000 }, async () => {
  const port = Number(process.env.BRAINBITE_TEST_PORT || 4318);
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = await createBrainBiteServer({ port });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${baseUrl}/?presentation=webgl&contentMode=internal-review&bubble-reward-bust=${Date.now()}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => typeof window.BrainBiteWorldPreview?.setProfile === 'function');

    const fixture = await page.evaluate(async () => {
      const active = P();
      active.name = 'Reef Kid';
      active.stars = 0;
      active.spark = 0;
      let progression = BrainBiteRegistry.createProgression();
      for (let missionId = 1; missionId < 8; missionId += 1) {
        progression = BrainBiteRegistry.completeMission(progression, missionId);
      }
      active.progression = BrainBiteRegistry.normalizeProgression({ ...progression, lastMissionId: 8 });
      active.updatedAt = Date.now();

      const other = blank('Other Kid');
      other.stars = 11;
      other.spark = 13;
      other.updatedAt = active.updatedAt;
      STORE.profiles = [active, other];
      STORE.active = 0;
      await persistCanonicalState({ renderAfter: true });
      await PERSISTENCE_CHAIN;
      return { activeId: active.id, otherId: other.id };
    });

    await page.locator('#home .home-primary-actions button[data-screen="brainbase"]').click();
    await page.locator('.bb-world-gateway-card summary').click();
    await page.locator('#bubbleReefLivePreviewBtn').click();
    await page.waitForFunction(() => window.BrainBiteWorldPreview?.getProfile?.() === 'bubble-reef');
    await page.getByRole('button', { name: /enter the 3d play portal/i }).click();
    await page.locator('#game.show').waitFor({ state: 'visible' });
    await page.waitForFunction(() => window.BrainBiteGame?.getState?.()?.m?.id === 8);

    for (const answer of ['1/2', '2/4', '3/6', '4/8', '5/10']) {
      await page.locator(`.webgl-answer-controls button[data-value="${answer}"]`).click();
      await page.waitForTimeout(750);
    }
    await page.waitForFunction(activeId => {
      const store = JSON.parse(localStorage.getItem('bb-core-v3'));
      const profile = store.profiles.find(candidate => candidate.id === activeId);
      return profile?.bubbleReefRewards?.rewards?.length === 1;
    }, fixture.activeId);

    await page.reload();
    await page.waitForFunction(() => Boolean(window.BrainBiteGame?.getState));
    const persisted = await page.evaluate(({ activeId, otherId }) => {
      const store = JSON.parse(localStorage.getItem('bb-core-v3'));
      return {
        activeProfileId: store.profiles[store.active].id,
        active: store.profiles.find(profile => profile.id === activeId),
        other: store.profiles.find(profile => profile.id === otherId),
      };
    }, fixture);

    assert.equal(persisted.activeProfileId, fixture.activeId);
    assert.equal(persisted.active.stars, 3);
    assert.equal(persisted.active.spark, 3);
    assert.ok(persisted.active.progression.completedMissionIds.includes(8));
    assert.equal(persisted.active.bubbleReefRewards.profileId, fixture.activeId);
    assert.equal(persisted.active.bubbleReefRewards.contributions.length, 1);
    assert.equal(persisted.active.bubbleReefRewards.rewards.length, 1);
    assert.equal(persisted.other.stars, 11);
    assert.equal(persisted.other.spark, 13);
    assert.equal(persisted.other.bubbleReefRewards, null);
    await context.close();
  } finally {
    await browser?.close();
    await new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
  }
});
