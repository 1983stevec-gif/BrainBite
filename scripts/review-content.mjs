#!/usr/bin/env node
// Records the outcome of educator review: an approval against the exact reviewed source
// digest, or a finding that rejects a record.
//
// Safety properties:
//   * a record whose live source no longer matches its recorded digest is refused, so an
//     approval can never cover content that changed after review;
//   * a quarantined record can never be approved;
//   * a rejection quarantines the record through the same path as an automated reason, so a
//     rejected record can never be approved and never becomes production-eligible, even if
//     the reviewer rejects a registry mission that was previously eligible;
//   * rejecting a record also clears any approval recorded earlier for it, so the manifest
//     cannot hold contradictory review data;
//   * both outcomes are written as data (EDUCATOR_APPROVALS, REVIEWER_FINDINGS) and the
//     manifest validator runs afterwards, so inconsistent review data fails the gate.
//
// Usage:
//   node scripts/review-content.mjs --reviewer <id> --role <role> --ids <file|id,id> [--dry-run]
//   node scripts/review-content.mjs --reject --reason "<finding>" --reviewer <id> --role <role> --ids <file|id,id> [--dry-run]
//   node scripts/review-content.mjs --list          # print pending identities
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { digest, isPlainObject } from './validate-content-review.mjs';
import { loadSources, repoRoot, resolveRecordValue } from './lib/content-sources.mjs';

const MANIFEST = resolve(repoRoot, 'content/content-review-manifest.js');
const require = createRequire(import.meta.url);

const USAGE = [
  'Usage: node scripts/review-content.mjs --reviewer <id> --role <role> --ids <file|id,id> [--dry-run]',
  '       node scripts/review-content.mjs --reject --reason "<finding>" --reviewer <id> --role <role> --ids <file|id,id> [--dry-run]',
  '       node scripts/review-content.mjs --list',
].join('\n');

const SCALAR_OPTIONS = new Map([
  ['--reviewer', 'reviewerId'],
  ['--role', 'reviewerRole'],
  ['--ids', 'idsArg'],
  ['--reason', 'reason'],
]);
const FLAG_OPTIONS = new Set(['--dry-run', '--reject', '--list']);

// Parse the review CLI before loading or changing any review data. Keeping this strict is
// important for a destructive command: a misspelled flag must never be interpreted as an
// identity or silently change the requested review mode.
export function parseReviewArgs(argv) {
  const options = {
    reviewerId: null,
    reviewerRole: null,
    idsArg: null,
    reason: null,
    dryRun: false,
    rejectMode: false,
    listOnly: false,
  };
  const seen = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`unexpected positional argument ${JSON.stringify(token)}`);
    if (!SCALAR_OPTIONS.has(token) && !FLAG_OPTIONS.has(token)) throw new Error(`unknown option ${token}`);
    if (seen.has(token)) throw new Error(`duplicate option ${token}`);
    seen.add(token);

    if (SCALAR_OPTIONS.has(token)) {
      const value = argv[index + 1];
      if (typeof value !== 'string' || !value.trim() || value.startsWith('--')) {
        throw new Error(`${token} requires a non-empty value`);
      }
      options[SCALAR_OPTIONS.get(token)] = value;
      index += 1;
      continue;
    }

    if (token === '--dry-run') options.dryRun = true;
    else if (token === '--reject') options.rejectMode = true;
    else if (token === '--list') options.listOnly = true;
  }

  if (options.listOnly && seen.size > 1) throw new Error('--list cannot be combined with review options');
  if (options.listOnly) return options;
  if (!options.reviewerId || !options.reviewerRole || !options.idsArg) {
    throw new Error('review mode requires --reviewer, --role, and --ids');
  }
  if (options.reason && !options.rejectMode) throw new Error('--reason requires --reject');
  if (options.rejectMode && !options.reason) throw new Error('--reject requires --reason');
  return options;
}

