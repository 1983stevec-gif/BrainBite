import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { digest, validateContentReview } from '../scripts/validate-content-review.mjs';
import { planApprovals, planRejections, replaceDataBlock } from '../scripts/review-content.mjs';
import { loadSources, repoRoot, resolveRecordValue } from '../scripts/lib/content-sources.mjs';

const require = createRequire(import.meta.url);
const manifest = require(resolve(repoRoot, 'content/content-review-manifest.js'));
const records = Object.values(manifest.records);
const sources = await loadSources();
const byIdentity = new Map(records.map(record => [record.identity, record]));

const TEMPLATE = 'generated-template:math-k-counting';
const LINKED_JSON = records.find(record => record.kind === 'json-pack-item' && record.taxonomy?.linkage === 'linked').identity;
const QUARANTINED = records.find(record => record.quarantine?.status === 'quarantined').identity;
const REVIEWER = { id: 'reviewer-001', role: 'Grade K teacher' };
const REVIEWED_AT = '2026-09-22T00:00:00.000Z';

// Run the actual command against disposable content, never educator data in the checkout.
function reviewFixture(t) {
  const parent = resolve(repoRoot, '.playwright-results');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(resolve(parent, 'review-cli-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const entry of ['content', 'scripts', 'brainbite-core.mjs']) {
    cpSync(resolve(repoRoot, entry), resolve(root, entry), { recursive: true });
  }
  const file = resolve(root, 'content/content-review-manifest.js');
  const original = readFileSync(file, 'utf8');
  const runRaw = (...args) => spawnSync(process.execPath, [
    resolve(root, 'scripts/review-content.mjs'), ...args,
  ], { cwd: root, encoding: 'utf8', timeout: 60000 });
  const run = (...args) => runRaw('--reviewer', REVIEWER.id, '--role', REVIEWER.role, ...args);
  return { root, file, original, run, runRaw };
}

for (const mode of ['approve', 'reject']) {
  test(`review CLI refuses a mixed ${mode} batch without writing any records`, t => {
    const fixture = reviewFixture(t);
    const flags = mode === 'reject' ? ['--reject', '--reason', 'fixture finding'] : [];
    const result = fixture.run(...flags, '--ids', `${TEMPLATE},no-such-record`);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /nothing was written/);
    assert.equal(readFileSync(fixture.file, 'utf8'), fixture.original);
  });
}

test('review CLI dry run preserves bytes and successful fixture approval/rejection validates', t => {
  const fixture = reviewFixture(t);
  const dry = fixture.run('--ids', TEMPLATE, '--dry-run');
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(readFileSync(fixture.file, 'utf8'), fixture.original);
  const approved = fixture.run('--ids', TEMPLATE);
  assert.equal(approved.status, 0, approved.stderr);
  assert.match(approved.stdout, /Approved 1 record\(s\); content-review validation passed/);
  assert.match(
    readFileSync(fixture.file, 'utf8'),
    new RegExp(`reviewedDigest: ${JSON.stringify(byIdentity.get(TEMPLATE).digest.value)}`),
  );
  const rejected = fixture.run('--reject', '--reason', 'fixture finding', '--ids', TEMPLATE);
  assert.equal(rejected.status, 0, rejected.stderr);
  assert.match(rejected.stdout, /Rejected 1 record\(s\); content-review validation passed/);
  const updated = createRequire(resolve(fixture.root, 'fixture.cjs'))(fixture.file);
  assert.equal(updated.approvals[TEMPLATE], undefined);
  assert.equal(updated.reviewerFindings[TEMPLATE].reason, 'fixture finding');
});

for (const mode of ['approve', 'reject']) {
  test(`review CLI restores original bytes when ${mode} post-write validation fails`, t => {
    const fixture = reviewFixture(t);
    // The selected template is current, but unrelated stale content fails the real
    // post-write validator. Preserve even these preexisting invalid bytes on rollback.
    const stale = fixture.original.replace(byIdentity.get('registry-mission:1').digest.value, 'f'.repeat(64));
    writeFileSync(fixture.file, stale);
    const flags = mode === 'reject' ? ['--reject', '--reason', 'fixture finding'] : [];
    const result = fixture.run(...flags, '--ids', TEMPLATE);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /validation FAILED; original manifest restored/);
    assert.match(result.stderr, /registry-mission:1: stale source digest/);
    assert.equal(readFileSync(fixture.file, 'utf8'), stale);
  });
}

