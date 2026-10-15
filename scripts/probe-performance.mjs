import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { classifyBudgetViolations, DEFAULT_PAYLOAD_BUDGET, DEFAULT_PERFORMANCE_BUDGETS, DEVICE_ONLY_BUDGETS } from '../presentation/performance-budget.mjs';

const probePort = Number(process.env.BRAINBITE_TEST_PORT || 4318);
const baseURL = process.env.BB_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${probePort}`;
const repo = resolve(import.meta.dirname, '..');
const output = resolve(process.env.BB_PERF_OUTPUT_DIR || 'test-results/performance-evidence');
const durableOutput = resolve(repo, '.ui-captures', 'release-evidence', 'performance-evidence');
const retention = {
  mode: 'replace-per-run',
  notice: 'This latest-run artifact is replaced by each performance probe run; use capturedAt to identify when it was produced.',
};
const packageManifest = JSON.parse(readFileSync(resolve(repo, 'release-evidence/package-manifest.json'), 'utf8'));
const isPackaged3DAsset = path => (
  /\.glb$/i.test(path)
  || /^assets\/art\/.*\.(?:avif|bmp|gif|jpe?g|png|webp)$/i.test(path)
);
const expectedPayload = new Map(Object.entries(packageManifest.files ?? {})
  .filter(([path]) => isPackaged3DAsset(path))
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([path, entry]) => [path, entry.bytes]));
if (!expectedPayload.size) throw new Error('Package manifest contains no packaged 3D assets');
const viewports = [
  { name: 'desktop', width: 1280, height: 853 },
  { name: 'mobile', width: 390, height: 844 },
];

await Promise.all([
  mkdir(output, { recursive: true }),
  mkdir(durableOutput, { recursive: true }),
]);

async function writeArtifact(name, artifact) {
  const contents = `${JSON.stringify(artifact, null, 2)}\n`;
  const paths = [...new Set([resolve(output, name), resolve(durableOutput, name)])];
  await Promise.all(paths.map(path => writeFile(path, contents)));
  console.log(`Performance evidence wrote: ${paths.join(', ')}`);
  return paths;
}

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

async function waitForScene(page, scene, measuredWorkMs) {
  // Scale the readiness margin from work already measured in this viewport. Polling exits
  // as soon as the counters are ready, while the one-minute cap still catches a real hang.
  const timeoutMs = Math.min(60000, Math.max(5000, Math.ceil((measuredWorkMs * 3 + 5000) / 250) * 250));
  const startedAt = Date.now();
  await page.waitForFunction((name) => {
    const report = window.BrainBitePresentation?.getPerformanceReport?.()[name];
    return (report?.metrics?.sceneLoad?.count || 0) >= 1 && (report?.assetTiming?.count || 0) >= 3;
  }, scene, { timeout: timeoutMs });
  const settle = { scene, measuredWorkMs, timeoutMs, durationMs: Date.now() - startedAt };
  console.log(JSON.stringify({ sceneSettle: settle }));
  return settle;
}

async function settlePayloadReads(page, tasks, measured, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (measured.size < expectedPayload.size && Date.now() < deadline) {
    await Promise.allSettled([...tasks]);
    if (measured.size < expectedPayload.size) await page.waitForTimeout(100);
  }
  await Promise.allSettled([...tasks]);
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
    const payload = { bytes: 0, assets: [], bodyReadFailures: [], missingAssets: [] };
    const payloadReads = [];
    const payloadPathsStarted = new Set();
    const measuredPayload = new Map();
    const sceneSettles = [];
    page.on('response', response => {
      const path = decodeURIComponent(new URL(response.url()).pathname).replace(/^\/+/, '');
      if (!expectedPayload.has(path) || payloadPathsStarted.has(path)) return;
      payloadPathsStarted.add(path);
      const task = response.body().then(buffer => {
        measuredPayload.set(path, buffer.length);
      }).catch(error => {
        payload.bodyReadFailures.push({ name: path, error: error.message });
      });
      payloadReads.push(task);
    });
    let report;
    try {
      const navigationStartedAt = Date.now();
      await page.goto(`${baseURL}/?presentation=webgl&probe=${Date.now()}`, { waitUntil: 'domcontentloaded' });
      const navigationMs = Date.now() - navigationStartedAt;
      const homeSettle = await waitForScene(page, 'home', navigationMs);
      sceneSettles.push(homeSettle);
      await page.waitForTimeout(750);
      const home = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().home);

      // Bubble Reef is a separate home composition with its own geometry budget. Keep the
      // Jungle report above, then remount and gate the alternate scene too.
      await page.evaluate(() => window.BrainBiteWorldPreview.setProfile('bubble-reef'));
      const bubbleReefSettle = await waitForScene(page, 'home', Math.max(navigationMs, homeSettle.durationMs));
      sceneSettles.push(bubbleReefSettle);
      await page.waitForTimeout(750);
      const bubbleReefHome = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().home);

      await page.evaluate(async () => {
        window.BrainBiteGame.startMission(1);
        await window.BrainBitePresentation?.syncFromScreen?.();
      });
      const battleSettle = await waitForScene(page, 'battle', Math.max(navigationMs, homeSettle.durationMs, bubbleReefSettle.durationMs));
      sceneSettles.push(battleSettle);
      await page.waitForTimeout(750);
      const battle = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().battle);
      const runtime = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().runtime);

      // Finish body reads before the DOM-only navigation can abort them. The package
      // manifest defines the complete metric; an absent, unreadable, or size-mismatched
      // asset means payload was not measured and must fail rather than silently pass.
      await settlePayloadReads(page, payloadReads, measuredPayload);
      payload.assets = [...measuredPayload].map(([name, bytes]) => ({ name, bytes }));
      payload.bytes = payload.assets.reduce((sum, asset) => sum + asset.bytes, 0);
      payload.missingAssets = [...expectedPayload.keys()].filter(path => !measuredPayload.has(path));
      const payloadSizeMismatches = payload.assets.flatMap(asset => {
        const expectedBytes = expectedPayload.get(asset.name);
        return asset.bytes === expectedBytes ? [] : [{ name: asset.name, expectedBytes, actualBytes: asset.bytes }];
      });

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

      const violations = [
        ...(home?.violations || []),
        ...(bubbleReefHome?.violations || []),
        ...(battle?.violations || []),
      ];
      const gate = classifyBudgetViolations(violations);
      // Startup readiness and payload are measured outside the scene reports, so they are
      // checked here against the same budget constants.
      const rawStartupMs = runtime?.readiness?.durationMs;
      const startupMs = rawStartupMs == null ? null : Number(rawStartupMs);
      const startupMeasured = Number.isFinite(startupMs);
      const startupViolation = startupMeasured && startupMs > DEFAULT_PERFORMANCE_BUDGETS.startup.max
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
      const saveStatistics = ['median', 'p95', 'max'];
      const missingSaveStatistics = saveStatistics.filter(statistic => !Number.isFinite(saveStats?.[statistic]));
      const measurementFailures = [
        ...(!startupMeasured ? [{ metric: 'startup', reason: 'durationMs was not a finite number' }] : []),
        ...missingSaveStatistics.map(statistic => ({ metric: 'save', statistic, reason: 'statistic was null or non-finite' })),
        ...payload.bodyReadFailures.map(failure => ({ metric: 'assetBytes', asset: failure.name, reason: `body read failed: ${failure.error}` })),
        ...payload.missingAssets.map(asset => ({ metric: 'assetBytes', asset, reason: 'asset response was not measured' })),
        ...payloadSizeMismatches.map(mismatch => ({ metric: 'assetBytes', asset: mismatch.name, reason: `body was ${mismatch.actualBytes} bytes; package manifest says ${mismatch.expectedBytes}` })),
      ];
      report = {
        schema: 'brainbite.performance-evidence.v1',
        capturedAt: new Date().toISOString(),
        retention,
        baseURL,
        viewport,
        durationMs: Date.now() - startedAt,
        errors,
        warnings,
        resourceFailures,
        sceneSettles,
        performance: { home, bubbleReefHome, battle, runtime },
        payload,
        startupMs: startupMeasured ? startupMs : null,
        saveMs: saveStats ? saveStats.median : null,
        saveStats,
        // Informational: these samples include cold-start saves, which are not what the
        // save budget describes. The controlled sample above is the gated one.
        runtimeReportedViolations: runtime?.violations || [],
        budgetGate: {
          ...gate,
          headless: [...gate.headless, ...startupViolation, ...saveViolations, ...payloadViolation],
          measurementFailures,
          pass: gate.pass && startupViolation.length === 0 && saveViolations.length === 0 && payloadViolation.length === 0 && measurementFailures.length === 0,
        },
      };
    } catch (error) {
      errors.push(`probe: ${error.message}`);
      report = {
        schema: 'brainbite.performance-evidence.v1',
        capturedAt: new Date().toISOString(),
        retention,
        baseURL,
        viewport,
        durationMs: Date.now() - startedAt,
        errors,
        warnings,
        resourceFailures,
        sceneSettles,
        performance: null,
        budgetGate: null,
      };
    } finally {
      await page.close();
    }
    reports.push(report);
    await writeArtifact(`${viewport.name}.json`, report);
    console.log(JSON.stringify({ viewport: viewport.name, errors: report.errors.length, warnings: report.warnings.length, durationMs: report.durationMs }));
  }
} finally {
  await browser.close();
}

const summary = {
  schema: 'brainbite.performance-evidence-summary.v1',
  capturedAt: new Date().toISOString(),
  retention,
  baseURL,
  deviceOnlyBudgets: DEVICE_ONLY_BUDGETS,
  reports: reports.map(report => ({
    viewport: report.viewport,
    errors: report.errors,
    warnings: report.warnings,
    resourceFailures: report.resourceFailures,
    sceneSettles: report.sceneSettles,
    performance: report.performance,
    payload: report.payload,
    startupMs: report.startupMs,
    saveMs: report.saveMs,
    saveStats: report.saveStats,
    runtimeReportedViolations: report.runtimeReportedViolations,
    budgetGate: report.budgetGate,
  })),
};
await writeArtifact('summary.json', summary);

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
  for (const failure of gate.measurementFailures || []) {
    console.error(`  MEASUREMENT FAIL ${failure.metric}${failure.statistic ? `.${failure.statistic}` : ''}${failure.asset ? ` ${failure.asset}` : ''}: ${failure.reason}`);
  }
}
const failed = reports.some(report => report.errors.length || !report.performance || (report.budgetGate && !report.budgetGate.pass));
if (ownedServer) await new Promise(done => { ownedServer.close(done); ownedServer.closeAllConnections?.(); });
if (failed) process.exitCode = 1;
