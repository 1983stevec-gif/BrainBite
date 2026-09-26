import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITY_FAMILIES,
  OFFLINE_QUEUE_LIMIT,
  SENT_EVENT_ID_LIMIT,
  CURRICULUM_ITEM_TEMPLATES,
  buildAdaptiveSession,
  createFoundationState,
  createCurriculumChallenge,
  createKnowledgePlatformChallenge,
  createLetterTrailChallenge,
  createRecoverySnapshot,
  createTargetSmashChallenge,
  createApprovedCurriculumChallenge,
  createCurriculumTaxonomy,
  defaultLearner,
  createSkillState,
  scoreAttempt,
  curriculumSkillsForGrade,
  findCurriculumSkill,
  exportFoundationEnvelope,
  contentManifest,
  buildCurriculumSession,
  buildParentInsights,
  grantBrainifact,
  importFoundationEnvelope,
  isSkillStale,
  loadFoundationState,
  mergeSkillStates,
  evidenceProvenanceSources,
  normalizeFoundationState,
  persistFoundationState,
  recordHomeworkAttempt,
  queueOfflineEvent,
  recordBossVictory,
  recordLearnerAttempt,
  remediateChallenge,
  replayOfflineQueue,
  resolveKnowledgePlatformChoice,
  resolveLetterTrailChoice,
  resolveTargetSmashResult,
  restoreFromRecoverySnapshot,
  scheduleReview,
  selectDueSkills,
  selectStaleSkills,
  setStageComplete,
  scoreContentQuality,
  resolveMissionChallenge,
  validateCurriculumTaxonomy,
  validateGeneratedChallenge,
  verifyCurriculumAnswer,
  upgradeBrainBase,
  validateContentBundle,
} from '../brainbite-core.mjs';

function makeStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

function hasDirectNestedArray(value) {
  if (Array.isArray(value)) {
    if (value.some(child => Array.isArray(child))) return true;
    return value.some(hasDirectNestedArray);
  }
  return !!value && typeof value === 'object' && Object.values(value).some(hasDirectNestedArray);
}

test('independent success carries more mastery evidence than assisted success', () => {
  const base = defaultLearner('Ada', 'profile-a');
  const assisted = recordLearnerAttempt(base, 'number-facts', {
    correct: true,
    assisted: true,
    hintsUsed: 2,
    responseTimeMs: 4200,
  }, { id: 'number-facts' });
  const independent = recordLearnerAttempt(base, 'number-facts', {
    correct: true,
    independent: true,
    responseTimeMs: 1800,
  }, { id: 'number-facts' });
  assert.ok(independent.skills['number-facts'].masteryScore > assisted.skills['number-facts'].masteryScore);
  assert.ok(independent.skills['number-facts'].confidence > assisted.skills['number-facts'].confidence);
});

test('same-skill cloud branches merge unique evidence without double-counting shared attempts', () => {
  let learner = defaultLearner('Ada', 'profile-a');
  learner = recordLearnerAttempt(learner, 'number-facts', {
    id: 'shared-attempt', originId: 'shared-origin', originSequence: 1,
    correct: true, independent: true, responseTimeMs: 1800, at: 100,
  }, { id: 'number-facts' });
  const left = recordLearnerAttempt(learner, 'number-facts', {
    id: 'left-attempt', originId: 'left-origin', originSequence: 1,
    correct: true, independent: true, responseTimeMs: 1700, at: 200,
  }, { id: 'number-facts' });
  const right = recordLearnerAttempt(learner, 'number-facts', {
    id: 'right-attempt', originId: 'right-origin', originSequence: 1,
    correct: false, independent: true, responseTimeMs: 2300, at: 300,
  }, { id: 'number-facts' });
  const merged = mergeSkillStates(left.skills['number-facts'], right.skills['number-facts'], { preferRight: true });
  assert.equal(merged.evidence.attempts, 3);
  assert.equal(merged.evidence.independentSuccesses, 2);
  assert.equal(merged.evidence.incorrectAttempts, 1);
  assert.equal(merged.recentPerformance.length, 3);
  assert.deepEqual(mergeSkillStates(merged, right.skills['number-facts'], { preferRight: true }).evidence, merged.evidence);
});

test('bounded cloud branches preserve all canonical hidden attempts after their visible histories diverge', () => {
  let shared = defaultLearner('Ada', 'profile-bounded-merge');
  for (let index = 0; index < 20; index += 1) {
    shared = recordLearnerAttempt(shared, 'number-facts', {
      id: `shared-${index}`,
      originId: 'shared-origin',
      originSequence: index + 1,
      correct: true,
      independent: true,
      responseTimeMs: 1800,
      at: index + 1,
    }, { id: 'number-facts' });
  }

  let left = structuredClone(shared);
  let right = structuredClone(shared);
  for (let index = 0; index < 20; index += 1) {
    left = recordLearnerAttempt(left, 'number-facts', {
      id: `left-${index}`,
      originId: 'left-origin',
      originSequence: index + 1,
      correct: true,
      independent: true,
      responseTimeMs: 1700,
      at: 100 + index,
    }, { id: 'number-facts' });
    right = recordLearnerAttempt(right, 'number-facts', {
      id: `right-${index}`,
      originId: 'right-origin',
      originSequence: index + 1,
      correct: true,
      independent: true,
      responseTimeMs: 1900,
      at: 200 + index,
    }, { id: 'number-facts' });
  }

  const merged = mergeSkillStates(left.skills['number-facts'], right.skills['number-facts'], { preferRight: true });
  assert.equal(merged.evidence.attempts, 60);
  assert.equal(merged.evidence.independentSuccesses, 60);
  assert.equal(merged.evidence.responseTimeMsTotal, 108000);
  assert.equal(merged.recentPerformance.length, 12);
  assert.equal(evidenceProvenanceSources(merged).length, 3);
  assert.equal(hasDirectNestedArray(merged.evidenceProvenance), false);
  const normalizedMergedLearner = normalizeFoundationState({
    learners: {
      [right.profileId]: { ...right, skills: { ...right.skills, 'number-facts': merged } },
    },
    activeLearnerId: right.profileId,
  }).learners[right.profileId];
  assert.equal(hasDirectNestedArray(normalizedMergedLearner), false);
  assert.deepEqual(
    mergeSkillStates(right.skills['number-facts'], left.skills['number-facts']).evidence,
    merged.evidence,
  );

  const repeated = mergeSkillStates(merged, right.skills['number-facts'], { preferRight: true });
  assert.deepEqual(repeated.evidence, merged.evidence);
  assert.deepEqual(repeated.evidenceProvenance, merged.evidenceProvenance);
  assert.equal(repeated.masteryScore, merged.masteryScore);
  assert.equal(repeated.confidence, merged.confidence);
  assert.equal(repeated.masteryState, merged.masteryState);
});

