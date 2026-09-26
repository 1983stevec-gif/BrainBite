import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { validateFirebaseRulesSource } from '../scripts/validate-firebase-security.mjs';

const source = fs.readFileSync('firebase/firestore.rules', 'utf8');

function mutated(from, to = '') {
  assert.equal(source.includes(from), true, `mutation target must exist: ${from}`);
  return source.replace(from, to);
}

function rejectsMutation(name, from, to = '') {
  test(name, () => {
    const errors = validateFirebaseRulesSource(mutated(from, to));
    assert.ok(errors.length > 0, 'mutated rules must fail the structural contract');
  });
}

test('current Firebase rules satisfy the complete static security contract', () => {
  assert.deepEqual(validateFirebaseRulesSource(source), []);
});

rejectsMutation(
  'family path ownership cannot be weakened to any authenticated user',
  'request.auth.uid == familyId',
  'request.auth.uid != null',
);

rejectsMutation(
  'global default deny cannot be removed',
  'allow read, write: if false;',
  'allow read, write: if request.auth != null;',
);

rejectsMutation(
  'clientUpdatedAt must remain a timestamp',
  'data.clientUpdatedAt is timestamp',
  'data.clientUpdatedAt != null',
);

rejectsMutation(
  'top-level progress key count remains bounded',
  `'programmableBitLessons', 'bubbleReefRewards'
        ])`,
  `'programmableBitLessons', 'bubbleReefRewards', 'unboundedExtension'
        ])`,
);

rejectsMutation(
  'secret fields remain explicitly rejected from cloud progress',
  `&& !keys.hasAny([
          'parentPin', 'parentAuth', 'pinHash', 'pinSalt', 'password',
          'idToken', 'refreshToken'
        ])`,
);

rejectsMutation(
  'profile ID must remain bound to its document path',
  '&& data.clientProfileId == profileId',
);

rejectsMutation(
  'nested progress ID must remain bound to its document path',
  '&& data.id == profileId',
);

rejectsMutation(
  'owner ID remains immutable on profile updates',
  `'displayName', 'progress', 'clientUpdatedAt'
          ])`,
  `'ownerId', 'displayName', 'progress', 'clientUpdatedAt'
          ])`,
);

rejectsMutation(
  'client profile ID remains immutable on profile updates',
  `'displayName', 'progress', 'clientUpdatedAt'
          ])`,
  `'displayName', 'clientProfileId', 'progress', 'clientUpdatedAt'
          ])`,
);

rejectsMutation(
  'tombstones keep an exact schema',
  "&& data.keys().hasOnly(['id', 'deleted', 'deletedAt'])",
);

rejectsMutation(
  'tombstone timestamps remain typed',
  '&& data.deletedAt is int && data.deletedAt >= 0',
  '&& data.deletedAt >= 0',
);

rejectsMutation(
  'stored tombstones cannot be changed or un-deleted',
  `&& ((!isStoredTombstone(resource.data))
            || request.resource.data == resource.data)`,
);

rejectsMutation(
  'physical profile deletion remains denied',
  `// A profile is deleted by replacing it with a permanent tombstone. A
        // privileged backend is required for full account-erasure cleanup.
        allow delete: if false;`,
  'allow delete: if signedInAs(familyId);',
);

rejectsMutation(
  'nested session history remains bounded',
  '&& data.sessions is list && data.sessions.size() <= 100',
  '&& data.sessions is list',
);

rejectsMutation(
  'Snap data remains absent from production cloud progress',
  '&& data.snap is list && data.snap.size() == 0',
  '&& data.snap is list',
);

rejectsMutation(
  'nested Learning Core skills remain typed and bounded',
  '&& data.skills is map && data.skills.size() <= 200',
  '&& data.skills is map',
);

rejectsMutation(
  'Learning Core cannot admit local-only offline queues',
  `'rewardLedger', 'hub'
        ])`,
  `'rewardLedger', 'hub', 'offlineQueue'
        ])`,
);

rejectsMutation(
  'time-control values remain typed and bounded',
  '&& data.dailyMinutes is int && data.dailyMinutes >= 1 && data.dailyMinutes <= 240',
  '&& data.dailyMinutes >= 1',
);

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
// CI sets REQUIRE_FIRESTORE_EMULATOR so a missing emulator fails instead of skipping silently.
if (process.env.REQUIRE_FIRESTORE_EMULATOR === '1') {
  test('the Firestore emulator is available when CI requires it', () => {
    assert.ok(emulatorHost, 'FIRESTORE_EMULATOR_HOST must be set (run under firebase emulators:exec)');
  });
}

function tokenFor(uid) {
  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'none', typ: 'JWT' });
  const payload = encode({
    iss: 'https://securetoken.google.com/demo-brainbite',
    aud: 'demo-brainbite',
    auth_time: now,
    user_id: uid,
    sub: uid,
    iat: now,
    exp: now + 3600,
    firebase: { identities: {}, sign_in_provider: 'custom' },
  });
  return `${header}.${payload}.`;
}

function firestoreValue(value) {
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return {
    mapValue: {
      fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, firestoreValue(nested)])),
    },
  };
}

function firestoreDocument(value) {
  return {
    fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, firestoreValue(nested)])),
  };
}

