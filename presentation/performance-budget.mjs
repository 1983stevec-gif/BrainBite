const MEBIBYTE = 1024 * 1024;

export const PERFORMANCE_METRICS = Object.freeze([
  'frame',
  'longTask',
  'startup',
  'sceneLoad',
  'save',
  'memory',
  'rendererGeometries',
  'rendererTextures',
  'rendererPrograms',
  'renderCalls',
  'renderTriangles',
  'assetLoad',
]);

export const DEFAULT_PERFORMANCE_BUDGETS = Object.freeze({
  frame: Object.freeze({ p95: 33.4, p99: 50, max: 100 }),
  longTask: Object.freeze({ p95: 100, max: 250 }),
  startup: Object.freeze({ max: 3000 }),
  sceneLoad: Object.freeze({ p95: 1500, max: 3000 }),
  save: Object.freeze({ p95: 250, max: 1000 }),
  memory: Object.freeze({ max: 512 * MEBIBYTE }),
  rendererGeometries: Object.freeze({ max: 500 }),
  rendererTextures: Object.freeze({ max: 256 }),
  rendererPrograms: Object.freeze({ max: 64 }),
  renderCalls: Object.freeze({ max: 200 }),
  renderTriangles: Object.freeze({ max: 250000 }),
  assetLoad: Object.freeze({ p95: 1500, max: 3000 }),
});

// Payload size is environment independent, so it catches an asset regression on any
// machine. Resource Timing reports zero sizes for these responses, so the probe measures
// the payload from the network layer instead of from page metrics.
export const DEFAULT_PAYLOAD_BUDGET = Object.freeze({ assetBytes: 4 * MEBIBYTE });

// Which budgets a headless container can judge. Frame pacing and long-task tails depend on
// host scheduling, and network/parse timings depend on container I/O, so those are
// recorded as external evidence and must be confirmed on real hardware.
export const DEVICE_ONLY_BUDGETS = Object.freeze(['frame', 'longTask', 'sceneLoad', 'assetLoad']);

export function classifyBudgetViolations(violations = [], deviceOnly = DEVICE_ONLY_BUDGETS) {
  const external = new Set(deviceOnly);
  const headless = [];
  const device = [];
  for (const violation of violations) {
    (external.has(violation.metric) ? device : headless).push(violation);
  }
  return { headless, device, pass: headless.length === 0 };
}

export const DEFAULT_DEVICE_TIERS = Object.freeze([
  Object.freeze({ tier: 'ultra', frameP95: 14, frameP99: 20, memoryBytes: 256 * MEBIBYTE }),
  Object.freeze({ tier: 'high', frameP95: 17, frameP99: 25, memoryBytes: 384 * MEBIBYTE }),
  Object.freeze({ tier: 'balanced', frameP95: 24, frameP99: 40, memoryBytes: 512 * MEBIBYTE }),
  Object.freeze({ tier: 'performance', frameP95: 34, frameP99: 55, memoryBytes: 768 * MEBIBYTE }),
  Object.freeze({ tier: 'mobile', frameP95: Infinity, frameP99: Infinity, memoryBytes: Infinity }),
]);

function finiteNonNegative(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new TypeError(`${label} must be a finite, non-negative number`);
  }
  return number;
}

function metricName(name) {
  if (!PERFORMANCE_METRICS.includes(name)) {
    throw new TypeError(`Unknown performance metric: ${name}`);
  }
  return name;
}

export function percentile(samples, percentileValue) {
  if (!samples.length) return null;
  const p = finiteNonNegative(percentileValue, 'Percentile');
  if (p > 100) throw new RangeError('Percentile must be at most 100');
  const sorted = samples.map(value => finiteNonNegative(value, 'Sample')).sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

export function summarizeSamples(samples = []) {
  if (!samples.length) {
    return { count: 0, average: null, p95: null, p99: null, max: null };
  }
  const values = samples.map(value => finiteNonNegative(value, 'Sample'));
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    count: values.length,
    average: total / values.length,
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    max: Math.max(...values),
  };
}

