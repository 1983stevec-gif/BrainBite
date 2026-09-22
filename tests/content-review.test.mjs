import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

import { validateContentReview } from '../scripts/validate-content-review.mjs';
import * as core from '../brainbite-core.mjs';

const require = createRequire(import.meta.url);
const review = require('../content/content-review-manifest.js');
const contentControl = require('../content/content-control-gate.js');
const registry = require('../content/experience-registry.js');
const { getReviewManifest, getReviewRecord, evaluateInternalReviewGate, evaluateProductionGate } = review;

function clone(value) {
  return structuredClone(value);
}

test('review manifest covers the reconciled Phase 3.2 inventory', () => {
  const manifest = getReviewManifest();
  assert.equal(manifest.version, '3.3.0');
  assert.deepEqual(manifest.coverage, {
    registryMissions: 30,
    generatedTemplates: 35,
    jsonPackItems: 40,
    linkedJsonPackItems: 17,
    quarantinedJsonPackItems: 23,
    totalRecords: 105,
  });
  assert.equal(manifest.records.length, 105);
  assert.equal(manifest.records.filter(record => record.kind === 'registry-mission').length, 30);
  assert.equal(manifest.records.filter(record => record.kind === 'generated-template').length, 35);
  assert.equal(manifest.records.filter(record => record.kind === 'json-pack-item').length, 40);
  assert.equal(manifest.records.filter(record => record.kind === 'json-pack-item' && record.quarantine.status === 'clear').length, 17);
  assert.equal(manifest.records.filter(record => record.kind === 'json-pack-item' && record.quarantine.status === 'quarantined').length, 23);
});

test('validator rejects a stale source digest', () => {
  const manifest = clone(getReviewManifest());
  manifest.records[0].digest.value = '0'.repeat(64);

  const result = validateContentReview({ manifest });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('registry-mission:1: stale source digest'));
});

test('production gate rejects educator approval without reviewer metadata', () => {
  const record = clone(getReviewRecord('generated-template:math-1-addition'));
  record.educatorReview = { status: 'approved', reviewer: null, reviewedAt: null };

  const result = evaluateProductionGate(record, { currentDigest: record.digest.value });
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes('educator-review-metadata-invalid'));
});

test('quarantined JSON pack items cannot enter internal review', () => {
  const record = getReviewRecord('json-pack-item:math-question-bank-v1.7.json::$.sets[2]');
  const result = evaluateInternalReviewGate(record, { currentDigest: record.digest.value });

  assert.equal(record.quarantine.status, 'quarantined');
  assert.ok(record.quarantine.reasons.includes('no-canonical-division-skill'));
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes('quarantine-active'));
});

test('exact-digest validated prototypes can pass the internal-review gate', () => {
  const record = getReviewRecord('generated-template:math-1-addition');
  const result = evaluateInternalReviewGate(record, { currentDigest: record.digest.value });

  assert.equal(record.runtime.status, 'internal-review');
  assert.equal(record.educatorReview.status, 'pending-educator');
  assert.equal(result.eligible, true);
  assert.deepEqual(result.reasons, []);
});

test('synthetic fully reviewed record can pass the production gate', () => {
  const record = clone(getReviewRecord('generated-template:math-1-addition'));
  record.educatorReview = {
    status: 'approved',
    reviewer: {
      id: 'educator-001',
      role: 'licensed-educator',
      reviewedAt: '2026-09-12T20:00:00.000Z',
    },
    reviewedAt: '2026-09-12T20:00:00.000Z',
  };

  const result = evaluateProductionGate(record, { currentDigest: record.digest.value });
  assert.equal(result.eligible, true);
  assert.deepEqual(result.reasons, []);
});

test('canonical registry missions pass production while generated templates remain fail-closed', () => {
  const mission = registry.missions[0];
  const record = getReviewRecord(`registry-mission:${mission.id}`);
  assert.deepEqual(record.runtime, {
    status: 'production-reviewed',
    prototype: false,
    production: true,
  });
  assert.equal(evaluateProductionGate(record, { currentDigest: record.digest.value }).eligible, true);
  const launch = contentControl.evaluateLaunch({
    identity: record.identity,
    registry,
    launchedPayload: mission,
    programmaticValidation: registry.validateRegistry(),
    href: 'https://brainbite.example/',
  });
  assert.equal(launch.approved, true, launch.reasons.join(', '));

  const generated = getReviewRecord('generated-template:math-1-addition');
  assert.equal(evaluateProductionGate(generated, { currentDigest: generated.digest.value }).eligible, false);
  assert.equal(generated.runtime.production, false);
});

test('registry launch binds the exact reviewed payload and rejects borrowed review identity', () => {
  const mission = registry.missions[0];
  const record = getReviewRecord(`registry-mission:${mission.id}`);
  for (const tampered of [
    { ...mission, prompt: `${mission.prompt} altered` },
    { ...mission, correct: [...mission.correct, '__tampered_correct__'] },
    { ...mission, wrong: [...mission.wrong, '__tampered_distractor__'] },
  ]) {
    const result = contentControl.evaluateLaunch({
      identity: record.identity,
      registry,
      launchedPayload: tampered,
      programmaticValidation: registry.validateRegistry(),
      href: 'https://brainbite.example/',
    });
    assert.equal(result.approved, false);
    assert.ok(result.reasons.includes('launched-payload-source-mismatch'));
  }
});

