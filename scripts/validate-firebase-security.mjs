import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RULES_PATH = 'firebase/firestore.rules';
// Deliberately independent of the rules file at runtime: any reviewed rule change,
// including comments or line-ending changes, requires an explicit audited digest update.
const REVIEWED_RULES_SHA256 = '07443d2ff4e5320996fbbb2373349aa4728ffc19b7f4ba7e73708c58e9cb4aeb';

function sha256(source) {
  return crypto.createHash('sha256').update(source, 'utf8').digest('hex');
}

function compact(source) {
  return source.replace(/\s+/g, ' ').trim();
}

function sanitizeSource(source) {
  const output = Array(source.length).fill(' ');
  let state = 'code';
  let quote = null;
  let quoteStart = -1;
  let commentStart = -1;
  let escaped = false;
  let valid = true;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (state === 'line-comment') {
      if (char === '\n') {
        output[index] = '\n';
        state = 'code';
      }
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        index += 1;
        state = 'code';
      } else if (char === '\n') {
        output[index] = '\n';
      }
      continue;
    }
    if (state === 'string') {
      output[index] = char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) state = 'code';
      continue;
    }

    if (char === '/' && next === '/') {
      index += 1;
      state = 'line-comment';
      continue;
    }
    if (char === '/' && next === '*') {
      index += 1;
      commentStart = index - 1;
      state = 'block-comment';
      continue;
    }
    if (char === "'" || char === '"') {
      output[index] = char;
      quote = char;
      quoteStart = index;
      escaped = false;
      state = 'string';
      continue;
    }
    output[index] = char;
  }

  if (state === 'block-comment') {
    valid = false;
    for (let index = commentStart; index < output.length; index += 1) output[index] = ' ';
  } else if (state === 'string') {
    valid = false;
    for (let index = quoteStart; index < output.length; index += 1) output[index] = ' ';
  }

  return { source: output.join(''), valid };
}

function skipQuoted(source, index) {
  const quote = source[index];
  let escaped = false;
  for (let cursor = index + 1; cursor < source.length; cursor += 1) {
    const char = source[cursor];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === quote) return cursor + 1;
  }
  return source.length;
}

function balancedDelimiters(source) {
  const pairs = new Map([['}', '{'], [')', '('], [']', '[']]);
  const stack = [];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "'" || source[index] === '"') {
      index = skipQuoted(source, index) - 1;
      continue;
    }
    if ('{(['.includes(source[index])) stack.push(source[index]);
    else if ('})]'.includes(source[index]) && stack.pop() !== pairs.get(source[index])) return false;
  }
  return stack.length === 0;
}

function findMarker(source, marker) {
  for (let index = 0; index <= source.length - marker.length; index += 1) {
    if (source[index] === "'" || source[index] === '"') {
      index = skipQuoted(source, index) - 1;
      continue;
    }
    if (source.startsWith(marker, index)) return index;
  }
  return -1;
}

function extractBlock(source, marker) {
  const markerIndex = findMarker(source, marker);
  if (markerIndex < 0) return '';
  let start = markerIndex + marker.length;
  while (start < source.length) {
    if (source[start] === "'" || source[start] === '"') {
      start = skipQuoted(source, start);
      continue;
    }
    if (source[start] === '{') break;
    start += 1;
  }
  if (start >= source.length) return '';
  const end = findMatchingBrace(source, start);
  return end < 0 ? '' : source.slice(start + 1, end);
}

function skipIgnored(source, index) {
  return source[index] === "'" || source[index] === '"' ? skipQuoted(source, index) : index;
}

