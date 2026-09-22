import {
  BUBBLE_REEF_MISSION_ID,
  BUBBLE_REEF_ROUTE,
  resolveBubbleReefRoute,
  validateBubbleReefRoute,
} from './route.mjs';

const REWARD_STATE_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function clone(value) {
  return structuredClone(value);
}

const BUBBLE_REEF_BASE_CONTRIBUTION = deepFreeze({
  schemaVersion: REWARD_STATE_VERSION,
  id: 'bubble-reef-base-current-restored',
  name: 'Restore the Bubble Current',
  type: 'base-contribution',
  persistent: true,
  unique: true,
  worldProfileId: BUBBLE_REEF_ROUTE.worldProfileId,
  routeId: BUBBLE_REEF_ROUTE.id,
  missionId: BUBBLE_REEF_MISSION_ID,
  reward: {
    id: 'bubble-reef-current-cache',
    name: 'Bubble Current Cache',
    type: 'mission-reward',
    unique: true,
    stars: 3,
    spark: 3,
  },
});

function validProfileId(profileId) {
  return typeof profileId === 'string' && profileId.trim() === profileId && profileId.length > 0;
}

function createBubbleReefRewardState(profileId) {
  if (!validProfileId(profileId)) throw new TypeError('Bubble Reef reward state requires a profileId.');
  return {
    schemaVersion: REWARD_STATE_VERSION,
    profileId,
    contributionLedger: {},
    contributions: [],
    rewards: [],
  };
}

function normalizeBubbleReefRewardState(state, profileId = state?.profileId) {
  const normalized = createBubbleReefRewardState(profileId);
  if (!state || typeof state !== 'object' || Array.isArray(state)) return normalized;

  const contributions = Array.isArray(state.contributions) ? state.contributions : [];
  const rewards = Array.isArray(state.rewards) ? state.rewards : [];
  const contribution = contributions.find(item => item?.id === BUBBLE_REEF_BASE_CONTRIBUTION.id);
  const rewardRecordId = `${BUBBLE_REEF_BASE_CONTRIBUTION.id}:${BUBBLE_REEF_BASE_CONTRIBUTION.reward.id}`;
  const reward = rewards.find(item => item?.id === rewardRecordId);

  if (contribution && reward) {
    normalized.contributions.push(clone(contribution));
    normalized.rewards.push(clone(reward));
    normalized.contributionLedger[BUBBLE_REEF_BASE_CONTRIBUTION.id] = {
      contributionId: contribution.id,
      rewardId: reward.id,
      awardedAt: reward.awardedAt,
    };
  }
  return normalized;
}

function validateBubbleReefContributionDefinition(definition = BUBBLE_REEF_BASE_CONTRIBUTION) {
  const errors = [];
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
    return { valid: false, errors: ['Bubble Reef contribution definition must be an object.'] };
  }
  if (definition.schemaVersion !== REWARD_STATE_VERSION) errors.push(`Bubble Reef contribution schemaVersion must be ${REWARD_STATE_VERSION}.`);
  if (definition.id !== 'bubble-reef-base-current-restored') errors.push('Bubble Reef contribution id is invalid.');
  if (definition.type !== 'base-contribution' || definition.persistent !== true || definition.unique !== true) {
    errors.push('Bubble Reef base contribution must be persistent and unique.');
  }
  if (definition.worldProfileId !== BUBBLE_REEF_ROUTE.worldProfileId) errors.push('Bubble Reef contribution targets the wrong world profile.');
  if (definition.routeId !== BUBBLE_REEF_ROUTE.id) errors.push('Bubble Reef contribution targets the wrong route.');
  if (definition.missionId !== BUBBLE_REEF_MISSION_ID) errors.push('Bubble Reef contribution targets the wrong mission.');
  if (definition.reward?.id !== 'bubble-reef-current-cache' || definition.reward?.unique !== true) {
    errors.push('Bubble Reef contribution requires its unique current cache reward.');
  }
  if (definition.reward?.type !== 'mission-reward' || definition.reward?.stars !== 3 || definition.reward?.spark !== 3) {
    errors.push('Bubble Reef reward must use the canonical non-boss mission reward amounts.');
  }
  return { valid: errors.length === 0, errors };
}

function reject(state, reason, validation) {
  return {
    status: 'rejected',
    granted: false,
    replayed: false,
    reason,
    validation,
    state,
    receipt: null,
  };
}

function routeEligibility(progression, route) {
  const validation = validateBubbleReefRoute(route);
  if (!validation.valid) return { eligible: false, reason: 'invalid-route', validation };
  const routeState = resolveBubbleReefRoute(progression, route);
  if (routeState.status !== 'complete') {
    return { eligible: false, reason: 'route-not-complete', validation };
  }
  return { eligible: true, validation };
}

