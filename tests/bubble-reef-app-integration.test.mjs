import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
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
