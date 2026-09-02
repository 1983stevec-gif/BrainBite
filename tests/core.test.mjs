import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITY_FAMILIES,
  buildAdaptiveSession,
  createFoundationState,
  createCurriculumChallenge,
  createKnowledgePlatformChallenge,
  createLetterTrailChallenge,
  createRecoverySnapshot,
  createTargetSmashChallenge,
  createCurriculumTaxonomy,
  defaultLearner,
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
  validateGeneratedChallenge,
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