function readAssetTiming(entry) {
  if (entry == null) return null;
  const source = typeof entry === 'number' ? { duration: entry } : entry;
  const derivedDuration = source.responseEnd != null && source.startTime != null
    ? Number(source.responseEnd) - Number(source.startTime)
    : null;
  const duration = source.duration ?? derivedDuration;
  if (duration == null) return null;
  return {
    name: source.name == null ? null : String(source.name),
    duration: finiteNonNegative(duration, 'Asset duration'),
    transferSize: source.transferSize == null
      ? null
      : finiteNonNegative(source.transferSize, 'Asset transfer size'),
    encodedBodySize: source.encodedBodySize == null
      ? null
      : finiteNonNegative(source.encodedBodySize, 'Asset encoded body size'),
    decodedBodySize: source.decodedBodySize == null
      ? null
      : finiteNonNegative(source.decodedBodySize, 'Asset decoded body size'),
  };
}

export function summarizeAssetTimings(entries = []) {
  const timings = Array.from(entries, readAssetTiming).filter(Boolean);
  const duration = summarizeSamples(timings.map(entry => entry.duration));
  const total = field => timings.reduce((sum, entry) => sum + (entry[field] ?? 0), 0);
  const slowest = timings.reduce((current, entry) => (
    current == null || entry.duration > current.duration ? entry : current
  ), null);
  return {
    ...duration,
    totalDuration: timings.length ? timings.reduce((sum, entry) => sum + entry.duration, 0) : 0,
    transferSize: total('transferSize'),
    encodedBodySize: total('encodedBodySize'),
    decodedBodySize: total('decodedBodySize'),
    slowest: slowest == null ? null : { name: slowest.name, duration: slowest.duration },
  };
}

export function findBudgetViolations(metrics, budgets = DEFAULT_PERFORMANCE_BUDGETS) {
  const violations = [];
  for (const [metric, limits] of Object.entries(budgets)) {
    const summary = metrics[metric];
    if (!summary || !limits) continue;
    for (const [statistic, budget] of Object.entries(limits)) {
      const actual = summary[statistic];
      if (actual != null && Number.isFinite(budget) && actual > budget) {
        violations.push({ metric, statistic, actual, budget, overBy: actual - budget });
      }
    }
  }
  return violations;
}

export function recommendDeviceTier(metrics, tiers = DEFAULT_DEVICE_TIERS) {
  const frame = metrics.frame;
  if (!frame?.count) {
    return { tier: 'balanced', reasons: ['No frame samples; using the conservative default.'] };
  }

  const memoryMax = metrics.memory?.max;
  const selected = tiers.find(candidate => (
    frame.p95 <= candidate.frameP95
    && frame.p99 <= candidate.frameP99
    && (memoryMax == null || memoryMax <= candidate.memoryBytes)
  )) || tiers.at(-1);

  const reasons = [
    `Frame p95 ${frame.p95}ms and p99 ${frame.p99}ms fit the ${selected.tier} thresholds.`,
  ];
  if (memoryMax != null) reasons.push(`Peak sampled heap was ${memoryMax} bytes.`);
  else reasons.push('Heap memory was unavailable and did not affect the recommendation.');
  return { tier: selected.tier, reasons };
}

function mergeBudgets(overrides = {}) {
  return Object.fromEntries(PERFORMANCE_METRICS.map(metric => [
    metric,
    { ...DEFAULT_PERFORMANCE_BUDGETS[metric], ...overrides[metric] },
  ]));
}

function readMemoryBytes(source) {
  const value = typeof source === 'function' ? source() : source;
  if (value == null) return null;
  if (typeof value === 'number') return finiteNonNegative(value, 'Memory sample');
  const bytes = value.usedJSHeapSize ?? value.memory?.usedJSHeapSize;
  return bytes == null ? null : finiteNonNegative(bytes, 'Memory sample');
}

function readRendererStats(source) {
  const renderer = typeof source === 'function' ? source() : source;
  const info = renderer?.info ?? renderer;
  if (!info) return null;
  const programCount = Array.isArray(info.programs) ? info.programs.length : info.programs;
  return {
    rendererGeometries: info.memory?.geometries,
    rendererTextures: info.memory?.textures,
    rendererPrograms: programCount,
    renderCalls: info.render?.calls,
    renderTriangles: info.render?.triangles,
  };
}

function readAssetEntries(source) {
  const entries = typeof source === 'function' ? source() : source;
  if (entries == null) return [];
  if (typeof entries[Symbol.iterator] !== 'function') {
    throw new TypeError('assetTimingSource must return an iterable');
  }
  return entries;
}