test('manifest loads without Node globals for browser consumers', () => {
  const source = fs.readFileSync(new URL('../content/content-review-manifest.js', import.meta.url), 'utf8');
  const context = { globalThis: {} };
  vm.runInNewContext(source, context);

  assert.equal(typeof context.globalThis.BrainBiteContentReviewManifest.getReviewRecord, 'function');
  assert.equal(context.globalThis.BrainBiteContentReviewManifest.records.length, 105);
});

test('live manifest validates against all canonical sources', () => {
  const result = validateContentReview();
  assert.equal(result.valid, true, result.errors.join('\n'));
});

test('release and hosted runtimes cannot be upgraded by public mode query parameters', () => {
  assert.equal(contentControl.getRuntimeMode({ href: 'https://brainbite.example/?release=1&contentMode=internal-review' }), 'production');
  assert.equal(contentControl.getRuntimeMode({ href: 'https://brainbite.example/?mode=internal-review' }), 'production');
  assert.equal(contentControl.getRuntimeMode({ href: 'http://localhost/?beta=1&mode=internal-review' }), 'production');
  assert.equal(contentControl.getRuntimeMode({ href: 'http://localhost/?rc=1&test=1' }), 'production');
  assert.equal(contentControl.getRuntimeMode({ href: 'http://localhost/?contentMode=internal-review' }), 'internal-review');
  assert.equal(contentControl.getRuntimeMode({ href: 'https://brainbite.example/?mode=internal-review', trustedTestHarness: true }), 'internal-review');
  assert.equal(contentControl.getRuntimeMode({ href: 'https://brainbite.example/?release=1', trustedTestHarness: true }), 'production');
});

test('hosted runtime ignores post-bootstrap mutable review globals', () => {
  const previous = globalThis.__BRAINBITE_INTERNAL_REVIEW__;
  try {
    globalThis.__BRAINBITE_INTERNAL_REVIEW__ = true;
    assert.equal(contentControl.getRuntimeMode({ href: 'https://brainbite.example/' }), 'production');
  } finally {
    if (previous === undefined) delete globalThis.__BRAINBITE_INTERNAL_REVIEW__;
    else globalThis.__BRAINBITE_INTERNAL_REVIEW__ = previous;
  }
});

test('single-learner timing anomalies remain review telemetry until corroborated', () => {
  const mixed = [
    { correct: true, responseTimeMs: 120 },
    { correct: true, responseTimeMs: 130 },
    { correct: true, responseTimeMs: 140 },
    { correct: false, responseTimeMs: 1800 },
  ];
  assert.equal(contentControl.inspectOutcome(mixed).suspicious, false);
  const unreliable = [...mixed.slice(0, 3), { correct: false, responseTimeMs: 120 }];
  assert.equal(contentControl.inspectOutcome(unreliable).signals.includes('response-time-anomaly'), true);
  const outcome = contentControl.quarantineSuspiciousOutcome(unreliable, { contentIdentity: 'generated-template:test' });
  assert.equal(outcome.quarantined, false);
  assert.deepEqual(outcome.signals, []);
  assert.ok(outcome.reviewSignals.includes('response-time-anomaly'));
  assert.equal(outcome.action, 'review-telemetry');
});

test('three wrong answers in four attempts do not quarantine a learner or content', () => {
  const attempts = [
    { correct: false, responseTimeMs: 900 },
    { correct: false, responseTimeMs: 1000 },
    { correct: false, responseTimeMs: 1100 },
    { correct: true, responseTimeMs: 1300 },
  ];
  const result = contentControl.quarantineSuspiciousOutcome(attempts, { contentIdentity: 'registry-mission:1' });
  assert.equal(result.quarantined, false);
  assert.equal(result.suspicious, false);
  assert.deepEqual(result.signals, []);
  assert.ok(result.reviewSignals.includes('high-miss-rate'));
  assert.ok(result.reviewSignals.includes('high-retry-count'));
  assert.equal(result.action, 'review-telemetry');
});

test('repeated learner struggle records review signals without a learner lockout', () => {
  const attempts = Array.from({ length: 8 }, (_, index) => ({
    correct: index === 7,
    hintsUsed: 1,
    assisted: true,
    responseTimeMs: 1800,
  }));
  const result = contentControl.quarantineSuspiciousOutcome(attempts, { contentIdentity: 'generated-template:reading' });
  assert.equal(result.quarantined, false);
  assert.equal(result.learnerPunishment, 'none');
  assert.equal(result.action, 'review-telemetry');
  assert.ok(result.reviewSignals.includes('high-hint-rate'));
  assert.ok(result.reviewSignals.includes('high-miss-rate'));
});

