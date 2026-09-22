import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyBudgetViolations,
  createPerformanceBudget,
  DEFAULT_PAYLOAD_BUDGET,
  DEVICE_ONLY_BUDGETS,
  recommendDeviceTier,
  summarizeAssetTimings,
  summarizeSamples,
} from '../presentation/performance-budget.mjs';

test('sample summaries compute nearest-rank percentiles and aggregate metrics', () => {
  const samples = Array.from({ length: 100 }, (_, index) => index + 1);
  assert.deepEqual(summarizeSamples(samples), {
    count: 100,
    average: 50.5,
    p95: 95,
    p99: 99,
    max: 100,
  });
});

test('empty samples have explicit null statistics and no violations', () => {
  const report = createPerformanceBudget().report();
  assert.deepEqual(report.metrics.frame, {
    count: 0,
    average: null,
    p95: null,
    p99: null,
    max: null,
  });
  assert.deepEqual(report.violations, []);
  assert.equal(report.recommendation.tier, 'balanced');
});

test('timers use the injected clock and report every exceeded budget', () => {
  const ticks = [100, 350, 500, 900];
  const recorder = createPerformanceBudget({
    clock: { now: () => ticks.shift() },
    budgets: {
      startup: { max: 200 },
      save: { max: 300 },
    },
  });

  const stopStartup = recorder.start('startup');
  assert.equal(stopStartup(), 250);
  const stopSave = recorder.start('save');
  assert.equal(stopSave(), 400);

  assert.deepEqual(recorder.report().violations, [
    { metric: 'startup', statistic: 'max', actual: 250, budget: 200, overBy: 50 },
    { metric: 'save', statistic: 'p95', actual: 400, budget: 250, overBy: 150 },
    { metric: 'save', statistic: 'max', actual: 400, budget: 300, overBy: 100 },
  ]);
  assert.throws(stopStartup, /already stopped/);
});

test('memory sampling accepts performance-like sources and skips unavailable memory', () => {
  let memory = { memory: { usedJSHeapSize: 64 * 1024 * 1024 } };
  const recorder = createPerformanceBudget({ memorySource: () => memory });

  assert.equal(recorder.sampleMemory(), 64 * 1024 * 1024);
  memory = undefined;
  assert.equal(recorder.sampleMemory(), null);
  assert.deepEqual(recorder.report().metrics.memory, {
    count: 1,
    average: 64 * 1024 * 1024,
    p95: 64 * 1024 * 1024,
    p99: 64 * 1024 * 1024,
    max: 64 * 1024 * 1024,
  });
});

test('tier recommendation accounts for frame tails and available memory evidence', () => {
  const fastMetrics = {
    frame: summarizeSamples([10, 11, 12, 13]),
    memory: summarizeSamples([128 * 1024 * 1024]),
  };
  assert.equal(recommendDeviceTier(fastMetrics).tier, 'ultra');

  const memoryConstrained = {
    frame: summarizeSamples([15, 16, 16, 17]),
    memory: summarizeSamples([700 * 1024 * 1024]),
  };
  assert.equal(recommendDeviceTier(memoryConstrained).tier, 'performance');

  const slowMetrics = {
    frame: summarizeSamples([45, 50, 60, 80]),
    memory: summarizeSamples([]),
  };
  assert.equal(recommendDeviceTier(slowMetrics).tier, 'mobile');
});

test('convenience recorders keep presentation timings independent', () => {
  const recorder = createPerformanceBudget();
  recorder.recordFrame(16);
  recorder.recordStartup(1200);
  recorder.recordSceneLoad(600);
  recorder.recordSave(80);

  const { metrics } = recorder.report();
  assert.equal(metrics.frame.max, 16);
  assert.equal(metrics.startup.max, 1200);
  assert.equal(metrics.sceneLoad.max, 600);
  assert.equal(metrics.save.max, 80);
});

test('long-task observer records main-thread stalls and disconnects safely', () => {
  let callback;
  let observedOptions;
  let disconnected = false;
  class FakeObserver {
    constructor(next) { callback = next; }
    observe(options) { observedOptions = options; }
    disconnect() { disconnected = true; }
  }

  const recorder = createPerformanceBudget();
  const observer = recorder.observeLongTasks(FakeObserver);
  assert.deepEqual(observedOptions, { type: 'longtask', buffered: true });
  callback({ getEntries: () => [{ duration: 75 }, { duration: 125 }] });
  assert.equal(recorder.report().metrics.longTask.p95, 125);
  observer.disconnect();
  assert.equal(disconnected, true);
});

test('renderer sampling records injected memory and render-call statistics', () => {
  const renderer = {
    info: {
      memory: { geometries: 18, textures: 9 },
      programs: [{}, {}, {}],
      render: { calls: 24, triangles: 12000 },
    },
  };
  const recorder = createPerformanceBudget({ rendererSource: () => renderer });

  assert.deepEqual(recorder.sampleRenderer(), {
    rendererGeometries: 18,
    rendererTextures: 9,
    rendererPrograms: 3,
    renderCalls: 24,
    renderTriangles: 12000,
  });
  renderer.info.memory.geometries = 20;
  renderer.info.render.calls = 30;
  recorder.sampleRenderer();

  const { metrics } = recorder.report();
  assert.equal(metrics.rendererGeometries.max, 20);
  assert.equal(metrics.rendererTextures.count, 2);
  assert.equal(metrics.rendererPrograms.max, 3);
  assert.equal(metrics.renderCalls.average, 27);
  assert.equal(metrics.renderTriangles.max, 12000);
});