test('normalized learners migrate v1/v2 attempt provenance into a bounded legacy aggregate', () => {
  let learner = defaultLearner('Vector', 'profile-vector-migration');
  learner = recordLearnerAttempt(learner, 'number-facts', {
    id: 'vector-independent', originId: 'migration-origin', originSequence: 1,
    correct: true, independent: true, responseTimeMs: 1200, at: 1,
  }, { id: 'number-facts' });
  learner = recordLearnerAttempt(learner, 'number-facts', {
    id: 'vector-assisted', originId: 'migration-origin', originSequence: 2,
    correct: true, assisted: true, hintsUsed: 2, responseTimeMs: 2400, at: 2,
  }, { id: 'number-facts' });
  learner = recordLearnerAttempt(learner, 'number-facts', {
    id: 'vector-error', originId: 'migration-origin', originSequence: 3,
    correct: false, independent: true, responseTimeMs: 350, repeatedPattern: true, at: 3,
  }, { id: 'number-facts' });
  assert.equal(hasDirectNestedArray(learner), false);
  const evidenceKeys = [
    'attempts', 'independentSuccesses', 'assistedSuccesses', 'hintsUsed',
    'incorrectAttempts', 'rapidAttempts', 'responseTimeMsTotal',
  ];
  const oldAttempts = [
    { id: 'vector-independent', attempts: 1, independentSuccesses: 1, assistedSuccesses: 0, hintsUsed: 0, incorrectAttempts: 0, rapidAttempts: 0, responseTimeMsTotal: 1200 },
    { id: 'vector-assisted', attempts: 1, independentSuccesses: 0, assistedSuccesses: 1, hintsUsed: 2, incorrectAttempts: 0, rapidAttempts: 0, responseTimeMsTotal: 2400 },
    { id: 'vector-error', attempts: 1, independentSuccesses: 0, assistedSuccesses: 0, hintsUsed: 0, incorrectAttempts: 1, rapidAttempts: 2, responseTimeMsTotal: 350 },
  ];
  const oldForms = [
    { version: 1, legacy: [0, 0, 0, 0, 0, 0, 0], attempts: oldAttempts.map(entry => [entry.id, ...evidenceKeys.map(key => entry[key])]) },
    { version: 2, legacy: [0, 0, 0, 0, 0, 0, 0], attempts: oldAttempts },
  ];

  for (const oldProvenance of oldForms) {
    const oldLearner = structuredClone(learner);
    oldLearner.skills['number-facts'].evidenceProvenance = oldProvenance;
    const normalized = normalizeFoundationState({
      learners: { [oldLearner.profileId]: oldLearner },
      activeLearnerId: oldLearner.profileId,
    }).learners[oldLearner.profileId];
    const migrated = normalized.skills['number-facts'];
    assert.deepEqual(migrated.evidence, learner.skills['number-facts'].evidence);
    assert.equal(migrated.evidenceProvenance.version, 5);
    assert.deepEqual(migrated.evidenceProvenance.legacy, evidenceKeys.map(key => migrated.evidence[key]));
    assert.equal(typeof migrated.evidenceProvenance.packed, 'string');
    assert.deepEqual(evidenceProvenanceSources(migrated), []);
    assert.equal(hasDirectNestedArray(normalized), false);
  }
});

test('v3 source provenance migrates to v5 without changing evidence or sequences', () => {
  let learner = defaultLearner('V3', 'profile-v3-migration');
  learner = recordLearnerAttempt(learner, 'number-facts', {
    id: 'v3-first', originId: 'v3-writer', originSequence: 1,
    correct: true, independent: true, responseTimeMs: 1400, at: 1,
  }, { id: 'number-facts' });
  learner = recordLearnerAttempt(learner, 'number-facts', {
    id: 'v3-second', originId: 'v3-writer', originSequence: 2,
    correct: false, independent: true, responseTimeMs: 2100, at: 2,
  }, { id: 'number-facts' });
  const originalEvidence = structuredClone(learner.skills['number-facts'].evidence);
  const provenance = learner.skills['number-facts'].evidenceProvenance;
  const sources = evidenceProvenanceSources(provenance);
  learner.skills['number-facts'].evidenceProvenance = {
    version: 3,
    legacy: provenance.legacy,
    sources,
  };

  const migrated = normalizeFoundationState({ learners: { [learner.profileId]: learner }, activeLearnerId: learner.profileId }).learners[learner.profileId].skills['number-facts'];
  assert.equal(migrated.evidenceProvenance.version, 5);
  assert.deepEqual(migrated.evidence, originalEvidence);
  assert.equal(evidenceProvenanceSources(migrated).length, 1);
  assert.equal(evidenceProvenanceSources(migrated)[0].sequence, 2);
});

test('v4 retired evidence migrates into the exact v5 legacy aggregate', () => {
  const learner = defaultLearner('V4', 'profile-v4-migration');
  const skill = learner.skills['number-facts'] || {
    skillId: 'number-facts',
    evidence: { attempts: 3, independentSuccesses: 1, assistedSuccesses: 1, hintsUsed: 2, incorrectAttempts: 1, rapidAttempts: 1, responseTimeMsTotal: 4200 },
  };
  skill.evidence = { attempts: 3, independentSuccesses: 1, assistedSuccesses: 1, hintsUsed: 2, incorrectAttempts: 1, rapidAttempts: 1, responseTimeMsTotal: 4200 };
  skill.evidenceProvenance = {
    version: 4,
    legacy: [0, 0, 0, 0, 0, 0, 0],
    retired: { evidence: [3, 1, 1, 2, 1, 1, 4200], filter: 'legacy-retired-filter' },
    sources: [],
  };
  learner.skills['number-facts'] = skill;
  const migrated = normalizeFoundationState({ learners: { [learner.profileId]: learner }, activeLearnerId: learner.profileId }).learners[learner.profileId].skills['number-facts'];
  assert.equal(migrated.evidenceProvenance.version, 5);
  assert.deepEqual(migrated.evidenceProvenance.legacy, [3, 1, 1, 2, 1, 1, 4200]);
  assert.deepEqual(evidenceProvenanceSources(migrated), []);
  assert.deepEqual(migrated.evidence, skill.evidence);
});

test('v5 provenance corruption is quarantined without losing the learner', () => {
  const learner = defaultLearner('Ceiling', 'profile-v5-ceiling');
  const skill = {
    ...learner.skills['number-facts'],
    skillId: 'number-facts',
    evidence: { attempts: 0, independentSuccesses: 0, assistedSuccesses: 0, hintsUsed: 0, incorrectAttempts: 0, rapidAttempts: 0, responseTimeMsTotal: 0 },
  };
  const normalize = evidenceProvenance => normalizeFoundationState({
    learners: { [learner.profileId]: { ...learner, skills: { 'number-facts': { ...skill, evidenceProvenance } } } },
    activeLearnerId: learner.profileId,
  });
  const packedLimit = normalize({ version: 5, legacy: [0, 0, 0, 0, 0, 0, 0], packed: `p2:${'A'.repeat(480 * 1024)}` });
  const writerLimit = normalize({ version: 5, legacy: [0, 0, 0, 0, 0, 0, 0], packed: `p2:${'.'.repeat(8192)}` });
  const packedLearner = packedLimit.learners[learner.profileId];
  const writerLearner = writerLimit.learners[learner.profileId];
  assert.equal(packedLearner.skills['number-facts'], undefined);
  assert.equal(writerLearner.skills['number-facts'], undefined);
  assert.equal(packedLearner.quarantinedRecords[0].reason, writerLearner.quarantinedRecords[0].reason);
  assert.equal(packedLearner.quarantinedRecords[0].kind, 'skill-state');
});

