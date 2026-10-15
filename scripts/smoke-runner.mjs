#!/usr/bin/env node
// Runs every ad-hoc smoke check under one reported runner.
//
// The smoke scripts each expected a server to already be listening, so they were never
// exercised by any gate. This runner starts one server, executes each smoke against it,
// records pass/fail with timing, and writes a report. By default the report and every
// screenshot go to the git-ignored .playwright-results/; `--promote` (used by
// `npm run evidence:refresh` and certify:local) writes the tracked evidence instead.
//
// Usage:
//   npm run smoke                      # every scripts/smoke-*.mjs
//   npm run smoke -- --only offline     # scripts whose name matches
//   npm run smoke -- --timeout 120000   # override every per-script timeout in ms
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { createBrainBiteServer, verifyBrainBiteServer } from './serve.mjs';
import { promoteEvidence, releaseEvidenceDir } from './lib/evidence-paths.mjs';

// Child smokes read the same switch, so their screenshots follow the report.
if (promoteEvidence) process.env.BRAINBITE_PROMOTE_EVIDENCE = '1';

const repoRoot = resolve(import.meta.dirname, '..');
const port = Number(process.env.BRAINBITE_TEST_PORT || 4318);
const baseURL = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

function argValue(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
const only = argValue('only', '');
const timeoutOverride = argValue('timeout', '');
const MAX_PER_SCRIPT_TIMEOUT_MS = 10 * 60 * 1000;
if (timeoutOverride && (!Number.isFinite(Number(timeoutOverride)) || Number(timeoutOverride) <= 0 || Number(timeoutOverride) > MAX_PER_SCRIPT_TIMEOUT_MS)) {
  console.error(`--timeout must be between 1 and ${MAX_PER_SCRIPT_TIMEOUT_MS} ms.`);
  process.exit(2);
}

const scripts = readdirSync(resolve(repoRoot, 'scripts'))
  .filter(name => /^smoke-.*\.mjs$/.test(name))
  // Never run the runner itself.
  .filter(name => name !== 'smoke-runner.mjs')
  .filter(name => !only || name.includes(only))
  .sort();

if (!scripts.length) {
  console.error(`No smoke scripts matched${only ? ` --only ${only}` : ''}.`);
  process.exit(2);
}

// Reuse a running server when there is one, otherwise own its lifecycle.
const serverIsReady = async () => {
  try {
    const response = await fetch(`${baseURL}/index.html`, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch { return false; }
};
let server = null;
if (await serverIsReady()) {
  try {
    const provenance = await verifyBrainBiteServer({ baseURL });
    console.log(`Reusing verified BrainBite server (${provenance.indexHtmlSha256})`);
  } catch (error) {
    console.error(`SMOKE ABORT: ${error.message}`);
    process.exit(1);
  }
} else {
  server = await createBrainBiteServer({ port });
}

async function loadMeasuredDurations() {
  const candidates = [
    resolve(releaseEvidenceDir, 'smoke-report.json'),
    resolve(repoRoot, 'release-evidence', 'smoke-report.json'),
  ];
  const measurements = new Map();
  for (const candidate of candidates) {
    try {
      const previous = JSON.parse(await readFile(candidate, 'utf8'));
      const source = relative(repoRoot, candidate);
      for (const result of previous.results) {
        if (!measurements.has(result.script) && result.status === 'pass' && Number.isFinite(result.durationMs) && result.durationMs > 0) {
          measurements.set(result.script, { durationMs: result.durationMs, source });
        }
      }
    } catch {
      // Try the next report. A missing or malformed local report must not hide release history.
    }
  }
  return measurements;
}

const measured = await loadMeasuredDurations();
let observedSlowdown = 1;

function timeoutBudgetFor(file) {
  if (timeoutOverride) return { timeoutMs: Number(timeoutOverride), basis: 'command-line override' };
  const measurement = measured.get(file);
  if (!measurement) {
    return { timeoutMs: MAX_PER_SCRIPT_TIMEOUT_MS, basis: 'no measured duration; bounded safety ceiling' };
  }
  // Four times the prior completed work plus a minute for browser startup/teardown covers
  // normal variance. Later children also scale to twice this host's observed slowdown.
  const multiplier = Math.max(4, observedSlowdown * 2);
  const timeoutMs = Math.min(MAX_PER_SCRIPT_TIMEOUT_MS, Math.ceil((measurement.durationMs * multiplier + 60000) / 1000) * 1000);
  return { timeoutMs, basis: `${measurement.durationMs}ms measured in ${measurement.source}; ${multiplier.toFixed(2)}x + 60000ms` };
}

const run = (file, timeoutBudget) => new Promise(resolveRun => {
  const startedAt = Date.now();
  execFile(process.execPath, [resolve(repoRoot, 'scripts', file)], {
    cwd: repoRoot,
    env: { ...process.env, BB_BASE: baseURL, BRAINBITE_TEST_PORT: String(port) },
    timeout: timeoutBudget.timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
  }, (error, stdout, stderr) => {
    const output = String(stdout || '');
    const diagnostics = String(stderr || '');
    // For a failure, surface the most useful line rather than the Node version banner.
    const interesting = diagnostics.split('\n').map(line => line.trim())
      .filter(line => /error|fail|expect|timeout|refused|Error:/.test(line) && !/^\s*at\s/.test(line))
      .slice(0, 2)
      .join(' | ');
    const tail = interesting
      || output.trim().split('\n').filter(Boolean).slice(-2).join(' | ')
      || diagnostics.trim().split('\n').filter(Boolean).slice(-2).join(' | ');
    resolveRun({
      script: file,
      status: error ? (error.killed ? 'timeout' : 'fail') : 'pass',
      durationMs: Date.now() - startedAt,
      timeoutMs: timeoutBudget.timeoutMs,
      timeoutBasis: timeoutBudget.basis,
      exitCode: error?.code ?? 0,
      signal: error?.signal ?? null,
      tail: tail.slice(0, 400),
    });
  });
});

const results = [];
for (const file of scripts) {
  const timeoutBudget = timeoutBudgetFor(file);
  console.log(`BUDGET  ${file.padEnd(38)} ${String(timeoutBudget.timeoutMs).padStart(6)}ms  ${timeoutBudget.basis}`);
  const result = await run(file, timeoutBudget);
  results.push(result);
  const measurement = measured.get(file);
  if (measurement) observedSlowdown = Math.max(observedSlowdown, result.durationMs / measurement.durationMs);
  const marker = result.status === 'pass' ? 'PASS' : result.status === 'timeout' ? 'TIMEOUT' : 'FAIL';
  console.log(`${marker.padEnd(7)} ${file.padEnd(38)} ${String(result.durationMs).padStart(6)}ms  ${result.tail}`);
}

const failed = results.filter(result => result.status !== 'pass');
const report = {
  schema: 'brainbite.smoke-report.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  timeoutPolicy: {
    maximumMs: MAX_PER_SCRIPT_TIMEOUT_MS,
    measuredDurationSources: [...new Set([...measured.values()].map(measurement => measurement.source))],
    overrideMs: timeoutOverride ? Number(timeoutOverride) : null,
  },
  totals: { scripts: results.length, passed: results.length - failed.length, failed: failed.length },
  results,
};
const outputDir = releaseEvidenceDir;
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, 'smoke-report.json'), `${JSON.stringify(report, null, 2)}\n`);

if (server) await new Promise(done => { server.close(done); server.closeAllConnections?.(); });

console.log(`\n${report.totals.passed}/${report.totals.scripts} smoke checks passed; report in ${relative(repoRoot, resolve(outputDir, 'smoke-report.json'))}${promoteEvidence ? '' : ' (run npm run evidence:refresh to update release-evidence/)'}`);
if (failed.length) {
  console.error(`Failed: ${failed.map(result => result.script).join(', ')}`);
  process.exitCode = 1;
}
