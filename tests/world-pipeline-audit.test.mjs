import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditWorldPipeline,
  WORLD_PIPELINE_MODULES,
} from '../scripts/audit-world-pipeline.mjs';

const entryPath = 'presentation/webgl-home.mjs';

function completeSources() {
  const imports = WORLD_PIPELINE_MODULES
    .filter(module => module.path !== entryPath)
    .map((module, index) => `import { dependency${index} } from './${module.path.split('/').at(-1)}';`)
    .join('\n');
  return Object.fromEntries(WORLD_PIPELINE_MODULES.map(module => [module.path, module.path === entryPath
    ? `${imports}\nnew THREE.WebGLRenderer();\nnew THREE.InstancedMesh();\ngetWorldProfile();\nworldProfile.id === 'bubble-reef';\ncreatePerformanceBudget();\nsampleRenderer();\nrecordFrame();\nshouldReduceMotion();\nrenderer.dispose();\nlongTaskObserver?.disconnect();`
    : module.path.endsWith('performance-budget.mjs')
      ? "p95; p99; rendererGeometries; renderCalls; renderTriangles; assetLoad; sampleAssetTimings; type: 'longtask'; observeLongTasks; recommendDeviceTier;"
      : 'export const fixture = true;']));
}

function certification(overrides = {}) {
  return {
    value: {
      schema: 'brainbite.local-certification.v1',
      generatedAt: '2026-09-13T07:26:31.038Z',
      workingTreeClean: false,
      summary: { total: 24, passed: 24, failed: 0 },
      results: [
        { command: 'npx playwright test tests/webgl.spec.js', passed: true, exitCode: 0 },
        {
          label: 'performance-probe', command: 'node scripts/probe-performance.mjs',
          passed: true, exitCode: 0, quality: 'diagnostic-only', budgetViolations: 20,
          note: 'Headless evidence only.',
        },
      ],
      externalGates: [{ id: 'gate-8.4-mobile', status: 'UNVERIFIED', reason: 'Requires devices.' }],
      ...overrides,
    },
  };
}

test('complete pipeline reports deterministic module reuse coverage', () => {
  const report = auditWorldPipeline({ sourceFiles: completeSources(), certificationArtifact: certification() });
  assert.deepEqual({
    total: report.reuse.totalModules,
    integrated: report.reuse.integratedModules,
    reusable: report.reuse.reusableModules,
    specific: report.reuse.worldSpecificModules,
    designCoveragePercent: report.reuse.reusableCoveragePercent,
    reusedExisting: report.reuse.reusedExistingModules,
    batch7Additive: report.reuse.batch7AdditiveModules,
    reusePercent: report.reuse.existingModuleReusePercent,
    newPercent: report.reuse.newSystemPercent,
  }, {
    total: 13, integrated: 13, reusable: 11, specific: 2,
    designCoveragePercent: 84.6, reusedExisting: 10, batch7Additive: 3,
    reusePercent: 76.9, newPercent: 23.1,
  });
  assert.equal(report.certificationClaimed, false);
});

test('missing or unimported modules lower coverage instead of being inferred', () => {
  const sources = completeSources();
  delete sources['presentation/props.mjs'];
  sources[entryPath] = sources[entryPath].replace("import { dependency11 } from './bubble-reef-route-kit.mjs';", '');
  const report = auditWorldPipeline({ sourceFiles: sources });
  assert.equal(report.reuse.integratedModules, 11);
  assert.equal(report.reuse.reusableModules, 10);
  assert.equal(report.reuse.worldSpecificModules, 1);
  assert.equal(report.reuse.modules.find(module => module.path === 'presentation/props.mjs').present, false);
  assert.equal(report.reuse.modules.find(module => module.path === 'presentation/bubble-reef-route-kit.mjs').integrated, false);
});

test('static WebGL and performance signals require every declared token', () => {
  const sources = completeSources();
  let report = auditWorldPipeline({ sourceFiles: sources });
  assert.equal(report.webgl.observedSignals, report.webgl.totalSignals);
  assert.equal(report.performance.observedInstrumentationSignals, report.performance.totalInstrumentationSignals);

  sources[entryPath] = sources[entryPath].replace('recordFrame();', '');
  sources['presentation/performance-budget.mjs'] = sources['presentation/performance-budget.mjs'].replace('sampleAssetTimings;', '');
  report = auditWorldPipeline({ sourceFiles: sources });
  assert.equal(report.webgl.signals.find(signal => signal.id === 'performance-budget').observed, false);
  assert.equal(report.performance.signals.find(signal => signal.id === 'asset-timing').observed, false);
});

test('retained performance metadata stays diagnostic and devices stay unverified', () => {
  const report = auditWorldPipeline({ sourceFiles: completeSources(), certificationArtifact: certification() });
  assert.deepEqual(report.performance.artifact.performanceProbe, {
    passedAsCommand: true,
    exitCode: 0,
    quality: 'diagnostic-only',
    budgetViolations: 20,
    note: 'Headless evidence only.',
  });
  assert.deepEqual(report.deviceResults, { status: 'UNVERIFIED', reason: 'Requires devices.' });
  assert.deepEqual(report.productionTimeHours, {
    status: 'UNKNOWN', value: null,
    reason: 'No authoritative time-tracking artifact is part of this bounded repository audit.',
  });
});

test('missing and malformed artifacts are reported without manufacturing evidence', () => {
  const missing = auditWorldPipeline({ sourceFiles: completeSources() });
  assert.equal(missing.performance.artifact.present, false);
  assert.equal(missing.deviceResults.status, 'UNVERIFIED');

  const malformed = auditWorldPipeline({
    sourceFiles: completeSources(),
    certificationArtifact: { error: 'Invalid JSON: fixture' },
  });
  assert.deepEqual(malformed.performance.artifact, {
    present: true,
    readable: false,
    path: 'release-evidence/local-certification.json',
    error: 'Invalid JSON: fixture',
  });
  assert.equal(malformed.certificationClaimed, false);
});
