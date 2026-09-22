import test from 'node:test';
import assert from 'node:assert/strict';
import { createPerformanceBudget } from '../presentation/performance-budget.mjs';
import { createPresentationTelemetry } from '../presentation/presentation-adapter.mjs';

test('startup readiness is recorded once in the existing startup budget', async () => {
  let now = 0;
  const clock = { now: () => now };
  const performanceBudget = createPerformanceBudget({ clock });
  const telemetry = createPresentationTelemetry({ clock, performanceBudget });

  now = 25;
  await telemetry.syncScreen('home', async () => {});
  now = 40;
  const readiness = { screen: 'home', startedAtMs: 0, readyAtMs: 40, durationMs: 40 };
  assert.deepEqual(telemetry.markReady(), readiness);

  now = 100;
  assert.deepEqual(telemetry.markReady(), readiness);
  const report = telemetry.report();
  assert.equal(report.metrics.startup.count, 1);
  assert.equal(report.metrics.startup.max, 40);
  assert.deepEqual(report.readiness, readiness);
  assert.deepEqual(report.telemetry.readiness, report.readiness);
});

test('screen changes record labeled navigation samples in the scene-load budget', async () => {
  let now = 10;
  const clock = { now: () => now };
  const performanceBudget = createPerformanceBudget({ clock });
  const telemetry = createPresentationTelemetry({ clock, performanceBudget });

  await telemetry.syncScreen('home', async () => {});
  now = 30;
  const sample = await telemetry.syncScreen('game', async () => {
    now = 47;
  });
  now = 60;
  assert.equal(await telemetry.syncScreen('game', async () => {}), null);

  assert.deepEqual(sample, {
    from: 'home',
    to: 'game',
    startedAtMs: 30,
    completedAtMs: 47,
    durationMs: 17,
  });
  const report = telemetry.report();
  assert.equal(report.metrics.sceneLoad.count, 1);
  assert.equal(report.metrics.sceneLoad.max, 17);
  assert.deepEqual(report.screenNavigation, {
    count: 1,
    last: sample,
    samples: [sample],
  });
  assert.deepEqual(report.telemetry.screenNavigation, report.screenNavigation);
});

test('telemetry keeps the performance-budget report contract additive', () => {
  const clock = { now: () => 0 };
  const report = createPresentationTelemetry({
    clock,
    performanceBudget: createPerformanceBudget({ clock }),
  }).report();

  for (const key of ['metrics', 'assetTiming', 'budgets', 'violations', 'recommendation']) {
    assert.ok(Object.hasOwn(report, key), `missing existing runtime report field ${key}`);
  }
  assert.equal(report.readiness, null);
  assert.deepEqual(report.screenNavigation, { count: 0, last: null, samples: [] });
});