function assetTimingKey(entry) {
  if (entry == null || typeof entry !== 'object') return null;
  return [
    entry.name,
    entry.startTime,
    entry.responseEnd,
    entry.duration,
    entry.transferSize,
    entry.encodedBodySize,
    entry.decodedBodySize,
  ].map(value => value == null ? '' : String(value)).join('|');
}

export function createPerformanceBudget({
  clock = globalThis.performance,
  memorySource = () => globalThis.performance?.memory,
  rendererSource = null,
  assetTimingSource = () => globalThis.performance?.getEntriesByType?.('resource') ?? [],
  budgets: budgetOverrides,
  tiers = DEFAULT_DEVICE_TIERS,
} = {}) {
  if (!clock || typeof clock.now !== 'function') {
    throw new TypeError('clock must provide a now() function');
  }

  const samples = Object.fromEntries(PERFORMANCE_METRICS.map(metric => [metric, []]));
  const assetTimings = [];
  const sampledAssetKeys = new Set();
  const budgets = mergeBudgets(budgetOverrides);

  function record(metric, value) {
    samples[metricName(metric)].push(finiteNonNegative(value, `${metric} sample`));
    return value;
  }

  function start(metric) {
    metricName(metric);
    if (metric === 'frame' || metric === 'memory') {
      throw new TypeError(`${metric} must be recorded directly`);
    }
    const startedAt = finiteNonNegative(clock.now(), 'Clock value');
    let stopped = false;
    return () => {
      if (stopped) throw new Error(`${metric} timer has already stopped`);
      stopped = true;
      return record(metric, finiteNonNegative(clock.now(), 'Clock value') - startedAt);
    };
  }

  function sampleMemory() {
    const bytes = readMemoryBytes(memorySource);
    if (bytes == null) return null;
    record('memory', bytes);
    return bytes;
  }

  function sampleRenderer() {
    const stats = readRendererStats(rendererSource);
    if (stats == null) return null;
    const recorded = {};
    for (const [metric, value] of Object.entries(stats)) {
      if (value == null) continue;
      recorded[metric] = record(metric, value);
    }
    return Object.keys(recorded).length ? recorded : null;
  }

  function recordAssetTiming(entry) {
    const timing = readAssetTiming(entry);
    if (timing == null) return null;
    assetTimings.push(timing);
    record('assetLoad', timing.duration);
    return timing;
  }

  function sampleAssetTimings() {
    const recorded = [];
    for (const entry of readAssetEntries(assetTimingSource)) {
      const key = assetTimingKey(entry);
      if (key != null) {
        if (sampledAssetKeys.has(key)) continue;
        sampledAssetKeys.add(key);
      }
      const timing = recordAssetTiming(entry);
      if (timing != null) recorded.push(timing);
    }
    return summarizeAssetTimings(recorded);
  }

  function observeLongTasks(Observer = globalThis.PerformanceObserver) {
    if (typeof Observer !== 'function') return null;
    let observer = null;
    try {
      observer = new Observer(list => {
        for (const entry of list.getEntries()) {
          if (entry?.duration != null) record('longTask', entry.duration);
        }
      });
      observer.observe({ type: 'longtask', buffered: true });
      return observer;
    } catch {
      observer?.disconnect?.();
      return null;
    }
  }

  function report() {
    const metrics = Object.fromEntries(PERFORMANCE_METRICS.map(metric => [
      metric,
      summarizeSamples(samples[metric]),
    ]));
    const assetTiming = summarizeAssetTimings(assetTimings);
    metrics.assetLoad = assetTiming;
    return {
      metrics,
      assetTiming,
      budgets,
      violations: findBudgetViolations(metrics, budgets),
      recommendation: recommendDeviceTier(metrics, tiers),
    };
  }

  return Object.freeze({
    record,
    recordFrame: durationMs => record('frame', durationMs),
    recordStartup: durationMs => record('startup', durationMs),
    recordSceneLoad: durationMs => record('sceneLoad', durationMs),
    recordSave: durationMs => record('save', durationMs),
    start,
    sampleMemory,
    sampleRenderer,
    recordAssetTiming,
    sampleAssetTimings,
    observeLongTasks,
    report,
  });
}
