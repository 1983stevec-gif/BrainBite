#!/usr/bin/env node
// Builds the reviewer-facing packet for every record that is not yet production-eligible.
//
// The gate already validates exact source digests; what a human reviewer needs is the
// content itself, in one place, with the identity to sign off. Output:
//   release-evidence/content-review-packet.json   machine-readable, one entry per record
//   release-evidence/content-review-packet.html   printable review sheet
//
// Usage: node scripts/gen-review-packet.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { digest } from './validate-content-review.mjs';
import { describeContent, loadSources, repoRoot, resolveRecordValue } from './lib/content-sources.mjs';

const require = createRequire(import.meta.url);
const reviewManifest = require(resolve(repoRoot, 'content/content-review-manifest.js'));
const sources = await loadSources();

const records = Object.values(reviewManifest.records || {});
const pending = [];
const rejected = [];
const mismatched = [];

for (const record of records) {
  if (record.runtime?.production === true) continue;
  const { value, reason } = resolveRecordValue(record, sources);
  if (reason) { mismatched.push({ identity: record.identity, reason }); continue; }
  const actual = digest(value);
  const digestMatches = actual === record.digest?.value;
  if (!digestMatches) mismatched.push({ identity: record.identity, reason: `source digest ${actual.slice(0, 12)} != manifest ${String(record.digest?.value).slice(0, 12)}` });
  const entry = {
    identity: record.identity,
    kind: record.kind,
    source: record.source,
    digest: record.digest?.value,
    digestMatches,
    quarantine: record.quarantine?.status || 'unknown',
    quarantineReasons: record.quarantine?.reasons || [],
    runtimeStatus: record.runtime?.status || 'unknown',
    verification: record.verification?.evidence || [],
    content: describeContent(value),
  };
  // A record that already carries a finding cannot be approved, so it is listed separately
  // instead of being handed to a reviewer as work that still needs doing.
  if (record.reviewerFinding) rejected.push({ ...entry, finding: record.reviewerFinding });
  else pending.push(entry);
}

const byKind = pending.reduce((totals, entry) => ({ ...totals, [entry.kind]: (totals[entry.kind] || 0) + 1 }), {});
const report = {
  schema: 'brainbite.content-review-packet.v1',
  generatedAt: new Date().toISOString(),
  totals: { records: records.length, pending: pending.length, rejected: rejected.length, byKind, digestMismatches: mismatched.length },
  digestMismatches: mismatched,
  pending,
  rejected,
};

const outputDir = resolve(repoRoot, 'release-evidence');
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, 'content-review-packet.json'), `${JSON.stringify(report, null, 2)}\n`);

const escape = value => String(value ?? '').replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
const rows = pending.map(entry => {
  const content = entry.content;
  return `<section class="record">
  <h3>${escape(entry.identity)} <span class="kind">${escape(entry.kind)}</span></h3>
  <dl>
    <dt>Prompt</dt><dd>${escape(content.prompt) || '<em>none</em>'}</dd>
    <dt>Answers</dt><dd>${escape((content.answers || []).join(', ')) || '<em>none</em>'}</dd>
    <dt>Distractors</dt><dd>${escape((content.distractors || []).join(', ')) || '<em>none</em>'}</dd>
    <dt>Explanation</dt><dd>${escape(content.explanation) || '<em>none</em>'}</dd>
    <dt>Hint</dt><dd>${escape(content.hint) || '<em>none</em>'}</dd>
    <dt>Skill / grade / difficulty</dt><dd>${escape([content.skill, content.grade, content.difficulty].filter(value => value !== null && value !== '').join(' · ')) || '<em>none</em>'}</dd>
    <dt>Already checked</dt><dd>${escape((entry.verification || []).join(', ')) || '<em>none</em>'}</dd>
    <dt>Source</dt><dd><code>${escape(entry.source?.file)}${escape(entry.source?.path || '')}</code></dd>
    <dt>Quarantine</dt><dd>${escape(entry.quarantine)}${entry.quarantineReasons.length ? ` — ${escape(entry.quarantineReasons.join(', '))}` : ''}</dd>
    <dt>Digest</dt><dd><code>${escape(entry.digest)}</code> ${entry.digestMatches ? '' : '<strong>MISMATCH</strong>'}</dd>
  </dl>
</section>`;
}).join('\n');

