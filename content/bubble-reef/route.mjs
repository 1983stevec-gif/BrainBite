import '../experience-registry.js';
import {
  resolveKnowledgePlatformChoice,
  resolveMissionChallenge,
} from '../../brainbite-core.mjs';

const ROUTE_VERSION = 1;
const WORLD_PROFILE_ID = 'bubble-reef';
const INTERACTION_ID = 'bubble-current';
const MISSION_ID = 8;
const REGISTRY = globalThis.BrainBiteRegistry;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function clone(value) {
  return structuredClone(value);
}

const BUBBLE_REEF_ROUTE = deepFreeze({
  schemaVersion: ROUTE_VERSION,
  id: 'bubble-reef-preview-route',
  worldProfileId: WORLD_PROFILE_ID,
  status: 'preview',
  progression: {
    strategy: 'canonical-mission',
    missionId: MISSION_ID,
  },
  waypoints: [
    { id: 'reef-entry', kind: 'landmark', label: 'Reef Entry' },
    {
      id: INTERACTION_ID,
      kind: 'interaction',
      label: 'Bubble Current',
      interaction: {
        kind: 'activity-family',
        missionId: MISSION_ID,
        activityFamily: REGISTRY.activityFamilies.knowledgePlatforms,
      },
    },
    { id: 'pearl-arch', kind: 'landmark', label: 'Pearl Arch' },
  ],
});

function interactionWaypoint(route) {
  return Array.isArray(route?.waypoints)
    ? route.waypoints.filter(waypoint => waypoint?.kind === 'interaction')
    : [];
}

function validateBubbleReefRoute(route = BUBBLE_REEF_ROUTE) {
  const errors = [];
  if (!route || typeof route !== 'object' || Array.isArray(route)) {
    return { valid: false, errors: ['Bubble Reef route must be an object.'] };
  }
  if (route.schemaVersion !== ROUTE_VERSION) errors.push(`Bubble Reef route schemaVersion must be ${ROUTE_VERSION}.`);
  if (route.id !== 'bubble-reef-preview-route') errors.push('Bubble Reef route id is invalid.');
  if (route.worldProfileId !== WORLD_PROFILE_ID) errors.push(`Bubble Reef route must target ${WORLD_PROFILE_ID}.`);
  if (route.status !== 'preview') errors.push('Bubble Reef route must remain a preview.');
  if (route.progression?.strategy !== 'canonical-mission') errors.push('Bubble Reef route must use canonical mission progression.');
  if (!Number.isInteger(route.progression?.missionId)) errors.push('Bubble Reef route progression requires a numeric missionId.');
  if (route.progression?.missionId !== MISSION_ID) errors.push(`Bubble Reef route must use canonical mission ${MISSION_ID}.`);

  const waypoints = Array.isArray(route.waypoints) ? route.waypoints : [];
  if (!waypoints.length) errors.push('Bubble Reef route requires waypoints.');
  const waypointIds = waypoints.map(waypoint => waypoint?.id);
  if (waypointIds.some(id => typeof id !== 'string' || !id.trim())) errors.push('Every Bubble Reef waypoint requires an id.');
  if (new Set(waypointIds).size !== waypointIds.length) errors.push('Bubble Reef waypoint ids must be unique.');
  if (waypoints.some(waypoint => !['landmark', 'interaction'].includes(waypoint?.kind))) errors.push('Bubble Reef waypoint kind is unsupported.');

  const interactions = interactionWaypoint(route);
  if (interactions.length !== 1) errors.push('Bubble Reef route requires exactly one interaction.');
  if (interactions[0]?.id !== INTERACTION_ID) errors.push(`Bubble Reef interaction id must be ${INTERACTION_ID}.`);
  const interaction = interactions[0]?.interaction;
  if (interaction?.kind !== 'activity-family') errors.push('Bubble Reef interaction must use an activity family.');
  if (interaction?.missionId !== route.progression?.missionId) errors.push('Bubble Reef interaction and progression must reference the same mission.');

  const mission = REGISTRY?.getMission(interaction?.missionId);
  if (!mission) errors.push(`Bubble Reef interaction references unknown mission ${String(interaction?.missionId)}.`);
  if (mission && interaction?.activityFamily !== mission.activityFamily) errors.push('Bubble Reef interaction activity family must match its canonical mission.');
  if (mission && !Object.values(REGISTRY.activityFamilies).includes(interaction?.activityFamily)) errors.push('Bubble Reef interaction activity family is not canonical.');

  const registryValidation = REGISTRY?.validateRegistry?.();
  if (!registryValidation?.valid) errors.push('The canonical experience registry is invalid.');
  return { valid: errors.length === 0, errors };
}