for (const initiallyApproved of [false, true]) {
  test(`review CLI rejects ${initiallyApproved ? 'approved' : 'pending'} linked JSON without changing source coverage`, t => {
    const fixture = reviewFixture(t);
    if (initiallyApproved) {
      const approved = fixture.run('--ids', LINKED_JSON);
      assert.equal(approved.status, 0, approved.stderr);
    }
    const before = readFileSync(fixture.file, 'utf8');
    const dry = fixture.run('--reject', '--reason', 'fixture finding', '--ids', LINKED_JSON, '--dry-run');
    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /Dry run: no changes written/);
    assert.equal(readFileSync(fixture.file, 'utf8'), before);
    const rejected = fixture.run('--reject', '--reason', 'fixture finding', '--ids', LINKED_JSON);
    assert.equal(rejected.status, 0, rejected.stderr);
    assert.match(rejected.stdout, /Rejected 1 record\(s\); content-review validation passed/);
    const updated = createRequire(resolve(fixture.root, 'fixture.cjs'))(fixture.file);
    const record = updated.getReviewRecord(LINKED_JSON);
    assert.equal(updated.approvals[LINKED_JSON], undefined);
    assert.equal(record.educatorReview.status, 'rejected');
    assert.equal(record.quarantine.status, 'quarantined');
    assert.equal(record.runtime.production, false);
    assert.equal(updated.evaluateProductionGate(LINKED_JSON, { currentDigest: record.digest.value }).eligible, false);
    assert.deepEqual(updated.getReviewManifest().coverage, manifest.getReviewManifest().coverage);
    const reapprove = fixture.run('--ids', LINKED_JSON);
    assert.equal(reapprove.status, 1, reapprove.stderr);
    assert.match(reapprove.stdout, /record is quarantined/);
  });
}

test('review CLI rejects missing and blank metadata before writing, including dry runs', t => {
  const fixture = reviewFixture(t);
  for (const dryRun of [false, true]) {
    for (const field of ['reviewer', 'role', 'reason']) {
      for (const invalid of [null, '', ' ']) {
        const args = ['--reject'];
        for (const [name, value] of [['reviewer', REVIEWER.id], ['role', REVIEWER.role], ['reason', 'fixture finding']]) {
          args.push(`--${name}`);
          if (name !== field) args.push(value);
          else if (invalid !== null) args.push(invalid);
        }
        args.push('--ids', TEMPLATE);
        if (dryRun) args.push('--dry-run');
        const result = fixture.runRaw(...args);
        assert.equal(result.status, 2, `${JSON.stringify(args)}: ${result.stderr}`);
        assert.match(result.stderr, /Usage:/);
        assert.equal(readFileSync(fixture.file, 'utf8'), fixture.original);
      }
    }
    const result = fixture.runRaw('--reviewer', '--role', REVIEWER.role, '--ids', TEMPLATE, ...(dryRun ? ['--dry-run'] : []));
    assert.equal(result.status, 2, result.stderr);
    assert.equal(readFileSync(fixture.file, 'utf8'), fixture.original);
  }
});

test('review CLI refuses stale-source rejection before writing, including dry runs', t => {
  const fixture = reviewFixture(t);
  const stale = fixture.original.replace(byIdentity.get(TEMPLATE).digest.value, 'f'.repeat(64));
  writeFileSync(fixture.file, stale);
  for (const flags of [[], ['--dry-run']]) {
    const result = fixture.run('--reject', '--reason', 'fixture finding', '--ids', TEMPLATE, ...flags);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /repair\/regenerate the manifest before rejecting/);
    assert.match(result.stderr, /nothing was written/);
    assert.doesNotMatch(result.stderr, /validation FAILED/);
    assert.equal(readFileSync(fixture.file, 'utf8'), stale);
  }
});