test('cloud evidence provenance merges assisted, independent, incorrect, and rapid categories once', () => {
  let shared = defaultLearner('Mix', 'profile-mixed-merge');
  const add = (learner, id, originId, originSequence, attempt) => recordLearnerAttempt(learner, 'word-order', {
    id,
    originId,
    originSequence,
    at: Number(id.match(/\d+/)?.[0] || 0) + 1,
    responseTimeMs: 2000,
    ...attempt,
  }, { id: 'word-order' });
  for (let index = 0; index < 16; index += 1) {
    shared = add(shared, `shared-${index}`, 'shared-origin', index + 1, index % 2
      ? { correct: true, assisted: true, hintsUsed: 2 }
      : { correct: true, independent: true });
  }

  let left = structuredClone(shared);
  let right = structuredClone(shared);
  for (let index = 0; index < 16; index += 1) {
    left = add(left, `left-${index + 100}`, 'left-origin', index + 1, { correct: false, independent: true });
    right = add(right, `right-${index + 200}`, 'right-origin', index + 1, {
      correct: false,
      independent: true,
      responseTimeMs: 350,
      repeatedPattern: true,
    });
  }

  const merged = mergeSkillStates(left.skills['word-order'], right.skills['word-order']);
  assert.deepEqual(merged.evidence, {
    attempts: 48,
    independentSuccesses: 8,
    assistedSuccesses: 8,
    hintsUsed: 16,
    incorrectAttempts: 32,
    rapidAttempts: 32,
    responseTimeMsTotal: 69600,
  });
  assert.equal(merged.evidence.attempts,
    merged.evidence.independentSuccesses + merged.evidence.assistedSuccesses + merged.evidence.incorrectAttempts);
  assert.equal(hasDirectNestedArray(merged), false);
  assert.deepEqual(mergeSkillStates(merged, left.skills['word-order']).evidence, merged.evidence);
});

test('legacy skill states without provenance conservatively deduplicate a shared hidden aggregate', () => {
  let shared = defaultLearner('Legacy', 'profile-legacy-merge');
  for (let index = 0; index < 16; index += 1) {
    shared = recordLearnerAttempt(shared, 'number-facts', {
      id: `legacy-shared-${index}`,
      correct: true,
      independent: true,
      responseTimeMs: 1500,
      at: index + 1,
    }, { id: 'number-facts' });
  }
  delete shared.skills['number-facts'].evidenceProvenance;

  const left = recordLearnerAttempt(structuredClone(shared), 'number-facts', {
    id: 'legacy-left', originId: 'legacy-left-origin', originSequence: 1,
    correct: true, independent: true, responseTimeMs: 1400, at: 100,
  }, { id: 'number-facts' });
  const right = recordLearnerAttempt(structuredClone(shared), 'number-facts', {
    id: 'legacy-right', originId: 'legacy-right-origin', originSequence: 1,
    correct: false, independent: true, responseTimeMs: 1600, at: 200,
  }, { id: 'number-facts' });

  const merged = mergeSkillStates(left.skills['number-facts'], right.skills['number-facts']);
  assert.equal(merged.evidence.attempts, 18);
  assert.equal(merged.evidence.independentSuccesses, 17);
  assert.equal(merged.evidence.incorrectAttempts, 1);
  assert.equal(merged.evidence.responseTimeMsTotal, 27000);
  assert.deepEqual(mergeSkillStates(merged, right.skills['number-facts']).evidence, merged.evidence);
});

test('source sequences reject stale attempts and retain cumulative category totals', () => {
  let learner = defaultLearner('Sequence', 'profile-sequence');
  learner = recordLearnerAttempt(learner, 'word-order', {
    id: 'sequence-1', originId: 'installation-a', originSequence: 1,
    correct: true, independent: true, responseTimeMs: 1200, at: 1,
  }, { id: 'word-order' });
  learner = recordLearnerAttempt(learner, 'word-order', {
    id: 'sequence-3', originId: 'installation-a', originSequence: 3,
    correct: true, assisted: true, hintsUsed: 1, responseTimeMs: 1800, at: 3,
  }, { id: 'word-order' });
  const beforeStale = structuredClone(learner.skills['word-order']);
  for (const originSequence of [3, 2]) {
    learner = recordLearnerAttempt(learner, 'word-order', {
      id: `sequence-${originSequence}-stale`, originId: 'installation-a', originSequence,
      correct: false, independent: true, responseTimeMs: 300, at: originSequence,
    }, { id: 'word-order' });
    assert.deepEqual(learner.skills['word-order'], beforeStale);
  }
  assert.deepEqual(learner.skills['word-order'].evidence, {
    attempts: 2,
    independentSuccesses: 1,
    assistedSuccesses: 1,
    hintsUsed: 1,
    incorrectAttempts: 0,
    rapidAttempts: 0,
    responseTimeMsTotal: 3000,
  });
  assert.equal(evidenceProvenanceSources(learner.skills['word-order'])[0].sequence, 3);
});

test('same-origin merge selects the higher cumulative sequence without summing its prefix', () => {
  let base = defaultLearner('Cumulative', 'profile-cumulative');
  base = recordLearnerAttempt(base, 'word-order', {
    id: 'cumulative-1', originId: 'installation-cumulative', originSequence: 1,
    correct: true, independent: true, responseTimeMs: 1200, at: 1,
  }, { id: 'word-order' });
  const lower = recordLearnerAttempt(structuredClone(base), 'word-order', {
    id: 'cumulative-2', originId: 'installation-cumulative', originSequence: 2,
    correct: false, independent: true, responseTimeMs: 1400, at: 2,
  }, { id: 'word-order' });
  const higher = recordLearnerAttempt(structuredClone(lower), 'word-order', {
    id: 'cumulative-3', originId: 'installation-cumulative', originSequence: 3,
    correct: true, assisted: true, hintsUsed: 1, responseTimeMs: 1800, at: 3,
  }, { id: 'word-order' });

  const merged = mergeSkillStates(lower.skills['word-order'], higher.skills['word-order']);
  const reversed = mergeSkillStates(higher.skills['word-order'], lower.skills['word-order']);
  assert.deepEqual(merged.evidence, higher.skills['word-order'].evidence);
  assert.deepEqual(reversed.evidence, merged.evidence);
  assert.deepEqual(mergeSkillStates(merged, lower.skills['word-order']).evidence, merged.evidence);
  assert.equal(evidenceProvenanceSources(merged).length, 1);
  assert.equal(evidenceProvenanceSources(merged)[0].sequence, 3);
});

test('same-origin provenance remains bounded across 5000 attempts', () => {
  let learner = defaultLearner('Bounded', 'profile-source-bound');
  for (let index = 0; index < 5000; index += 1) {
    learner = recordLearnerAttempt(learner, 'number-facts', {
      id: `bounded-${index}`,
      originId: 'installation-bounded',
      originSequence: index + 1,
      correct: true,
      independent: true,
      responseTimeMs: 1000,
      at: index + 1,
    }, { id: 'number-facts' });
  }
  const skill = learner.skills['number-facts'];
  assert.equal(skill.evidence.attempts, 5000);
  assert.equal(skill.recentPerformance.length, 12);
  assert.equal(evidenceProvenanceSources(skill).length, 1);
  assert.equal(evidenceProvenanceSources(skill)[0].sequence, 5000);
  assert.ok(Buffer.byteLength(JSON.stringify(skill), 'utf8') < 64 * 1024);
  assert.ok(Buffer.byteLength(JSON.stringify(skill.evidenceProvenance), 'utf8') < 64 * 1024);
  assert.equal(hasDirectNestedArray(skill), false);
});

