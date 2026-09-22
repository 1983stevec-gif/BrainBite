import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  REQUEST_SCHEMA,
  approveAsset,
  inspectGlb,
  intakeAsset,
  normalizeApprovedAsset,
  promoteAsset,
} from '../scripts/intake-glb.mjs';

const blenderPath = process.env.BRAINBITE_BLENDER;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function rewriteGlbJson(input, mutate) {
  const jsonLength = input.readUInt32LE(12);
  const gltf = JSON.parse(input.subarray(20, 20 + jsonLength).toString('utf8').replace(/[\u0000 ]+$/u, ''));
  mutate(gltf);
  let json = Buffer.from(JSON.stringify(gltf));
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const tail = input.subarray(20 + jsonLength);
  const header = Buffer.from(input.subarray(0, 12));
  header.writeUInt32LE(12 + jsonHeader.length + json.length + tail.length, 8);
  return Buffer.concat([header, jsonHeader, json, tail]);
}

async function stageApprovedFixture({ workspace, fixture, inputBytes, assetId, budgets, expectedStatus = 'accepted' }) {
  await mkdir(workspace, { recursive: true });
  const inputPath = inputBytes
    ? path.join(workspace, `${assetId}.candidate.glb`)
    : new URL(`../assets/generated/blender/glb/${fixture}`, import.meta.url);
  if (inputBytes) await writeFile(inputPath, inputBytes);
  const input = inputBytes ?? await readFile(inputPath);
  const requestPath = path.join(workspace, `${assetId}.request.json`);
  const root = path.join(workspace, 'intake');
  const request = {
    schema: REQUEST_SCHEMA,
    assetId,
    displayName: `Integration Fixture: ${assetId}`,
    expectedSha256: sha256(input),
    source: {
      vendor: 'BrainBite repository',
      engine: 'Blender starter kit 1.2.0',
      taskId: `integration-${assetId}`,
      acquiredAt: '2026-09-12T12:00:00Z',
      prompt: 'Original repository-authored normalization integration fixture.',
      inputRights: 'Original BrainBite production asset built by this repository.',
      containsChildData: false,
    },
    license: {
      commercialUseConfirmed: true,
      redistributionAllowed: true,
      termsUrl: 'https://brainbite.example/original-asset-policy',
      termsCapturedAt: '2026-09-12T12:00:00Z',
      attribution: '',
    },
    budgets,
  };
  await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`);
  const intake = await intakeAsset({ inputPath, requestPath, root });
  assert.equal(intake.report.status, expectedStatus);
  if (expectedStatus !== 'accepted') return { inputPath, request, requestPath, root, intake };
  await approveAsset({ assetId, inputSha256: request.expectedSha256, approvedBy: 'integration test', root });
  await promoteAsset({ assetId, inputSha256: request.expectedSha256, root });
  return { inputPath, request, requestPath, root };
}

test('approved repository fixture completes the real Blender normalization boundary', {
  skip: blenderPath ? false : 'Set BRAINBITE_BLENDER to run the Blender integration test.',
  timeout: 120000,
}, async t => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'brainbite-blender-normalize-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const { inputPath, request, root } = await stageApprovedFixture({
    workspace,
    fixture: 'brainbite_portal.glb',
    assetId: 'portal_pipeline_fixture',
    budgets: {
      maxBytes: 2 * 1024 * 1024,
      maxTriangles: 20000,
      maxMaterials: 10,
      maxTextures: 4,
      maxDimension: 10,
    },
  });
  const normalized = await normalizeApprovedAsset({
    assetId: request.assetId,
    inputSha256: request.expectedSha256,
    root,
    blenderPath,
  });
  const output = await readFile(normalized.destination);
  const inspection = inspectGlb(output, request.budgets);
  assert.equal(inspection.valid, true);
  assert.equal(normalized.report.status, 'passed');
  assert.equal(normalized.report.source_sha256, request.expectedSha256);
  assert.equal(normalized.report.output_sha256, sha256(output));
  assert.deepEqual(normalized.report.normalized_metrics.bounds_min, normalized.report.reimport_metrics.bounds_min);
  assert.deepEqual(normalized.report.normalized_metrics.bounds_max, normalized.report.reimport_metrics.bounds_max);
  const [minX, minY, minZ] = normalized.report.reimport_metrics.bounds_min;
  const [maxX, maxY] = normalized.report.reimport_metrics.bounds_max;
  assert.ok(Math.abs((minX + maxX) * 0.5) <= 1e-5);
  assert.ok(Math.abs((minY + maxY) * 0.5) <= 1e-5);
  assert.ok(Math.abs(minZ) <= 1e-5);
  assert.equal((await normalizeApprovedAsset({
    assetId: request.assetId,
    inputSha256: request.expectedSha256,
    root,
    blenderPath,
  })).idempotent, true);

  const secondWorkspace = path.join(workspace, 'second-pass');
  const secondRequestPath = path.join(secondWorkspace, 'portal.request.json');
  const secondRoot = path.join(secondWorkspace, 'intake');
  await mkdir(secondWorkspace, { recursive: true });
  await writeFile(secondRequestPath, `${JSON.stringify({
    ...request,
    expectedSha256: sha256(output),
    source: { ...request.source, taskId: 'normalized-second-pass', prompt: 'Second-pass idempotence fixture.' },
  }, null, 2)}\n`);
  const secondIntake = await intakeAsset({ inputPath: normalized.destination, requestPath: secondRequestPath, root: secondRoot });
  await approveAsset({ assetId: request.assetId, inputSha256: secondIntake.report.inputSha256, approvedBy: 'integration test', root: secondRoot });
  await promoteAsset({ assetId: request.assetId, inputSha256: secondIntake.report.inputSha256, root: secondRoot });
  const second = await normalizeApprovedAsset({ assetId: request.assetId, inputSha256: secondIntake.report.inputSha256, root: secondRoot, blenderPath });
  assert.deepEqual(second.report.reimport_metrics.root_names, normalized.report.reimport_metrics.root_names);
  assert.deepEqual(second.report.reimport_metrics.material_names, normalized.report.reimport_metrics.material_names);
  assert.deepEqual(second.report.reimport_metrics.bounds_min, normalized.report.reimport_metrics.bounds_min);
  assert.deepEqual(second.report.reimport_metrics.bounds_max, normalized.report.reimport_metrics.bounds_max);

  const adversarialInput = rewriteGlbJson(output, gltf => {
    const siblingIndex = gltf.nodes.length;
    gltf.nodes.push({ name: 'InjectedSiblingRoot', mesh: 0 });
    gltf.scenes[gltf.scene ?? 0].nodes.push(siblingIndex);
    gltf.materials[0].name = 'Collision.Name';
    gltf.materials[1].name = 'Collision_Name';
  });
  const adversarialWorkspace = await mkdtemp(path.join(tmpdir(), 'bb-adv-'));
  t.after(() => rm(adversarialWorkspace, { recursive: true, force: true }));
  const adversarialRoot = path.join(adversarialWorkspace, 'intake');
  const adversarialRequest = await stageApprovedFixture({
    workspace: adversarialWorkspace,
    inputBytes: adversarialInput,
    assetId: request.assetId,
    budgets: request.budgets,
  });
  const adversarial = await normalizeApprovedAsset({
    assetId: request.assetId,
    inputSha256: adversarialRequest.request.expectedSha256,
    root: adversarialRoot,
    blenderPath,
  });
  assert.equal(adversarial.report.normalized_metrics.mesh_count, adversarial.report.source_metrics.mesh_count);
  assert.equal(adversarial.report.normalized_metrics.object_count, adversarial.report.source_metrics.object_count);
  assert.equal(
    new Set(adversarial.report.reimport_metrics.material_names).size,
    adversarial.report.reimport_metrics.material_names.length,
  );

  const stabilityWorkspace = await mkdtemp(path.join(tmpdir(), 'bb-stable-'));
  t.after(() => rm(stabilityWorkspace, { recursive: true, force: true }));
  const stabilityRequest = await stageApprovedFixture({
    workspace: stabilityWorkspace,
    inputBytes: await readFile(adversarial.destination),
    assetId: request.assetId,
    budgets: request.budgets,
  });
  const stability = await normalizeApprovedAsset({
    assetId: request.assetId,
    inputSha256: stabilityRequest.request.expectedSha256,
    root: stabilityRequest.root,
    blenderPath,
  });
  assert.deepEqual(stability.report.reimport_metrics.material_names, adversarial.report.reimport_metrics.material_names);
  assert.equal(stability.report.reimport_metrics.mesh_count, adversarial.report.reimport_metrics.mesh_count);
});

test('animated mascot with degenerate source geometry is quarantined before Blender', {
  skip: blenderPath ? false : 'Set BRAINBITE_BLENDER to run the Blender integration test.',
  timeout: 120000,
}, async t => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'brainbite-blender-rig-reject-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const { intake, root } = await stageApprovedFixture({
    workspace,
    fixture: 'brainbite_mascot.glb',
    assetId: 'mascot_static_lane_reject',
    budgets: {
      maxBytes: 3 * 1024 * 1024,
      maxTriangles: 100000,
      maxMaterials: 20,
      maxTextures: 10,
      maxDimension: 10,
    },
    expectedStatus: 'rejected',
  });
  assert.match(intake.report.reasons.join('\n'), /degenerate triangles/);
  await assert.rejects(() => stat(path.join(root, 'approved', 'mascot_static_lane_reject.glb')), /ENOENT/);
});

test('real Blender boundary rejects geometry outside the declared dimension budget', {
  skip: blenderPath ? false : 'Set BRAINBITE_BLENDER to run the Blender integration test.',
  timeout: 120000,
}, async t => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'brainbite-blender-budget-reject-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const { request, root } = await stageApprovedFixture({
    workspace,
    fixture: 'brainbite_portal.glb',
    assetId: 'portal_dimension_reject',
    budgets: {
      maxBytes: 2 * 1024 * 1024,
      maxTriangles: 20000,
      maxMaterials: 10,
      maxTextures: 4,
      maxDimension: 0.25,
    },
  });
  await assert.rejects(
    normalizeApprovedAsset({ assetId: request.assetId, inputSha256: request.expectedSha256, root, blenderPath }),
    /maximum dimension outside budget/,
  );
});
