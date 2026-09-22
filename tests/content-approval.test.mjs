import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { digest, validateContentReview } from '../scripts/validate-content-review.mjs';
import { planApprovals } from '../scripts/approve-content.mjs';
import { loadSources, repoRoot, resolveRecordValue } from '../scripts/lib/content-sources.mjs';

const require = createRequire(import.meta.url);
const manifest = require(resolve(repoRoot, 'content/content-review-manifest.js'));
const records = Object.values(manifest.records);
const sources = await loadSources();
const byIdentity = new Map(records.map(record => [record.identity, record]));

const TEMPLATE = 'generated-template:math-k-counting';
const QUARANTINED = records.find(record => record.quarantine?.status === 'quarantined').identity;
const REVIEWER = { id: 'reviewer-001', role: 'Grade K teacher' };
const REVIEWED_AT = '2026-09-22T00:00:00.000Z';

// Builds a manifest clone that mirrors what approve-content.mjs writes for one identity.
function manifestWithApproval(identity, {
  reviewer = REVIEWER,
  reviewedAt = REVIEWED_AT,
  recordReviewer = null,
  recordReviewedAt = null,
  digestOverride = null,
  forcePromote = true,
} = {}) {
  const clone = structuredClone({
    ...manifest.getReviewManifest(),
    approvals: { [identity]: { reviewer, reviewedAt } },
  });
  if (forcePromote) {
    const record = clone.records.find(entry => entry.identity === identity);
    // The record may deliberately disagree with the approval to exercise the contract.
    record.educatorReview = { status: 'approved', reviewer: recordReviewer || reviewer, reviewedAt: recordReviewedAt || reviewedAt };
    record.runtime = { status: 'production-reviewed', prototype: false, production: true };
    record.promotion = { status: 'production-reviewed', reasons: [] };
  }
  if (digestOverride) {
    const record = clone.records.find(entry => entry.identity === identity);
    record.digest = { ...record.digest, value: digestOverride };
  }
  return clone;
}

test('the shipped manifest has no approvals and keeps every non-registry record fail-closed', () => {
  assert.deepEqual(Object.keys(manifest.approvals || {}), []);
  const approved = records.filter(record => record.educatorReview?.status === 'approved');
  assert.equal(approved.length, 0, 'no record may be educator-approved without a recorded approval');
  assert.equal(records.filter(record => record.runtime.production === true).length, 30, 'only the reviewed registry missions ship');
});

test('the live sources still match every recorded digest', () => {
  const mismatches = [];
  for (const record of records) {
    const { value, reason } = resolveRecordValue(record, sources);
    if (reason) { mismatches.push(`${record.identity}: ${reason}`); continue; }
    if (digest(value) !== record.digest.value) mismatches.push(`${record.identity}: digest drift`);
  }
  assert.deepEqual(mismatches, [], 'a drifted digest invalidates review evidence');
});

test('a digest-matching approval validates, and stale or malformed approvals are rejected', () => {
  const accepted = validateContentReview({ manifest: manifestWithApproval(TEMPLATE) });
  assert.equal(accepted.valid, true, accepted.errors.join('\n'));

  // A source that changed after review must invalidate the approval.
  const stale = validateContentReview({ manifest: manifestWithApproval(TEMPLATE, { digestOverride: 'f'.repeat(64) }) });
  assert.equal(stale.valid, false);
  assert.ok(stale.errors.some(error => /stale source digest/.test(error)), stale.errors.join('\n'));

  // Reviewer metadata must match the recorded approval exactly.
  const wrongReviewer = validateContentReview({ manifest: manifestWithApproval(TEMPLATE, { recordReviewer: { id: 'someone-else', role: 'Grade K teacher' } }) });
  assert.equal(wrongReviewer.valid, false);
  assert.ok(wrongReviewer.errors.some(error => /approval reviewer metadata mismatch/.test(error)));

  const wrongTimestamp = validateContentReview({ manifest: manifestWithApproval(TEMPLATE, { recordReviewedAt: '2020-01-01T00:00:00.000Z' }) });
  assert.equal(wrongTimestamp.valid, false);
  assert.ok(wrongTimestamp.errors.some(error => /approval timestamp mismatch/.test(error)));
});

test('an approval cannot leave a record unpromoted or cover quarantined content', () => {
  const unpromoted = validateContentReview({ manifest: manifestWithApproval(TEMPLATE, { forcePromote: false }) });
  assert.equal(unpromoted.valid, false);
  assert.ok(unpromoted.errors.some(error => /must be promoted to production/.test(error)), unpromoted.errors.join('\n'));

  const quarantined = validateContentReview({ manifest: manifestWithApproval(QUARANTINED) });
  assert.equal(quarantined.valid, false);
  assert.ok(quarantined.errors.some(error => /quarantined record can never be educator-approved/.test(error)), quarantined.errors.join('\n'));
});

test('the approval planner refuses quarantined, unknown, and stale-digest requests', () => {
  const { accepted, refused } = planApprovals({
    requested: [TEMPLATE, QUARANTINED, 'generated-template:no-such-skill'],
    recordsByIdentity: byIdentity,
    sources,
    reviewer: REVIEWER,
  });
  assert.deepEqual(accepted.map(entry => entry.identity), [TEMPLATE]);
  assert.deepEqual(refused.map(entry => entry.reason), ['record is quarantined', 'no such record']);

  // A manifest whose digest no longer matches its source must be regenerated first.
  const tampered = new Map(byIdentity);
  const original = tampered.get(TEMPLATE);
  tampered.set(TEMPLATE, { ...original, digest: { ...original.digest, value: 'f'.repeat(64) } });
  const stale = planApprovals({ requested: [TEMPLATE], recordsByIdentity: tampered, sources, reviewer: REVIEWER });
  assert.equal(stale.accepted.length, 0);
  assert.match(stale.refused[0].reason, /does not match the reviewed digest/);

  // Registry missions already ship, so they are not re-approvable.
  const already = planApprovals({ requested: ['registry-mission:1'], recordsByIdentity: byIdentity, sources, reviewer: REVIEWER });
  assert.equal(already.refused[0].reason, 'already production-eligible');
});