test('6000 distinct provenance writers remain exact and compact below 512 KiB', () => {
  let learner = defaultLearner('Many Writers', 'profile-many-writers');
  const writerCount = 6000;
  for (let index = 0; index < writerCount; index += 1) {
    learner = recordLearnerAttempt(learner, 'number-facts', {
      id: `many-writers-${index}`,
      originId: `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}:10000000-0000-4000-8000-${(writerCount-index).toString(16).padStart(12, '0')}`,
      originSequence: 1,
      correct: index % 4 !== 0,
      independent: index % 4 >= 2,
      assisted: index % 4 === 1,
      hintsUsed: index % 4 === 1 ? 2 : 0,
      responseTimeMs: index % 4 === 0 ? 350 : 1000 + (index % 5) * 100,
      repeatedPattern: index % 4 === 0,
      at: index + 1,
    }, { id: 'number-facts' });
  }
  const skill = learner.skills['number-facts'];
  assert.equal(skill.evidence.attempts, writerCount);
  assert.equal(skill.evidence.independentSuccesses, 3000);
  assert.equal(skill.evidence.assistedSuccesses, 1500);
  assert.equal(skill.evidence.hintsUsed, 3000);
  assert.equal(skill.evidence.incorrectAttempts, 1500);
  assert.equal(skill.evidence.rapidAttempts, 3000);
  assert.equal(skill.evidenceProvenance.version, 5);
  assert.equal(Object.hasOwn(skill.evidenceProvenance, 'sources'), false);
  assert.equal(Object.hasOwn(skill.evidenceProvenance, 'retired'), false);
  assert.equal(typeof skill.evidenceProvenance.packed, 'string');
  assert.equal(evidenceProvenanceSources(skill).length, writerCount);
  assert.ok(Buffer.byteLength(JSON.stringify(skill.evidenceProvenance), 'utf8') < 512 * 1024);
  assert.ok(Buffer.byteLength(JSON.stringify(learner), 'utf8') < 512 * 1024);
  assert.equal(hasDirectNestedArray(skill), false);

  const repeated = mergeSkillStates(skill, structuredClone(skill), { preferRight: true });
  assert.deepEqual(repeated.evidence, skill.evidence);
  assert.ok(repeated.masteryScore <= skill.masteryScore);
});

test('independently compacted disjoint branches merge 193 successes and 193 failures exactly once', () => {
  let left = defaultLearner('Left', 'profile-disjoint-left');
  let right = defaultLearner('Right', 'profile-disjoint-right');
  for (let index = 0; index < 193; index += 1) {
    left = recordLearnerAttempt(left, 'number-facts', {
      id: `left-${index}`, originId: `left-writer-${index}`, originSequence: 1,
      correct: true, independent: true, responseTimeMs: 1200, at: index + 1,
    }, { id: 'number-facts' });
    right = recordLearnerAttempt(right, 'number-facts', {
      id: `right-${index}`, originId: `right-writer-${index}`, originSequence: 1,
      correct: false, independent: true, responseTimeMs: 1800, at: index + 1000,
    }, { id: 'number-facts' });
  }
  const compactedLeft = structuredClone(left.skills['number-facts']);
  const compactedRight = structuredClone(right.skills['number-facts']);
  const merged = mergeSkillStates(compactedLeft, compactedRight);
  assert.deepEqual(merged.evidence, {
    attempts: 386,
    independentSuccesses: 193,
    assistedSuccesses: 0,
    hintsUsed: 0,
    incorrectAttempts: 193,
    rapidAttempts: 0,
    responseTimeMsTotal: 579000,
  });
  assert.equal(evidenceProvenanceSources(merged).length, 386);
  assert.deepEqual(mergeSkillStates(merged, compactedLeft).evidence, merged.evidence);
  assert.deepEqual(mergeSkillStates(compactedRight, merged).evidence, merged.evidence);
});

test('repeated incorrect attempts and rapid random answers do not create false mastery', () => {
  let learner = defaultLearner('Bee', 'profile-b');
  for (let i = 0; i < 5; i += 1) {
    learner = recordLearnerAttempt(learner, 'word-order', {
      correct: false,
      independent: true,
      responseTimeMs: 350,
      randomLike: true,
    }, { id: 'word-order' });
  }
  const skill = learner.skills['word-order'];
  assert.ok(skill.masteryScore < 25);
  assert.notEqual(skill.masteryState, 'Mastered');
  assert.ok(skill.evidence.rapidAttempts >= 5);
  assert.equal(evidenceProvenanceSources(skill).length, 1);
  assert.equal(evidenceProvenanceSources(skill)[0].id, 'local-unscoped');
  assert.equal(evidenceProvenanceSources(skill)[0].sequence, 5);
});

test('difficulty adaptation and remediation change presentation rather than repeating identically', () => {
  const learner = defaultLearner('Cleo', 'profile-c');
  const session = buildAdaptiveSession({
    learner,
    skillStates: {
      weak: { skillId: 'weak', masteryState: 'Practicing', masteryScore: 22, confidence: 0.3, evidence: { attempts: 2, independentSuccesses: 0, assistedSuccesses: 0, hintsUsed: 1, incorrectAttempts: 1, rapidAttempts: 0, responseTimeMsTotal: 4000 } },
      review: { skillId: 'review', masteryState: 'Strong', masteryScore: 78, confidence: 0.8, evidence: { attempts: 4, independentSuccesses: 3, assistedSuccesses: 0, hintsUsed: 0, incorrectAttempts: 0, rapidAttempts: 0, responseTimeMsTotal: 6500 }, nextReviewAt: Date.now() - 1 },
    },
    desiredSessionMinutes: 16,
  });
  assert.ok(session.items.length >= 2);
  const weakItem = session.items.find(item => item.skillId === 'weak');
  assert.ok(weakItem);
  const challenge = createTargetSmashChallenge({
    skillId: 'weak',
    prompt: 'Smash the right answers.',
    answers: ['12', '18', '24'],
    distractors: ['11', '13', '14'],
  });
  const guided = remediateChallenge(challenge, { prerequisiteState: { missing: ['counting'] } }, 'incorrect');
  assert.equal(guided.guided, true);
  assert.ok(guided.choices.length <= challenge.choices.length);
  assert.equal(guided.reviewPrerequisite, 'counting');
});

test('prerequisite remediation, spaced review, and stale review are tracked independently', () => {
  let learner = defaultLearner('Dana', 'profile-dana');
  learner = recordLearnerAttempt(learner, 'fraction', {
    correct: true,
    independent: true,
    responseTimeMs: 2000,
  }, { id: 'fraction' });
  let skill = learner.skills.fraction;
  skill = scheduleReview(skill, { correct: true, independent: true, responseTimeMs: 2000 }, Date.now());
  assert.ok(skill.nextReviewAt > Date.now());
  const reviewed = scheduleReview(skill, { correct: false, independent: true, responseTimeMs: 1800 }, Date.now());
  assert.ok(reviewed.nextReviewAt <= skill.nextReviewAt);
  const stale = { ...reviewed, lastIndependentSuccessAt: Date.now() - 4 * 24 * 60 * 60 * 1000 };
  assert.equal(isSkillStale(stale), true);
  assert.equal(selectStaleSkills({ fraction: stale }).length, 1);
  assert.equal(selectDueSkills({ fraction: { ...stale, nextReviewAt: Date.now() - 1 } }).length, 1);
});

test('Target Smash, Letter Trail, and Knowledge Platforms map to answer-driven state changes', () => {
  const target = createTargetSmashChallenge({ skillId: 'number-facts', prompt: 'Pick the right values.', answers: ['12', '18'], distractors: ['13', '14'] });
  const targetResult = resolveTargetSmashResult(target, ['12', '18'], { independent: true, responseTimeMs: 1200 });
  assert.equal(targetResult.challenge.completed, true);
  const trail = createLetterTrailChallenge({ skillId: 'word-order', prompt: 'Trace the word.', targetSequence: ['B', 'I', 'T'], distractors: ['A', 'N'] });
  const trailResult = resolveLetterTrailChoice(trail, 'B', { independent: true, responseTimeMs: 900 });
  assert.deepEqual(trailResult.challenge.revealed, ['B']);
  const platforms = createKnowledgePlatformChallenge({ skillId: 'fraction-meaning', prompt: 'Step carefully.', platformOrder: ['Count', 'Compare'], distractors: ['Guess'] });
  const platformResult = resolveKnowledgePlatformChoice(platforms, 'Count', { independent: true, responseTimeMs: 1100 });
  assert.deepEqual(platformResult.challenge.visited, ['Count']);
});

