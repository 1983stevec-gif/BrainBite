#!/usr/bin/env node
// Runs every ad-hoc smoke check under one reported runner.
//
// The smoke scripts each expected a server to already be listening, so they were never
// exercised by any gate. This runner starts one server, executes each smoke against it,
// records pass/fail with timing, and writes tracked evidence.
//
// Usage:
//   npm run smoke                      # every scripts/smoke-*.mjs
//   npm run smoke -- --only offline     # scripts whose name matches
//   npm run smoke -- --timeout 120000   # per-script timeout in ms
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createBrainBiteServer } from './serve.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const port = Number(process.env.BRAINBITE_TEST_PORT || 4318);
const baseURL = process.env.BB_BASE || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

function argValue(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
const only = argValue('only', '');
const perScriptTimeout = Number(argValue('timeout', 120000));

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
    const response = await fetch(`${baseURL}/index.html`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch { return false; }
};
let server = null;
if (!(await serverIsReady())) {
  server = await createBrainBiteServer({ port });
}

const run = (file) => new Promise(resolveRun => {
  const startedAt = Date.now();
  execFile(process.execPath, [resolve(repoRoot, 'scripts', file)], {
    cwd: repoRoot,
    env: { ...process.env, BB_BASE: baseURL, BRAINBITE_TEST_PORT: String(port) },
    timeout: perScriptTimeout,
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
      exitCode: error?.code ?? 0,
      signal: error?.signal ?? null,
      tail: tail.slice(0, 400),
    });
  });
});

const results = [];
for (const file of scripts) {
  const result = await run(file);
  results.push(result);
  const marker = result.status === 'pass' ? 'PASS' : result.status === 'timeout' ? 'TIMEOUT' : 'FAIL';
  console.log(`${marker.padEnd(7)} ${file.padEnd(38)} ${String(result.durationMs).padStart(6)}ms  ${result.tail}`);
}

const failed = results.filter(result => result.status !== 'pass');
const report = {
  schema: 'brainbite.smoke-report.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  totals: { scripts: results.length, passed: results.length - failed.length, failed: failed.length },
  results,
};
const outputDir = resolve(repoRoot, 'release-evidence');
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, 'smoke-report.json'), `${JSON.stringify(report, null, 2)}\n`);

if (server) await new Promise(done => { server.close(done); server.closeAllConnections?.(); });

console.log(`\n${report.totals.passed}/${report.totals.scripts} smoke checks passed; evidence in release-evidence/smoke-report.json`);
if (failed.length) {
  console.error(`Failed: ${failed.map(result => result.script).join(', ')}`);
  process.exitCode = 1;
}