function findMatchingBrace(source, start) {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const next = skipIgnored(source, index);
    if (next !== index) {
      index = next - 1;
      continue;
    }
    if (source[index] === '{') depth += 1;
    else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function parseMatcherScopes(source) {
  const scopes = [];
  for (let index = 0; index < source.length; index += 1) {
    const next = skipIgnored(source, index);
    if (next !== index) {
      index = next - 1;
      continue;
    }
    if (!source.startsWith('match', index)
      || /[A-Za-z0-9_$]/.test(source[index - 1] || '')
      || /[A-Za-z0-9_$]/.test(source[index + 5] || '')) continue;

    const match = /^match\s+(\/(?:[^\s{}]|\{[^}]+\})+)\s*\{/.exec(source.slice(index));
    if (!match) return null;
    const bodyStart = index + match[0].length - 1;
    const bodyEnd = findMatchingBrace(source, bodyStart);
    if (bodyEnd < 0) return null;
    scopes.push({
      path: match[1],
      matchStart: index,
      bodyStart,
      bodyEnd,
    });
    index = bodyStart;
  }

  for (const scope of scopes) {
    scope.parent = scopes
      .filter(candidate => candidate !== scope
        && candidate.bodyStart < scope.matchStart
        && candidate.bodyEnd > scope.bodyEnd)
      .sort((left, right) => (left.bodyEnd - left.bodyStart) - (right.bodyEnd - right.bodyStart))[0] || null;
  }
  return scopes;
}

function isIdentifierChar(char) {
  return /[A-Za-z0-9_$]/.test(char || '');
}

function parseAllowDeclarations(source) {
  const declarations = [];
  let valid = true;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "'" || source[index] === '"') {
      index = skipQuoted(source, index) - 1;
      continue;
    }
    if (!source.startsWith('allow', index)
      || isIdentifierChar(source[index - 1])
      || isIdentifierChar(source[index + 5])) continue;

    let cursor = index + 5;
    while (/\s/.test(source[cursor] || '')) cursor += 1;
    const operationStart = cursor;
    while (cursor < source.length && source[cursor] !== ':') {
      if (source[cursor] === ';' || source[cursor] === '{' || source[cursor] === '}') {
        valid = false;
        break;
      }
      cursor += 1;
    }
    if (!valid || source[cursor] !== ':') {
      valid = false;
      break;
    }

    const operationText = source.slice(operationStart, cursor).trim();
    const operations = operationText ? operationText.split(',').map(operation => operation.trim()) : [];
    if (!operations.length || operations.some(operation => !['read', 'write', 'create', 'update', 'delete'].includes(operation))
      || new Set(operations).size !== operations.length) {
      valid = false;
      break;
    }

    cursor += 1;
    while (/\s/.test(source[cursor] || '')) cursor += 1;
    if (!source.startsWith('if', cursor) || isIdentifierChar(source[cursor - 1]) || isIdentifierChar(source[cursor + 2])) {
      valid = false;
      break;
    }
    cursor += 2;
    const conditionStart = cursor;
    while (cursor < source.length && source[cursor] !== ';') {
      if (source[cursor] === "'" || source[cursor] === '"') cursor = skipQuoted(source, cursor);
      else cursor += 1;
    }
    if (cursor >= source.length) {
      valid = false;
      break;
    }
    const condition = compact(source.slice(conditionStart, cursor));
    if (!condition) {
      valid = false;
      break;
    }
    declarations.push({ start: index, end: cursor + 1, operations, condition, scope: null });
    index = cursor;
  }
  return { declarations, valid };
}

function allowCondition(declarations, operation) {
  return declarations.find(declaration => declaration.operations.length === 1
    && declaration.operations[0] === operation)?.condition || '';
}

function declarationsInScope(declarations, scope) {
  return declarations.filter(declaration => declaration.scope === scope);
}