test('boss victory does not automatically create mastery, but Kraken rewards stay unique', () => {
  let learner = defaultLearner('Dee', 'profile-d');
  learner = recordBossVictory(learner, 'fraction-kraken');
  learner = recordBossVictory(learner, 'fraction-kraken');
  assert.equal(learner.rewards.length, 1);
  assert.equal(learner.skills['fraction-meaning'], undefined);
  const rewarded = grantBrainifact(learner);
  assert.equal(rewarded.rewards.length, 1);
});

test('offline queue replays exactly once and rejects duplicates', () => {
  let learner = defaultLearner('Eli', 'profile-e');
  learner = queueOfflineEvent(learner, { id: 'evt-1', type: 'attempt', payload: { a: 1 }, profileId: learner.profileId, schemaVersion: 1, timestamp: 1234 });
  learner = queueOfflineEvent(learner, { id: 'evt-1', type: 'attempt', payload: { a: 1 }, profileId: learner.profileId, schemaVersion: 1, timestamp: 1234 });
  assert.equal(learner.offlineQueue.length, 1);
  assert.equal(learner.offlineQueue[0].profileId, learner.profileId);
  assert.equal(learner.offlineQueue[0].schemaVersion, 1);
  assert.equal(learner.offlineQueue[0].timestamp, 1234);
  const replay = replayOfflineQueue(learner, event => event.id === 'evt-1');
  assert.equal(replay.sent.length, 1);
  assert.equal(replay.learner.offlineQueue.length, 0);
  const second = replayOfflineQueue(replay.learner, () => true);
  assert.equal(second.sent.length, 0);
});

test('offline queue normalizes foreign event ownership to the active learner', () => {
  const eventId = '11111111-1111-4111-8111-111111111111';
  let learner = defaultLearner('Fia', 'profile-f');
  learner = queueOfflineEvent(learner, {
    id: eventId, type: 'LearningAttemptRecorded', profileId: 'profile-other',
    payload: { skillId: 'number-facts' }, timestamp: 4321,
  });
  assert.equal(learner.offlineQueue[0].profileId, 'profile-f');
  const replay = replayOfflineQueue(learner, event => event.profileId === 'profile-f');
  assert.deepEqual(replay.sent, [eventId]);
  assert.equal(replay.learner.offlineQueue.length, 0);
});

test('offline event history is bounded, deterministic, and keeps exactly-once acknowledgements', () => {
  let learner = defaultLearner('Bounded', 'profile-bounded-events');
  for (let index = 0; index < OFFLINE_QUEUE_LIMIT + 25; index += 1) {
    learner = queueOfflineEvent(learner, { id: `event-${index}`, type: 'attempt', timestamp: index, payload: { index } });
  }
  assert.equal(learner.offlineQueue.length, OFFLINE_QUEUE_LIMIT);
  assert.equal(learner.offlineQueue[0].id, 'event-25');

  learner.sentEventIds = Array.from({ length: SENT_EVENT_ID_LIMIT + 10 }, (_, index) => `sent-${index}`);
  learner.offlineQueue.push({ id: 'sent-2009', type: 'attempt', payload: {} });
  const normalized = normalizeFoundationState({
    activeLearnerId: learner.profileId,
    learners: { [learner.profileId]: learner },
  }).learners[learner.profileId];
  assert.equal(normalized.sentEventIds.length, SENT_EVENT_ID_LIMIT);
  assert.equal(normalized.sentEventIds[0], 'sent-10');
  assert.equal(normalized.offlineQueue.some(event => event.id === 'sent-2009'), false);

  const legacy = defaultLearner('Legacy', 'profile-legacy-events');
  legacy.offlineQueue = [
    { type: 'attempt', timestamp: 7, payload: { answer: 2 } },
    { type: 'attempt', timestamp: 7, payload: { answer: 2 } },
  ];
  const first = normalizeFoundationState({ activeLearnerId: legacy.profileId, learners: { [legacy.profileId]: legacy } }).learners[legacy.profileId];
  const second = normalizeFoundationState({ activeLearnerId: first.profileId, learners: { [first.profileId]: first } }).learners[first.profileId];
  assert.equal(first.offlineQueue.length, 1);
  assert.equal(first.offlineQueue[0].id, second.offlineQueue[0].id);
});

test('canonical attempt idempotency survives bounded sent-ID eviction', () => {
  const originId = '11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222';
  const attempt = { id: 'old-attempt', originId, originSequence: 1, correct: true, independent: true, responseTimeMs: 1800, at: 1 };
  let canonical = recordLearnerAttempt(defaultLearner('Idempotent', 'profile-idempotent'), 'number-facts', attempt, { id: 'number-facts' });
  canonical.sentEventIds = ['old-event', ...Array.from({ length: SENT_EVENT_ID_LIMIT }, (_, index) => `new-${index}`)];
  canonical = normalizeFoundationState({ activeLearnerId: canonical.profileId, learners: { [canonical.profileId]: canonical } }).learners[canonical.profileId];
  assert.equal(canonical.sentEventIds.includes('old-event'), false);
  canonical = queueOfflineEvent(canonical, { id: 'old-event', type: 'LearningAttemptRecorded', payload: { skillId: 'number-facts', attempt } });
  const replay = replayOfflineQueue(canonical, event => {
    canonical = recordLearnerAttempt(canonical, event.payload.skillId, event.payload.attempt, { id: event.payload.skillId });
    return true;
  });
  canonical = replay.learner;
  assert.equal(replay.sent.length, 1);
  assert.equal(canonical.skills['number-facts'].evidence.attempts, 1);
  assert.equal(canonical.skills['number-facts'].evidence.independentSuccesses, 1);
});

test('content validation quarantines invalid content', () => {
  const result = validateContentBundle({
    worldDefinitions: [{ id: 'world-a' }],
    activityDefinitions: [
      { id: 'activity-a', family: ACTIVITY_FAMILIES.targetSmash, answers: ['1', '2'] },
      { id: 'activity-a', family: ACTIVITY_FAMILIES.letterTrail, targetSequence: ['A'] },
    ],
    bossDefinitions: [{ id: 'boss-a' }],
    rewardDefinitions: [{ id: 'reward-a' }],
  });
  assert.equal(result.valid, false);
  assert.ok(result.quarantined.includes('activity-a'));
});

test('default content manifest validates cleanly after migration', () => {
  const result = validateContentBundle(contentManifest());
  assert.equal(result.valid, true);
  assert.deepEqual(result.quarantined, []);
});

test('curriculum taxonomy spans K-6 and generated challenges validate cleanly', () => {
  const taxonomy = createCurriculumTaxonomy();
  assert.equal(validateCurriculumTaxonomy(taxonomy).valid, true);
  assert.equal(taxonomy.skills.length, 35);
  assert.equal(curriculumSkillsForGrade({ subject: 'math', grade: '4', taxonomy }).length, 1);
  const skill = findCurriculumSkill('math-4-fractions', taxonomy);
  assert.equal(skill.subject, 'math');
  assert.equal(skill.grade, '4');
  const challenge = createCurriculumChallenge('math-4-fractions', { taxonomy, seed: 2 });
  const validation = validateGeneratedChallenge(challenge, skill);
  assert.equal(validation.valid, true);
  assert.equal(scoreContentQuality(challenge, skill).score >= 70, true);
});