// Builds a manifest clone that mirrors what review-content.mjs writes for one identity.
function manifestWithApproval(identity, {
  reviewer = REVIEWER,
  reviewedAt = REVIEWED_AT,
  recordReviewer = null,
  recordReviewedAt = null,
  approvalReviewedDigest = null,
  recordReviewedDigest = null,
  digestOverride = null,
  forcePromote = true,
} = {}) {
  const clone = structuredClone({
    ...manifest.getReviewManifest(),
    approvals: { [identity]: { reviewer, reviewedAt, reviewedDigest: approvalReviewedDigest || manifest.getReviewRecord(identity).digest.value } },
  });
  if (forcePromote) {
    const record = clone.records.find(entry => entry.identity === identity);
    // The record may deliberately disagree with the approval to exercise the contract.
    record.educatorReview = {
      status: 'approved',
      reviewer: recordReviewer || reviewer,
      reviewedAt: recordReviewedAt || reviewedAt,
      reviewedDigest: recordReviewedDigest || clone.approvals[identity].reviewedDigest,
    };
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
  assert.equal(manifest.getReviewManifest().approvals, manifest.approvals);
  assert.equal(manifest.getReviewManifest().reviewerFindings, manifest.reviewerFindings);
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

  const missingDigest = manifestWithApproval(TEMPLATE);
  delete missingDigest.approvals[TEMPLATE].reviewedDigest;
  delete missingDigest.records.find(entry => entry.identity === TEMPLATE).educatorReview.reviewedDigest;
  const missing = validateContentReview({ manifest: missingDigest });
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.some(error => /reviewedDigest/.test(error)), missing.errors.join('\n'));

  // Regenerating a record digest while retaining the old approval must fail even when the
  // record's own digest field is otherwise current-looking.
  const regenerated = validateContentReview({ manifest: manifestWithApproval(TEMPLATE, { digestOverride: 'a'.repeat(64) }) });
  assert.equal(regenerated.valid, false);
  assert.ok(regenerated.errors.some(error => /approval reviewedDigest does not match record digest/.test(error)), regenerated.errors.join('\n'));
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

// Builds a manifest clone that mirrors what review-content.mjs --reject writes for one
// identity: the finding quarantines the record, the review status becomes rejected, and the
// record leaves production.
function manifestWithFinding(identity, {
  reviewer = REVIEWER,
  rejectedAt = REVIEWED_AT,
  reason = 'answer key does not match the reviewed intent',
  keepApproval = false,
  forcePromote = false,
} = {}) {
  const clone = structuredClone(manifest.getReviewManifest());
  const finding = { reviewer, rejectedAt, reason };
  clone.reviewerFindings = { [identity]: finding };
  const record = clone.records.find(entry => entry.identity === identity);
  record.reviewerFinding = finding;
  record.educatorReview = { status: 'rejected', reviewer, reviewedAt: rejectedAt };
  record.quarantine = { status: 'quarantined', reasons: [...record.quarantine.reasons, `reviewer-rejected: ${reason}`] };
  record.promotion = { status: 'quarantined', reasons: ['quarantine-active'] };
  if (forcePromote) record.runtime = { status: 'production-reviewed', prototype: false, production: true };
  if (keepApproval) clone.approvals = { [identity]: { reviewer, reviewedAt: rejectedAt } };
  return clone;
}

test('a reviewer finding quarantines the record so it can never be approved', () => {
  const clone = manifestWithFinding(TEMPLATE);
  const consistent = validateContentReview({ manifest: clone });
  assert.equal(consistent.valid, true, consistent.errors.join('\n'));

  const rejectedByIdentity = new Map(clone.records.map(record => [record.identity, record]));
  const { accepted, refused } = planApprovals({
    requested: [TEMPLATE],
    recordsByIdentity: rejectedByIdentity,
    sources,
    reviewer: REVIEWER,
  });
  assert.deepEqual(accepted, []);
  assert.deepEqual(refused.map(entry => entry.reason), ['record is quarantined']);
});

test('a rejection supersedes an approval and cannot leave the record in production', () => {
  const contradictory = validateContentReview({ manifest: manifestWithFinding(TEMPLATE, { keepApproval: true }) });
  assert.equal(contradictory.valid, false);
  assert.ok(
    contradictory.errors.some(error => /quarantined record can never be educator-approved/.test(error)),
    contradictory.errors.join('\n'),
  );

  const promoted = validateContentReview({ manifest: manifestWithFinding(TEMPLATE, { forcePromote: true }) });
  assert.equal(promoted.valid, false);
  assert.ok(
    promoted.errors.some(error => /a rejected record must not be production-eligible/.test(error)),
    promoted.errors.join('\n'),
  );
});

test('review validation rejects blank identity, role, timestamp and rejection reason', () => {
  for (const reviewer of [{ id: ' ', role: 'teacher' }, { id: 'reviewer', role: ' ' }]) {
    const result = validateContentReview({ manifest: manifestWithApproval(TEMPLATE, { reviewer }) });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => /non-empty reviewer/.test(error)));
  }
  const timestamp = validateContentReview({ manifest: manifestWithApproval(TEMPLATE, { reviewedAt: 'not-a-date' }) });
  assert.equal(timestamp.valid, false);
  assert.ok(timestamp.errors.some(error => /valid timestamp/.test(error)));
  const reason = validateContentReview({ manifest: manifestWithFinding(TEMPLATE, { reason: ' ' }) });
  assert.equal(reason.valid, false);
  assert.ok(reason.errors.some(error => /non-empty reason/.test(error)));
});