function getBubbleReefRoute() {
  return clone(BUBBLE_REEF_ROUTE);
}

function resolveBubbleReefRoute(progression, route = BUBBLE_REEF_ROUTE) {
  const validation = validateBubbleReefRoute(route);
  if (!validation.valid) return { status: 'invalid', validation, route: clone(route) };
  const normalizedProgression = REGISTRY.normalizeProgression(progression);
  const missionId = route.progression.missionId;
  const completed = normalizedProgression.completedMissionIds.includes(missionId);
  const unlocked = REGISTRY.isMissionUnlocked(normalizedProgression, missionId);
  return {
    status: completed ? 'complete' : unlocked ? 'available' : 'locked',
    validation,
    route: clone(route),
    missionId,
    progression: normalizedProgression,
  };
}

function startBubbleCurrent(progression, options = {}) {
  const routeState = resolveBubbleReefRoute(progression);
  if (routeState.status === 'invalid') return { ...routeState, interactionId: INTERACTION_ID, challenge: null };
  if (routeState.status === 'locked') {
    return {
      status: 'locked',
      interactionId: INTERACTION_ID,
      worldProfileId: WORLD_PROFILE_ID,
      missionId: MISSION_ID,
      family: REGISTRY.activityFamilies.knowledgePlatforms,
      challenge: null,
    };
  }
  const resolution = resolveMissionChallenge(MISSION_ID, options);
  return {
    ...resolution,
    interactionId: INTERACTION_ID,
    worldProfileId: WORLD_PROFILE_ID,
  };
}

function rideBubbleCurrent(challenge, platform, meta = {}) {
  if (challenge?.id !== `mission-${MISSION_ID}` || challenge?.family !== REGISTRY.activityFamilies.knowledgePlatforms) {
    throw new Error('Bubble Current requires the canonical Bubble Reef challenge.');
  }
  return resolveKnowledgePlatformChoice(challenge, platform, meta);
}

function completeBubbleCurrent(progression, challenge) {
  const normalized = REGISTRY.normalizeProgression(progression);
  const mission = REGISTRY.getMission(MISSION_ID);
  const expectedOrder = mission.correct.slice(0, 3);
  const canonicalCompletion = challenge?.id === `mission-${MISSION_ID}`
    && challenge?.skillId === mission.skill
    && challenge?.source === 'mission-registry'
    && challenge?.family === mission.activityFamily
    && challenge?.completed === true
    && JSON.stringify(challenge.platformOrder) === JSON.stringify(expectedOrder)
    && JSON.stringify(challenge.visited) === JSON.stringify(expectedOrder);
  if (!canonicalCompletion) {
    return normalized;
  }
  return REGISTRY.completeMission(normalized, MISSION_ID);
}

export {
  BUBBLE_REEF_ROUTE,
  INTERACTION_ID as BUBBLE_CURRENT_ID,
  MISSION_ID as BUBBLE_REEF_MISSION_ID,
  ROUTE_VERSION as BUBBLE_REEF_ROUTE_VERSION,
  completeBubbleCurrent,
  getBubbleReefRoute,
  resolveBubbleReefRoute,
  rideBubbleCurrent,
  startBubbleCurrent,
  validateBubbleReefRoute,
};

if (typeof window !== 'undefined') {
  window.BrainBiteBubbleReef = Object.freeze({
    BUBBLE_REEF_ROUTE,
    completeBubbleCurrent,
    getBubbleReefRoute,
    resolveBubbleReefRoute,
    rideBubbleCurrent,
    startBubbleCurrent,
    validateBubbleReefRoute,
  });
}
