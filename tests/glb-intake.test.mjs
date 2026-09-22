import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  REQUEST_SCHEMA,
  approveAsset,
  inspectGlb,
  intakeAsset,
  normalizeApprovedAsset,
  promoteAsset,
  validateRequest,
} from '../scripts/intake-glb.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function makeGlb(overrides = {}) {
  const bin = Buffer.alloc(44);
  [[0, 0, 0], [1, 0, 0], [0, 1, 0]].flat().forEach((value, index) => bin.writeFloatLE(value, index * 4));
  [0, 1, 2].forEach((value, index) => bin.writeUInt16LE(value, 36 + index * 2));
  const gltf = {
    asset: { version: '2.0', generator: 'BrainBite intake fixture' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 6 },
    ],
    buffers: [{ byteLength: 42 }],
    materials: [{ name: 'BB_Test' }],
    ...overrides,
  };
  let json = Buffer.from(JSON.stringify(gltf));
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  const total = 12 + jsonHeader.length + json.length + binHeader.length + bin.length;
  const header = Buffer.alloc(12);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  return Buffer.concat([header, jsonHeader, json, binHeader, bin]);
}

function makeNormalizedGlb(assetId) {
  const rootName = `BrainBite_${assetId}_ROOT`;
  const output = makeGlb({
    scenes: [{ nodes: [0] }],
    nodes: [
      {
        name: rootName,
        children: [1],
        extras: {
          brainbite_asset_id: assetId,
          brainbite_units: 'meters',
          brainbite_pivot: 'bottom-center',
          brainbite_pipeline: 'static-prop-normalization',
        },
      },
      { name: 'FixtureMesh', mesh: 0 },
    ],
    materials: [{ name: `BB_${assetId}_000_Test` }],
  });
  const jsonLength = output.readUInt32LE(12);
  const binOffset = 20 + jsonLength + 8;
  [[-0.5, 0, 0.5], [0.5, 0, 0.5], [0, 1, -0.5]].flat()
    .forEach((value, index) => output.writeFloatLE(value, binOffset + index * 4));
  return output;
}

function makeNormalizationMetrics(assetId) {
  return {
    object_count: 2,
    mesh_count: 1,
    triangle_count: 1,
    material_count: 1,
    material_names: [`BB_${assetId}_000_Test`],
    texture_count: 0,
    texture_names: [],
    bounds_min: [-0.5, -0.5, 0],
    bounds_max: [0.5, 0.5, 1],
    dimensions: [1, 1, 1],
    max_dimension: 1,
    root_names: [`BrainBite_${assetId}_ROOT`],
    armature_count: 0,
    animation_count: 0,
    singular_transform_count: 0,
    sheared_transform_count: 0,
    negative_determinant_count: 0,
    non_unit_scale_count: 0,
    non_finite_material_value_count: 0,
    degenerate_triangle_count: 0,
    non_finite_vertex_count: 0,
    missing_material_slot_count: 0,
  };
}

function makeRequest(bytes, overrides = {}) {
  return {
    schema: REQUEST_SCHEMA,
    assetId: 'jungle_fern',
    displayName: 'Jungle Fern',
    expectedSha256: digest(bytes),
    source: {
      vendor: 'fixture-vendor',
      engine: 'fixture-engine-v1',
      taskId: 'fixture-task-1',
      acquiredAt: '2026-09-12T12:00:00Z',
      prompt: 'Original stylized jungle fern on a plain background.',
      inputRights: 'Original BrainBite test fixture.',
      containsChildData: false,
    },
    license: {
      commercialUseConfirmed: true,
      redistributionAllowed: true,
      termsUrl: 'https://example.test/terms',
      termsCapturedAt: '2026-09-12T12:00:00Z',
      attribution: '',
    },
    budgets: {
      maxBytes: 1024 * 1024,
      maxTriangles: 100,
      maxMaterials: 4,
      maxTextures: 2,
      maxDimension: 10,
    },
    ...overrides,
  };
}