test('review validation checks map shapes and every entry including unknown identities', () => {
  for (const name of ['approvals', 'reviewerFindings']) {
    for (const value of [undefined, null, [], 'invalid', 42, false]) {
      const clone = structuredClone(manifest.getReviewManifest());
      clone[name] = value;
      const result = validateContentReview({ manifest: clone });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(error => error.includes(`${name} must be an object map`)), result.errors.join('\n'));
    }
    for (const identity of [TEMPLATE, 'no-such-record']) {
      for (const value of [undefined, null, [], 'invalid', 42, false]) {
        const clone = structuredClone(manifest.getReviewManifest());
        clone[name] = { [identity]: value };
        const result = validateContentReview({ manifest: clone });
        assert.equal(result.valid, false);
        assert.ok(result.errors.some(error => error.includes(`${name} entry must be an object`)), result.errors.join('\n'));
        if (identity === 'no-such-record') assert.ok(result.errors.some(error => /unknown identity/.test(error)));
      }
    }
    const clone = structuredClone(manifest.getReviewManifest());
    clone[name] = { 'no-such-record': { reviewer: { id: ' ', role: ' ' }, reviewedAt: 'bad', rejectedAt: 'bad', reason: ' ' } };
    const result = validateContentReview({ manifest: clone });
    assert.equal(result.valid, false);
    for (const pattern of [/unknown identity/, /non-empty reviewer/, /valid timestamp/]) {
      assert.ok(result.errors.some(error => pattern.test(error)), result.errors.join('\n'));
    }
    if (name === 'reviewerFindings') assert.ok(result.errors.some(error => /non-empty reason/.test(error)));
  }
});

test('review validation requires plain object maps and preserves malformed entries for diagnostics', () => {
  for (const value of [new Map([[TEMPLATE, { reviewer: REVIEWER, reviewedAt: REVIEWED_AT, reviewedDigest: 'f'.repeat(64) }]]), new Set([TEMPLATE]), new Date()]) {
    const clone = structuredClone(manifest.getReviewManifest());
    clone.approvals = value;
    const result = validateContentReview({ manifest: clone });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => /approvals must be an object map/.test(error)), result.errors.join('\n'));
  }

  const nullPrototype = Object.create(null);
  nullPrototype[TEMPLATE] = {
    reviewer: REVIEWER,
    reviewedAt: REVIEWED_AT,
    reviewedDigest: manifest.getReviewRecord(TEMPLATE).digest.value,
  };
  const accepted = validateContentReview({ manifest: manifestWithApproval(TEMPLATE) });
  const withNullPrototype = structuredClone(manifest.getReviewManifest());
  withNullPrototype.approvals = nullPrototype;
  withNullPrototype.records.find(entry => entry.identity === TEMPLATE).educatorReview = {
    status: 'approved',
    reviewer: REVIEWER,
    reviewedAt: REVIEWED_AT,
    reviewedDigest: nullPrototype[TEMPLATE].reviewedDigest,
  };
  withNullPrototype.records.find(entry => entry.identity === TEMPLATE).runtime = {
    status: 'production-reviewed', prototype: false, production: true,
  };
  withNullPrototype.records.find(entry => entry.identity === TEMPLATE).promotion = {
    status: 'production-reviewed', reasons: [],
  };
  assert.equal(accepted.valid, true, accepted.errors.join('\n'));
  const nullResult = validateContentReview({ manifest: withNullPrototype });
  assert.equal(nullResult.valid, true, nullResult.errors.join('\n'));
});

test('both review outcomes require object reviewers, non-empty identity/role and valid timestamps', () => {
  for (const makeManifest of [manifestWithApproval, manifestWithFinding]) {
    for (const reviewer of [null, [], 'teacher', {}, { id: ' ', role: 'teacher' }, { id: 'reviewer', role: ' ' }]) {
      const result = validateContentReview({ manifest: makeManifest(TEMPLATE, { reviewer }) });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(error => /non-empty reviewer/.test(error)), result.errors.join('\n'));
    }
    for (const timestamp of [null, '', ' ', 'not-a-date', 42]) {
      const result = validateContentReview({ manifest: makeManifest(TEMPLATE, { reviewedAt: timestamp, rejectedAt: timestamp }) });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(error => /valid timestamp/.test(error)), result.errors.join('\n'));
    }
  }
  for (const reason of [null, '', ' ', 42]) {
    const result = validateContentReview({ manifest: manifestWithFinding(TEMPLATE, { reason }) });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => /non-empty reason/.test(error)), result.errors.join('\n'));
  }
});

