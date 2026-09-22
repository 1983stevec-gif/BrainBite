#!/usr/bin/env node
// Records an educator approval against the exact reviewed source digest.
//
// Safety properties:
//   * a record whose live source no longer matches its recorded digest is refused, so an
//     approval can never cover content that changed after review;
//   * a quarantined record can never be approved;
//   * approval is written as data (EDUCATOR_APPROVALS) and the manifest validator is run
//     afterwards, so an inconsistent approval fails the content-review gate.
//
// Usage:
//   node scripts/approve-content.mjs --reviewer <id> --role <role> --ids <file|id,id> [--dry-run]
//   node scripts/approve-content.mjs --list          # print pending identities
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { digest } from './validate-content-review.mjs';
import { loadSources, repoRoot, resolveRecordValue } from './lib/content-sources.mjs';

const MANIFEST = resolve(repoRoot, 'content/content-review-manifest.js');
const require = createRequire(import.meta.url);

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

const isCliRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

async function runCli() {
const reviewManifest = require(MANIFEST);

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}
const dryRun = process.argv.includes('--dry-run');
const listOnly = process.argv.includes('--list');
const reviewerId = arg('reviewer');
const reviewerRole = arg('role');
const idsArg = arg('ids');

const recordsByIdentity = new Map(Object.values(reviewManifest.records || {}).map(record => [record.identity, record]));
const pendingIds = [...recordsByIdentity.values()].filter(record => record.runtime?.production !== true).map(record => record.identity);

if (listOnly) {
  console.log(pendingIds.join('\n'));
  process.exit(0);
}
if (!reviewerId || !reviewerRole || !idsArg) {
  console.error('Usage: node scripts/approve-content.mjs --reviewer <id> --role <role> --ids <file|id,id> [--dry-run]');
  console.error('       node scripts/approve-content.mjs --list');
  process.exit(2);
}

const requested = /\.(json|txt)$/i.test(idsArg)
  ? JSON.parse(readFileSync(resolve(repoRoot, idsArg), 'utf8'))
  : idsArg.split(',').map(value => value.trim()).filter(Boolean);

const sources = await loadSources();
const reviewedAt = new Date().toISOString();
const { accepted, refused } = planApprovals({ requested, recordsByIdentity, sources, reviewer: { id: reviewerId, role: reviewerRole } });

const report = {
  reviewer: { id: reviewerId, role: reviewerRole },
  reviewedAt,
  accepted: accepted.map(entry => entry.identity),
  refused,
  dryRun,
};
console.log(JSON.stringify(report, null, 1));

if (refused.length) {
  console.error(`\n${refused.length} record(s) refused; nothing was written.`);
  process.exitCode = 1;
}
if (!accepted.length || dryRun) {
  if (dryRun && accepted.length) console.log('\nDry run: no changes written.');
  process.exit(process.exitCode ?? 0);
}

// Merge into the existing approvals and rewrite the data block.
const existing = reviewManifest.approvals || {};
const merged = { ...existing };
for (const entry of accepted) merged[entry.identity] = { reviewer: { id: reviewerId, role: reviewerRole }, reviewedAt };
const entries = Object.keys(merged).sort().map(identity => {
  const approval = merged[identity];
  return `    ${JSON.stringify(identity)}: { reviewer: { id: ${JSON.stringify(approval.reviewer.id)}, role: ${JSON.stringify(approval.reviewer.role)} }, reviewedAt: ${JSON.stringify(approval.reviewedAt)} },`;
}).join('\n');

const source = readFileSync(MANIFEST, 'utf8');
const block = /const EDUCATOR_APPROVALS = \{\n[\s\S]*?\n  \};/;
if (!block.test(source)) {
  console.error('Could not locate the EDUCATOR_APPROVALS block; the manifest was not modified.');
  process.exit(1);
}
writeFileSync(MANIFEST, source.replace(block, `const EDUCATOR_APPROVALS = {\n${entries}\n  };`));

// Prove the result is internally consistent before reporting success.
try {
  execFileSync(process.execPath, [resolve(repoRoot, 'scripts/validate-content-review.mjs')], { stdio: 'pipe' });
  console.log(`\nApproved ${accepted.length} record(s); content-review validation passed.`);
} catch (error) {
  console.error('\nApproval written but content-review validation FAILED:');
  console.error(String(error.stdout || error.message));
  process.exitCode = 1;
}
}

if (isCliRun) await runCli();