async function fixture(t, bytes = makeGlb(), request = null) {
  const directory = await mkdtemp(path.join(tmpdir(), 'brainbite-intake-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const inputPath = path.join(directory, 'candidate.glb');
  const requestPath = path.join(directory, 'request.json');
  await writeFile(inputPath, bytes);
  await writeFile(requestPath, `${JSON.stringify(request ?? makeRequest(bytes), null, 2)}\n`);
  return { directory, root: path.join(directory, 'intake'), inputPath, requestPath };
}

test('valid self-contained GLB is inspected and remains quarantined after intake', async t => {
  const bytes = makeGlb();
  const inspected = inspectGlb(bytes, makeRequest(bytes).budgets);
  assert.equal(inspected.valid, true);
  assert.deepEqual(inspected.metrics, {
    bytes: bytes.length, meshes: 1, nodes: 1, triangles: 1, materials: 1,
    textures: 0, images: 0, animations: 0, skins: 0,
  });
  const files = await fixture(t, bytes);
  const { report, quarantineFile } = await intakeAsset(files);
  assert.equal(report.status, 'accepted');
  assert.equal(report.lifecycle, 'QUARANTINED');
  assert.equal(digest(await readFile(quarantineFile)), digest(bytes));
});

test('malformed GLB is rejected but retained with reasons in quarantine', async t => {
  const bytes = makeGlb();
  bytes.writeUInt32LE(bytes.length + 4, 8);
  const files = await fixture(t, bytes);
  const { report, quarantineFile } = await intakeAsset(files);
  assert.equal(report.status, 'rejected');
  assert.match(report.reasons.join('\n'), /declared length/);
  assert.equal(digest(await readFile(quarantineFile)), digest(bytes));
});

test('malformed nested glTF structures are rejected and quarantined without throwing', async t => {
  const bytes = makeGlb({ nodes: [{ mesh: 0, children: {} }] });
  const inspected = inspectGlb(bytes, makeRequest(bytes).budgets);
  assert.equal(inspected.valid, false);
  assert.match(inspected.reasons.join('\n'), /malformed nested glTF structure/);
  const files = await fixture(t, bytes);
  const { report, quarantineFile } = await intakeAsset(files);
  assert.equal(report.status, 'rejected');
  assert.match(report.reasons.join('\n'), /malformed nested glTF structure/);
  assert.equal(digest(await readFile(quarantineFile)), digest(bytes));
});

test('request validation rejects mismatched hashes, missing rights, child data and credentials', () => {
  const bytes = makeGlb();
  const request = makeRequest(bytes);
  request.expectedSha256 = '0'.repeat(64);
  request.source.inputRights = '';
  request.source.containsChildData = true;
  request.source.apiToken = 'must-not-enter-records';
  request.license.redistributionAllowed = false;
  const reasons = validateRequest(request, digest(bytes), bytes.length).join('\n');
  assert.match(reasons, /forbidden credential-like field/);
  assert.match(reasons, /does not match/);
  assert.match(reasons, /inputRights/);
  assert.match(reasons, /containsChildData/);
  assert.match(reasons, /redistributionAllowed/);
});

test('external resources, unsupported extensions and resource budgets are rejected', () => {
  const external = makeGlb({
    buffers: [{ byteLength: 42, uri: 'https://example.test/model.bin' }],
    images: [{ uri: 'data:image/png;base64,AA==' }],
    extensionsUsed: ['EXT_untrusted_vendor_feature'],
    materials: [{}, {}, {}],
  });
  const result = inspectGlb(external, { maxTriangles: 0, maxMaterials: 2, maxTextures: 0 });
  assert.equal(result.valid, false);
  assert.match(result.reasons.join('\n'), /unsupported glTF extensions/);
  assert.match(result.reasons.join('\n'), /buffer URIs/);
  assert.match(result.reasons.join('\n'), /image URIs/);
  assert.match(result.reasons.join('\n'), /triangles exceed/);
  assert.match(result.reasons.join('\n'), /materials exceed/);
});

test('GLB geometry validation rejects bad accessors, indices, non-finite values, and degenerate triangles', () => {
  const limits = { maxTriangles: 100, maxMaterials: 4, maxTextures: 2 };
  const degenerate = makeGlb();
  const degenerateBin = 20 + degenerate.readUInt32LE(12) + 8;
  for (let offset = 0; offset < 36; offset += 4) degenerate.writeFloatLE(0, degenerateBin + offset);
  assert.match(inspectGlb(degenerate, limits).reasons.join('\n'), /degenerate triangles/);

  const nonFinite = makeGlb();
  const nonFiniteBin = 20 + nonFinite.readUInt32LE(12) + 8;
  nonFinite.writeFloatLE(Number.NaN, nonFiniteBin);
  assert.match(inspectGlb(nonFinite, limits).reasons.join('\n'), /non-finite position values/);

  const badIndex = makeGlb();
  const badIndexBin = 20 + badIndex.readUInt32LE(12) + 8;
  badIndex.writeUInt16LE(99, badIndexBin + 36);
  assert.match(inspectGlb(badIndex, limits).reasons.join('\n'), /out-of-range vertex/);

  const badAccessor = makeGlb({
    accessors: [
      { bufferView: 0, byteOffset: 35, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
    ],
  });
  assert.match(inspectGlb(badAccessor, limits).reasons.join('\n'), /invalid alignment\/stride|exceeds its bufferView/);

  const badTriangles = makeGlb({
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: 4, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 8 },
    ],
    buffers: [{ byteLength: 44 }],
  });
  assert.match(inspectGlb(badTriangles, limits).reasons.join('\n'), /invalid triangle indices/);

  const combinedMisalignment = makeGlb({
    bufferViews: [
      { buffer: 0, byteOffset: 2, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 6 },
    ],
  });
  assert.match(inspectGlb(combinedMisalignment, limits).reasons.join('\n'), /invalid alignment\/stride/);

  const invalidExplicitStride = makeGlb({
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 6, byteStride: 2 },
    ],
  });
  assert.match(inspectGlb(invalidExplicitStride, limits).reasons.join('\n'), /invalid alignment\/stride/);

  const repeatedInstance = makeGlb({
    scenes: [{ nodes: [0, 1] }],
    nodes: [{ mesh: 0 }, { mesh: 0 }],
  });
  assert.match(inspectGlb(repeatedInstance, { ...limits, maxTriangles: 1 }).reasons.join('\n'), /scene instances exceed/);
});

