import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { validateFirebaseRulesSource } from '../scripts/validate-firebase-security.mjs';

const source = fs.readFileSync('firebase/firestore.rules', 'utf8');

function mutated(from, to = '') {
  if (source.includes(from)) return source.replace(from, to);
  // Original conjunctive fixtures still target the same executable checks.
  const escape = value => [...value].map(char => '\\^$.*+?()[]{}|'.includes(char) ? '\\' + char : char).join('');
  const pattern = from.replaceAll('&&', ',').trim().split(/\s+/).map(escape).join('\\s*');
  const target = new RegExp(pattern).exec(source)?.[0];
  assert.ok(target, `mutation target must exist: ${from}`);
  return source.replace(target, to.replaceAll('&&', ','));
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

test('the pinned reviewed source rejects semantic relaxations, quoted decoys, and even comment edits', () => {
  const authReturn = 'return request.auth != null && request.auth.uid == familyId;';
  const profileGetRead = `allow get: if signedInAs(familyId)
          && resource.data.ownerId == request.auth.uid
          && resource.data.clientProfileId == profileId;`;
  const familyCreate = `allow create: if signedInAs(familyId)
        && validFamilyDocument(request.resource.data, familyId);`;
  const attacks = [
    ['profile document read OR true', profileGetRead, profileGetRead.replace(';', ' || true;')],
    ['family create OR signed-in user', familyCreate, familyCreate.replace(';', ' || signedInAs(familyId);')],
    ['auth helper OR true', authReturn, 'return true || (request.auth != null && request.auth.uid == familyId);'],
    ['auth requirements inside quoted strings', authReturn,
      "return 'request.auth != null && request.auth.uid == familyId' == 'request.auth != null && request.auth.uid == familyId';"],
    ['owner requirement inside quoted strings', '&& data.ownerId == familyId',
      "&& 'data.ownerId == familyId' == 'data.ownerId == familyId'"],
    // A raw-source digest also pins comments: harmless edits incur an intentional audit cost.
    ['comment edit', '// A profile is deleted by replacing it with a permanent tombstone.',
      '// A profile is deleted by replacing it with a permanent tombstone. Reviewed comment edit.'],
  ];
  for (const [label, before, after] of attacks) {
    assert.match(validateFirebaseRulesSource(mutated(before, after)).join('\n'),
      /pinned reviewed SHA-256 contract; intentional audited rule changes must update/, label);
  }
});

test('an appended duplicate profile matcher cannot bypass the owner check', () => {
  const duplicate = source.replace(
    `        allow delete: if false;
      }
    }

    match /{document=**} {`,
    `        allow delete: if false;
      }

      match /profiles/{profileId} {
        allow read: if true;
      }
    }

    match /{document=**} {`,
  );
  assert.notEqual(duplicate, source);
  assert.match(validateFirebaseRulesSource(duplicate).join('\n'), /exactly one nested \/profiles/);
});

test('composite and additive profile grants are rejected', () => {
  const marker = `        allow delete: if false;\n      }\n    }\n\n    match /{document=**}`;
  for (const grant of ['allow read, write: if true;', 'allow write: if true;']) {
    const mutatedSource = source.replace(marker, `        allow delete: if false;\n        ${grant}\n      }\n    }\n\n    match /{document=**}`);
    assert.notEqual(mutatedSource, source);
    assert.match(validateFirebaseRulesSource(mutatedSource).join('\n'), /single-operation|exactly one/);
  }
});

test('commented secure function and allow clauses cannot mask insecure executable rules', () => {
  const insecureFunction = source.replace(
    `function signedInAs(familyId) {\n      return request.auth != null && request.auth.uid == familyId;\n    }`,
    `function signedInAs(familyId) {\n      /* return request.auth != null && request.auth.uid == familyId; */\n      return true;\n    }`,
  );
  assert.match(validateFirebaseRulesSource(insecureFunction).join('\n'), /Family authentication/);

  const insecureAllow = source.replace(
    `        allow get: if signedInAs(familyId)\n          && resource.data.ownerId == request.auth.uid\n          && resource.data.clientProfileId == profileId;`,
    `        /* allow get: if signedInAs(familyId)\n          && resource.data.ownerId == request.auth.uid\n          && resource.data.clientProfileId == profileId; */\n        allow get: if true;`,
  );
  assert.notEqual(insecureAllow, source);
  assert.match(validateFirebaseRulesSource(insecureAllow).join('\n'), /Profile document reads/);
});

test('unterminated block comments and strings fail closed', () => {
  const unterminatedComment = `${source}\n/*`;
  assert.match(validateFirebaseRulesSource(unterminatedComment).join('\n'), /unterminated block comment/);

  const unterminatedString = source.replace(
    "value.matches('^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$')",
    "value.matches('^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$)",
  );
  assert.match(validateFirebaseRulesSource(unterminatedString).join('\n'), /unterminated block comment or quoted string/);
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
  "keys.size() == (('currencyLedger' in data) ? 28 : 27)",
  "keys.size() >= (('currencyLedger' in data) ? 28 : 27)",
);

rejectsMutation(
  'secret fields remain explicitly rejected from cloud progress',
  "keys.size() == (('currencyLedger' in data) ? 28 : 27)",
  "keys.size() == (('currencyLedger' in data) ? 29 : 28)",
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
  'resource.data.ownerId == familyId',
);

rejectsMutation(
  'client profile ID remains immutable on profile updates',
  '&& resource.data.clientProfileId == profileId',
);

rejectsMutation('profile update schema stays within the exact envelope allowlist', 'data.keys().size() == 5', 'data.keys().size() <= 6');

test('tombstones keep an exact schema', () => {
  const block = /function validTombstone\(data, profileId\) \{[\s\S]*?\n    \}/.exec(source)[0];
  const weakened = source.replace(block, block.replace('data.keys().size() == 3', 'data.keys().size() <= 4'));
  assert.notEqual(weakened, source);
  assert.equal(validateFirebaseRulesSource(weakened).some(error => error.includes('validTombstone needs its exact field count')), true);
});

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

rejectsMutation('Learning Core cannot admit local-only offline queues', 'data.keys().size() == 8', 'data.keys().size() <= 9');

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

  const changedOwner = profileEnvelope(updated);
  changedOwner.ownerId = 'family-b';
  assert.equal((await request('family-a', 'PATCH', changedOwner)).status, 403, 'owner ID is immutable');

  const changedClientProfileId = profileEnvelope(updated);
  changedClientProfileId.clientProfileId = `${profileId}-other`;
  assert.equal((await request('family-a', 'PATCH', changedClientProfileId)).status, 403, 'client profile ID is immutable');

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

  const nonStringClientId = profileEnvelope(structuredClone(live));
  nonStringClientId.clientProfileId = 7;
  nonStringClientId.progress.id = 7;
  assert.equal((await request('family-a', 'PATCH', nonStringClientId)).status, 403, 'non-string client profile ID is rejected');

  const wrongTimestamp = profileEnvelope(live);
  wrongTimestamp.clientUpdatedAt = 'not-a-timestamp';
  assert.equal((await request('family-a', 'PATCH', wrongTimestamp)).status, 403, 'untyped clientUpdatedAt is rejected');

  const denyRootShapeMutations = async baseline => {
    const fields = Object.keys(baseline).filter(key => key !== 'currencyLedger');
    assert.equal(fields.length, 27, 'every root base field is mandatory');
    for (const key of fields) for (const replacement of [false, true]) {
      const envelope = profileEnvelope(structuredClone(baseline)), target = envelope.progress, value = target[key];
      delete target[key]; if (replacement) target.unexpectedRootField = value;
      assert.equal((await request('family-a', 'PATCH', envelope)).status, 403, 'root ' + key + (replacement ? ' substitution' : ' missing') + (baseline.currencyLedger ? ' with ledger' : ' legacy'));
    }
    for (const key of ['unexpectedRootField', 'parentPin', 'deleted', 'deletedAt']) {
      const envelope = profileEnvelope(structuredClone(baseline)); envelope.progress[key] = true;
      assert.equal((await request('family-a', 'PATCH', envelope)).status, 403, 'extra root ' + key + (baseline.currencyLedger ? ' with ledger' : ' legacy'));
    }
  };
  await denyRootShapeMutations(live);

  const upgraded = structuredClone(live);
  upgraded.currencyLedger = { version: 1, profileId, legacy: { score: 0, stars: 0, spark: 0 }, missions: '0'.repeat(30), preview: '0', purchases: '0000', writers: '{}' };
  const upgradeResponse = await request('family-a', 'PATCH', profileEnvelope(upgraded));
  assert.equal(upgradeResponse.status, 200, 'owner may upgrade an existing legacy save: ' + (upgradeResponse.status === 200 ? '' : await upgradeResponse.text()));
  assert.equal((await request('family-a', 'PATCH', profileEnvelope(live))).status, 403, 'an old client cannot discard upgraded currency provenance');
  await denyRootShapeMutations(upgraded);
  const newProfileId = profileId + '-fresh', newProfile = structuredClone(upgraded);
  newProfile.id = newProfileId;
  const createLedgerDocument = progress => fetch(url.replace(profileId, newProfileId) + '?currentDocument.exists=false', { method: 'PATCH', headers: { Authorization: 'Bearer ' + tokenFor('family-a'), 'Content-Type': 'application/json' }, body: JSON.stringify(firestoreDocument(profileEnvelope(progress))) });
  assert.equal((await createLedgerDocument(newProfile)).status, 403, 'create must deny cross-profile currency ownership');
  newProfile.currencyLedger.profileId = newProfileId;
  const createLedgerResponse = await createLedgerDocument(newProfile);
  assert.equal(createLedgerResponse.status, 200, 'new ledger profile creates within evaluator budget: ' + (createLedgerResponse.status === 200 ? '' : await createLedgerResponse.text()));
  for (const [label, mutate] of [
    ['currency profile ownership', profile => { profile.currencyLedger.profileId = 'sibling'; }],
    ['currency version', profile => { profile.currencyLedger.version = 2; }],
    ['currency legacy type', profile => { profile.currencyLedger.legacy.spark = '0'; }],
    ['currency legacy bounds', profile => { profile.currencyLedger.legacy.score = -1; }],
    ['currency mission receipt size', profile => { profile.currencyLedger.missions = '0'.repeat(31); }],
    ['currency mission receipt value', profile => { profile.currencyLedger.missions = 'x'.repeat(30); }],
    ['currency purchase receipt size', profile => { profile.currencyLedger.purchases = '00000'; }],
    ['currency writer bounds', profile => { profile.currencyLedger.writers = 'x'.repeat(131073); }],
    ['currency mission type', profile => { profile.currencyLedger.missions = 0; }],
    ['currency preview type', profile => { profile.currencyLedger.preview = null; }],
    ['currency purchase type', profile => { profile.currencyLedger.purchases = []; }],
    ['currency writer type', profile => { profile.currencyLedger.writers = {}; }],
    ['currency fractional baseline', profile => { profile.currencyLedger.legacy.spark = 0.5; }],
    ['currency excessive baseline', profile => { profile.currencyLedger.legacy.stars = 1000000001; }],
    ['currency extra fields', profile => { profile.currencyLedger.secret = 'hidden'; }],
  ]) {
    const invalid = structuredClone(upgraded); mutate(invalid);
    assert.equal((await request('family-a', 'PATCH', profileEnvelope(invalid))).status, 403, label + ' is rejected');
  }


  // Every renamed field keeps the count unchanged, proving mandatory accesses
  // still deny substitutions; extra fields prove exact counts cannot grow.
  for (const mapName of ['progression', 'mastery', 'settings', 'controls', 'learningCore', 'currencyLedger', 'learningCore.hub', 'currencyLedger.legacy']) {
    const at = profile => mapName.split('.').reduce((value, key) => value[key], profile);
    for (const key of Object.keys(at(upgraded))) {
      for (const replacement of [false, true]) {
        const invalid = structuredClone(upgraded), target = at(invalid), value = target[key];
        delete target[key];
        if (replacement) target.unexpectedField = value;
        assert.equal((await request('family-a', 'PATCH', profileEnvelope(invalid))).status, 403, mapName + '.' + key + (replacement ? ' substitution' : ' missing'));
      }
    }
    const extra = structuredClone(upgraded); at(extra).unexpectedField = true;
    assert.equal((await request('family-a', 'PATCH', profileEnvelope(extra))).status, 403, mapName + ' extra field');
  }

  const deletedAt = Date.now();
  const tombstone = profileEnvelope({ id: profileId, deleted: true, deletedAt });
  assert.equal((await request('family-a', 'PATCH', tombstone)).status, 200, 'owner can replace live progress with a tombstone');
  assert.equal((await request('family-a', 'PATCH', tombstone)).status, 200, 'an identical tombstone retry is idempotent');
  assert.equal((await request('family-a', 'PATCH', profileEnvelope(live))).status, 403, 'a tombstone cannot be un-deleted');
  assert.equal((await request('family-a', 'DELETE')).status, 403, 'physical delete cannot erase the tombstone');
});