test('asset timing summary aggregates durations, bytes, and the slowest asset', () => {
  const entries = [
    { name: '/mascot.glb', duration: 120, transferSize: 4000, encodedBodySize: 3500, decodedBodySize: 8000 },
    { name: '/jungle.webp', startTime: 50, responseEnd: 250, transferSize: 6000 },
  ];
  const recorder = createPerformanceBudget({ assetTimingSource: () => entries });

  assert.deepEqual(recorder.sampleAssetTimings(), {
    count: 2,
    average: 160,
    p95: 200,
    p99: 200,
    max: 200,
    totalDuration: 320,
    transferSize: 10000,
    encodedBodySize: 3500,
    decodedBodySize: 8000,
    slowest: { name: '/jungle.webp', duration: 200 },
  });
  assert.deepEqual(recorder.report().assetTiming, recorder.report().metrics.assetLoad);
});

test('resource timing sampling is idempotent across repeated reports', () => {
  const entries = [{ name: '/mascot.glb', duration: 120, transferSize: 4000 }];
  const recorder = createPerformanceBudget({ assetTimingSource: () => entries });

  assert.equal(recorder.sampleAssetTimings().count, 1);
  assert.equal(recorder.sampleAssetTimings().count, 0);
  assert.equal(recorder.report().metrics.assetLoad.count, 1);
});

test('renderer and asset sources skip unavailable values with explicit empty summaries', () => {
  const recorder = createPerformanceBudget({
    rendererSource: () => ({ info: { memory: {}, render: {} } }),
    assetTimingSource: () => [null, {}, { name: '/pending.glb' }],
  });

  assert.equal(recorder.sampleRenderer(), null);
  assert.deepEqual(recorder.sampleAssetTimings(), summarizeAssetTimings([]));
  assert.deepEqual(recorder.report().assetTiming, {
    count: 0,
    average: null,
    p95: null,
    p99: null,
    max: null,
    totalDuration: 0,
    transferSize: 0,
    encodedBodySize: 0,
    decodedBodySize: 0,
    slowest: null,
  });
});

test('renderer and asset budget overruns are reported as violations', () => {
  const recorder = createPerformanceBudget({
    rendererSource: { memory: { geometries: 12, textures: 4 }, render: { calls: 8 } },
    assetTimingSource: [100, 450],
    budgets: {
      rendererGeometries: { max: 10 },
      renderCalls: { max: 5 },
      assetLoad: { p95: 300, max: 400 },
    },
  });
  recorder.sampleRenderer();
  recorder.sampleAssetTimings();

  assert.deepEqual(recorder.report().violations, [
    { metric: 'rendererGeometries', statistic: 'max', actual: 12, budget: 10, overBy: 2 },
    { metric: 'renderCalls', statistic: 'max', actual: 8, budget: 5, overBy: 3 },
    { metric: 'assetLoad', statistic: 'p95', actual: 450, budget: 300, overBy: 150 },
    { metric: 'assetLoad', statistic: 'max', actual: 450, budget: 400, overBy: 50 },
  ]);
});

test('budget violations split into headless-judgeable and device-only evidence', () => {
  const violations = [
    { metric: 'renderCalls', statistic: 'max', actual: 260, budget: 200, overBy: 60 },
    { metric: 'frame', statistic: 'p95', actual: 900, budget: 33.4, overBy: 866.6 },
    { metric: 'longTask', statistic: 'max', actual: 2200, budget: 250, overBy: 1950 },
    { metric: 'sceneLoad', statistic: 'p95', actual: 4100, budget: 1500, overBy: 2600 },
    { metric: 'assetLoad', statistic: 'max', actual: 3900, budget: 3000, overBy: 900 },
  ];
  const classified = classifyBudgetViolations(violations);
  // Frame pacing and network/parse timing cannot be judged in a headless container.
  assert.deepEqual(classified.device.map(item => `${item.metric}.${item.statistic}`), [
    'frame.p95', 'longTask.max', 'sceneLoad.p95', 'assetLoad.max',
  ]);
  // Draw calls and payload are environment independent, so they must fail the gate.
  assert.deepEqual(classified.headless.map(item => item.metric), ['renderCalls']);
  assert.equal(classified.pass, false);

  const onlyDevice = classifyBudgetViolations(violations.filter(item => DEVICE_ONLY_BUDGETS.includes(item.metric)));
  assert.equal(onlyDevice.pass, true, 'device-only violations must not fail the headless gate');
  assert.equal(onlyDevice.headless.length, 0);

  assert.equal(classifyBudgetViolations([]).pass, true);
});

test('the payload budget is a positive, environment-independent byte ceiling', () => {
  assert.ok(Number.isFinite(DEFAULT_PAYLOAD_BUDGET.assetBytes));
  assert.ok(DEFAULT_PAYLOAD_BUDGET.assetBytes >= 3 * 1024 * 1024, 'must not be set below the current 3.1 MB payload');
  assert.ok(DEFAULT_PAYLOAD_BUDGET.assetBytes <= 8 * 1024 * 1024, 'must stay inside the documented 8-12 MB Batch 9 target');
});