test('promotion requires separate approval and is idempotent after promotion', async t => {
  const bytes = makeGlb();
  const files = await fixture(t, bytes);
  const { report } = await intakeAsset(files);
  await assert.rejects(() => promoteAsset({ assetId: 'jungle_fern', inputSha256: report.inputSha256, root: files.root }), /ENOENT/);
  await approveAsset({ assetId: 'jungle_fern', inputSha256: report.inputSha256, approvedBy: 'BrainBite art reviewer', root: files.root });
  const promoted = await promoteAsset({ assetId: 'jungle_fern', inputSha256: report.inputSha256, root: files.root });
  assert.equal(promoted.idempotent, false);
  assert.equal(digest(await readFile(promoted.destination)), report.inputSha256);
  assert.equal(JSON.parse(await readFile(promoted.manifestFile, 'utf8')).lifecycle, 'PROMOTED');
  assert.equal((await promoteAsset({ assetId: 'jungle_fern', inputSha256: report.inputSha256, root: files.root })).idempotent, true);
});

test('unsafe asset IDs cannot become paths or approvals', async t => {
  const bytes = makeGlb();
  const request = makeRequest(bytes, { assetId: '../escape' });
  const files = await fixture(t, bytes, request);
  const { report, quarantineFile } = await intakeAsset(files);
  assert.equal(report.assetId, '_rejected');
  assert.equal(report.status, 'rejected');
  assert.ok(path.resolve(quarantineFile).startsWith(path.resolve(files.root)));
  await assert.rejects(() => approveAsset({ assetId: '../escape', inputSha256: digest(bytes), approvedBy: 'reviewer', root: files.root }), /safe asset identifier/);
});

test('non-string asset IDs are rejected and still retained in quarantine', async t => {
  const bytes = Buffer.from('not a glb');
  const request = makeRequest(bytes, { assetId: 12 });
  const files = await fixture(t, bytes, request);
  const { report, quarantineFile } = await intakeAsset(files);
  assert.equal(report.assetId, '_rejected');
  assert.equal(report.status, 'rejected');
  assert.match(report.reasons.join('\n'), /assetId must be a string/);
  assert.equal(digest(await readFile(quarantineFile)), digest(bytes));
});

test('failed replacement restores the previous promoted asset and manifest', async t => {
  const first = makeGlb();
  const files = await fixture(t, first);
  let intake = await intakeAsset(files);
  await approveAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, approvedBy: 'reviewer', root: files.root });
  const firstPromotion = await promoteAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root });
  const oldManifest = await readFile(firstPromotion.manifestFile, 'utf8');

  const second = makeGlb({ extras: { revision: 2 } });
  await writeFile(files.inputPath, second);
  await writeFile(files.requestPath, `${JSON.stringify(makeRequest(second), null, 2)}\n`);
  intake = await intakeAsset(files);
  await approveAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, approvedBy: 'reviewer', root: files.root });
  await assert.rejects(() => promoteAsset({
    assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root,
    testHooks: { afterAssetCommit: () => { throw new Error('simulated interruption'); } },
  }), /simulated interruption/);
  assert.equal(digest(await readFile(firstPromotion.destination)), digest(first));
  assert.equal(await readFile(firstPromotion.manifestFile, 'utf8'), oldManifest);
});