test('every canonical curriculum cell has approved deterministic content', () => {
  const taxonomy = createCurriculumTaxonomy();
  const approved = taxonomy.skills.map(skill => createApprovedCurriculumChallenge(skill.id, { taxonomy, seed: 7 }));
  assert.equal(approved.length, 35);
  assert.deepEqual(Object.keys(CURRICULUM_ITEM_TEMPLATES).sort(), taxonomy.skills.map(skill => skill.id).sort());
  assert.equal(approved.every(result => result.status === 'approved' && result.approved && !result.quarantined), true);
  assert.equal(new Set(taxonomy.skills.map(skill => `${skill.subject}:${skill.grade}`)).size, 35);

  for (const { challenge } of approved) {
    const repeated = createCurriculumChallenge(challenge.skillId, { taxonomy, seed: 7 });
    const answers = challenge.answers || challenge.targetSequence || challenge.platformOrder;
    const allChoices = [...answers, ...challenge.distractors].map(value => String(value).trim().toLowerCase());
    assert.deepEqual(repeated, challenge, `${challenge.skillId} must be deterministic for the same seed`);
    assert.doesNotMatch(challenge.prompt, /^(?:show mastery|practice|answer the question|choose the answer)\b/i);
    assert.ok(challenge.explanation.trim());
    assert.ok(challenge.hintMetadata?.hint);
    assert.ok(challenge.supportMetadata?.scaffold);
    assert.equal(challenge.contentStatus, 'internally-programmatically-validated-prototype');
    assert.equal(allChoices.length, new Set(allChoices).size, `${challenge.skillId} choices must be unique`);
    assert.equal(answers.every(answer => verifyCurriculumAnswer(challenge, answer)), true, `${challenge.skillId} answer must verify`);
    assert.equal(challenge.distractors.every(answer => !verifyCurriculumAnswer(challenge, answer)), true, `${challenge.skillId} distractors must fail verification`);
    if (challenge.subject === 'math') assert.notEqual(challenge.answerVerification.type, 'exact-match');
    assert.equal(scoreContentQuality(challenge, findCurriculumSkill(challenge.skillId, taxonomy)).usefulness, true);
  }
});

test('every canonical template preserves its answer predicate across supported activity families', () => {
  const taxonomy = createCurriculumTaxonomy();
  for (const skill of taxonomy.skills) {
    for (const family of skill.supportedActivityTypes) {
      const result = createApprovedCurriculumChallenge(skill.id, { taxonomy, family, seed: 11, difficulty: 'hard' });
      const answers = result.challenge?.answers || result.challenge?.targetSequence || result.challenge?.platformOrder || [];
      assert.equal(result.approved, true, `${skill.id} should support ${family}`);
      assert.deepEqual(answers, CURRICULUM_ITEM_TEMPLATES[skill.id].answers);
      assert.equal(answers.every(answer => verifyCurriculumAnswer(result.challenge, answer)), true);
    }
  }
  const incompatible = createApprovedCurriculumChallenge('vocabulary-k-categories', {
    taxonomy,
    family: ACTIVITY_FAMILIES.letterTrail,
    seed: 11,
  });
  assert.equal(incompatible.approved, false);
  assert.equal(incompatible.status, 'quarantined');
  assert.equal(incompatible.errors.some(error => error.includes('Unsupported requested activity family')), true);
  const easy = createCurriculumChallenge('math-1-addition', { taxonomy, seed: 11, difficulty: 'easy' });
  const hard = createCurriculumChallenge('math-1-addition', { taxonomy, seed: 11, difficulty: 'hard' });
  assert.deepEqual(easy.answers, hard.answers);
  assert.equal(easy.answerVerification.expected, hard.answerVerification.expected);
  assert.notDeepEqual(easy.supportMetadata, hard.supportMetadata);
});

test('generated challenge validation rejects taxonomy mismatches, ambiguity, empty sequences, and failed safety hooks', () => {
  const taxonomy = createCurriculumTaxonomy();
  const skill = findCurriculumSkill('reading-3-main-idea', taxonomy);
  const challenge = createCurriculumChallenge(skill.id, { taxonomy, family: ACTIVITY_FAMILIES.letterTrail });
  assert.equal(validateGeneratedChallenge({ ...challenge, skillId: 'unknown-skill' }, taxonomy).valid, false);
  assert.equal(validateGeneratedChallenge({ ...challenge, subject: 'math' }, skill).valid, false);
  assert.equal(validateGeneratedChallenge({ ...challenge, grade: '6' }, skill).valid, false);
  assert.equal(validateGeneratedChallenge({ ...challenge, domain: 'wrong' }, skill).valid, false);
  assert.equal(validateGeneratedChallenge({ ...challenge, prompt: ' ' }, skill).valid, false);
  assert.equal(validateGeneratedChallenge({ ...challenge, targetSequence: [] }, skill).valid, false);
  assert.equal(validateGeneratedChallenge({ ...challenge, targetSequence: ['a'], distractors: ['A'] }, skill).valid, false);
  assert.equal(validateGeneratedChallenge(challenge, skill, { readabilityCheck: () => false, safetyCheck: () => ({ valid: false, errors: ['unsafe'] }) }).valid, false);
});

test('registry missions route through their declared families with explicit approval', () => {
  const registry = globalThis.BrainBiteRegistry;
  const results = registry.missions.map(mission => ({ mission, result: resolveMissionChallenge(mission.id) }));
  assert.equal(results.length, 30);
  assert.equal(results.every(({ mission, result }) => result.approved && result.status === 'approved' && result.challenge.family === mission.activityFamily), true);
  const letterTrail = results.find(({ mission }) => mission.activityFamily === ACTIVITY_FAMILIES.letterTrail);
  assert.deepEqual(letterTrail.result.challenge.targetSequence, letterTrail.mission.correct);
  assert.notDeepEqual(letterTrail.result.challenge.targetSequence, Array.from(letterTrail.mission.correct[0]));
});

test('empty-state curriculum sessions synthesize approved adaptive items and vary game families', () => {
  const taxonomy = createCurriculumTaxonomy();
  const learner = defaultLearner('Adaptive', 'profile-adaptive');
  const session = buildCurriculumSession({ learner, taxonomy, subject: 'math', sessionMinutes: 24, skillStates: {} });
  assert.ok(session.items.length >= 2);
  assert.equal(session.items.every(item => item.challengeApproval.approved), true);
  assert.equal(session.items.every(item => findCurriculumSkill(item.skillId, taxonomy).supportedActivityTypes.includes(item.family)), true);
  assert.equal(session.items.slice(1).every((item, index) => item.family !== session.items[index].family), true);
  assert.equal(session.items.every(item => item.what?.skillId === item.skillId && item.how?.family === item.family), true);
});

test('content validation keeps explicit vertical-slice legacy skills separate from canonical taxonomy', () => {
  const valid = validateContentBundle(contentManifest());
  assert.equal(valid.valid, true);
  const legacy = validateContentBundle({
    activityDefinitions: [{ id: 'legacy-custom', skillId: 'number-facts', family: ACTIVITY_FAMILIES.targetSmash, answers: ['1'], distractors: ['2'] }],
  });
  const unknown = validateContentBundle({
    activityDefinitions: [{ id: 'unknown-custom', skillId: 'not-canonical', family: ACTIVITY_FAMILIES.targetSmash, answers: ['1'], distractors: ['2'] }],
  });
  assert.equal(legacy.valid, true);
  assert.equal(unknown.valid, false);
});

