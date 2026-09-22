import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const registry = require('../content/experience-registry.js');

const {
  registryVersion,
  realms,
  worlds,
  missions,
  bosses,
  activityFamilies,
  verticalSlice,
  validateRegistry,
  getMission,
  getWorld,
  createProgression,
  normalizeProgression,
  isMissionUnlocked,
  completeMission,
  mergeProgression,
} = registry;

const LIVE_WORLD_IDS = ['math', 'words', 'spanish'];
const LIVE_MISSION_IDS = Array.from({ length: 30 }, (_, index) => index + 1);
const FIRST_MISSION_BY_WORLD = { math: 1, words: 11, spanish: 21 };
const LIVE_BOSS_NAMES = ['Astro Muncher', 'Word Warp', 'El Eco'];
const ACTIVITY_FAMILY_NAMES = ['Target Smash', 'Letter Trail', 'Knowledge Platforms'];
const FAMILY_ALIASES = {
  targetsmash: 'Target Smash',
  'target-smash': 'Target Smash',
  'target-smash-jungle': 'Target Smash',
  lettertrail: 'Letter Trail',
  'letter-trail': 'Letter Trail',
  'letter-trail-jungle': 'Letter Trail',
  knowledgeplatforms: 'Knowledge Platforms',
  'knowledge-platforms': 'Knowledge Platforms',
  'knowledge-platforms-jungle': 'Knowledge Platforms',
};

function entries(value) {
  if (Array.isArray(value)) return value.map((item, index) => [String(index), item]);
  if (value && typeof value === 'object') return Object.entries(value);
  return [];
}

function idOf(value) {
  if (value && typeof value === 'object') {
    return value.id ?? value.missionId ?? value.activityId ?? value.worldId ?? value.bossId;
  }
  return value;
}

function missionIdsForWorld(world) {
  const references = world.missionIds ?? world.missions ?? [];
  return references.map(idOf);
}

function missionWorldId(mission) {
  return mission.worldId ?? mission.world;
}

function missionBossName(mission) {
  if (mission.bossName) return mission.bossName;
  if (mission.boss && typeof mission.boss === 'object') {
    return mission.boss.name ?? mission.boss.title ?? bossName(bosses.find(boss => idOf(boss) === mission.boss.id));
  }
  const bossId = mission.bossId ?? (typeof mission.boss === 'string' ? mission.boss : null);
  if (bossId) return bossName(bosses.find(boss => idOf(boss) === bossId));
  return null;
}

function bossName(boss) {
  return boss && typeof boss === 'object' ? boss.name ?? boss.title ?? boss.id : boss;
}

function familyName(value, key = '') {
  const candidate = value && typeof value === 'object'
    ? value.family ?? value.activityFamily ?? value.familyName ?? value.familyId ?? value.name ?? value.label ?? value.type ?? value.id
    : value;
  const exact = ACTIVITY_FAMILY_NAMES.find(name => name === candidate);
  if (exact) return exact;
  const candidateAlias = FAMILY_ALIASES[String(candidate ?? '').toLowerCase()];
  if (candidateAlias) return candidateAlias;
  return FAMILY_ALIASES[String(key).toLowerCase()] ?? null;
}

function mappedVerticalSliceFamilies(slice) {
  const found = new Set();
  function visit(value, key = '') {
    const label = familyName(value, key);
    if (label) found.add(label);
    if (Array.isArray(value)) {
      value.forEach(item => visit(item));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [childKey, childValue] of Object.entries(value)) {
        if (['world', 'worldId', 'boss', 'bossId', 'realm', 'id'].includes(childKey)) continue;
        visit(childValue, childKey);
      }
    }
  }
  visit(slice);
  return found;
}

function sortedMissionIds(ids) {
  return [...ids].sort((left, right) => LIVE_MISSION_IDS.indexOf(left) - LIVE_MISSION_IDS.indexOf(right));
}

function assertValidMissionIds(ids, message) {
  assert.ok(Array.isArray(ids), `${message} must be an array`);
  assert.ok(ids.every(id => LIVE_MISSION_IDS.includes(id)), `${message} contains an invalid mission ID`);
  assert.equal(new Set(ids).size, ids.length, `${message} contains duplicates`);
}

test('CommonJS registry exports the complete public API', () => {
  for (const name of [
    'registryVersion',
    'realms',
    'worlds',
    'missions',
    'bosses',
    'activityFamilies',
    'verticalSlice',
    'validateRegistry',
    'getMission',
    'getWorld',
    'createProgression',
    'normalizeProgression',
    'isMissionUnlocked',
    'completeMission',
    'mergeProgression',
  ]) {
    assert.ok(Object.hasOwn(registry, name), `missing export: ${name}`);
  }
  assert.ok(typeof registryVersion === 'string' || typeof registryVersion === 'number');
  assert.ok(realms && typeof realms === 'object');
  assert.ok(Array.isArray(worlds));
  assert.ok(Array.isArray(missions));
  assert.ok(Array.isArray(bosses));
  assert.ok(activityFamilies && typeof activityFamilies === 'object');
  assert.ok(verticalSlice && typeof verticalSlice === 'object');
  for (const name of ['validateRegistry', 'getMission', 'getWorld', 'createProgression', 'normalizeProgression', 'isMissionUnlocked', 'completeMission', 'mergeProgression']) {
    assert.equal(typeof registry[name], 'function', `${name} must be a function`);
  }
});