test('currency rules pin profile ownership, bounds and old-client downgrade refusal', () => {
  for (const clause of [
    'data.profileId == profileId',
    'data.missions is string',
    "data.missions.matches('[0le]{30}')",
    'data.purchases is string',
    "data.purchases.matches('[0le]{4}')",
    'data.writers is string',
    'data.writers.size() <= 131072',
    '&& validCurrencyTransition(resource.data, request.resource.data)',
  ]) assert.equal(source.includes(clause), true, clause);
});

test('currency fields cannot hide removed range or ownership guards', () => {
  for (const [from, to] of [['data.legacy.score <= 1000000000', 'true'], ['data.profileId == profileId', 'true']]) {
    const errors = validateFirebaseRulesSource(mutated(from, to));
    assert.equal(errors.some(error => !error.includes('pinned reviewed SHA-256')), true, from);
  }
});

test('currency guard cannot be removed from either actual write grant', () => {
  const guard = "          && (!('currencyLedger' in request.resource.data.progress) || validCurrencyLedger(request.resource.data.progress.currencyLedger, profileId))";
  for (const operation of ['create', 'update']) {
    const expression = new RegExp('allow ' + operation + ': if signedInAs\\(familyId\\)\\n          && [\\s\\S]*?;');
    const block = [...source.matchAll(new RegExp(expression.source, 'g'))].find(match => match[0].includes(guard))[0];
    const invalid = source.replace(block, block.replace(guard, ''));
    assert.notEqual(invalid, source);
    assert.equal(validateFirebaseRulesSource(invalid).some(error => error.includes('Profile ' + operation + ' must validate currency')), true);
  }
});
