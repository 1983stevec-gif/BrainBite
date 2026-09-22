import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { classifyBudgetViolations, DEFAULT_PAYLOAD_BUDGET, DEFAULT_PERFORMANCE_BUDGETS, DEVICE_ONLY_BUDGETS } from '../presentation/performance-budget.mjs';

const probePort = Number(process.env.BRAINBITE_TEST_PORT || 4318);
const baseURL = process.env.BB_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${probePort}`;
const output = resolve(process.env.BB_PERF_OUTPUT_DIR || 'test-results/performance-evidence');
const viewports = [
  { name: 'desktop', width: 1280, height: 853 },
  { name: 'mobile', width: 390, height: 844 },
];

await mkdir(output, { recursive: true });

// Own the server when nothing is listening, so the probe cannot silently measure a
// connection failure. This is how its earlier evidence was lost: it ran after another
// stage closed its server and reported the refusal as a result.
const serverIsReady = async () => {
  try {
    const response = await fetch(`${baseURL}/index.html`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch { return false; }
};
let ownedServer = null;
if (!(await serverIsReady())) {
  const { createBrainBiteServer } = await import('./serve.mjs');
  ownedServer = await createBrainBiteServer({ port: probePort });
}

const browser = await chromium.launch({ headless: true });
const reports = [];

async function waitForScene(page, scene) {
  // A bounded settle window is more stable than waiting on two independent
  // counters while WebGL and the service worker initialize together.
  await page.waitForTimeout(5000);
  const ready = await page.evaluate((name) => {
    const report = window.BrainBitePresentation?.getPerformanceReport?.()[name];
    return (report?.metrics?.sceneLoad?.count || 0) >= 1 && (report?.assetTiming?.count || 0) >= 3;
  }, scene);
  if (!ready) throw new Error(`${scene} presentation did not reach the measured-ready state`);
}

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const errors = [];
    const warnings = [];
    const resourceFailures = [];
    const appOrigin = new URL(baseURL).origin;
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('requestfailed', request => {
      const failure = { url: request.url(), resourceType: request.resourceType(), error: request.failure()?.errorText || 'unknown' };
      resourceFailures.push(failure);
      if (new URL(request.url()).origin === appOrigin) errors.push(`requestfailed: ${failure.url} (${failure.error})`);
      else warnings.push(`optional resource unavailable: ${failure.url} (${failure.error})`);
    });
    page.on('console', message => {
      if (message.type() !== 'error') return;
      if (message.text().startsWith('Failed to load resource')) return;
      errors.push(`console: ${message.text()}`);
    });
    const startedAt = Date.now();
    // Measure the 3D payload from the network layer: Resource Timing reports zero sizes
    // for these responses, and payload size is the environment-independent budget.
    const payload = { bytes: 0, assets: [] };
    page.on('response', async response => {
      const url = response.url();
      if (!/\.(glb|woff2)$/.test(new URL(url).pathname)) return;
      try {
        const buffer = await response.body();
        payload.bytes += buffer.length;
        payload.assets.push({ name: new URL(url).pathname.split('/').pop(), bytes: buffer.length });
      } catch { /* a redirect or aborted body is not payload */ }
    });
    let report;
    try {
      await page.goto(`${baseURL}/?presentation=webgl&probe=${Date.now()}`, { waitUntil: 'domcontentloaded' });
      await waitForScene(page, 'home');
      await page.waitForTimeout(750);
      const home = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().home);

      await page.evaluate(async () => {
        window.BrainBiteGame.startMission(1);
        await window.BrainBitePresentation?.syncFromScreen?.();
      });
      await waitForScene(page, 'battle');
      await page.waitForTimeout(750);
      const battle = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().battle);
      const runtime = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().runtime);

      // Measure save latency on the shipping DOM path. In a headless WebGL session the
      // persistence chain queues behind software-rasterized frames (measured ~600 ms of
      // pure frame time), which says nothing about save cost.
      await page.goto(`${baseURL}/?match=0&webgl=0&probe=${Date.now()}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => Boolean(window.BrainBiteGame?.getState));
      await page.waitForTimeout(300);
      // Enough samples for a p95 to mean something. The previous version took three saves and
      // reported the median as "p95" against the p95 budget, so the tail it claimed to check
      // was never measured. Each iteration mutates the state and awaits the same save path the
      // app uses, so a slow save shows up instead of averaging away.
      const saveStats = await page.evaluate(async () => {
        if (typeof save !== 'function' || typeof P !== 'function') return null;
        const samples = [];
        for (let index = 0; index < 20; index += 1) {
          P().updatedAt = Date.now() + index;
          const started = performance.now();
          await save();
          samples.push(performance.now() - started);
        }
        samples.sort((a, b) => a - b);
        const pick = fraction => samples[Math.min(samples.length - 1, Math.ceil(fraction * samples.length) - 1)];
        return { median: pick(0.5), p95: pick(0.95), max: samples[samples.length - 1], samples: samples.length };
      });

      const violations = [...(home?.violations || []), ...(battle?.violations || [])];
      const gate = classifyBudgetViolations(violations);
      // Startup readiness and payload are measured outside the scene reports, so they are
      // checked here against the same budget constants.
      const startupMs = Number(runtime?.readiness?.durationMs);
      const startupViolation = Number.isFinite(startupMs) && startupMs > DEFAULT_PERFORMANCE_BUDGETS.startup.max
        ? [{ metric: 'startup', statistic: 'max', actual: startupMs, budget: DEFAULT_PERFORMANCE_BUDGETS.startup.max, overBy: startupMs - DEFAULT_PERFORMANCE_BUDGETS.startup.max }]
        : [];
      const payloadViolation = payload.bytes > DEFAULT_PAYLOAD_BUDGET.assetBytes
        ? [{ metric: 'assetBytes', statistic: 'max', actual: payload.bytes, budget: DEFAULT_PAYLOAD_BUDGET.assetBytes, overBy: payload.bytes - DEFAULT_PAYLOAD_BUDGET.assetBytes }]
        : [];
      const saveBudget = DEFAULT_PERFORMANCE_BUDGETS.save;
      const saveViolations = [];
      if (saveStats && saveStats.p95 > saveBudget.p95) {
        saveViolations.push({ metric: 'save', statistic: 'p95', actual: saveStats.p95, budget: saveBudget.p95, overBy: saveStats.p95 - saveBudget.p95 });
      }
      if (saveStats && saveStats.max > saveBudget.max) {
        saveViolations.push({ metric: 'save', statistic: 'max', actual: saveStats.max, budget: saveBudget.max, overBy: saveStats.max - saveBudget.max });
      }
      report = {
        schema: 'brainbite.performance-evidence.v1',
        capturedAt: new Date().toISOString(),
        baseURL,
        viewport,
        durationMs: Date.now() - startedAt,
        errors,
        warnings,
        resourceFailures,
        performance: { home, battle, runtime },
        payload,
        startupMs: Number.isFinite(startupMs) ? startupMs : null,
        saveMs: saveStats ? saveStats.median : null,
        saveStats,
        // Informational: these samples include cold-start saves, which are not what the
        // save budget describes. The controlled sample above is the gated one.
        runtimeReportedViolations: runtime?.violations || [],
        budgetGate: { ...gate, headless: [...gate.headless, ...startupViolation, ...saveViolations, ...payloadViolation], pass: gate.pass && startupViolation.length === 0 && saveViolations.length === 0 && payloadViolation.length === 0 },
      };
    } catch (error) {
      errors.push(`probe: ${error.message}`);
      report = {
        schema: 'brainbite.performance-evidence.v1',
        capturedAt: new Date().toISOString(),
        baseURL,
        viewport,
        durationMs: Date.now() - startedAt,
        errors,
        warnings,
        resourceFailures,
        performance: null,
        budgetGate: null,
      };
    } finally {
      await page.close();
    }
    reports.push(report);
    await writeFile(resolve(output, `${viewport.name}.json`), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ viewport: viewport.name, errors: report.errors.length, warnings: report.warnings.length, durationMs: report.durationMs }));
  }
} finally {
  await browser.close();
}