// Decides which requested identities may be approved. Exported so the safety rules can be
// tested directly against a manifest whose digest no longer matches its source.
export function planApprovals({ requested = [], recordsByIdentity, sources, reviewer }) {
  const accepted = [];
  const refused = [];
  for (const identity of requested) {
    const record = recordsByIdentity.get(identity);
    if (!record) { refused.push({ identity, reason: 'no such record' }); continue; }
    if (record.quarantine?.status === 'quarantined') { refused.push({ identity, reason: 'record is quarantined' }); continue; }
    if (record.runtime?.production === true) { refused.push({ identity, reason: 'already production-eligible' }); continue; }
    const { value, reason } = resolveRecordValue(record, sources);
    if (reason) { refused.push({ identity, reason }); continue; }
    const actual = digest(value);
    if (actual !== record.digest?.value) {
      refused.push({ identity, reason: `source digest ${actual.slice(0, 12)} does not match the reviewed digest ${String(record.digest?.value).slice(0, 12)} — regenerate the manifest before approving` });
      continue;
    }
    accepted.push({ identity, digest: actual, kind: record.kind, reviewer });
  }
  return { accepted, refused };
}

// Rejections may cover production or quarantined records, but all review writes require
// matching source digests. Repair/regenerate stale content before recording a finding.
export function planRejections({ requested = [], recordsByIdentity, sources, reviewer, reason }) {
  const accepted = [];
  const refused = [];
  for (const identity of requested) {
    const record = recordsByIdentity.get(identity);
    if (!record) { refused.push({ identity, reason: 'no such record' }); continue; }
    if (record.reviewerFinding) { refused.push({ identity, reason: 'record already carries a reviewer finding' }); continue; }
    const resolved = resolveRecordValue(record, sources);
    if (resolved.reason) { refused.push({ identity, reason: resolved.reason }); continue; }
    const actual = digest(resolved.value);
    if (actual !== record.digest?.value) {
      refused.push({ identity, reason: `source digest ${actual.slice(0, 12)} does not match the reviewed digest ${String(record.digest?.value).slice(0, 12)} — repair/regenerate the manifest before rejecting` });
      continue;
    }
    accepted.push({ identity, kind: record.kind, reviewer, reason });
  }
  return { accepted, refused };
}

// Rewrites one hand-maintained data block in the manifest source.
//
// This is line-based rather than a body regex on purpose. A regex like
// /const X = \{\n[\s\S]*?\n  \};/ requires at least one line between the braces, so with an
// empty block it does not stop at its own closing line: it runs on to the next `};` in the
// file. The first approval ever recorded would therefore have deleted every line between
// the approvals block and that point, including the reviewer findings block. Matching the
// opening and closing lines separately cannot overrun.
export function replaceDataBlock(text, name, entries) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => line.trimStart().startsWith(`const ${name} = {`));
  if (start < 0) return null;
  const end = lines.findIndex((line, index) => index > start && line.trim() === '};');
  if (end < 0) return null;
  const indent = lines[start].slice(0, lines[start].indexOf('const'));
  return [
    ...lines.slice(0, start),
    `${indent}const ${name} = {`,
    ...entries.map(entry => `${indent}  ${entry}`),
    `${indent}};`,
    ...lines.slice(end + 1),
  ].join('\n');
}

const isCliRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

