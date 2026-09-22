import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  BUBBLE_REEF_BASE_CONTRIBUTION,
  createBubbleReefRewardState,
  grantBubbleReefContribution,
  replayBubbleReefContribution,
  validateBubbleReefContributionDefinition,
} from '../content/bubble-reef/rewards.mjs';
import {
  BUBBLE_REEF_MISSION_ID,
  getBubbleReefRoute,
} from '../content/bubble-reef/route.mjs';

const require = createRequire(import.meta.url);
const registry = require('../content/experience-registry.js');

function completedProgression() {
  let progression = registry.createProgression();
  for (let missionId = 1; missionId <= BUBBLE_REEF_MISSION_ID; missionId += 1) {
    progression = registry.completeMission(progression, missionId);
  }
  return progression;
}

test('Bubble Reef exposes one frozen persistent base contribution and canonical reward', () => {
  assert.deepEqual(validateBubbleReefContributionDefinition(), { valid: true, errors: [] });
  assert.equal(Object.isFrozen(BUBBLE_REEF_BASE_CONTRIBUTION), true);
  assert.equal(Object.isFrozen(BUBBLE_REEF_BASE_CONTRIBUTION.reward), true);
  assert.equal(BUBBLE_REEF_BASE_CONTRIBUTION.type, 'base-contribution');
  assert.equal(BUBBLE_REEF_BASE_CONTRIBUTION.persistent, true);
  assert.equal(BUBBLE_REEF_BASE_CONTRIBUTION.unique, true);
  assert.deepEqual(
    { stars: BUBBLE_REEF_BASE_CONTRIBUTION.reward.stars, spark: BUBBLE_REEF_BASE_CONTRIBUTION.reward.spark },
    { stars: 3, spark: 3 },
  );
});

test('completed Bubble Reef route grants its contribution and reward exactly once', () => {
  const initial = createBubbleReefRewardState('profile-reef');
  const first = grantBubbleReefContribution(initial, { progression: completedProgression(), awardedAt: 1234 });

  assert.equal(first.status, 'granted');
  assert.equal(first.granted, true);
  assert.equal(first.state.contributions.length, 1);
  assert.equal(first.state.rewards.length, 1);
  assert.deepEqual(
    { stars: first.state.rewards[0].stars, spark: first.state.rewards[0].spark },
    { stars: 3, spark: 3 },
  );
  assert.equal(first.receipt.profileId, 'profile-reef');
  assert.deepEqual(initial, createBubbleReefRewardState('profile-reef'));

  const second = grantBubbleReefContribution(first.state, { progression: completedProgression(), awardedAt: 9999 });
  assert.equal(second.status, 'replayed');
  assert.equal(second.granted, false);
  assert.equal(second.replayed, true);
  assert.deepEqual(second.state, first.state);
  assert.deepEqual(second.receipt, first.receipt);
});

test('grant is profile-scoped and cross-profile receipt replay is rejected', () => {
  const profileA = grantBubbleReefContribution(createBubbleReefRewardState('profile-a'), {
    progression: completedProgression(),
    awardedAt: 10,
  });
  const profileB = createBubbleReefRewardState('profile-b');
  const rejected = replayBubbleReefContribution(profileB, profileA.receipt, { progression: completedProgression() });

  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.reason, 'invalid-receipt');
  assert.deepEqual(rejected.state, profileB);

  const grantedB = grantBubbleReefContribution(profileB, { progression: completedProgression(), awardedAt: 20 });
  assert.equal(grantedB.granted, true);
  assert.equal(grantedB.state.profileId, 'profile-b');
});

test('valid receipt replay imports once and still requires a completed valid route', () => {
  const source = grantBubbleReefContribution(createBubbleReefRewardState('profile-a'), {
    progression: completedProgression(),
    awardedAt: 42,
  });
  const emptyReplica = createBubbleReefRewardState('profile-a');

  const locked = replayBubbleReefContribution(emptyReplica, source.receipt, { progression: registry.createProgression() });
  assert.equal(locked.status, 'rejected');
  assert.equal(locked.reason, 'route-not-complete');
  assert.equal(locked.state.rewards.length, 0);

  const imported = replayBubbleReefContribution(emptyReplica, source.receipt, { progression: completedProgression() });
  assert.equal(imported.status, 'granted');
  assert.equal(imported.receipt.awardedAt, 42);
  const repeated = replayBubbleReefContribution(imported.state, source.receipt, { progression: completedProgression() });
  assert.equal(repeated.status, 'replayed');
  assert.deepEqual(repeated.state, imported.state);
});

test('invalid and uncompleted routes cannot grant persistent state', () => {
  const initial = createBubbleReefRewardState('profile-guarded');
  const locked = grantBubbleReefContribution(initial, { progression: registry.createProgression() });
  assert.equal(locked.status, 'rejected');
  assert.equal(locked.reason, 'route-not-complete');
  assert.deepEqual(locked.state, initial);

  const invalidRoute = getBubbleReefRoute();
  invalidRoute.progression.strategy = 'reef-points';
  const invalid = grantBubbleReefContribution(initial, {
    progression: completedProgression(),
    route: invalidRoute,
  });
  assert.equal(invalid.status, 'rejected');
  assert.equal(invalid.reason, 'invalid-route');
  assert.match(invalid.validation.errors.join(' '), /canonical mission progression/);
  assert.deepEqual(invalid.state, initial);
});

