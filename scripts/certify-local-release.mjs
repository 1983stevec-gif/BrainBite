/**
 * Reproducible local certification for the BrainBite shipping and MATCH paths.
 * External device, human-review, and production-host gates remain unverified.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = resolve(process.env.BB_CERT_OUTPUT || 'release-evidence/local-certification.json');
const tempOutput = resolve(process.env.BB_CERT_TEMP || '.certification-tmp');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const results = [];

function run(command, args, extraEnv = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32' && command.toLowerCase().endsWith('.cmd'),
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', code => resolveRun({ code: code ?? 1, stdout, stderr }));
    child.on('error', error => resolveRun({ code: 1, stdout, stderr: `${stderr}${error.message}` }));
  });
}

async function record(label, command, args, extraEnv = {}) {
  const startedAt = Date.now();
  const result = await run(command, args, extraEnv);
  const entry = {
    label,
    command: [command, ...args].join(' '),
    passed: result.code === 0,
    exitCode: result.code,
    durationMs: Date.now() - startedAt,
    output: `${result.stdout}${result.stderr}`.slice(-6000),
  };
  results.push(entry);
  console.log(`${entry.passed ? 'PASS' : 'FAIL'} ${label}`);
  return entry;
}

async function gitSnapshot() {
  const [branch, commit, status] = await Promise.all([
    run('git', ['branch', '--show-current']),
    run('git', ['rev-parse', 'HEAD']),
    run('git', ['status', '--porcelain']),
  ]);
  return {
    branch: branch.stdout.trim(),
    commit: commit.stdout.trim(),
    workingTreeClean: !status.stdout.trim(),
  };
}

// The snapshot is taken before anything is written. This run regenerates tracked evidence
// (viewport captures, the smoke report, and the report below), so snapshotting at the end
// always recorded a dirty tree and the field carried no information.
const git = await gitSnapshot();
await mkdir(resolve(output, '..'), { recursive: true });
await mkdir(tempOutput, { recursive: true });

// No server is started here on purpose. Every stage below serves itself on the configured
// test port: Playwright's global setup for the browser groups, the smoke runner for the
// smokes, and the performance probe for its own measurements. This runner used to start a
// server on port 4317 and wait for it, but nothing ever connected to 4317 — Playwright and
// the smoke runner both serve 4318 — so the readiness gate proved nothing and the process
// sat idle for the whole run. `check:test-ports` now scans this file instead of exempting
// it, so a hardcoded port here cannot come back.
try {
  const validators = [
    ['content', 'check:content'],
    ['content-review', 'check:content-review'],
    ['runtime', 'check:runtime'],
    ['release-structure', 'check:release'],
    ['firebase-structure', 'check:firebase'],
    ['launch-structure', 'check:launch'],
    ['final-hardening', 'check:final'],
    ['firebase-security', 'check:firebase:security'],
    ['release-evidence', 'check:evidence'],
    ['unit-tests', 'test:unit'],
  ];
  for (const [label, script] of validators) await record(label, npmCommand, ['run', script]);

  const browserGroups = [
    ['release-browser', 'tests/release.spec.js'],
    // bubble-reef-preview is a world/activity preview, so it belongs with the activity
    // family. It used to be in no group at all: the certification ran 159 of the 161
    // browser tests and still reported a clean sweep. check:certification-coverage now
    // fails if a spec in the Playwright testMatch is missing from this list.
    ['activity-browser', 'tests/activity-families.spec.js', 'tests/bubble-reef-preview.spec.js'],
    ['webgl-browser', 'tests/webgl.spec.js', 'tests/webgl-accessibility.spec.js', 'tests/webgl-assets.spec.js'],
    ['brainbase-match-browser', 'tests/brainbase.spec.js', 'tests/match.spec.js'],
    ['native-shell-browser', 'tests/native-shell.spec.js'],
  ];
  for (const [label, ...specs] of browserGroups) {
    // One retry, matching CI. Under load a WebGL mount or a reload can exceed its timeout
    // and pass on a second attempt; without a retry a single such timeout failed the whole
    // twenty-minute certification. Retries are not hidden: Playwright counts a test that
    // passes on retry as flaky, and that count is recorded below.
    const jsonReport = resolve(tempOutput, `${label}.json`);
    await record(label, npmCommand, ['exec', '--', 'playwright', 'test', ...specs, '--reporter=json', '--retries=1'], {
      PLAYWRIGHT_OUTPUT_DIR: resolve(tempOutput, label),
      PLAYWRIGHT_JSON_OUTPUT_NAME: jsonReport,
    });
    {
      const entry = results.at(-1);
      try {
        const stats = JSON.parse(await readFile(jsonReport, 'utf8')).stats ?? {};
        entry.testsPassed = stats.expected ?? 0;
        entry.testsFlaky = stats.flaky ?? 0;
        entry.testsFailed = stats.unexpected ?? 0;
        entry.note = `${entry.testsPassed} passed, ${entry.testsFlaky} flaky, ${entry.testsFailed} failed.`;
      } catch (error) {
        entry.note = `Playwright JSON report unavailable: ${error.message}`;
      }
    }
  }

  // One reported smoke runner owns the smoke inventory; the performance probe stays
  // separate because it produces its own evidence pack.
  await record('smoke-runner', nodeCommand, ['scripts/smoke-runner.mjs', '--promote']);
  {
    const entry = results.at(-1);
    try {
      const smoke = JSON.parse(await readFile(resolve(root, 'release-evidence', 'smoke-report.json'), 'utf8'));
      entry.quality = 'headless';
      entry.smokesPassed = smoke.totals?.passed ?? 0;
      entry.smokesTotal = smoke.totals?.scripts ?? 0;
      entry.note = `${entry.smokesPassed}/${entry.smokesTotal} smoke checks passed.`;
    } catch (error) {
      entry.note = `Smoke report unavailable: ${error.message}`;
    }
  }

  {
    const label = 'performance-probe';
    const env = { BB_PERF_OUTPUT_DIR: resolve(tempOutput, 'performance-evidence') };
    await record(label, nodeCommand, ['scripts/probe-performance.mjs'], env);
    {
      try {
        const performance = JSON.parse(await readFile(resolve(tempOutput, 'performance-evidence', 'summary.json'), 'utf8'));
        const entry = results.at(-1);
        const gate = performance.reports?.[0]?.budgetGate || null;
        const headlessViolations = performance.reports.flatMap(report => report.budgetGate?.headless || []);
        const deviceOnly = performance.reports.flatMap(report => report.budgetGate?.device || []);
        const payloadBytes = Math.max(0, ...performance.reports.map(report => report.payload?.bytes || 0));
        entry.quality = 'headless-judged';
        entry.headlessBudgetViolations = headlessViolations.length;
        entry.deviceOnlyBudgetViolations = deviceOnly.length;
        entry.payloadBytes = payloadBytes;
        entry.note = headlessViolations.length
          ? `Headless budgets failed: ${headlessViolations.map(item => `${item.metric}.${item.statistic}`).join(', ')}`
          : `${deviceOnly.length} device-only budget(s) recorded as unverified; payload ${Math.round(payloadBytes / 1024)} KB.`;
        if (!gate?.pass && !headlessViolations.length) entry.note = 'Budget gate did not report a pass.';
      } catch (error) {
        const entry = results.at(-1);
        entry.quality = 'diagnostic-unavailable';
        entry.note = `Performance summary could not be read: ${error.message}`;
      }
    }
  }
} finally {
  // The server is deliberately unref'd so the certification process can exit
  // with its report status on Windows without terminating its process tree.
}

const report = {
  schema: 'brainbite.local-certification.v1',
  generatedAt: new Date().toISOString(),
  branch: git.branch || 'unknown',
  commit: git.commit || 'unknown',
  workingTreeClean: git.workingTreeClean,
  scope: 'local automated release certification',
  results,
  summary: {
    total: results.length,
    passed: results.filter(item => item.passed).length,
    failed: results.filter(item => !item.passed).length,
  },
  externalGates: [
    { id: 'gate-8.4-mobile', status: 'UNVERIFIED', reason: 'Requires real phone/tablet/Chromebook devices.' },
    { id: 'gate-8.5-review', status: 'UNVERIFIED', reason: 'Requires educator, Spanish, legal/privacy, and screen-reader sign-off.' },
    { id: 'gate-8.6-production', status: 'UNVERIFIED', reason: 'Requires production domain, HTTPS, support contact, and live account deletion/export.' },
  ],
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
await rm(tempOutput, { recursive: true, force: true });
console.log(`CERTIFICATION REPORT ${output}`);
process.exitCode = report.summary.failed ? 1 : 0;