async function runCli() {
let options;
try {
  options = parseReviewArgs(process.argv.slice(2));
} catch (error) {
  console.error(`Usage error: ${error.message}`);
  console.error(USAGE);
  process.exitCode = 2;
  return;
}

const reviewManifest = require(MANIFEST);
for (const name of ['approvals', 'reviewerFindings']) {
  if (!isPlainObject(reviewManifest[name])) {
    console.error(`Invalid review data: ${name} must be an object map with Object.prototype or null prototype; nothing was written.`);
    process.exitCode = 1;
    return;
  }
}
const {
  dryRun,
  listOnly,
  rejectMode,
  reviewerId,
  reviewerRole,
  idsArg,
  reason,
} = options;

const recordsByIdentity = new Map(Object.values(reviewManifest.records || {}).map(record => [record.identity, record]));
// Records that already carry a finding cannot be approved, so they are not offered as work.
const pendingIds = [...recordsByIdentity.values()]
  .filter(record => record.runtime?.production !== true && !record.reviewerFinding)
  .map(record => record.identity);

if (listOnly) {
  console.log(pendingIds.join('\n'));
  return;
}

let requested;
try {
  requested = /\.(json|txt)$/i.test(idsArg)
    ? JSON.parse(readFileSync(resolve(repoRoot, idsArg), 'utf8'))
    : idsArg.split(',').map(value => value.trim()).filter(Boolean);
  if (!Array.isArray(requested) || !requested.length || requested.some(value => typeof value !== 'string' || !value.trim())) {
    throw new Error('--ids requires a non-empty array of identity strings or comma-separated identities');
  }
  requested = [...new Set(requested.map(value => value.trim()))];
} catch (error) {
  console.error(`Invalid review identities: ${error.message}`);
  process.exit(2);
}

const sources = await loadSources();
const reviewedAt = new Date().toISOString();
const reviewer = { id: reviewerId, role: reviewerRole };
const { accepted, refused } = rejectMode
  ? planRejections({ requested, recordsByIdentity, sources, reviewer, reason })
  : planApprovals({ requested, recordsByIdentity, sources, reviewer });

const report = {
  mode: rejectMode ? 'reject' : 'approve',
  reviewer,
  ...(rejectMode ? { reason } : {}),
  reviewedAt,
  accepted: accepted.map(entry => entry.identity),
  refused,
  dryRun,
};
console.log(JSON.stringify(report, null, 1));

if (refused.length) {
  console.error(`\n${refused.length} record(s) refused; nothing was written.`);
  process.exitCode = 1;
  return;
}
if (!accepted.length || dryRun) {
  if (dryRun && accepted.length) console.log('\nDry run: no changes written.');
  process.exit(process.exitCode ?? 0);
}

// Rewrite the hand-maintained data blocks.
const formatApprovals = approvals => Object.keys(approvals).sort().map(identity => {
  const entry = approvals[identity];
  return `${JSON.stringify(identity)}: { reviewer: { id: ${JSON.stringify(entry.reviewer.id)}, role: ${JSON.stringify(entry.reviewer.role)} }, reviewedAt: ${JSON.stringify(entry.reviewedAt)}, reviewedDigest: ${JSON.stringify(entry.reviewedDigest)} },`;
});

const formatFindings = findings => Object.keys(findings).sort().map(identity => {
  const entry = findings[identity];
  return `${JSON.stringify(identity)}: { reviewer: { id: ${JSON.stringify(entry.reviewer.id)}, role: ${JSON.stringify(entry.reviewer.role)} }, rejectedAt: ${JSON.stringify(entry.rejectedAt)}, reason: ${JSON.stringify(entry.reason)} },`;
});

const source = readFileSync(MANIFEST, 'utf8');
const approvals = { ...(reviewManifest.approvals || {}) };
const findings = { ...(reviewManifest.reviewerFindings || {}) };
let updated;
if (rejectMode) {
  for (const entry of accepted) {
    findings[entry.identity] = { reviewer, rejectedAt: reviewedAt, reason };
    // A rejection supersedes an approval recorded earlier for the same record, so the
    // manifest can never hold contradictory review data.
    delete approvals[entry.identity];
  }
  updated = replaceDataBlock(source, 'EDUCATOR_APPROVALS', formatApprovals(approvals));
  updated = updated && replaceDataBlock(updated, 'REVIEWER_FINDINGS', formatFindings(findings));
} else {
  for (const entry of accepted) approvals[entry.identity] = {
    reviewer,
    reviewedAt,
    reviewedDigest: entry.digest,
  };
  updated = replaceDataBlock(source, 'EDUCATOR_APPROVALS', formatApprovals(approvals));
}
if (!updated) {
  console.error('Could not locate the EDUCATOR_APPROVALS or REVIEWER_FINDINGS block; the manifest was not modified.');
  process.exit(1);
}
writeFileSync(MANIFEST, updated);

// Prove the result is internally consistent before reporting success.
try {
  execFileSync(process.execPath, [resolve(repoRoot, 'scripts/validate-content-review.mjs')], { stdio: 'pipe' });
  console.log(`\n${rejectMode ? 'Rejected' : 'Approved'} ${accepted.length} record(s); content-review validation passed.`);
} catch (error) {
  writeFileSync(MANIFEST, source);
  console.error(`\n${rejectMode ? 'Rejection' : 'Approval'} content-review validation FAILED; original manifest restored:`);
  console.error([error.stdout, error.stderr].map(value => String(value || '')).filter(Boolean).join('\n') || error.message);
  process.exitCode = 1;
}
}

if (isCliRun) await runCli();