test('ambiguous curriculum content is rejected and quarantined', () => {
  const skill = findCurriculumSkill('vocabulary-2-synonyms');
  const result = validateGeneratedChallenge({
    id: 'bad-item',
    family: 'Target Smash',
    skillId: 'vocabulary-2-synonyms',
    subject: 'vocabulary',
    grade: '2',
    answers: ['same'],
    distractors: ['same'],
  }, skill);
  assert.equal(result.valid, false);
  assert.equal(result.quarantined.length, 1);
});

test('canonical generated items with structural shape but no semantic evidence are quarantined', () => {
  const skill = findCurriculumSkill('vocabulary-2-synonyms');
  const structurallyPlausible = {
    id: 'semantic-gap',
    source: 'curriculum',
    family: ACTIVITY_FAMILIES.targetSmash,
    skillId: skill.id,
    subject: skill.subject,
    grade: skill.grade,
    domain: skill.domain,
    difficulty: 'normal',
    prompt: 'Show mastery for Synonyms.',
    answers: ['glad'],
    distractors: ['angry', 'empty', 'tired'],
  };
  const validation = validateGeneratedChallenge(structurallyPlausible, skill);
  assert.equal(validation.valid, false);
  assert.equal(validation.errors.some(error => error.includes('determinate')), true);
  assert.equal(validation.errors.some(error => error.includes('answer-verification')), true);
  assert.equal(scoreContentQuality(structurallyPlausible, skill).usefulness, false);
});

test('homework evidence is tracked as assisted evidence and parent insights derive from real data', () => {
  let learner = defaultLearner('Home', 'profile-home');
  learner = recordLearnerAttempt(learner, 'reading-3-main-idea', { correct: true, independent: true, responseTimeMs: 1500 }, { id: 'reading-3-main-idea' });
  const independentScore = learner.skills['reading-3-main-idea'].masteryScore;
  learner = recordHomeworkAttempt(learner, 'reading-3-main-idea', { correct: true, responseTimeMs: 1600 }, { id: 'reading-3-main-idea' });
  assert.ok(learner.skills['reading-3-main-idea'].masteryScore > independentScore);
  assert.equal(learner.skills['reading-3-main-idea'].evidence.assistedSuccesses >= 1, true);
  learner.practice.push({ subject: 'reading', grade: '3', topic: 'main idea', homework: true, ts: Date.now() - 1000 });
  learner.sessions.push({ ts: Date.now() - 1000, mission: 3, world: 'words', accuracy: 90 });
  const insights = buildParentInsights(learner, createCurriculumTaxonomy());
  assert.equal(insights.weeklySummary.homework >= 1, true);
  assert.equal(insights.priority.length > 0, true);
  assert.equal(insights.nextSteps.length > 0, true);
});

test('curriculum session composition blends current learning, review, weak skills, and stretch material', () => {
  const learner = defaultLearner('Mix', 'profile-mix');
  learner.skills['math-4-fractions'] = {
    skillId: 'math-4-fractions',
    masteryScore: 24,
    confidence: 0.3,
    masteryState: 'Practicing',
    evidence: { attempts: 3, independentSuccesses: 0, assistedSuccesses: 1, hintsUsed: 1, incorrectAttempts: 1, rapidAttempts: 0, responseTimeMsTotal: 5000 },
    recentPerformance: [],
    reviewHistory: [],
    prerequisiteState: { met: [], missing: [] },
    lastPracticedAt: Date.now() - 1,
    lastIndependentSuccessAt: null,
    nextReviewAt: Date.now() - 1,
    remediationLevel: 0,
    rewardIds: [],
  };
  learner.skills['reading-6-argument'] = {
    skillId: 'reading-6-argument',
    masteryScore: 88,
    confidence: 0.9,
    masteryState: 'Mastered',
    evidence: { attempts: 6, independentSuccesses: 4, assistedSuccesses: 1, hintsUsed: 0, incorrectAttempts: 0, rapidAttempts: 0, responseTimeMsTotal: 8000 },
    recentPerformance: [],
    reviewHistory: [],
    prerequisiteState: { met: [], missing: [] },
    lastPracticedAt: Date.now() - 1,
    lastIndependentSuccessAt: Date.now() - 1,
    nextReviewAt: Date.now() - 1,
    remediationLevel: 0,
    rewardIds: [],
  };
  const session = buildCurriculumSession({ learner, subject: 'math', grade: '4', sessionMinutes: 16, skillStates: learner.skills });
  assert.equal(session.grade, '4');
  assert.ok(session.items.length >= 1);
  assert.ok(session.counts.current + session.counts.review + session.counts.weak + session.counts.stretch >= 1);
});

test('save/load round trip, backup recovery, and schema envelopes work', () => {
  const storage = makeStorage();
  const foundation = normalizeFoundationState({
    learners: {
      a: {
        profileId: 'a',
        name: 'A',
        stage: 'brainbase',
        settings: { reducedMotion: true },
      },
    },
    activeLearnerId: 'a',
  });
  const saved = createRecoverySnapshot(foundation);
  saved.learners.a.hub.variant = 'upgraded';
  const normalized = importFoundationEnvelope(exportFoundationEnvelope(saved));
  persistFoundationState(saved, storage);
  const loaded = loadFoundationState(storage);
  assert.equal(loaded.learners.a.hub.variant, 'upgraded');
  const corruptStorage = makeStorage({
    'bb-brainbite-foundation-v1': '{broken',
    'bb-brainbite-foundation-v1-backup': JSON.stringify(saved),
  });
  const recovered = loadFoundationState(corruptStorage);
  assert.equal(recovered.learners.a.hub.variant, 'upgraded');
  assert.equal(normalized.version, 1);
  assert.equal(recovered.learners.a.settings.reducedMotion, true);
  const recoveryStorage = makeStorage({
    'bb-brainbite-foundation-v1': '{broken',
    'bb-brainbite-foundation-v1-backup': '{broken',
    'bb-brainbite-foundation-v1-recovery': JSON.stringify(saved),
  });
  const recoveryLoaded = loadFoundationState(recoveryStorage);
  assert.equal(recoveryLoaded.learners.a.hub.variant, 'upgraded');
});

test('recovery snapshots preserve state metadata without recursively nesting snapshots', () => {
  const state = normalizeFoundationState({
    learners: { a: { profileId: 'a', name: 'A', stage: 'brainbase' } },
    activeLearnerId: 'a',
    saveMeta: { lastSavedAt: 42, customMarker: 'kept' },
  });
  const snapshotted = createRecoverySnapshot(state);
  assert.equal(snapshotted.saveMeta.customMarker, 'kept');
  assert.equal(snapshotted.recoverySnapshot.recoverySnapshot, null);
  snapshotted.learners.a.stage = 'brainbase-upgrade';
  const restored = restoreFromRecoverySnapshot(snapshotted);
  assert.equal(restored.learners.a.stage, 'brainbase');
  assert.equal(restored.saveMeta.customMarker, 'kept');
  assert.equal(restored.recoverySnapshot, null);

  const resnapshotted = createRecoverySnapshot(snapshotted);
  assert.equal(resnapshotted.recoverySnapshot.recoverySnapshot, null);
});

