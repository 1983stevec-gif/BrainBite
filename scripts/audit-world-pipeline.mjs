import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORLD_PIPELINE_MODULES = Object.freeze([
  { path: 'presentation/webgl-home.mjs', classification: 'reusable', origin: 'existing', reason: 'shared scene host selected by world profile' },
  { path: 'presentation/props.mjs', classification: 'reusable', origin: 'existing', reason: 'shared presentation primitives' },
  { path: 'presentation/capability.mjs', classification: 'reusable', origin: 'existing', reason: 'shared capability and reduced-motion policy' },
  { path: 'presentation/gltf-assets.mjs', classification: 'reusable', origin: 'existing', reason: 'shared asset loader and disposal contract' },
  { path: 'presentation/jungle-environment.mjs', classification: 'reusable', origin: 'existing', reason: 'existing environment helpers reused by the current Bubble Reef host' },
  { path: 'presentation/character-animation.mjs', classification: 'reusable', origin: 'existing', reason: 'shared character animation contract' },
  { path: 'presentation/graphics-quality.mjs', classification: 'reusable', origin: 'existing', reason: 'shared quality-tier controller' },
  { path: 'presentation/surface-textures.mjs', classification: 'reusable', origin: 'existing', reason: 'shared procedural material helpers' },
  { path: 'presentation/performance-budget.mjs', classification: 'reusable', origin: 'existing', reason: 'shared telemetry and budget contract' },
  { path: 'presentation/programmable-bit.mjs', classification: 'reusable', origin: 'existing', reason: 'shared companion presentation' },
  { path: 'presentation/world-profiles.mjs', classification: 'reusable', origin: 'batch-7', reason: 'validated world-selection seam' },
  { path: 'presentation/bubble-reef-kit.mjs', classification: 'world-specific', origin: 'batch-7', reason: 'Bubble Reef environment kit' },
  { path: 'presentation/bubble-reef-route-kit.mjs', classification: 'world-specific', origin: 'batch-7', reason: 'Bubble Reef route and interaction kit' },
]);

const ENTRY_PATH = 'presentation/webgl-home.mjs';
const CERTIFICATION_PATH = 'release-evidence/local-certification.json';

function roundPercent(numerator, denominator) {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

function extractLocalImports(source = '') {
  const imports = new Set();
  const pattern = /^\s*import\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/gm;
  for (const match of source.matchAll(pattern)) {
    if (!match[1].startsWith('.')) continue;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(ENTRY_PATH), match[1]));
    imports.add(resolved);
  }
  return imports;
}

function hasAll(source, tokens) {
  return typeof source === 'string' && tokens.every(token => source.includes(token));
}

function summarizeCertification(artifact) {
  if (artifact == null) {
    return { present: false, readable: false, path: CERTIFICATION_PATH, error: null };
  }
  if (artifact.error) {
    return { present: true, readable: false, path: CERTIFICATION_PATH, error: artifact.error };
  }

  const value = artifact.value;
  const results = Array.isArray(value?.results) ? value.results : [];
  const probe = results.find(result => result?.label === 'performance-probe'
    || String(result?.command || '').includes('probe-performance.mjs'));
  const webgl = results.find(result => String(result?.command || '').includes('tests/webgl.spec.js'));
  const deviceGate = Array.isArray(value?.externalGates)
    ? value.externalGates.find(gate => gate?.id === 'gate-8.4-mobile')
    : null;

  return {
    present: true,
    readable: true,
    path: CERTIFICATION_PATH,
    schema: value?.schema ?? null,
    generatedAt: value?.generatedAt ?? null,
    workingTreeClean: value?.workingTreeClean ?? null,
    summary: value?.summary ?? null,
    webglRegression: webgl ? {
      passed: webgl.passed === true && webgl.exitCode === 0,
      exitCode: webgl.exitCode ?? null,
      command: webgl.command ?? null,
    } : null,
    performanceProbe: probe ? {
      passedAsCommand: probe.passed === true && probe.exitCode === 0,
      exitCode: probe.exitCode ?? null,
      quality: probe.quality ?? 'unspecified',
      budgetViolations: Number.isFinite(probe.budgetViolations) ? probe.budgetViolations : null,
      note: probe.note ?? null,
    } : null,
    physicalDeviceGate: deviceGate ? {
      status: deviceGate.status ?? 'UNVERIFIED',
      reason: deviceGate.reason ?? null,
    } : {
      status: 'UNVERIFIED',
      reason: 'No physical-device result was found in the inspected artifact.',
    },
  };
}