function liveProfile(id = 'profile-a') {
  const profile = {
    id,
    name: 'Cloud Kid',
    score: 0,
    stars: 0,
    spark: 0,
    progression: { version: 1, completedMissionIds: [], unlockedMissionIds: [1, 11, 21], lastMissionId: 1 },
    bestCombo: 0,
    bite: 'Nib',
    unlockedBites: ['Nib'],
    cosmetics: [],
    equippedCosmetic: '',
    programmableBits: {},
    activeProgrammableBitId: '',
    mastery: { math: 10, words: 10, spanish: 10 },
    skills: {},
    mistakes: [],
    practice: [],
    snap: [],
    sessions: [],
    settings: {
      reducedMotion: false,
      cameraMotionReduction: false,
      largeTargets: false,
      highContrast: false,
      captions: false,
      dyslexicFont: false,
      textScale: '1',
      qualityTier: 'balanced',
      soundOn: true,
      musicOn: false,
      enemySpeed: 'normal',
    },
    controls: {
      dailyMinutes: 30,
      maxSessionMinutes: 20,
      requireParentForSnap: false,
      requireParentForPractice: false,
    },
    codeLabProjects: {},
    codeBridgeLessons: {},
    programmableBitLessons: {},
    bubbleReefRewards: {},
    updatedAt: Date.now(),
  };
  profile.learningCore = {
    version: 5,
    stage: 'child-profile',
    completedStages: [],
    hub: { variant: 'starter', expansionUnlocked: false, visibleChangeCount: 0, upgrades: [] },
    mastery: {},
    skills: {},
    rewards: [],
    rewardLedger: {},
  };
  return profile;
}

function profileEnvelope(progress, familyId = 'family-a') {
  const deletedAt = progress.deletedAt;
  return {
    ownerId: familyId,
    displayName: progress.deleted ? '' : progress.name,
    clientProfileId: progress.id,
    progress,
    clientUpdatedAt: new Date(progress.deleted ? deletedAt : Date.now()),
  };
}

test('Firestore emulator enforces ownership, bounds, types, immutable IDs, and permanent tombstones', { skip: !emulatorHost }, async () => {
  const profileId = `rules-${Date.now()}`;
  const url = `http://${emulatorHost}/v1/projects/demo-brainbite/databases/(default)/documents/families/family-a/profiles/${profileId}`;
  const request = (uid, method, value, exists = method === 'PATCH' ? true : undefined) => fetch(`${url}${exists === undefined ? '' : `?currentDocument.exists=${exists}`}`, {
    method,
    headers: {
      Authorization: `Bearer ${tokenFor(uid)}`,
      'Content-Type': 'application/json',
    },
    body: value === undefined ? undefined : JSON.stringify(firestoreDocument(value)),
  });

  const live = liveProfile(profileId);
  assert.equal((await request('family-a', 'PATCH', profileEnvelope(live), false)).status, 200, 'owner creates valid live profile');
  assert.equal((await request('family-b', 'GET')).status, 403, 'another family cannot read profile');

  const updated = structuredClone(live);
  updated.score = 1;
  assert.equal((await request('family-a', 'PATCH', profileEnvelope(updated))).status, 200, 'owner updates valid live profile');

  for (const omittedField of ['practice', 'offlineQueue', 'profileId']) {
    const localOnlyCore = structuredClone(live);
    localOnlyCore.learningCore[omittedField] = omittedField === 'profileId' ? profileId : [];
    assert.equal((await request('family-a', 'PATCH', profileEnvelope(localOnlyCore))).status, 403, `Learning Core must reject local-only ${omittedField}`);
  }

  const secret = structuredClone(live);
  secret.parentPin = '1234';
  assert.equal((await request('family-a', 'PATCH', profileEnvelope(secret))).status, 403, 'secret-bearing progress is rejected');

  const oversized = structuredClone(live);
  oversized.sessions = Array.from({ length: 101 }, (_, index) => ({ id: `session-${index}` }));
  assert.equal((await request('family-a', 'PATCH', profileEnvelope(oversized))).status, 403, 'oversized history is rejected');

  const wrongPath = structuredClone(live);
  wrongPath.id = 'different-profile';
  assert.equal((await request('family-a', 'PATCH', profileEnvelope(wrongPath))).status, 403, 'nested ID mismatch is rejected');

  const wrongTypeMutations = [
    ['root score', profile => { profile.score = '0'; }],
    ['mastery percentage', profile => { profile.mastery.math = '10'; }],
    ['Learning Core hub visibleChangeCount', profile => { profile.learningCore.hub.visibleChangeCount = '0'; }],
    ['root updatedAt', profile => { profile.updatedAt = '0'; }],
  ];
  for (const [label, mutate] of wrongTypeMutations) {
    const wrongType = structuredClone(live);
    mutate(wrongType);
    assert.equal((await request('family-a', 'PATCH', profileEnvelope(wrongType))).status, 403, `${label} rejects the wrong type`);
  }

  const nonStringClientId = profileEnvelope(live);
  nonStringClientId.clientProfileId = 7;
  nonStringClientId.progress.id = 7;
  assert.equal((await request('family-a', 'PATCH', nonStringClientId)).status, 403, 'non-string client profile ID is rejected');

  const wrongTimestamp = profileEnvelope(live);
  wrongTimestamp.clientUpdatedAt = 'not-a-timestamp';
  assert.equal((await request('family-a', 'PATCH', wrongTimestamp)).status, 403, 'untyped clientUpdatedAt is rejected');

  const deletedAt = Date.now();
  const tombstone = profileEnvelope({ id: profileId, deleted: true, deletedAt });
  assert.equal((await request('family-a', 'PATCH', tombstone)).status, 200, 'owner can replace live progress with a tombstone');
  assert.equal((await request('family-a', 'PATCH', tombstone)).status, 200, 'an identical tombstone retry is idempotent');
  assert.equal((await request('family-a', 'PATCH', profileEnvelope(live))).status, 403, 'a tombstone cannot be un-deleted');
  assert.equal((await request('family-a', 'DELETE')).status, 403, 'physical delete cannot erase the tombstone');
});