test('persisted generations rotate primary, backup, and recovery independently', () => {
  const storage = makeStorage();
  const stateFor = stage => normalizeFoundationState({
    learners: { a: { profileId: 'a', name: 'A', stage } },
    activeLearnerId: 'a',
  });
  persistFoundationState(stateFor('one'), storage);
  persistFoundationState(stateFor('two'), storage);
  persistFoundationState(stateFor('three'), storage);
  const values = storage.dump();
  assert.equal(JSON.parse(values['bb-brainbite-foundation-v1']).learners.a.stage, 'three');
  assert.equal(JSON.parse(values['bb-brainbite-foundation-v1-backup']).learners.a.stage, 'two');
  assert.equal(JSON.parse(values['bb-brainbite-foundation-v1-recovery']).learners.a.stage, 'one');
});

test('malformed primary falls back to a valid backup before creating fresh progress', () => {
  const backup = normalizeFoundationState({
    learners: { a: { profileId: 'a', name: 'Recovered', stage: 'brainbase-upgrade' } },
    activeLearnerId: 'a',
  });
  const storage = makeStorage({
    'bb-brainbite-foundation-v1': JSON.stringify({ notFoundation: true }),
    'bb-brainbite-foundation-v1-backup': JSON.stringify(backup),
    'bb-brainbite-foundation-v1-recovery': JSON.stringify({ stillNotFoundation: true }),
  });
  const loaded = loadFoundationState(storage);
  assert.equal(loaded.learners.a.name, 'Recovered');
  assert.equal(loaded.learners.a.stage, 'brainbase-upgrade');
});

test('one corrupt skill provenance record is quarantined while sibling skills and learners survive', () => {
  const healthy = recordLearnerAttempt(defaultLearner('Healthy', 'healthy'), 'number-facts', {
    correct: true,
    independent: true,
    responseTimeMs: 1200,
  }, { id: 'number-facts' }).skills['number-facts'];
  const corrupt = {
    ...structuredClone(healthy),
    evidenceProvenance: { version: 5, legacy: 'corrupt-child-data', packed: 'not-a-provenance-record' },
  };
  const other = recordLearnerAttempt(defaultLearner('Other', 'other'), 'word-order', {
    correct: true,
    independent: true,
    responseTimeMs: 1200,
  }, { id: 'word-order' }).skills['word-order'];
  const normalized = normalizeFoundationState({
    learners: {
      healthy: { profileId: 'healthy', name: 'Healthy', skills: { good: healthy, bad: corrupt } },
      other: { profileId: 'other', name: 'Other', skills: { other: other } },
    },
    activeLearnerId: 'healthy',
  });
  assert.ok(normalized.learners.healthy.skills.good);
  assert.equal(normalized.learners.healthy.skills.bad, undefined);
  assert.ok(normalized.learners.other.skills.other);
  assert.equal(normalized.learners.healthy.quarantinedRecords.length, 1);
  assert.equal(normalized.learners.healthy.quarantinedRecords[0].kind, 'skill-state');
  assert.equal(normalized.learners.healthy.quarantinedRecords[0].recordId, 'bad');
  assert.equal(normalized.learners.healthy.quarantinedRecords[0].reason, 'invalid-skill-state');
  assert.doesNotMatch(normalized.learners.healthy.quarantinedRecords[0].reason, /corrupt-child-data/);
});

test('BrainBase upgrade persists and continuing from a completed stage remains consistent', () => {
  let learner = defaultLearner('Finn', 'profile-f');
  learner = setStageComplete(learner, 'fraction-kraken');
  learner = upgradeBrainBase(learner);
  assert.equal(learner.hub.variant, 'upgraded');
  assert.equal(learner.hub.expansionUnlocked, true);
});

test('settings survive learner normalization and storage round trips', () => {
  const learner = defaultLearner('Gio', 'profile-g');
  learner.settings.highContrast = true;
  learner.settings.reducedMotion = true;
  const normalized = normalizeFoundationState({ learners: { g: learner }, activeLearnerId: 'g' });
  assert.equal(normalized.learners.g.settings.highContrast, true);
  assert.equal(normalized.learners.g.settings.reducedMotion, true);
});

test('canonical generated validation rejects reviewed-template content substitution', () => {
  const approved = createApprovedCurriculumChallenge('math-1-addition', { seed: 9, family: ACTIVITY_FAMILIES.targetSmash });
  assert.equal(approved.approved, true);
  const alteredPrompt = structuredClone(approved.challenge);
  alteredPrompt.prompt = 'A substituted prompt with the same answer shape.';
  const promptValidation = validateGeneratedChallenge(alteredPrompt, findCurriculumSkill('math-1-addition'));
  assert.equal(promptValidation.approved, false);
  assert.ok(promptValidation.errors.includes('Canonical generated prompt does not match its reviewed template.'));

  const alteredAnswers = structuredClone(approved.challenge);
  alteredAnswers.answers = ['13'];
  const answerValidation = validateGeneratedChallenge(alteredAnswers, findCurriculumSkill('math-1-addition'));
  assert.equal(answerValidation.approved, false);
  assert.ok(answerValidation.errors.includes('Canonical generated answers do not match its reviewed template.'));
});

test('merging a skill state with itself leaves the mastery score unchanged', () => {
  let state = createSkillState('fractions');
  for (let index = 0; index < 4; index += 1) {
    state = scoreAttempt({ id: `a-${index}`, correct: index !== 2, independent: true, responseTimeMs: 2000, originId: 'device-a', originSequence: index + 1 }, state);
  }
  const merged = mergeSkillStates(state, state);
  assert.equal(merged.masteryScore, state.masteryScore);
  assert.equal(merged.evidence.attempts, state.evidence.attempts);
  const pulledNothingNew = mergeSkillStates(state, mergeSkillStates(state, state));
  assert.equal(pulledNothingNew.masteryScore, state.masteryScore);
});

test('a replayed attempt with the same id is scored once', () => {
  const attempt = { id: 'attempt-1', correct: true, independent: true, responseTimeMs: 1800 };
  const once = scoreAttempt(attempt, createSkillState('fractions'));
  const twice = scoreAttempt(attempt, once);
  assert.equal(twice.evidence.attempts, 1);
  assert.equal(twice.evidence.independentSuccesses, 1);
  assert.equal(twice.masteryScore, once.masteryScore);
  const other = scoreAttempt({ ...attempt, id: 'attempt-2' }, twice);
  assert.equal(other.evidence.attempts, 2);
});

test('cloud scrubbing removes a whole-word child name but not fields that merely contain its letters', () => {
  const event = () => ({ id: 'evt', type: 'ContentOutcomeObserved', createdAt: 1, payload: { skillId: 'place-value', family: 'target-smash', note: 'Great job Sam!' } });
  const short = normalizeFoundationState({ learners: { 'p-1': { ...defaultLearner('e', 'p-1'), telemetry: [event()] } } }).learners['p-1'];
  assert.equal(short.telemetry[0].payload.skillId, 'place-value');
  assert.equal(short.telemetry[0].payload.family, 'target-smash');
  const sam = normalizeFoundationState({ learners: { 'p-2': { ...defaultLearner('Sam', 'p-2'), telemetry: [event()] } } }).learners['p-2'];
  assert.equal(sam.telemetry[0].payload.skillId, 'place-value');
  assert.equal(sam.telemetry[0].payload.note, undefined);
  const samuel = normalizeFoundationState({ learners: { 'p-3': { ...defaultLearner('Samuel', 'p-3'), telemetry: [event()] } } }).learners['p-3'];
  assert.equal(samuel.telemetry[0].payload.note, 'Great job Sam!');
});
