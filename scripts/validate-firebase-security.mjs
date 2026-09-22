import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RULES_PATH = 'firebase/firestore.rules';

function compact(source) {
  return source.replace(/\/\/[^\n]*/g, ' ').replace(/\s+/g, ' ').trim();
}

function balancedDelimiters(source) {
  const pairs = new Map([['}', '{'], [')', '('], [']', '[']]);
  const stack = [];
  let quote = null;
  let escaped = false;
  let lineComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if ('{(['.includes(char)) stack.push(char);
    else if ('})]'.includes(char) && stack.pop() !== pairs.get(char)) return false;
  }
  return !quote && stack.length === 0;
}

function extractBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return '';
  const start = source.indexOf('{', markerIndex + marker.length);
  if (start < 0) return '';
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start + 1, index);
    }
  }
  return '';
}

function allowCondition(block, operation) {
  const match = block.match(new RegExp(`allow\\s+${operation}\\s*:\\s*if\\s*([\\s\\S]*?);`));
  return compact(match?.[1] || '');
}

function expect(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function validateFirebaseRulesSource(source) {
  const errors = [];
  const all = compact(source);
  expect(errors, balancedDelimiters(source), 'Rules delimiters or quoted strings are unbalanced.');
  expect(errors, /rules_version\s*=\s*'2'\s*;/.test(source), 'Rules must declare rules_version 2.');
  expect(errors, all.includes('match /{document=**} { allow read, write: if false; }'), 'Global default deny is missing.');
  expect(errors, !/allow\s+(?:read|write|read,\s*write)[^;]*request\.auth\s*!=\s*null[^;]*;/.test(source), 'An authenticated-user-only allow rule is overbroad.');

  const auth = compact(extractBlock(source, 'function signedInAs(familyId)'));
  expect(errors, auth.includes('request.auth != null') && auth.includes('request.auth.uid == familyId'), 'Family authentication must bind auth.uid to the path familyId.');

  const identifier = compact(extractBlock(source, 'function validIdentifier(value)'));
  expect(errors, identifier.includes("value.matches('^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$')"), 'Identifiers need a single string-only, character, and 128-character regex bound.');

  const familyValidator = compact(extractBlock(source, 'function validFamilyDocument(data, familyId)'));
  expect(errors, familyValidator.includes("data.keys().hasOnly(['ownerId', 'updatedAt'])"), 'Family documents need an exact schema.');
  expect(errors, familyValidator.includes('data.ownerId == familyId'), 'Family ownerId must match the path familyId.');
  expect(errors, familyValidator.includes('data.updatedAt is timestamp'), 'Family updatedAt must be a timestamp.');

  const progression = compact(extractBlock(source, 'function validProgression(data)'));
  expect(errors, progression.includes('data is map'), 'Progression must be typed as a map.');
  expect(errors, progression.includes('data.completedMissionIds is list') && progression.includes('data.completedMissionIds.size() <= 30'), 'Completed mission IDs need list and size bounds.');
  expect(errors, progression.includes('data.unlockedMissionIds is list') && progression.includes('data.unlockedMissionIds.size() <= 30'), 'Unlocked mission IDs need list and size bounds.');
  expect(errors, progression.includes('data.lastMissionId is int') && progression.includes('data.lastMissionId <= 30'), 'Last mission ID needs integer and range bounds.');

  const mastery = compact(extractBlock(source, 'function validMastery(data)'));
  expect(errors, mastery.includes("data.keys().hasOnly(['math', 'words', 'spanish'])"), 'Mastery needs an exact nested schema.');
  expect(errors, ['math', 'words', 'spanish'].every(key => mastery.includes(`data.${key} is number`) && mastery.includes(`data.${key} <= 100`)), 'Mastery values need numeric percentage bounds.');

  const settings = compact(extractBlock(source, 'function validSettings(data)'));
  expect(errors, settings.includes('data.keys().hasOnly(['), 'Settings need an exact nested schema.');
  expect(errors, settings.includes('data.reducedMotion is bool') && settings.includes('data.soundOn is bool'), 'Settings boolean fields must be typed.');
  expect(errors, settings.includes('data.textScale is string') && settings.includes('data.textScale.size() <= 8'), 'Settings strings need type and size bounds.');

  const controls = compact(extractBlock(source, 'function validControls(data)'));
  expect(errors, controls.includes('data.dailyMinutes is int') && controls.includes('data.dailyMinutes <= 240'), 'Daily time limit needs integer and range bounds.');
  expect(errors, controls.includes('data.maxSessionMinutes is int') && controls.includes('data.maxSessionMinutes <= 120'), 'Session time limit needs integer and range bounds.');
  expect(errors, controls.includes('data.maxSessionMinutes <= data.dailyMinutes'), 'Session limit cannot exceed the daily limit.');

  const learningCore = compact(extractBlock(source, 'function validLearningCore(data)'));
  expect(errors, learningCore.includes('data is map'), 'Learning core must be a map.');
  expect(errors, learningCore.includes("data.keys().hasOnly([ 'version', 'stage', 'completedStages', 'skills', 'mastery', 'rewards', 'rewardLedger', 'hub' ])"), 'Learning core needs the exact compact cloud allowlist.');
  for (const omitted of ['profileId', 'name', 'practice', 'sessions', 'settings', 'currentChallenge', 'activeActivity', 'saveMeta', 'recoverySnapshot', 'telemetry', 'offlineQueue', 'sentEventIds', 'contentQuarantine', 'quarantinedRecords']) {
    expect(errors, !learningCore.includes(`'${omitted}'`), `Learning core cloud schema must omit ${omitted}.`);
  }
  expect(errors, learningCore.includes('data.version is int') && learningCore.includes('data.version <= 100'), 'Learning core version needs integer bounds.');
  for (const [field, kind, limit] of [['completedStages', 'list', 32], ['skills', 'map', 200], ['mastery', 'map', 200], ['rewards', 'list', 200], ['rewardLedger', 'map', 200]]) {
    expect(errors, learningCore.includes(`data.${field} is ${kind}`) && learningCore.includes(`data.${field}.size() <= ${limit}`), `Learning core ${field} needs ${kind} and size bounds.`);
  }
  expect(errors, learningCore.includes('validLearningCoreHub(data.hub)'), 'Learning core hub must use its fixed schema validator.');

  const learningCoreHub = compact(extractBlock(source, 'function validLearningCoreHub(data)'));
  expect(errors, learningCoreHub.includes("data.keys().hasOnly([ 'variant', 'expansionUnlocked', 'visibleChangeCount', 'upgrades' ])"), 'Learning core hub needs an exact schema.');
  expect(errors, learningCoreHub.includes('data.expansionUnlocked is bool') && learningCoreHub.includes('data.upgrades is list') && learningCoreHub.includes('data.upgrades.size() <= 64'), 'Learning core hub fields need types and bounds.');

  const collections = compact(extractBlock(source, 'function validOptionalProfileCollections(data)'));
  for (const [field, limit] of [['programmableBits', 64], ['codeLabProjects', 50], ['codeBridgeLessons', 100], ['programmableBitLessons', 100], ['bubbleReefRewards', 8]]) {
    expect(errors, collections.includes(`data.${field} is map`) && collections.includes(`data.${field}.size() <= ${limit}`), `${field} needs map and size bounds.`);
  }

  const scalars = compact(extractBlock(source, 'function validOptionalProfileScalars(data)'));
  expect(errors, scalars.includes('data.equippedCosmetic is string') && scalars.includes('data.equippedCosmetic.size() <= 64'), 'equippedCosmetic needs a canonical string sentinel and size bound.');
  expect(errors, scalars.includes('data.activeProgrammableBitId is string') && scalars.includes('data.activeProgrammableBitId.size() <= 32'), 'activeProgrammableBitId needs a canonical string sentinel and size bound.');
  expect(errors, scalars.includes('data.updatedAt is number') && scalars.includes('data.updatedAt >= 0'), 'updatedAt needs a required non-negative numeric value.');

  const live = compact(extractBlock(source, 'function validLiveProgress(data, profileId, displayName)'));
  expect(errors, live.includes('data is map'), 'Live progress must be a map.');
  expect(errors, live.includes('let keys = data.keys()') && live.includes('keys.hasOnly(['), 'Live progress needs one cached key set and an exact allowlist.');
  expect(errors, live.includes("keys.hasOnly([ 'id', 'name', 'score', 'stars', 'spark', 'progression', 'learningCore', 'bestCombo', 'bite', 'unlockedBites', 'cosmetics', 'equippedCosmetic', 'programmableBits', 'activeProgrammableBitId', 'mastery', 'skills', 'mistakes', 'practice', 'snap', 'sessions', 'settings', 'controls', 'updatedAt', 'codeLabProjects', 'codeBridgeLessons', 'programmableBitLessons', 'bubbleReefRewards' ])"), 'Live progress needs the exact canonical field allowlist and resulting key-count bound.');
  for (const secret of ['parentPin', 'parentAuth', 'pinHash', 'pinSalt', 'password', 'idToken', 'refreshToken']) {
    expect(errors, live.includes(`'${secret}'`), `Live progress must explicitly reject ${secret}.`);
  }
  expect(errors, live.includes("!keys.hasAny([ 'parentPin', 'parentAuth', 'pinHash', 'pinSalt', 'password', 'idToken', 'refreshToken' ])"), 'Secret fields must be rejected as one enforceable invariant.');
  expect(errors, !live.includes("'deleted'") && !live.includes("'deletedAt'"), 'The exact live-progress allowlist must reject tombstone fields.');
  expect(errors, live.includes('data.id == profileId') && live.includes('data.name == displayName'), 'Nested profile identifiers must match the document envelope.');
  for (const field of ['score', 'stars', 'spark', 'bestCombo']) {
    expect(errors, live.includes(`data.${field} is number`) && live.includes(`data.${field} <=`), `${field} needs numeric bounds.`);
  }
  for (const [field, kind, limit] of [['unlockedBites', 'list', 32], ['cosmetics', 'list', 128], ['skills', 'map', 200], ['mistakes', 'list', 100], ['practice', 'list', 100], ['sessions', 'list', 100]]) {
    expect(errors, live.includes(`data.${field} is ${kind}`) && live.includes(`data.${field}.size() <= ${limit}`), `${field} needs ${kind} and size bounds.`);
  }
  expect(errors, live.includes('data.snap is list') && live.includes('data.snap.size() == 0'), 'Snap data must be an empty list in production cloud progress.');
  for (const validator of ['validProgression', 'validMastery', 'validSettings', 'validControls', 'validLearningCore', 'validOptionalProfileCollections', 'validOptionalProfileScalars']) {
    expect(errors, live.includes(`${validator}(`), `Live progress must call ${validator}.`);
  }
  expect(errors, live.includes('validLearningCore(data.learningCore)'), 'Live progress must require the compact Learning Core map.');

  const tombstone = compact(extractBlock(source, 'function validTombstone(data, profileId)'));
  expect(errors, tombstone.includes("data.keys().hasOnly(['id', 'deleted', 'deletedAt'])"), 'Tombstones need an exact three-field schema.');
  expect(errors, tombstone.includes('data.id == profileId'), 'Tombstone ID must match the profile path.');
  expect(errors, tombstone.includes('data.deleted is bool') && tombstone.includes('data.deleted == true'), 'Tombstone deleted must be true and typed.');
  expect(errors, tombstone.includes('data.deletedAt is int') && tombstone.includes('data.deletedAt >= 0'), 'Tombstone deletedAt needs integer and range bounds.');

  const envelope = compact(extractBlock(source, 'function validProfileDocument(data, profileId, familyId)'));
  expect(errors, envelope.includes("data.keys().hasOnly([ 'ownerId', 'displayName', 'clientProfileId', 'progress', 'clientUpdatedAt' ])"), 'Profile documents need an exact envelope schema.');
  expect(errors, envelope.includes('data.ownerId == familyId'), 'Profile ownerId must match the family path.');
  expect(errors, envelope.includes('data.clientProfileId == profileId'), 'clientProfileId must match the profile path.');
  expect(errors, envelope.includes('data.progress is map') && envelope.includes('data.progress.id == data.clientProfileId'), 'Nested progress ID must match the validated clientProfileId.');
  expect(errors, envelope.includes('data.clientUpdatedAt is timestamp'), 'clientUpdatedAt must be a timestamp.');
  expect(errors, envelope.includes('data.clientUpdatedAt.toMillis() == data.progress.deletedAt'), 'Tombstone timestamp must agree with deletedAt.');
  expect(errors, envelope.includes('validLiveProgress(') && envelope.includes('validTombstone('), 'Envelope must validate both live and tombstone schemas.');

  const storedTombstone = compact(extractBlock(source, 'function isStoredTombstone(data)'));
  expect(errors, storedTombstone.includes('data.progress is map') && storedTombstone.includes("data.progress.get('deleted', false) == true"), 'Stored tombstone detection must default missing deletion state to false and require true.');

  const family = extractBlock(source, 'match /families/{familyId}');
  const profile = extractBlock(family, 'match /profiles/{profileId}');
  const familyPrefix = family.slice(0, family.indexOf('match /profiles/{profileId}'));
  const familyRead = allowCondition(familyPrefix, 'read');
  const familyCreate = allowCondition(familyPrefix, 'create');
  const familyUpdate = allowCondition(familyPrefix, 'update');
  const familyDelete = allowCondition(familyPrefix, 'delete');
  expect(errors, familyRead.includes('signedInAs(familyId)') && familyRead.includes('resource.data.ownerId == request.auth.uid'), 'Family reads need path and stored-owner checks.');
  expect(errors, familyCreate.includes('signedInAs(familyId)') && familyCreate.includes('validFamilyDocument('), 'Family creates need authentication and schema validation.');
  expect(errors, familyUpdate.includes('request.resource.data.ownerId == resource.data.ownerId'), 'Family ownerId must be immutable.');
  expect(errors, familyDelete === 'false', 'Client family deletion must be denied because it does not cascade profiles.');

  const profileRead = allowCondition(profile, 'read');
  const profileCreate = allowCondition(profile, 'create');
  const profileUpdate = allowCondition(profile, 'update');
  const profileDelete = allowCondition(profile, 'delete');
  expect(errors, profileRead.includes('signedInAs(familyId)') && profileRead.includes('resource.data.ownerId == request.auth.uid') && profileRead.includes('resource.data.clientProfileId == profileId'), 'Profile reads need family, stored-owner, and path-ID checks.');
  expect(errors, profileCreate.includes('signedInAs(familyId)') && profileCreate.includes('validProfileDocument('), 'Profile creates need authentication and full validation.');
  expect(errors, profileUpdate.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly([ 'displayName', 'progress', 'clientUpdatedAt' ])"), 'Profile ownerId and clientProfileId must be immutable through an exact mutable-field diff allowlist.');
  expect(errors, profileUpdate.includes('validProfileDocument('), 'Profile updates need full schema validation.');
  expect(errors, profileUpdate.includes('!isStoredTombstone(resource.data)') && profileUpdate.includes('request.resource.data == resource.data'), 'Stored tombstones must allow only identical idempotent retries.');
  expect(errors, profileDelete === 'false', 'Physical profile deletion must be denied to preserve authoritative tombstones.');

  return errors;
}

export function validateFirebaseRulesFile(rulesPath = RULES_PATH) {
  const source = fs.readFileSync(rulesPath, 'utf8');
  return validateFirebaseRulesSource(source);
}

function runCli() {
  const errors = validateFirebaseRulesFile();
  if (errors.length) {
    for (const error of errors) console.error(`Firebase security contract: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log('Firebase ownership, schema bounds, secret rejection, and tombstone invariants validated structurally.');
  console.log('Run tests/firebase-security-rules.test.mjs with FIRESTORE_EMULATOR_HOST for executable rule behavior evidence.');
}

const isDirect = path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (isDirect) runCli();