test('the rejection planner accepts pending records and refuses unknown or already-rejected ones', () => {
  const rejectedByIdentity = new Map(
    manifestWithFinding(TEMPLATE).records.map(record => [record.identity, record]),
  );
  const { accepted, refused } = planRejections({
    requested: [TEMPLATE, QUARANTINED, 'generated-template:no-such-skill'],
    recordsByIdentity: new Map([...byIdentity, ...rejectedByIdentity]),
    sources,
    reviewer: REVIEWER,
    reason: 'not age-appropriate for the stated grade',
  });
  // TEMPLATE already carries a finding in that map, QUARANTINED is rejectable, unknown is not.
  assert.deepEqual(accepted.map(entry => entry.identity), [QUARANTINED]);
  assert.deepEqual(refused, [
    { identity: TEMPLATE, reason: 'record already carries a reviewer finding' },
    { identity: 'generated-template:no-such-skill', reason: 'no such record' },
  ]);
});

test('the rejection planner refuses stale sources without accepting the record', () => {
  const staleRecords = new Map(byIdentity);
  staleRecords.set(TEMPLATE, { ...byIdentity.get(TEMPLATE), digest: { value: 'f'.repeat(64) } });
  const result = planRejections({ requested: [TEMPLATE], recordsByIdentity: staleRecords, sources, reviewer: REVIEWER, reason: 'fixture finding' });
  assert.deepEqual(result.accepted, []);
  assert.match(result.refused[0].reason, /repair\/regenerate the manifest before rejecting/);
});

test('review CLI rejects malformed identity lists and deduplicates valid identities', t => {
  const fixture = reviewFixture(t);
  const idsFile = resolve(fixture.root, 'ids.json');
  for (const value of [null, {}, [], TEMPLATE, [null], [' ']]) {
    writeFileSync(idsFile, JSON.stringify(value));
    const result = fixture.run('--ids', idsFile, '--dry-run');
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /Invalid review identities/);
    assert.equal(readFileSync(fixture.file, 'utf8'), fixture.original);
  }
  const result = fixture.run('--ids', `${TEMPLATE},${TEMPLATE}`);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Approved 1 record/);
});

test('review CLI strictly rejects unknown, positional, duplicate and conflicting options', t => {
  const fixture = reviewFixture(t);
  const invalidArgs = [
    ['--bogus'],
    ['--reviewer', REVIEWER.id, '--role', REVIEWER.role, '--ids', TEMPLATE, 'positional'],
    ['--reviewer', REVIEWER.id, '--reviewer', 'another', '--role', REVIEWER.role, '--ids', TEMPLATE],
    ['--reviewer', REVIEWER.id, '--role', REVIEWER.role, '--ids', TEMPLATE, '--ids', TEMPLATE],
    ['--reviewer', REVIEWER.id, '--role', REVIEWER.role, '--ids', TEMPLATE, '--reject', '--reject', '--reason', 'fixture finding'],
    ['--list', '--reviewer', REVIEWER.id],
    ['--list', '--list'],
    ['--reviewer', REVIEWER.id, '--role', REVIEWER.role, '--ids', TEMPLATE, '--reason', 'not in reject mode'],
  ];
  for (const args of invalidArgs) {
    const result = fixture.runRaw(...args);
    assert.equal(result.status, 2, `${JSON.stringify(args)}: ${result.stderr}`);
    assert.match(result.stderr, /Usage error:/, result.stderr);
    assert.equal(readFileSync(fixture.file, 'utf8'), fixture.original);
  }
});

test('the manifest block rewrite cannot overrun an empty block', () => {
  // The first approval ever recorded would have deleted everything between the approvals
  // block and the next standalone `};`, because the previous regex required a line between
  // the braces and so did not stop at its own closing line.
  const source = [
    'function factory() {',
    '  const EDUCATOR_APPROVALS = {',
    '  };',
    '',
    '  // REVIEWER_FINDINGS must survive an approvals rewrite.',
    '  const REVIEWER_FINDINGS = {',
    '  };',
    '',
    '  return { approvals: EDUCATOR_APPROVALS };',
    '}',
    '',
  ].join('\n');

  const updated = replaceDataBlock(source, 'EDUCATOR_APPROVALS', ['"a": { reviewer: { id: "r" } },']);
  assert.ok(updated, 'the block must be found');
  assert.match(updated, /const REVIEWER_FINDINGS = \{/);
  assert.match(updated, /return \{ approvals: EDUCATOR_APPROVALS \};/);
  assert.match(updated, / {2}"a": \{ reviewer: \{ id: "r" \} \},/);
  assert.equal(updated.split('\n').length, source.split('\n').length + 1, 'exactly one entry line was added');

  // A missing block must refuse rather than write something surprising.
  assert.equal(replaceDataBlock(source, 'NO_SUCH_BLOCK', []), null);
});