test('live inventory contains three worlds, thirty unique missions, and four encounters', () => {
  assert.equal(worlds.length, 3);
  assert.deepEqual(worlds.map(world => world.id).sort(), LIVE_WORLD_IDS.sort());
  assert.equal(missions.length, 30);
  assert.deepEqual(missions.map(mission => mission.id).sort((left, right) => left - right), LIVE_MISSION_IDS);
  assert.equal(new Set(missions.map(mission => mission.id)).size, 30);

  const liveBossMissions = missions.filter(mission => mission.boss === true || mission.bossId || missionBossName(mission));
  assert.equal(liveBossMissions.length, 3);
  assert.deepEqual(liveBossMissions.map(missionBossName).sort(), LIVE_BOSS_NAMES.sort());
  assert.equal(bosses.length, 4);
  assert.deepEqual(bosses.map(bossName).sort(), [...LIVE_BOSS_NAMES, 'Fraction Kraken'].sort());
  assert.ok(bosses.some(boss => bossName(boss) === 'Fraction Kraken'));
});

test('each mission has exactly one world owner and world mission lists are exact', () => {
  const worldById = new Map(worlds.map(world => [world.id, world]));
  const missionById = new Map(missions.map(mission => [mission.id, mission]));
  const listedMissionIds = worlds.flatMap(missionIdsForWorld);

  assert.deepEqual([...new Set(listedMissionIds)].sort((left, right) => left - right), LIVE_MISSION_IDS);
  assert.equal(listedMissionIds.length, LIVE_MISSION_IDS.length);

  for (const mission of missions) {
    const owners = worlds.filter(world => missionIdsForWorld(world).includes(mission.id));
    assert.equal(owners.length, 1, `mission ${mission.id} must have exactly one world owner`);
    assert.equal(missionWorldId(mission), owners[0].id, `mission ${mission.id} points to the wrong world`);
  }

  for (const world of worlds) {
    const listed = missionIdsForWorld(world);
    const expected = missions.filter(mission => missionWorldId(mission) === world.id).map(mission => mission.id);
    assert.deepEqual(listed.sort((left, right) => left - right), expected.sort((left, right) => left - right), `mission list mismatch for ${world.id}`);
    assert.ok(worldById.has(world.id));
    for (const missionId of listed) assert.equal(missionById.get(missionId)?.id, missionId);
  }
});

test('activity families and the Jungle Circuit vertical slice map cleanly', () => {
  const exportedFamilies = new Set(entries(activityFamilies)
    .map(([key, value]) => familyName(value, key))
    .filter(Boolean));
  assert.deepEqual([...exportedFamilies].sort(), ACTIVITY_FAMILY_NAMES.sort());

  const sliceWorldId = verticalSlice.worldId ?? verticalSlice.world?.id ?? verticalSlice.world ?? verticalSlice.worldDefinitions?.[0]?.id;
  assert.equal(sliceWorldId, 'jungle-circuit');
  assert.deepEqual([...mappedVerticalSliceFamilies(verticalSlice)].sort(), ACTIVITY_FAMILY_NAMES.sort());

  const sliceBoss = verticalSlice.bossId ?? verticalSlice.boss ?? verticalSlice.bossDefinitions?.[0];
  const sliceBossName = sliceBoss && typeof sliceBoss === 'object' ? bossName(sliceBoss) : sliceBoss;
  assert.ok(sliceBossName === 'fraction-kraken' || sliceBossName === 'Fraction Kraken');
});

test('registry validation is clean and lookup rejects unknown IDs', () => {
  const result = validateRegistry();
  assert.equal(result.valid, true);
  for (const key of ['errors', 'issues', 'warnings']) {
    if (Array.isArray(result[key])) assert.deepEqual(result[key], [], `${key} should be empty`);
  }

  for (const missionId of LIVE_MISSION_IDS) {
    assert.equal(getMission(missionId)?.id, missionId);
  }
  for (const worldId of LIVE_WORLD_IDS) {
    assert.equal(getWorld(worldId)?.id, worldId);
  }
  assert.ok(!getMission('not-a-mission'));
  assert.ok(!getWorld('not-a-world'));
});

test('subtraction mission classifies only subtraction sentences as correct', () => {
  const mission = getMission(4);
  assert.ok(mission.correct.every(answer => String(answer).includes('-')));
  assert.ok(mission.wrong.every(answer => !String(answer).includes('-')));
});