test('a corroborated anomaly across a complete cross-learner window can quarantine content', () => {
  const contentObservations = ['learner-a', 'learner-b', 'learner-c'].map(learnerId => ({
    learnerId,
    attempts: Array.from({ length: 8 }, () => ({
      correct: false,
      responseTimeMs: 1000,
    })),
  }));
  const result = contentControl.quarantineSuspiciousOutcome([], {
    contentIdentity: 'generated-template:broken-item',
    contentObservations,
  });
  assert.equal(result.quarantined, true);
  assert.equal(result.suspicious, true);
  assert.ok(result.signals.includes('high-miss-rate'));
  assert.ok(result.signals.includes('high-retry-count'));
  assert.equal(result.qualityMetrics.distinctLearners, 3);
  assert.equal(result.qualityMetrics.totalAttempts, 24);
  assert.equal(result.action, 'quarantine-review');
});

test('cross-learner corroboration requires stable learner identities', () => {
  const contentObservations = Array.from({ length: 3 }, () => ({
    attempts: Array.from({ length: 8 }, () => ({ correct: false, responseTimeMs: 1000 })),
  }));
  const result = contentControl.quarantineSuspiciousOutcome([], { contentObservations });
  assert.equal(result.quarantined, false);
  assert.deepEqual(result.signals, []);
  assert.equal(result.qualityMetrics.distinctLearners, 0);
});

test('anonymous or incomplete windows cannot help spoof cross-learner quarantine', () => {
  const normal = ['learner-a', 'learner-b', 'learner-c'].map(learnerId => ({
    learnerId,
    attempts: Array.from({ length: 4 }, () => ({ correct: true, responseTimeMs: 1000 })),
  }));
  const anonymousFailures = Array.from({ length: 3 }, () => ({
    attempts: Array.from({ length: 8 }, () => ({ correct: false, responseTimeMs: 1000 })),
  }));
  const mixed = contentControl.quarantineSuspiciousOutcome([], { contentObservations: [...normal, ...anonymousFailures] });
  assert.equal(mixed.quarantined, false);
  assert.equal(mixed.qualityMetrics.anomalousLearners, 0);

  const incomplete = contentControl.quarantineSuspiciousOutcome([], {
    contentObservations: ['learner-a', 'learner-b', 'learner-c'].map(learnerId => ({
      learnerId,
      attempts: [{ correct: false, responseTimeMs: 100 }],
    })),
  });
  assert.equal(incomplete.quarantined, false);
  assert.equal(incomplete.qualityMetrics.distinctLearners, 0);
});

test('runtime callers cannot weaken quarantine thresholds', () => {
  const result = contentControl.quarantineSuspiciousOutcome([], {
    thresholds: { minimumAttempts: 0, windowAttempts: 0, minimumDistinctLearners: 0, minimumAnomalousLearners: 0 },
    contentObservations: [{ attempts: [] }],
  });
  assert.equal(result.quarantined, false);
  assert.equal(result.thresholds.minimumAttempts, contentControl.SUSPICIOUS_THRESHOLDS.minimumAttempts);
  assert.equal(result.thresholds.minimumDistinctLearners, contentControl.SUSPICIOUS_THRESHOLDS.minimumDistinctLearners);
});

test('canonical ordered-family choices remain bound to reviewed values', () => {
  for (const [skillId, family, field] of [
    ['reading-4-inference', 'Letter Trail', 'choices'],
    ['math-4-fractions', 'Knowledge Platforms', 'platforms'],
  ]) {
    const route = core.createApprovedCurriculumChallenge(skillId, { family, seed: 17 });
    assert.equal(route.approved, true);
    const altered = clone(route.challenge);
    altered[field][0] = 'unreviewed-option';
    assert.equal(core.validateGeneratedChallenge(altered, core.findCurriculumSkill(skillId)).valid, false);
  }
});

test('canonical generated support and taxonomy metadata remain bound to review', () => {
  const source = core.createCurriculumChallenge('math-4-fractions', { family: core.ACTIVITY_FAMILIES.letterTrail, difficulty: 'normal', seed: 19 });
  const alteredSupport = { ...source, supportMetadata: { ...source.supportMetadata, visualSupport: 'unreviewed' } };
  const alteredTaxonomy = { ...source, domain: 'unreviewed-domain' };
  assert.equal(core.validateGeneratedChallenge(alteredSupport).valid, false);
  assert.equal(core.validateGeneratedChallenge(alteredTaxonomy).valid, false);
});

test('release and deployment workflows explicitly validate reviewed content before publishing', () => {
  const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const ci = fs.readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const pages = fs.readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  for (const script of ['beta:check', 'rc:check', 'release:check']) assert.match(packageJson.scripts[script], /check:content-review/);
  assert.match(ci, /npm run check:content-review/);
  assert.match(pages, /set -euo pipefail[\s\S]*npm run check:content[\s\S]*npm run check:content-review[\s\S]*Stage static site/);
});