const rejectedRows = rejected.map(entry => `<section class="record rejected">
  <h3>${escape(entry.identity)} <span class="kind">${escape(entry.kind)}</span></h3>
  <p><strong>Rejected</strong> by ${escape(entry.finding?.reviewer?.id)} (${escape(entry.finding?.reviewer?.role)}) on ${escape(entry.finding?.rejectedAt)}: ${escape(entry.finding?.reason)}</p>
  <p class="meta">This record cannot be approved until the finding is resolved in the source and the manifest regenerated.</p>
</section>`).join('\n');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>BrainBite content review packet</title>
<style>
 body{font:16px/1.5 system-ui,sans-serif;margin:2rem auto;max-width:60rem;padding:0 1rem;color:#101820}
 h1{margin-bottom:.25rem} .meta{color:#556} .record{border:1px solid #ccd;border-radius:10px;padding:1rem 1.25rem;margin:1.25rem 0;break-inside:avoid}
 h3{margin:0 0 .5rem} .kind{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:#667;font-weight:600}
 dl{display:grid;grid-template-columns:11rem 1fr;gap:.25rem .75rem;margin:0}
 dt{font-weight:600;color:#334} dd{margin:0} code{font-size:.85em;word-break:break-all}
 .warn{background:#fff4e5;border-color:#e0a458}
 .rubric{background:#f4f7fb;border:1px solid #ccd;border-radius:10px;padding:1rem 1.25rem}
 .rubric ol{margin:.5rem 0 .5rem 1.25rem;padding:0} .rubric li{margin:.25rem 0}
 .rejected{background:#fdf1f1;border-color:#c66}
</style></head><body>
<h1>BrainBite content review packet</h1>
<p class="meta">Generated ${escape(report.generatedAt)} · ${pending.length} record(s) awaiting review · ${rejected.length} rejected · ${mismatched.length} digest mismatch(es)</p>
<p>Sign off per record. Approval is recorded against the exact source digest shown, so editing the content afterwards invalidates the approval automatically.</p>
<section class="rubric">
 <h2>What to assess</h2>
 <ol>
  <li><strong>Correctness</strong> — the marked answer is right, and every distractor is wrong.</li>
  <li><strong>Age-appropriateness</strong> — vocabulary, tone, and subject matter suit the stated grade.</li>
  <li><strong>Clarity</strong> — the prompt says one thing and can be read at the stated level.</li>
  <li><strong>Distractor quality</strong> — wrong answers are plausible but unambiguously wrong to a child who has the skill.</li>
  <li><strong>Feedback</strong> — the explanation teaches the reasoning, not just the answer.</li>
  <li><strong>Alignment</strong> — the skill and grade labels match the curriculum intent.</li>
  <li><strong>Bias and safety</strong> — no stereotypes, no culturally specific assumptions, nothing distressing.</li>
 </ol>
 <p>Approve with <code>npm run review:approve -- --reviewer &lt;id&gt; --role &lt;role&gt; --ids &lt;file&gt;</code>.
 If a record fails any criterion, reject it instead of approving:
 <code>npm run review:reject -- --reason "&lt;finding&gt;" --reviewer &lt;id&gt; --role &lt;role&gt; --ids &lt;file&gt;</code>.
 A rejected record is quarantined, cannot be approved, and cannot ship; the finding records what was wrong.</p>
</section>
${mismatched.length ? `<p class="warn"><strong>${mismatched.length} record(s) failed digest verification</strong> and must be regenerated before review: ${escape(mismatched.map(entry => entry.identity).join(', '))}</p>` : ''}
${rows}
${rejected.length ? `<h2>Rejected by review (${rejected.length})</h2>${rejectedRows}` : ''}
</body></html>
`;
await writeFile(resolve(outputDir, 'content-review-packet.html'), html);

console.log(JSON.stringify({ pending: pending.length, rejected: rejected.length, byKind, digestMismatches: mismatched.length, output: 'release-evidence/content-review-packet.{json,html}' }, null, 1));
if (mismatched.length) process.exitCode = 1;