export function auditWorldPipeline({
  sourceFiles = {},
  certificationArtifact = null,
  moduleManifest = WORLD_PIPELINE_MODULES,
} = {}) {
  const entrySource = sourceFiles[ENTRY_PATH];
  const directImports = extractLocalImports(entrySource);
  const modules = moduleManifest.map(module => {
    const present = typeof sourceFiles[module.path] === 'string';
    const integrated = present && (module.path === ENTRY_PATH || directImports.has(module.path));
    return { ...module, present, integrated };
  });
  const reusableCount = modules.filter(module => module.classification === 'reusable' && module.integrated).length;
  const worldSpecificCount = modules.filter(module => module.classification === 'world-specific' && module.integrated).length;
  const existingCount = modules.filter(module => module.origin === 'existing' && module.integrated).length;
  const batch7Count = modules.filter(module => module.origin === 'batch-7' && module.integrated).length;
  const total = modules.length;

  const webglSignals = [
    ['renderer', ENTRY_PATH, ['new THREE.WebGLRenderer']],
    ['instancing', ENTRY_PATH, ['new THREE.InstancedMesh']],
    ['profile-selection', ENTRY_PATH, ['getWorldProfile', "worldProfile.id === 'bubble-reef'"]],
    ['performance-budget', ENTRY_PATH, ['createPerformanceBudget', 'sampleRenderer', 'recordFrame']],
    ['reduced-motion', ENTRY_PATH, ['shouldReduceMotion']],
    ['disposal', ENTRY_PATH, ['renderer.dispose()', 'longTaskObserver?.disconnect'] ],
  ].map(([id, file, tokens]) => ({ id, file, observed: hasAll(sourceFiles[file], tokens), tokens }));

  const performanceModule = sourceFiles['presentation/performance-budget.mjs'];
  const performanceSignals = [
    ['frame-tail-percentiles', ['p95', 'p99']],
    ['renderer-statistics', ['rendererGeometries', 'renderCalls', 'renderTriangles']],
    ['asset-timing', ['assetLoad', 'sampleAssetTimings']],
    ['long-task-observer', ["type: 'longtask'", 'observeLongTasks']],
    ['device-tier-recommendation', ['recommendDeviceTier']],
  ].map(([id, tokens]) => ({
    id,
    file: 'presentation/performance-budget.mjs',
    observed: hasAll(performanceModule, tokens),
    tokens,
  }));

  const certification = summarizeCertification(certificationArtifact);
  return {
    schema: 'brainbite.world-pipeline-audit.v1',
    scope: 'static repository and retained-artifact audit',
    certificationClaimed: false,
    reuse: {
      definition: 'Integrated reusable modules divided by the fixed direct world-pipeline inventory; this is module coverage, not source-line reuse.',
      totalModules: total,
      integratedModules: modules.filter(module => module.integrated).length,
      reusableModules: reusableCount,
      worldSpecificModules: worldSpecificCount,
      reusedExistingModules: existingCount,
      batch7AdditiveModules: batch7Count,
      reusableCoveragePercent: roundPercent(reusableCount, total),
      existingModuleReusePercent: roundPercent(existingCount, total),
      newSystemPercent: roundPercent(batch7Count, total),
      modules,
    },
    webgl: {
      evidenceType: 'static source signals',
      observedSignals: webglSignals.filter(signal => signal.observed).length,
      totalSignals: webglSignals.length,
      signals: webglSignals,
    },
    performance: {
      evidenceType: 'static instrumentation plus retained local artifact metadata',
      observedInstrumentationSignals: performanceSignals.filter(signal => signal.observed).length,
      totalInstrumentationSignals: performanceSignals.length,
      signals: performanceSignals,
      artifact: certification,
    },
    productionTimeHours: {
      status: 'UNKNOWN',
      value: null,
      reason: 'No authoritative time-tracking artifact is part of this bounded repository audit.',
    },
    deviceResults: certification.readable ? certification.physicalDeviceGate : {
      status: 'UNVERIFIED',
      reason: 'No readable physical-device evidence was found.',
    },
    limitations: [
      'Static imports and source tokens establish repository wiring, not runtime behavior.',
      'A successful headless probe command is not a performance pass when its retained quality is diagnostic-only.',
      'No physical-device, sustained-FPS, thermal, battery, or production-host certification is inferred.',
      'Percentages apply only to the declared direct world-pipeline module inventory.',
    ],
  };
}

async function readSources(root, manifest = WORLD_PIPELINE_MODULES) {
  const entries = await Promise.all(manifest.map(async module => {
    try {
      return [module.path, await readFile(path.resolve(root, module.path), 'utf8')];
    } catch (error) {
      if (error?.code === 'ENOENT') return [module.path, null];
      throw error;
    }
  }));
  return Object.fromEntries(entries);
}

async function readJsonArtifact(root, relativePath) {
  try {
    const source = await readFile(path.resolve(root, relativePath), 'utf8');
    try {
      return { value: JSON.parse(source) };
    } catch (error) {
      return { error: `Invalid JSON: ${error.message}` };
    }
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    return { error: error.message };
  }
}

export async function auditRepository(root) {
  const [sourceFiles, certificationArtifact] = await Promise.all([
    readSources(root),
    readJsonArtifact(root, CERTIFICATION_PATH),
  ]);
  return auditWorldPipeline({ sourceFiles, certificationArtifact });
}

function parseRoot(argv) {
  const index = argv.indexOf('--root');
  if (index === -1) return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  if (!argv[index + 1]) throw new Error('--root requires a directory');
  return path.resolve(argv[index + 1]);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const report = await auditRepository(parseRoot(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.reuse.integratedModules !== report.reuse.totalModules) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`WORLD_PIPELINE_AUDIT_ERROR ${error.message}\n`);
    process.exitCode = 1;
  }
}