function grantBubbleReefContribution(state, { progression, route = BUBBLE_REEF_ROUTE, awardedAt = Date.now() } = {}) {
  let next;
  try {
    next = normalizeBubbleReefRewardState(state);
  } catch {
    return reject(state, 'invalid-profile-state', { valid: false, errors: ['Bubble Reef reward state requires a profileId.'] });
  }

  const definitionValidation = validateBubbleReefContributionDefinition();
  if (!definitionValidation.valid) return reject(next, 'invalid-definition', definitionValidation);
  const eligibility = routeEligibility(progression, route);
  if (!eligibility.eligible) return reject(next, eligibility.reason, eligibility.validation);
  if (!Number.isFinite(awardedAt) || awardedAt < 0) {
    return reject(next, 'invalid-awarded-at', { valid: false, errors: ['awardedAt must be a non-negative finite number.'] });
  }

  const prior = next.contributionLedger[BUBBLE_REEF_BASE_CONTRIBUTION.id];
  if (prior) {
    return {
      status: 'replayed',
      granted: false,
      replayed: true,
      reason: null,
      validation: eligibility.validation,
      state: next,
      receipt: {
        schemaVersion: REWARD_STATE_VERSION,
        profileId: next.profileId,
        contributionId: prior.contributionId,
        rewardId: prior.rewardId,
        awardedAt: prior.awardedAt,
      },
    };
  }

  const contribution = {
    id: BUBBLE_REEF_BASE_CONTRIBUTION.id,
    name: BUBBLE_REEF_BASE_CONTRIBUTION.name,
    type: BUBBLE_REEF_BASE_CONTRIBUTION.type,
    worldProfileId: BUBBLE_REEF_BASE_CONTRIBUTION.worldProfileId,
    routeId: BUBBLE_REEF_BASE_CONTRIBUTION.routeId,
    missionId: BUBBLE_REEF_BASE_CONTRIBUTION.missionId,
    persistent: true,
    contributedAt: awardedAt,
  };
  const reward = {
    id: `${contribution.id}:${BUBBLE_REEF_BASE_CONTRIBUTION.reward.id}`,
    contributionId: contribution.id,
    rewardId: BUBBLE_REEF_BASE_CONTRIBUTION.reward.id,
    name: BUBBLE_REEF_BASE_CONTRIBUTION.reward.name,
    type: BUBBLE_REEF_BASE_CONTRIBUTION.reward.type,
    unique: true,
    stars: BUBBLE_REEF_BASE_CONTRIBUTION.reward.stars,
    spark: BUBBLE_REEF_BASE_CONTRIBUTION.reward.spark,
    awardedAt,
  };
  next.contributions.push(contribution);
  next.rewards.push(reward);
  next.contributionLedger[contribution.id] = {
    contributionId: contribution.id,
    rewardId: reward.id,
    awardedAt,
  };

  return {
    status: 'granted',
    granted: true,
    replayed: false,
    reason: null,
    validation: eligibility.validation,
    state: next,
    receipt: {
      schemaVersion: REWARD_STATE_VERSION,
      profileId: next.profileId,
      contributionId: contribution.id,
      rewardId: reward.id,
      awardedAt,
    },
  };
}

function replayBubbleReefContribution(state, receipt, options = {}) {
  const expectedRewardId = `${BUBBLE_REEF_BASE_CONTRIBUTION.id}:${BUBBLE_REEF_BASE_CONTRIBUTION.reward.id}`;
  const validReceipt = receipt?.schemaVersion === REWARD_STATE_VERSION
    && receipt?.profileId === state?.profileId
    && receipt?.contributionId === BUBBLE_REEF_BASE_CONTRIBUTION.id
    && receipt?.rewardId === expectedRewardId
    && Number.isFinite(receipt?.awardedAt)
    && receipt.awardedAt >= 0;
  if (!validReceipt) {
    let next = state;
    try {
      next = normalizeBubbleReefRewardState(state);
    } catch {
      // Keep the rejected input observable when profile state itself is invalid.
    }
    return reject(next, 'invalid-receipt', { valid: false, errors: ['Bubble Reef grant receipt is invalid or belongs to another profile.'] });
  }
  return grantBubbleReefContribution(state, { ...options, awardedAt: receipt.awardedAt });
}

export {
  BUBBLE_REEF_BASE_CONTRIBUTION,
  REWARD_STATE_VERSION as BUBBLE_REEF_REWARD_STATE_VERSION,
  createBubbleReefRewardState,
  grantBubbleReefContribution,
  normalizeBubbleReefRewardState,
  replayBubbleReefContribution,
  validateBubbleReefContributionDefinition,
};