test('legacy profile fields migrate into canonical progression and drop invalid IDs', () => {
  const migrated = normalizeProgression({
    completed: [1, 11, 30, 999, 'not-a-mission', 1],
    unlockedMath: 3,
    unlockedWords: 12,
    unlockedSpanish: 22,
    lastMission: 12,
  });

  assert.deepEqual(sortedMissionIds(migrated.completedMissionIds), [1, 11, 30]);
  assert.deepEqual(sortedMissionIds(migrated.unlockedMissionIds), [1, 2, 3, 11, 12, 21, 22, 30]);
  assert.equal(migrated.lastMissionId, 12);
  assertValidMissionIds(migrated.completedMissionIds, 'completed');
  assertValidMissionIds(migrated.unlockedMissionIds, 'unlocked');

  const nested = normalizeProgression({
    progression: { completed: [2], unlocked: [1, 2, 11, 21], lastMission: 2 },
  });
  assert.deepEqual(sortedMissionIds(nested.completedMissionIds), [2]);
  assert.ok([1, 2, 11, 21].every(id => nested.unlockedMissionIds.includes(id)));
  assertValidMissionIds(nested.unlockedMissionIds, 'nested unlocked');
  assert.equal(nested.lastMissionId, 2);
});

test('normalization removes invalid completed, unlocked, and last mission IDs', () => {
  const normalized = normalizeProgression({
    completed: [1, 0, -1, 31, null, 'bad'],
    unlocked: [1, 11, 999, 'bad'],
    lastMission: 999,
  });

  assert.deepEqual(sortedMissionIds(normalized.completedMissionIds), [1]);
  assert.deepEqual(sortedMissionIds(normalized.unlockedMissionIds), [1, 2, 11, 21]);
  assert.ok(LIVE_MISSION_IDS.includes(normalized.lastMissionId));
  assertValidMissionIds(normalized.completedMissionIds, 'completed');
  assertValidMissionIds(normalized.unlockedMissionIds, 'unlocked');
});

test('new progression unlocks the first mission in every world only', () => {
  const progression = createProgression();
  assert.deepEqual(sortedMissionIds(progression.completedMissionIds), []);
  assert.deepEqual(sortedMissionIds(progression.unlockedMissionIds), [1, 11, 21]);

  for (const world of worlds) {
    const [first, second] = missionIdsForWorld(world);
    assert.equal(first, FIRST_MISSION_BY_WORLD[world.id]);
    assert.equal(isMissionUnlocked(progression, first), true);
    assert.equal(isMissionUnlocked(progression, second), false);
  }
});

test('mission completion unlocks the next mission in sequence and rejects locked missions', () => {
  for (const world of worlds) {
    const missionIds = missionIdsForWorld(world);
    let progression = createProgression();

    const skipped = completeMission(progression, missionIds[1]);
    assert.deepEqual(skipped, progression);
    assert.equal(isMissionUnlocked(skipped, missionIds[1]), false);

    for (let index = 0; index < missionIds.length; index += 1) {
      const missionId = missionIds[index];
      assert.equal(isMissionUnlocked(progression, missionId), true);
      progression = completeMission(progression, missionId);
      assert.deepEqual(sortedMissionIds(progression.completedMissionIds), sortedMissionIds(missionIds.slice(0, index + 1)));
      assert.equal(isMissionUnlocked(progression, missionId), true);
      if (index + 1 < missionIds.length) {
        assert.equal(isMissionUnlocked(progression, missionIds[index + 1]), true);
        if (index + 2 < missionIds.length) assert.equal(isMissionUnlocked(progression, missionIds[index + 2]), false);
      }
    }
    assert.deepEqual(sortedMissionIds(progression.completedMissionIds), sortedMissionIds(missionIds));
  }
});

test('replaying a completed mission is idempotent', () => {
  const first = worlds[0].missionIds[0];
  const missionId = idOf(first);
  const afterFirst = completeMission(createProgression(), missionId);
  const snapshot = structuredClone(afterFirst);
  const afterReplay = completeMission(afterFirst, missionId);

  assert.deepEqual(afterReplay, snapshot);
  assert.equal(afterReplay.completedMissionIds.filter(id => id === missionId).length, 1);
  assert.equal(afterReplay.unlockedMissionIds.filter(id => id === missionId).length, 1);
});

test('progression merges union completed and unlocked missions with deterministic last mission', () => {
  const local = {
    completed: [2, 1],
    unlocked: [3, 1, 2, 11],
    lastMission: 2,
  };
  const remote = {
    completed: [12, 11],
    unlocked: [13, 12, 11, 21],
    lastMission: 12,
  };

  const merged = mergeProgression(local, remote);
  assert.deepEqual(merged.completedMissionIds, [1, 2, 11, 12]);
  assert.deepEqual(merged.unlockedMissionIds, [1, 2, 3, 11, 12, 13, 21]);
  assert.equal(merged.lastMissionId, 2);
  assert.deepEqual(merged, mergeProgression(local, remote));

  const remotePreferred = mergeProgression(local, remote, { preferRemote: true });
  assert.deepEqual(remotePreferred.completedMissionIds, merged.completedMissionIds);
  assert.deepEqual(remotePreferred.unlockedMissionIds, merged.unlockedMissionIds);
  assert.equal(remotePreferred.lastMissionId, 12);
});
