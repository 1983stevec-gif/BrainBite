import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  BUBBLE_REEF_MISSION_ID,
  BUBBLE_REEF_ROUTE,
  completeBubbleCurrent,
  getBubbleReefRoute,
  resolveBubbleReefRoute,
  rideBubbleCurrent,
  startBubbleCurrent,
  validateBubbleReefRoute,
} from '../content/bubble-reef/route.mjs';

const require = createRequire(import.meta.url);
const registry = require('../content/experience-registry.js');

function progressionThroughMission(missionId) {
  let progression = registry.createProgression();
  for (let id = 1; id <= missionId; id += 1) progression = registry.completeMission(progression, id);
  return progression;
}

test('Bubble Reef route is valid, isolated data linked to one canonical activity', () => {
  assert.deepEqual(validateBubbleReefRoute(BUBBLE_REEF_ROUTE), { valid: true, errors: [] });
  assert.equal(BUBBLE_REEF_ROUTE.worldProfileId, 'bubble-reef');
  assert.equal(BUBBLE_REEF_ROUTE.status, 'preview');
  assert.equal(Object.isFrozen(BUBBLE_REEF_ROUTE), true);

  const interactions = BUBBLE_REEF_ROUTE.waypoints.filter(waypoint => waypoint.kind === 'interaction');
  const mission = registry.getMission(BUBBLE_REEF_MISSION_ID);
  assert.equal(interactions.length, 1);
  assert.equal(interactions[0].interaction.missionId, mission.id);
  assert.equal(interactions[0].interaction.activityFamily, registry.activityFamilies.knowledgePlatforms);
  assert.equal(interactions[0].interaction.activityFamily, mission.activityFamily);

  const copy = getBubbleReefRoute();
  copy.waypoints[0].label = 'Changed';
  assert.equal(getBubbleReefRoute().waypoints[0].label, 'Reef Entry');
});

test('Bubble Reef validation rejects local progression drift and invalid interaction data', () => {
  const badStrategy = getBubbleReefRoute();
  badStrategy.progression.strategy = 'reef-points';
  assert.match(validateBubbleReefRoute(badStrategy).errors.join(' '), /canonical mission progression/);

  const duplicateWaypoint = getBubbleReefRoute();
  duplicateWaypoint.waypoints[1].id = duplicateWaypoint.waypoints[0].id;
  assert.match(validateBubbleReefRoute(duplicateWaypoint).errors.join(' '), /unique/);

  const familyDrift = getBubbleReefRoute();
  familyDrift.waypoints[1].interaction.activityFamily = registry.activityFamilies.targetSmash;
  assert.match(validateBubbleReefRoute(familyDrift).errors.join(' '), /match its canonical mission/);

  const unknownMission = getBubbleReefRoute();
  unknownMission.progression.missionId = 999;
  unknownMission.waypoints[1].interaction.missionId = 999;
  assert.match(validateBubbleReefRoute(unknownMission).errors.join(' '), /unknown mission 999/);

  const substitutedMission = getBubbleReefRoute();
  substitutedMission.progression.missionId = 12;
  substitutedMission.waypoints[1].interaction.missionId = 12;
  substitutedMission.waypoints[1].interaction.activityFamily = registry.getMission(12).activityFamily;
  assert.match(validateBubbleReefRoute(substitutedMission).errors.join(' '), /canonical mission 8/);

  const secondInteraction = getBubbleReefRoute();
  secondInteraction.waypoints.push(structuredClone(secondInteraction.waypoints[1]));
  secondInteraction.waypoints.at(-1).id = 'another-current';
  assert.match(validateBubbleReefRoute(secondInteraction).errors.join(' '), /exactly one interaction/);
});

test('Bubble Current honors canonical unlock state and LearningCore challenge metadata', () => {
  const locked = startBubbleCurrent(registry.createProgression());
  assert.equal(locked.status, 'locked');
  assert.equal(locked.challenge, null);
  assert.equal(resolveBubbleReefRoute(registry.createProgression()).status, 'locked');

  const ready = progressionThroughMission(BUBBLE_REEF_MISSION_ID - 1);
  assert.equal(resolveBubbleReefRoute(ready).status, 'available');
  const started = startBubbleCurrent(ready);
  assert.equal(started.status, 'approved');
  assert.equal(started.validation.valid, true);
  assert.equal(started.challenge.family, registry.activityFamilies.knowledgePlatforms);
  assert.equal(started.challenge.skillId, registry.getMission(BUBBLE_REEF_MISSION_ID).skill);
  assert.equal(started.challenge.source, 'mission-registry');
});

test('Bubble Current resolves through Knowledge Platforms and canonical mission completion', () => {
  const ready = progressionThroughMission(BUBBLE_REEF_MISSION_ID - 1);
  let challenge = startBubbleCurrent(ready).challenge;

  const wrong = rideBubbleCurrent(challenge, challenge.distractors[0], { independent: true });
  assert.equal(wrong.attempt.correct, false);
  assert.deepEqual(wrong.challenge.visited, []);
  assert.deepEqual(completeBubbleCurrent(ready, wrong.challenge), ready);
  assert.deepEqual(completeBubbleCurrent(ready, {
    id: `mission-${BUBBLE_REEF_MISSION_ID}`,
    family: registry.activityFamilies.knowledgePlatforms,
    completed: true,
  }), ready);

  for (const platform of challenge.platformOrder) {
    const result = rideBubbleCurrent(challenge, platform, { independent: true });
    assert.equal(result.attempt.correct, true);
    challenge = result.challenge;
  }
  assert.equal(challenge.completed, true);

  const completed = completeBubbleCurrent(ready, challenge);
  assert.equal(completed.completedMissionIds.includes(BUBBLE_REEF_MISSION_ID), true);
  assert.equal(completed.unlockedMissionIds.includes(BUBBLE_REEF_MISSION_ID + 1), true);
  assert.equal(completed.lastMissionId, BUBBLE_REEF_MISSION_ID);
  assert.equal(resolveBubbleReefRoute(completed).status, 'complete');
});