test('approved static asset normalization is staged, validated and idempotent', async t => {
  const bytes = makeGlb();
  const files = await fixture(t, bytes);
  const intake = await intakeAsset(files);
  await approveAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, approvedBy: 'reviewer', root: files.root });
  await promoteAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root });
  const normalizedBytes = makeNormalizedGlb('jungle_fern');
  const fakeBlender = async (_executable, args) => {
    const value = name => args[args.indexOf(name) + 1];
    const source = await readFile(value('--input'));
    await writeFile(value('--output'), normalizedBytes);
    await writeFile(value('--blend'), Buffer.alloc(64, 1));
    const metrics = makeNormalizationMetrics(value('--asset-id'));
    await writeFile(value('--report'), `${JSON.stringify({
      schema: 'brainbite.blender.normalization-report.v1',
      pipeline_version: '1.0.0',
      blender_version: 'fixture',
      status: 'passed',
      asset_id: value('--asset-id'),
      mode: 'static-prop',
      source_sha256: digest(source),
      output_sha256: digest(normalizedBytes),
      source_metrics: {
        ...metrics,
        object_count: 1,
        root_names: ['FixtureSource'],
        material_names: ['BB_Test'],
      },
      normalized_metrics: metrics,
      reimport_metrics: metrics,
      units: 'meters',
      pivot: 'bottom-center',
    })}\n`);
    return { code: 0, stdout: 'fixture pass', stderr: '' };
  };
  const normalized = await normalizeApprovedAsset({
    assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root,
    blenderPath: 'fixture-blender', runBlender: fakeBlender,
  });
  assert.equal(normalized.idempotent, false);
  assert.equal(digest(await readFile(normalized.destination)), digest(normalizedBytes));
  assert.equal((await normalizeApprovedAsset({
    assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root,
    blenderPath: 'fixture-blender', runBlender: fakeBlender,
  })).idempotent, true);

  const cachedReport = JSON.parse(await readFile(normalized.reportFile, 'utf8'));
  cachedReport.status = 'failed';
  await writeFile(normalized.reportFile, `${JSON.stringify(cachedReport)}\n`);
  await assert.rejects(() => normalizeApprovedAsset({
    assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root,
    blenderPath: 'fixture-blender', runBlender: fakeBlender,
  }), /existing normalization output is incomplete or invalid/);
});

test('normalization rejects a promoted manifest with the wrong asset identity', async t => {
  const bytes = makeGlb();
  const files = await fixture(t, bytes);
  const intake = await intakeAsset(files);
  await approveAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, approvedBy: 'reviewer', root: files.root });
  const promoted = await promoteAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root });
  const manifest = JSON.parse(await readFile(promoted.manifestFile, 'utf8'));
  manifest.assetId = 'different_asset';
  await writeFile(promoted.manifestFile, `${JSON.stringify(manifest)}\n`);
  await assert.rejects(() => normalizeApprovedAsset({
    assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root,
    blenderPath: 'fixture-blender', runBlender: async () => { throw new Error('must not run'); },
  }), /approved asset or manifest does not match/);
});

test('normalization preserves Blender rejection diagnostics and removes staging output', async t => {
  const bytes = makeGlb();
  const files = await fixture(t, bytes);
  const intake = await intakeAsset(files);
  await approveAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, approvedBy: 'reviewer', root: files.root });
  await promoteAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root });
  await assert.rejects(() => normalizeApprovedAsset({
    assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root,
    blenderPath: 'fixture-blender',
    runBlender: async () => ({ code: 0, stdout: '', stderr: 'NORMALIZE FAIL RuntimeError: asset contains an armature\n' }),
  }), /NORMALIZE FAIL RuntimeError: asset contains an armature/);
  await assert.rejects(() => stat(path.join(files.root, 'normalized', 'jungle_fern', intake.report.inputSha256)), /ENOENT/);
});

test('normalization rejects unchanged output paired with a fabricated minimal report', async t => {
  const bytes = makeGlb();
  const files = await fixture(t, bytes);
  const intake = await intakeAsset(files);
  await approveAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, approvedBy: 'reviewer', root: files.root });
  await promoteAsset({ assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root });
  await assert.rejects(() => normalizeApprovedAsset({
    assetId: 'jungle_fern', inputSha256: intake.report.inputSha256, root: files.root,
    blenderPath: 'fixture-blender',
    runBlender: async (_executable, args) => {
      const value = name => args[args.indexOf(name) + 1];
      await writeFile(value('--output'), bytes);
      await writeFile(value('--blend'), Buffer.alloc(64, 1));
      await writeFile(value('--report'), `${JSON.stringify({
        schema: 'brainbite.blender.normalization-report.v1',
        status: 'passed',
        asset_id: 'jungle_fern',
        source_sha256: digest(bytes),
        output_sha256: digest(bytes),
      })}\n`);
      return { code: 0, stdout: 'fixture pass', stderr: '' };
    },
  }), /report contract is incomplete/);
  await assert.rejects(() => stat(path.join(files.root, 'normalized', 'jungle_fern', intake.report.inputSha256)), /ENOENT/);
});