const summary = {
  schema: 'brainbite.performance-evidence-summary.v1',
  capturedAt: new Date().toISOString(),
  baseURL,
  deviceOnlyBudgets: DEVICE_ONLY_BUDGETS,
  reports: reports.map(report => ({
    viewport: report.viewport,
    errors: report.errors,
    warnings: report.warnings,
    resourceFailures: report.resourceFailures,
    performance: report.performance,
    payload: report.payload,
    startupMs: report.startupMs,
    saveMs: report.saveMs,
    saveStats: report.saveStats,
    runtimeReportedViolations: report.runtimeReportedViolations,
    budgetGate: report.budgetGate,
  })),
};
await writeFile(resolve(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

// Headless-judgeable budgets must pass. Frame pacing, long-task tails, and network/parse
// timings are recorded as external evidence: they depend on host scheduling and container
// I/O, so they must be confirmed on real hardware rather than asserted here.
for (const report of reports) {
  const gate = report.budgetGate || { headless: [], device: [], pass: true };
  console.log(JSON.stringify({
    viewport: report.viewport.name,
    headlessViolations: gate.headless.length,
    deviceOnlyViolations: gate.device.length,
    pass: gate.pass,
  }));
  for (const violation of gate.headless) {
    console.error(`  BUDGET FAIL ${violation.metric}.${violation.statistic}: ${Math.round(violation.actual)} > ${violation.budget}`);
  }
  for (const violation of gate.device) {
    console.log(`  device-only (unverified): ${violation.metric}.${violation.statistic} ${Math.round(violation.actual)} > ${violation.budget}`);
  }
}
const failed = reports.some(report => report.errors.length || !report.performance || (report.budgetGate && !report.budgetGate.pass));
if (ownedServer) await new Promise(done => { ownedServer.close(done); ownedServer.closeAllConnections?.(); });
if (failed) process.exitCode = 1;