function expect(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function validateFirebaseRulesSource(source) {
  const errors = [];
  expect(errors, sha256(source) === REVIEWED_RULES_SHA256,
    'Rules source differs from the pinned reviewed SHA-256 contract; intentional audited rule changes must update the independent digest constant and regression tests.');
  const lexical = sanitizeSource(source);
  const executable = lexical.source;
  const all = compact(executable);
  expect(errors, lexical.valid, 'Rules contain an unterminated block comment or quoted string.');
  expect(errors, balancedDelimiters(executable), 'Rules delimiters or quoted strings are unbalanced.');
  expect(errors, /rules_version\s*=\s*'2'\s*;/.test(executable), 'Rules must declare rules_version 2.');
  expect(errors, all.includes('match /{document=**} { allow read, write: if false; }'), 'Global default deny is missing.');
  expect(errors, !/allow\s+(?:read|write|read,\s*write)[^;]*request\.auth\s*!=\s*null[^;]*;/.test(executable), 'An authenticated-user-only allow rule is overbroad.');

  const auth = compact(extractBlock(executable, 'function signedInAs(familyId)'));
  expect(errors, auth.includes('request.auth != null') && auth.includes('request.auth.uid == familyId'), 'Family authentication must bind auth.uid to the path familyId.');

  const identifier = compact(extractBlock(executable, 'function validIdentifier(value)'));
  expect(errors, identifier.includes("value.matches('^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$')"), 'Identifiers need a single string-only, character, and 128-character regex bound.');

  const familyValidator = compact(extractBlock(executable, 'function validFamilyDocument(data, familyId)'));
  expect(errors, familyValidator.includes("data.keys().hasOnly(['ownerId', 'updatedAt'])"), 'Family documents need an exact schema.');
  expect(errors, familyValidator.includes('data.ownerId == familyId'), 'Family ownerId must match the path familyId.');
  expect(errors, familyValidator.includes('data.updatedAt is timestamp'), 'Family updatedAt must be a timestamp.');

  const progression = compact(extractBlock(executable, 'function validProgression(data)'));
  expect(errors, progression.includes('data is map'), 'Progression must be typed as a map.');
  expect(errors, progression.includes('data.completedMissionIds is list') && progression.includes('data.completedMissionIds.size() <= 30'), 'Completed mission IDs need list and size bounds.');
  expect(errors, progression.includes('data.unlockedMissionIds is list') && progression.includes('data.unlockedMissionIds.size() <= 30'), 'Unlocked mission IDs need list and size bounds.');
  expect(errors, progression.includes('data.lastMissionId is int') && progression.includes('data.lastMissionId <= 30'), 'Last mission ID needs integer and range bounds.');

  const mastery = compact(extractBlock(executable, 'function validMastery(data)'));
  expect(errors, mastery.includes("data.keys().hasOnly(['math', 'words', 'spanish'])"), 'Mastery needs an exact nested schema.');
  expect(errors, ['math', 'words', 'spanish'].every(key => mastery.includes(`data.${key} is number`) && mastery.includes(`data.${key} <= 100`)), 'Mastery values need numeric percentage bounds.');

  const settings = compact(extractBlock(executable, 'function validSettings(data)'));
  expect(errors, settings.includes('data.keys().hasOnly(['), 'Settings need an exact nested schema.');
  expect(errors, settings.includes('data.reducedMotion is bool') && settings.includes('data.soundOn is bool'), 'Settings boolean fields must be typed.');
  expect(errors, settings.includes('data.textScale is string') && settings.includes('data.textScale.size() <= 8'), 'Settings strings need type and size bounds.');

  const controls = compact(extractBlock(executable, 'function validControls(data)'));
  expect(errors, controls.includes('data.dailyMinutes is int') && controls.includes('data.dailyMinutes <= 240'), 'Daily time limit needs integer and range bounds.');
  expect(errors, controls.includes('data.maxSessionMinutes is int') && controls.includes('data.maxSessionMinutes <= 120'), 'Session time limit needs integer and range bounds.');
  expect(errors, controls.includes('data.maxSessionMinutes <= data.dailyMinutes'), 'Session limit cannot exceed the daily limit.');

  const learningCore = compact(extractBlock(executable, 'function validLearningCore(data)'));
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

  const learningCoreHub = compact(extractBlock(executable, 'function validLearningCoreHub(data)'));
  expect(errors, learningCoreHub.includes("data.keys().hasOnly([ 'variant', 'expansionUnlocked', 'visibleChangeCount', 'upgrades' ])"), 'Learning core hub needs an exact schema.');
  expect(errors, learningCoreHub.includes('data.expansionUnlocked is bool') && learningCoreHub.includes('data.upgrades is list') && learningCoreHub.includes('data.upgrades.size() <= 64'), 'Learning core hub fields need types and bounds.');

  const collections = compact(extractBlock(executable, 'function validOptionalProfileCollections(data)'));
  for (const [field, limit] of [['programmableBits', 64], ['codeLabProjects', 50], ['codeBridgeLessons', 100], ['programmableBitLessons', 100], ['bubbleReefRewards', 8]]) {
    expect(errors, collections.includes(`data.${field} is map`) && collections.includes(`data.${field}.size() <= ${limit}`), `${field} needs map and size bounds.`);
  }

  const scalars = compact(extractBlock(executable, 'function validOptionalProfileScalars(data)'));
  expect(errors, scalars.includes('data.equippedCosmetic is string') && scalars.includes('data.equippedCosmetic.size() <= 64'), 'equippedCosmetic needs a canonical string sentinel and size bound.');
  expect(errors, scalars.includes('data.activeProgrammableBitId is string') && scalars.includes('data.activeProgrammableBitId.size() <= 32'), 'activeProgrammableBitId needs a canonical string sentinel and size bound.');
  expect(errors, scalars.includes('data.updatedAt is number') && scalars.includes('data.updatedAt >= 0'), 'updatedAt needs a required non-negative numeric value.');

  const live = compact(extractBlock(executable, 'function validLiveProgress(data, profileId, displayName)'));
  expect(errors, live.includes('data is map'), 'Live progress must be a map.');
  expect(errors, live.includes('let keys = data.keys()') && live.includes('keys.hasOnly(['), 'Live progress needs one cached key set and an exact allowlist.');
  expect(errors, live.includes("keys.hasOnly([ 'id', 'name', 'score', 'stars', 'spark', 'progression', 'learningCore', 'bestCombo', 'bite', 'unlockedBites', 'cosmetics', 'equippedCosmetic', 'programmableBits', 'activeProgrammableBitId', 'mastery', 'skills', 'mistakes', 'practice', 'snap', 'sessions', 'settings', 'controls', 'updatedAt', 'codeLabProjects', 'codeBridgeLessons', 'programmableBitLessons', 'bubbleReefRewards' ])"), 'Live progress needs the exact canonical field allowlist and resulting key-count bound.');
  for (const secret of ['parentPin', 'parentAuth', 'pinHash', 'pinSalt', 'password', 'idToken', 'refreshToken']) {
    expect(errors, !live.includes(`'${secret}'`), `Live progress allowlist must reject ${secret}.`);
  }
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

  const tombstone = compact(extractBlock(executable, 'function validTombstone(data, profileId)'));
  expect(errors, tombstone.includes("data.keys().hasOnly(['id', 'deleted', 'deletedAt'])"), 'Tombstones need an exact three-field schema.');
  expect(errors, tombstone.includes('data.id == profileId'), 'Tombstone ID must match the profile path.');
  expect(errors, tombstone.includes('data.deleted is bool') && tombstone.includes('data.deleted == true'), 'Tombstone deleted must be true and typed.');
  expect(errors, tombstone.includes('data.deletedAt is int') && tombstone.includes('data.deletedAt >= 0'), 'Tombstone deletedAt needs integer and range bounds.');

  const profileUpdateBound = compact(extractBlock(executable, 'function validProfileUpdate(previous, next, profileId, familyId)'));
  expect(errors, profileUpdateBound.includes('next.ownerId == previous.ownerId'), 'Profile ownerId must be immutable through updates.');
  expect(errors, profileUpdateBound.includes('next.clientProfileId == previous.clientProfileId'), 'Profile clientProfileId must be immutable through updates.');
  expect(errors, profileUpdateBound.includes('validProfileDocument(next, profileId, familyId)'), 'Profile updates must reuse the exact envelope and progress validator.');

  const envelope = compact(extractBlock(executable, 'function validProfileDocument(data, profileId, familyId)'));
  expect(errors, envelope.includes("data.keys().hasOnly([ 'ownerId', 'displayName', 'clientProfileId', 'progress', 'clientUpdatedAt' ])"), 'Profile documents need an exact envelope schema.');
  expect(errors, envelope.includes('data.ownerId == familyId'), 'Profile ownerId must match the family path.');
  expect(errors, envelope.includes('data.clientProfileId == profileId'), 'clientProfileId must match the profile path.');
  expect(errors, envelope.includes('data.progress is map') && envelope.includes('data.clientProfileId == profileId'), 'Progress and client profile IDs must be rooted in the profile path.');
  expect(errors, envelope.includes('data.clientUpdatedAt is timestamp'), 'clientUpdatedAt must be a timestamp.');
  expect(errors, envelope.includes('data.clientUpdatedAt.toMillis() == data.progress.deletedAt'), 'Tombstone timestamp must agree with deletedAt.');
  expect(errors, envelope.includes('validLiveProgress(') && envelope.includes('validTombstone('), 'Envelope must validate both live and tombstone schemas.');

  const storedTombstone = compact(extractBlock(executable, 'function isStoredTombstone(data)'));
  expect(errors, storedTombstone.includes('data.progress is map') && storedTombstone.includes("data.progress.get('deleted', false) == true"), 'Stored tombstone detection must default missing deletion state to false and require true.');

  const matcherScopes = parseMatcherScopes(executable);
  expect(errors, matcherScopes !== null, 'Every matcher scope must have a valid path and balanced body.');
  const scopes = matcherScopes || [];
  const allowDeclarations = parseAllowDeclarations(executable);
  for (const declaration of allowDeclarations.declarations) {
    declaration.scope = scopes
      .filter(scope => declaration.start > scope.bodyStart && declaration.end < scope.bodyEnd)
      .sort((left, right) => (left.bodyEnd - left.bodyStart) - (right.bodyEnd - right.bodyStart))[0] || null;
  }
  expect(errors, allowDeclarations.valid, 'Every allow declaration must name valid operations and a nonempty condition.');
  const rootMatchers = scopes.filter(scope => !scope.parent);
  const databaseRoot = rootMatchers.filter(scope => scope.path === '/databases/{database}/documents');
  expect(errors, databaseRoot.length === 1 && rootMatchers.length === 1, 'Rules must have exactly one database document matcher root.');

  const root = databaseRoot[0];
  const rootChildren = root ? scopes.filter(scope => scope.parent === root) : [];
  const globalMatchers = rootChildren.filter(scope => scope.path === '/{document=**}');
  const familyMatchers = rootChildren.filter(scope => scope.path === '/families/{familyId}');
  expect(errors, globalMatchers.length === 1, 'Rules must have exactly one global default-deny matcher.');
  expect(errors, familyMatchers.length === 1, 'Rules must have exactly one /families/{familyId} matcher.');
  expect(errors, root && rootChildren.length === 2, 'Rules must not contain unexpected top-level matcher scopes.');
  expect(errors, scopes.length === 4, 'Rules must contain only the intended matcher scopes.');

  const family = familyMatchers[0];
  const profileMatchers = family ? scopes.filter(scope => scope.parent === family && scope.path === '/profiles/{profileId}') : [];
  const familyChildren = family ? scopes.filter(scope => scope.parent === family) : [];
  expect(errors, profileMatchers.length === 1, 'Rules must have exactly one nested /profiles/{profileId} matcher.');
  expect(errors, family && familyChildren.length === 1, 'Rules must not contain unexpected nested family matcher scopes.');
  const global = globalMatchers[0];
  const profile = profileMatchers[0];
  const profileChildren = profile ? scopes.filter(scope => scope.parent === profile) : [];
  const globalChildren = global ? scopes.filter(scope => scope.parent === global) : [];
  expect(errors, global && globalChildren.length === 0, 'Global default-deny matcher must not contain nested scopes.');
  expect(errors, profile && profileChildren.length === 0, 'Profile matcher must not contain nested scopes.');

  const globalDeclarations = global ? declarationsInScope(allowDeclarations.declarations, global) : [];
  const familyDeclarations = family ? declarationsInScope(allowDeclarations.declarations, family) : [];
  const profileDeclarations = profile ? declarationsInScope(allowDeclarations.declarations, profile) : [];
  const unexpectedDeclarations = allowDeclarations.declarations.filter(declaration => !declaration.scope);
  expect(errors, unexpectedDeclarations.length === 0, 'Every allow declaration must be inside an intended matcher scope.');
  expect(errors, globalDeclarations.length === 1
    && globalDeclarations[0].operations.join(',') === 'read,write'
    && globalDeclarations[0].condition === 'false', 'Global default deny must be exactly one allow read, write: if false declaration.');
  expect(errors, familyDeclarations.length === 4
    && familyDeclarations.every(declaration => declaration.operations.length === 1), 'Family matcher must contain exactly one single-operation allow for each intended operation.');
  expect(errors, profileDeclarations.length === 4
    && profileDeclarations.every(declaration => declaration.operations.length === 1), 'Profile matcher must contain exactly one single-operation allow for each intended operation.');

  const familyRead = allowCondition(familyDeclarations, 'read');
  const familyCreate = allowCondition(familyDeclarations, 'create');
  const familyUpdate = allowCondition(familyDeclarations, 'update');
  const familyDelete = allowCondition(familyDeclarations, 'delete');
  expect(errors, familyRead.includes('signedInAs(familyId)') && familyRead.includes('resource.data.ownerId == request.auth.uid'), 'Family reads need path and stored-owner checks.');
  expect(errors, familyCreate.includes('signedInAs(familyId)') && familyCreate.includes('validFamilyDocument('), 'Family creates need authentication and schema validation.');
  expect(errors, familyUpdate.includes('request.resource.data.ownerId == resource.data.ownerId'), 'Family ownerId must be immutable.');
  expect(errors, familyDelete === 'false', 'Client family deletion must be denied because it does not cascade profiles.');

  const profileRead = allowCondition(profileDeclarations, 'read');
  const profileCreate = allowCondition(profileDeclarations, 'create');
  const profileUpdate = allowCondition(profileDeclarations, 'update');
  const profileDelete = allowCondition(profileDeclarations, 'delete');
  expect(errors, profileRead.includes('signedInAs(familyId)') && profileRead.includes('resource.data.ownerId == request.auth.uid') && profileRead.includes('resource.data.clientProfileId == profileId'), 'Profile reads need family, stored-owner, and path-ID checks.');
  expect(errors, profileCreate.includes('signedInAs(familyId)') && profileCreate.includes('validProfileDocument('), 'Profile creates need authentication and full validation.');
  expect(errors, profileUpdate.includes('validProfileUpdate(resource.data, request.resource.data, profileId, familyId)'), 'Profile updates must use the bounded mutable-field allowlist.');
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
  console.log('Firebase reviewed-source SHA-256, ownership, schema bounds, secret rejection, and tombstone invariants validated structurally.');
  console.log('Run tests/firebase-security-rules.test.mjs with FIRESTORE_EMULATOR_HOST for executable rule behavior evidence.');
}

const isDirect = path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (isDirect) runCli();
