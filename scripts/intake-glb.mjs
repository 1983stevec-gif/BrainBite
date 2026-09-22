#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import {
  copyFile,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REQUEST_SCHEMA = 'brainbite.asset-intake.request.v1';
export const REPORT_SCHEMA = 'brainbite.asset-intake.report.v1';
export const APPROVAL_SCHEMA = 'brainbite.asset-intake.approval.v1';
export const PROMOTION_SCHEMA = 'brainbite.asset-promotion.v1';
export const NORMALIZATION_SCHEMA = 'brainbite.blender.normalization-report.v1';
export const HARD_MAX_BYTES = 64 * 1024 * 1024;
export const HARD_MAX_TRIANGLES = 1_000_000;

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const SAFE_ID = /^[a-z0-9][a-z0-9_-]{1,63}$/;
const SAFE_SHA = /^[a-f0-9]{64}$/;
const SUPPORTED_EXTENSIONS = new Set([
  'KHR_materials_emissive_strength',
  'KHR_materials_unlit',
  'KHR_texture_transform',
]);
const COMPONENT_LAYOUT = new Map([
  [5120, { bytes: 1, read: (buffer, offset) => buffer.readInt8(offset) }],
  [5121, { bytes: 1, read: (buffer, offset) => buffer.readUInt8(offset) }],
  [5122, { bytes: 2, read: (buffer, offset) => buffer.readInt16LE(offset) }],
  [5123, { bytes: 2, read: (buffer, offset) => buffer.readUInt16LE(offset) }],
  [5125, { bytes: 4, read: (buffer, offset) => buffer.readUInt32LE(offset) }],
  [5126, { bytes: 4, read: (buffer, offset) => buffer.readFloatLE(offset) }],
]);
const TYPE_COMPONENTS = new Map([['SCALAR', 1], ['VEC2', 2], ['VEC3', 3], ['VEC4', 4], ['MAT2', 4], ['MAT3', 9], ['MAT4', 16]]);

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isNonEmpty = value => typeof value === 'string' && value.trim().length > 0;
const isSafeId = value => typeof value === 'string' && SAFE_ID.test(value);
const isSafeHash = value => typeof value === 'string' && SAFE_SHA.test(value);
const isDate = value => isNonEmpty(value) && !Number.isNaN(Date.parse(value));
const isHttpsUrl = value => {
  if (!isNonEmpty(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

function multiplyMatrix(left, right) {
  const result = Array(16).fill(0);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      for (let inner = 0; inner < 4; inner += 1) result[column * 4 + row] += left[inner * 4 + row] * right[column * 4 + inner];
    }
  }
  return result;
}

function nodeMatrix(node) {
  if (node.matrix !== undefined) return Array.isArray(node.matrix) && node.matrix.length === 16 && node.matrix.every(Number.isFinite) ? node.matrix : null;
  const translation = node.translation ?? [0, 0, 0];
  const rotation = node.rotation ?? [0, 0, 0, 1];
  const scale = node.scale ?? [1, 1, 1];
  if (
    !Array.isArray(translation) || translation.length !== 3 || !translation.every(Number.isFinite)
    || !Array.isArray(rotation) || rotation.length !== 4 || !rotation.every(Number.isFinite)
    || !Array.isArray(scale) || scale.length !== 3 || !scale.every(Number.isFinite)
  ) return null;
  const [x, y, z, w] = rotation;
  const length = Math.hypot(x, y, z, w);
  if (length <= 1e-12) return null;
  const qx = x / length;
  const qy = y / length;
  const qz = z / length;
  const qw = w / length;
  const [sx, sy, sz] = scale;
  return [
    (1 - 2 * (qy * qy + qz * qz)) * sx, 2 * (qx * qy + qz * qw) * sx, 2 * (qx * qz - qy * qw) * sx, 0,
    2 * (qx * qy - qz * qw) * sy, (1 - 2 * (qx * qx + qz * qz)) * sy, 2 * (qy * qz + qx * qw) * sy, 0,
    2 * (qx * qz + qy * qw) * sz, 2 * (qy * qz - qx * qw) * sz, (1 - 2 * (qx * qx + qy * qy)) * sz, 0,
    translation[0], translation[1], translation[2], 1,
  ];
}

function transformPoint(matrix, point) {
  return [
    matrix[0] * point[0] + matrix[4] * point[1] + matrix[8] * point[2] + matrix[12],
    matrix[1] * point[0] + matrix[5] * point[1] + matrix[9] * point[2] + matrix[13],
    matrix[2] * point[0] + matrix[6] * point[1] + matrix[10] * point[2] + matrix[14],
  ];
}

function findForbiddenKey(value, trail = []) {
  if (!isObject(value) && !Array.isArray(value)) return null;
  for (const [key, nested] of Object.entries(value)) {
    const next = [...trail, key];
    if (/(api.?key|authorization|credential|password|secret|token)/i.test(key)) return next.join('.');
    const found = findForbiddenKey(nested, next);
    if (found) return found;
  }
  return null;
}

function pushIf(reasons, condition, message) {
  if (condition) reasons.push(message);
}

export function validateRequest(request, actualSha, actualBytes) {
  const reasons = [];
  if (!isObject(request)) return ['request must be a JSON object'];

  const forbidden = findForbiddenKey(request);
  pushIf(reasons, forbidden, `request contains forbidden credential-like field: ${forbidden}`);
  pushIf(reasons, request.schema !== REQUEST_SCHEMA, `schema must be ${REQUEST_SCHEMA}`);
  pushIf(reasons, !isSafeId(request.assetId), 'assetId must be a string using 2-64 lowercase letters, numbers, underscores, or hyphens');
  pushIf(reasons, !isNonEmpty(request.displayName), 'displayName is required');
  pushIf(reasons, !isSafeHash(request.expectedSha256), 'expectedSha256 must be a lowercase SHA-256 value');
  pushIf(reasons, request.expectedSha256 !== actualSha, 'expectedSha256 does not match the input file');

  const source = request.source;
  pushIf(reasons, !isObject(source), 'source provenance is required');
  if (isObject(source)) {
    pushIf(reasons, !isNonEmpty(source.vendor), 'source.vendor is required');
    pushIf(reasons, !isNonEmpty(source.engine), 'source.engine is required');
    pushIf(reasons, !isNonEmpty(source.taskId), 'source.taskId is required');
    pushIf(reasons, !isDate(source.acquiredAt), 'source.acquiredAt must be a valid date');
    pushIf(reasons, !isNonEmpty(source.prompt), 'source.prompt is required');
    pushIf(reasons, !isNonEmpty(source.inputRights), 'source.inputRights is required');
    pushIf(reasons, source.containsChildData !== false, 'source.containsChildData must be explicitly false');
  }

  const license = request.license;
  pushIf(reasons, !isObject(license), 'license evidence is required');
  if (isObject(license)) {
    pushIf(reasons, license.commercialUseConfirmed !== true, 'license.commercialUseConfirmed must be true');
    pushIf(reasons, license.redistributionAllowed !== true, 'license.redistributionAllowed must be true');
    pushIf(reasons, !isHttpsUrl(license.termsUrl), 'license.termsUrl must be an HTTPS URL');
    pushIf(reasons, !isDate(license.termsCapturedAt), 'license.termsCapturedAt must be a valid date');
    pushIf(reasons, typeof license.attribution !== 'string', 'license.attribution must be a string, even when empty');
  }

  const budgets = request.budgets;
  pushIf(reasons, !isObject(budgets), 'budgets are required');
  if (isObject(budgets)) {
    for (const field of ['maxBytes', 'maxTriangles', 'maxMaterials', 'maxTextures']) {
      pushIf(reasons, !Number.isSafeInteger(budgets[field]) || budgets[field] < 0, `budgets.${field} must be a non-negative integer`);
    }
    pushIf(reasons, typeof budgets.maxDimension !== 'number' || !Number.isFinite(budgets.maxDimension) || budgets.maxDimension <= 0, 'budgets.maxDimension must be a positive finite number');
    pushIf(reasons, budgets.maxBytes > HARD_MAX_BYTES, `budgets.maxBytes cannot exceed ${HARD_MAX_BYTES}`);
    pushIf(reasons, budgets.maxTriangles > HARD_MAX_TRIANGLES, `budgets.maxTriangles cannot exceed ${HARD_MAX_TRIANGLES}`);
    pushIf(reasons, actualBytes > budgets.maxBytes, `input exceeds budgets.maxBytes (${actualBytes} > ${budgets.maxBytes})`);
  }
  return reasons;
}

function inspectGlbUnchecked(bytes, budgets = {}) {
  const reasons = [];
  const metrics = {
    bytes: bytes.length,
    meshes: 0,
    nodes: 0,
    triangles: 0,
    materials: 0,
    textures: 0,
    images: 0,
    animations: 0,
    skins: 0,
  };
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length < 20) return { valid: false, reasons: ['GLB is shorter than the minimum header and JSON chunk'], metrics };
  if (bytes.length > HARD_MAX_BYTES) return { valid: false, reasons: [`GLB exceeds hard limit of ${HARD_MAX_BYTES} bytes`], metrics };
  pushIf(reasons, bytes.toString('ascii', 0, 4) !== 'glTF', 'invalid GLB magic');
  pushIf(reasons, bytes.readUInt32LE(4) !== 2, 'GLB version must be 2');
  pushIf(reasons, bytes.readUInt32LE(8) !== bytes.length, 'GLB declared length must equal file length');
  if (reasons.length) return { valid: false, reasons, metrics };

  let offset = 12;
  let jsonBytes = null;
  let binBytes = null;
  let chunkIndex = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) {
      reasons.push('truncated GLB chunk header');
      break;
    }
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    offset += 8;
    if (length % 4 !== 0) reasons.push(`chunk ${chunkIndex} length is not 4-byte aligned`);
    if (offset + length > bytes.length) {
      reasons.push(`chunk ${chunkIndex} exceeds the GLB boundary`);
      break;
    }
    const chunk = bytes.subarray(offset, offset + length);
    if (chunkIndex === 0 && type !== JSON_CHUNK) reasons.push('first GLB chunk must be JSON');
    if (type === JSON_CHUNK) {
      if (jsonBytes) reasons.push('GLB contains more than one JSON chunk');
      else jsonBytes = chunk;
    } else if (type === BIN_CHUNK) {
      if (binBytes) reasons.push('GLB contains more than one BIN chunk');
      else binBytes = chunk;
    } else {
      reasons.push(`unsupported GLB chunk type 0x${type.toString(16)}`);
    }
    offset += length;
    chunkIndex += 1;
  }
  if (offset !== bytes.length) reasons.push('GLB chunks do not consume the declared file length');
  if (!jsonBytes) reasons.push('GLB JSON chunk is missing');
  if (reasons.length) return { valid: false, reasons: [...new Set(reasons)], metrics };

  let gltf;
  try {
    const json = jsonBytes.toString('utf8').replace(/[\u0000 ]+$/u, '');
    gltf = JSON.parse(json);
  } catch {
    return { valid: false, reasons: ['GLB JSON chunk is not valid UTF-8 JSON'], metrics };
  }

  pushIf(reasons, gltf?.asset?.version !== '2.0', 'glTF asset.version must be 2.0');
  pushIf(reasons, !Array.isArray(gltf.scenes) || gltf.scenes.length === 0, 'glTF must contain at least one scene');
  pushIf(reasons, !Array.isArray(gltf.nodes) || gltf.nodes.length === 0, 'glTF must contain at least one node');
  pushIf(reasons, !Array.isArray(gltf.meshes) || gltf.meshes.length === 0, 'glTF must contain at least one mesh');

  const unsupported = [...new Set([...(gltf.extensionsUsed ?? []), ...(gltf.extensionsRequired ?? [])])]
    .filter(extension => !SUPPORTED_EXTENSIONS.has(extension));
  if (unsupported.length) reasons.push(`unsupported glTF extensions: ${unsupported.sort().join(', ')}`);

  const buffers = gltf.buffers ?? [];
  pushIf(reasons, buffers.length > 1, 'self-contained intake supports at most one GLB buffer');
  for (const buffer of buffers) {
    if ('uri' in buffer) reasons.push('external or embedded buffer URIs are not allowed');
    if (!Number.isSafeInteger(buffer.byteLength) || buffer.byteLength < 0) reasons.push('buffer.byteLength must be a non-negative integer');
    if (buffer.byteLength > (binBytes?.length ?? 0)) reasons.push('buffer.byteLength exceeds the BIN chunk');
  }
  for (const image of gltf.images ?? []) {
    if ('uri' in image) reasons.push('external or data image URIs are not allowed');
    if (!Number.isSafeInteger(image.bufferView)) reasons.push('images must reference an embedded bufferView');
  }
  for (const [index, view] of (gltf.bufferViews ?? []).entries()) {
    const start = view.byteOffset ?? 0;
    const length = view.byteLength;
    if (view.buffer !== 0 || !Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(length) || length < 0 || start + length > (binBytes?.length ?? 0)) {
      reasons.push(`bufferView ${index} exceeds the embedded BIN buffer`);
    }
  }

  const accessors = gltf.accessors ?? [];
  const views = gltf.bufferViews ?? [];
  const accessorLayouts = accessors.map((accessor, index) => {
    const component = COMPONENT_LAYOUT.get(accessor.componentType);
    const components = TYPE_COMPONENTS.get(accessor.type);
    const view = views[accessor.bufferView];
    if (!component || !components || !Number.isSafeInteger(accessor.count) || accessor.count < 0 || !view || accessor.sparse !== undefined) {
      reasons.push(`accessor ${index} has unsupported type, count, bufferView, or sparse data`);
      return null;
    }
    const accessorOffset = accessor.byteOffset ?? 0;
    const stride = view.byteStride ?? component.bytes * components;
    const elementBytes = component.bytes * components;
    const combinedOffset = (view.byteOffset ?? 0) + accessorOffset;
    const explicitStrideInvalid = view.byteStride !== undefined && (stride < 4 || stride % 4 !== 0);
    if (
      !Number.isSafeInteger(accessorOffset) || accessorOffset < 0 || combinedOffset % component.bytes !== 0
      || !Number.isSafeInteger(stride) || stride < elementBytes || stride > 252 || stride % component.bytes !== 0
      || explicitStrideInvalid
      || (accessor.count > 0 && accessorOffset + stride * (accessor.count - 1) + elementBytes > view.byteLength)
    ) {
      reasons.push(`accessor ${index} exceeds its bufferView or has invalid alignment/stride`);
      return null;
    }
    return { accessor, component, components, stride, base: (view.byteOffset ?? 0) + accessorOffset };
  });
  const decoded = new Map();
  const decodeAccessor = index => {
    if (decoded.has(index)) return decoded.get(index);
    const layout = accessorLayouts[index];
    if (!layout || !binBytes) return null;
    const reader = {
      length: layout.accessor.count,
      get(item) {
        if (!Number.isSafeInteger(item) || item < 0 || item >= layout.accessor.count) return undefined;
      const entry = [];
      const base = layout.base + item * layout.stride;
      for (let component = 0; component < layout.components; component += 1) {
        entry.push(layout.component.read(binBytes, base + component * layout.component.bytes));
      }
        return layout.components === 1 ? entry[0] : entry;
      },
    };
    decoded.set(index, reader);
    return reader;
  };
  const primitivePositions = new Map();
  const geometry = {
    boundsMin: null,
    boundsMax: null,
    degenerateTriangles: 0,
    nonFiniteValues: 0,
    materialNames: (gltf.materials ?? []).map(material => material.name ?? '').sort(),
  };
  for (const [meshIndex, mesh] of (gltf.meshes ?? []).entries()) {
    for (const [primitiveIndex, primitive] of (mesh.primitives ?? []).entries()) {
      if ((primitive.mode ?? 4) !== 4) {
        reasons.push('only TRIANGLES mesh primitives are supported');
        continue;
      }
      const positionIndex = primitive.attributes?.POSITION;
      const positionLayout = accessorLayouts[positionIndex];
      if (!Number.isSafeInteger(positionIndex) || !positionLayout || positionLayout.accessor.componentType !== 5126 || positionLayout.accessor.type !== 'VEC3' || positionLayout.accessor.normalized === true) {
        reasons.push(`mesh ${meshIndex} primitive ${primitiveIndex} requires a FLOAT VEC3 POSITION accessor`);
        continue;
      }
      const positions = decodeAccessor(positionIndex);
      if (!positions) continue;
      const indexLayout = primitive.indices === undefined ? null : accessorLayouts[primitive.indices];
      const indexCount = primitive.indices === undefined ? positions.length : indexLayout?.accessor.count;
      if (
        !Number.isSafeInteger(indexCount)
        || (indexLayout && (indexLayout.accessor.type !== 'SCALAR' || ![5121, 5123, 5125].includes(indexLayout.accessor.componentType)))
        || indexCount % 3 !== 0
      ) {
        reasons.push(`mesh ${meshIndex} primitive ${primitiveIndex} has invalid triangle indices`);
        continue;
      }
      const primitiveTriangles = indexCount / 3;
      metrics.triangles += primitiveTriangles;
      const triangleScanLimit = Number.isSafeInteger(budgets.maxTriangles)
        ? Math.min(budgets.maxTriangles, HARD_MAX_TRIANGLES)
        : HARD_MAX_TRIANGLES;
      if (metrics.triangles > triangleScanLimit) {
        reasons.push(`triangles exceed maxTriangles (${metrics.triangles} > ${triangleScanLimit})`);
        continue;
      }
      const maxPositionReads = triangleScanLimit * 3;
      if (positions.length > maxPositionReads) {
        reasons.push(`mesh ${meshIndex} primitive ${primitiveIndex} exceeds the vertex scan budget`);
        continue;
      }
      for (let index = 0; index < positions.length; index += 1) {
        geometry.nonFiniteValues += positions.get(index).filter(value => !Number.isFinite(value)).length;
      }
      const indices = primitive.indices === undefined
        ? { length: positions.length, get: index => index }
        : decodeAccessor(primitive.indices);
      if (!indices) {
        reasons.push(`mesh ${meshIndex} primitive ${primitiveIndex} has invalid triangle indices`);
        continue;
      }
      let invalidIndex = false;
      for (let index = 0; index < indices.length; index += 1) {
        const value = indices.get(index);
        if (!Number.isSafeInteger(value) || value < 0 || value >= positions.length) {
          invalidIndex = true;
          break;
        }
      }
      if (invalidIndex) {
        reasons.push(`mesh ${meshIndex} primitive ${primitiveIndex} references an out-of-range vertex`);
        continue;
      }
      if (primitive.material !== undefined && (!Number.isSafeInteger(primitive.material) || primitive.material < 0 || primitive.material >= (gltf.materials?.length ?? 0))) {
        reasons.push(`mesh ${meshIndex} primitive ${primitiveIndex} references an invalid material`);
      }
      for (let offset = 0; offset < indices.length; offset += 3) {
        const [a, b, c] = [positions.get(indices.get(offset)), positions.get(indices.get(offset + 1)), positions.get(indices.get(offset + 2))];
        const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
        if (cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2 <= 4e-24) geometry.degenerateTriangles += 1;
      }
      const entries = primitivePositions.get(meshIndex) ?? [];
      entries.push(positions);
      primitivePositions.set(meshIndex, entries);
    }
  }
  if (geometry.nonFiniteValues) reasons.push(`geometry contains ${geometry.nonFiniteValues} non-finite position values`);
  if (geometry.degenerateTriangles) reasons.push(`geometry contains ${geometry.degenerateTriangles} degenerate triangles`);

  const worldBoundsMin = [Infinity, Infinity, Infinity];
  const worldBoundsMax = [-Infinity, -Infinity, -Infinity];
  let worldPointCount = 0;
  const maxScenePointVisits = (Number.isSafeInteger(budgets.maxTriangles)
    ? Math.min(budgets.maxTriangles, HARD_MAX_TRIANGLES)
    : HARD_MAX_TRIANGLES) * 3;
  let scenePointBudgetExceeded = false;
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const visiting = new Set();
  const visited = new Set();
  const visitNode = (index, parentMatrix) => {
    if (!Number.isSafeInteger(index) || index < 0 || index >= (gltf.nodes?.length ?? 0)) {
      reasons.push('scene hierarchy references an invalid node');
      return;
    }
    if (visiting.has(index)) {
      reasons.push('scene hierarchy contains a cycle');
      return;
    }
    if (visited.has(index)) reasons.push('scene hierarchy references one node from multiple parents');
    visiting.add(index);
    visited.add(index);
    const node = gltf.nodes[index];
    const local = nodeMatrix(node);
    if (!local) {
      reasons.push(`node ${index} has an invalid transform`);
    } else {
      const world = multiplyMatrix(parentMatrix, local);
      if (node.mesh !== undefined) {
        if (!Number.isSafeInteger(node.mesh) || !primitivePositions.has(node.mesh)) reasons.push(`node ${index} references an invalid mesh`);
        else for (const positions of primitivePositions.get(node.mesh)) {
          if (worldPointCount + positions.length > maxScenePointVisits) {
            scenePointBudgetExceeded = true;
            break;
          }
          for (let pointIndex = 0; pointIndex < positions.length; pointIndex += 1) {
          const transformed = transformPoint(world, positions.get(pointIndex));
          for (let axis = 0; axis < 3; axis += 1) {
            worldBoundsMin[axis] = Math.min(worldBoundsMin[axis], transformed[axis]);
            worldBoundsMax[axis] = Math.max(worldBoundsMax[axis], transformed[axis]);
          }
          worldPointCount += 1;
        }
        }
      }
      for (const child of node.children ?? []) visitNode(child, world);
    }
    visiting.delete(index);
  };
  for (const root of gltf.scenes?.[gltf.scene ?? 0]?.nodes ?? []) visitNode(root, identity);
  if (scenePointBudgetExceeded) reasons.push(`scene instances exceed the ${maxScenePointVisits}-point geometry scan budget`);
  if (worldPointCount && [...worldBoundsMin, ...worldBoundsMax].every(Number.isFinite)) {
    geometry.boundsMin = worldBoundsMin;
    geometry.boundsMax = worldBoundsMax;
  } else if (!worldPointCount) {
    reasons.push('scene contains no reachable mesh positions');
  }

  Object.assign(metrics, {
    meshes: gltf.meshes?.length ?? 0,
    nodes: gltf.nodes?.length ?? 0,
    materials: gltf.materials?.length ?? 0,
    textures: gltf.textures?.length ?? 0,
    images: gltf.images?.length ?? 0,
    animations: gltf.animations?.length ?? 0,
    skins: gltf.skins?.length ?? 0,
  });
  for (const [field, metric] of [['maxTriangles', 'triangles'], ['maxMaterials', 'materials'], ['maxTextures', 'textures'], ['maxTextures', 'images']]) {
    if (Number.isSafeInteger(budgets[field]) && metrics[metric] > budgets[field]) {
      reasons.push(`${metric} exceed ${field} (${metrics[metric]} > ${budgets[field]})`);
    }
  }
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)], metrics, geometry, gltf };
}

export function inspectGlb(bytes, budgets = {}) {
  try {
    return inspectGlbUnchecked(bytes, budgets);
  } catch (error) {
    const length = Buffer.isBuffer(bytes) ? bytes.length : Buffer.from(bytes ?? []).length;
    return {
      valid: false,
      reasons: [`malformed nested glTF structure: ${error instanceof Error ? error.message : String(error)}`],
      metrics: {
        bytes: length,
        meshes: 0,
        nodes: 0,
        triangles: 0,
        materials: 0,
        textures: 0,
        images: 0,
        animations: 0,
        skins: 0,
      },
      geometry: {
        boundsMin: null,
        boundsMax: null,
        degenerateTriangles: 0,
        nonFiniteValues: 0,
        materialNames: [],
      },
      gltf: null,
    };
  }
}

function safeId(value, label) {
  if (!isSafeId(value)) throw new Error(`${label} is not a safe asset identifier`);
  return value;
}

function safeHash(value) {
  if (!isSafeHash(value)) throw new Error('sha256 is not a lowercase SHA-256 value');
  return value;
}

function within(root, ...parts) {
  const base = path.resolve(root);
  const target = path.resolve(base, ...parts);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) throw new Error('asset path escaped the intake root');
  return target;
}

async function atomicWriteOnce(target, contents) {
  await mkdir(path.dirname(target), { recursive: true });
  try {
    const existing = await readFile(target);
    if (!existing.equals(Buffer.from(contents))) throw new Error(`refusing to overwrite different record: ${target}`);
    return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporary, contents, { flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function intakeAsset({ inputPath, requestPath, root }) {
  const inputStat = await stat(inputPath);
  if (!inputStat.isFile()) throw new Error('input must be a regular file');
  if (inputStat.size > HARD_MAX_BYTES) throw new Error(`input exceeds hard limit of ${HARD_MAX_BYTES} bytes`);
  const bytes = await readFile(inputPath);
  const inputSha256 = sha256(bytes);
  let request;
  let requestError = null;
  try {
    request = await readJson(requestPath);
  } catch (error) {
    requestError = `request JSON could not be read: ${error.message}`;
    request = null;
  }
  const requestReasons = requestError ? [requestError] : validateRequest(request, inputSha256, bytes.length);
  const inspection = inspectGlb(bytes, isObject(request?.budgets) ? request.budgets : {});
  const reasons = [...new Set([...requestReasons, ...inspection.reasons])];
  const accepted = reasons.length === 0;
  const assetId = isSafeId(request?.assetId) ? request.assetId : '_rejected';
  const quarantineFile = within(root, 'quarantine', assetId, `${inputSha256}.glb`);
  const reportFile = within(root, 'reports', assetId, `${inputSha256}.json`);
  await mkdir(path.dirname(quarantineFile), { recursive: true });
  try {
    await copyFile(inputPath, quarantineFile, 1);
  } catch (error) {
    if (error.code !== 'EEXIST' || sha256(await readFile(quarantineFile)) !== inputSha256) throw error;
  }
  const report = {
    schema: REPORT_SCHEMA,
    assetId,
    inputSha256,
    lifecycle: 'QUARANTINED',
    status: accepted ? 'accepted' : 'rejected',
    reasons,
    metrics: inspection.metrics,
    request,
    quarantineFile: path.relative(root, quarantineFile).split(path.sep).join('/'),
  };
  await atomicWriteOnce(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  return { report, reportFile, quarantineFile };
}

export async function approveAsset({ assetId, inputSha256, approvedBy, root }) {
  safeId(assetId, 'assetId');
  safeHash(inputSha256);
  if (!isNonEmpty(approvedBy) || approvedBy.length > 100) throw new Error('approvedBy must be 1-100 characters');
  const reportFile = within(root, 'reports', assetId, `${inputSha256}.json`);
  const report = await readJson(reportFile);
  if (report.schema !== REPORT_SCHEMA || report.status !== 'accepted' || report.inputSha256 !== inputSha256) {
    throw new Error('only a matching accepted intake report can be approved');
  }
  const approval = {
    schema: APPROVAL_SCHEMA,
    assetId,
    inputSha256,
    approvedBy: approvedBy.trim(),
    approvedAt: new Date().toISOString(),
  };
  const approvalFile = within(root, 'approvals', assetId, `${inputSha256}.json`);
  await atomicWriteOnce(approvalFile, `${JSON.stringify(approval, null, 2)}\n`);
  return { approval, approvalFile };
}

async function replaceWithRollback({ staged, destination, backup }) {
  let hadDestination = false;
  try {
    await stat(destination);
    hadDestination = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (hadDestination) {
    await mkdir(path.dirname(backup), { recursive: true });
    await rename(destination, backup);
  }
  try {
    await rename(staged, destination);
  } catch (error) {
    if (hadDestination) await rename(backup, destination);
    throw error;
  }
  return { hadDestination, backup };
}

export async function promoteAsset({ assetId, inputSha256, root, testHooks = {} }) {
  safeId(assetId, 'assetId');
  safeHash(inputSha256);
  const reportFile = within(root, 'reports', assetId, `${inputSha256}.json`);
  const approvalFile = within(root, 'approvals', assetId, `${inputSha256}.json`);
  const sourceFile = within(root, 'quarantine', assetId, `${inputSha256}.glb`);
  const [report, approval, source] = await Promise.all([readJson(reportFile), readJson(approvalFile), readFile(sourceFile)]);
  if (report.status !== 'accepted' || report.inputSha256 !== inputSha256) throw new Error('intake report is not accepted');
  if (approval.schema !== APPROVAL_SCHEMA || approval.inputSha256 !== inputSha256) throw new Error('matching local approval is required');
  if (sha256(source) !== inputSha256) throw new Error('quarantined asset hash changed after intake');

  const destination = within(root, 'approved', `${assetId}.glb`);
  const manifestFile = within(root, 'approved-manifests', `${assetId}.json`);
  try {
    const current = await readFile(destination);
    const manifest = await readJson(manifestFile);
    if (sha256(current) === inputSha256 && manifest.inputSha256 === inputSha256) return { destination, manifestFile, manifest, idempotent: true };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const stagingRoot = within(root, '.staging', `${assetId}-${inputSha256}-${process.pid}-${Date.now()}`);
  const stagedAsset = path.join(stagingRoot, `${assetId}.glb`);
  const stagedManifest = path.join(stagingRoot, `${assetId}.json`);
  const rollbackRoot = within(root, '.rollback', assetId, inputSha256);
  const assetBackup = path.join(rollbackRoot, `${assetId}.glb`);
  const manifestBackup = path.join(rollbackRoot, `${assetId}.json`);
  const manifest = {
    schema: PROMOTION_SCHEMA,
    assetId,
    inputSha256,
    lifecycle: 'PROMOTED',
    displayName: report.request.displayName,
    source: report.request.source,
    license: report.request.license,
    budgets: report.request.budgets,
    metrics: report.metrics,
    approval,
  };
  await mkdir(stagingRoot, { recursive: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await mkdir(path.dirname(manifestFile), { recursive: true });
  await copyFile(sourceFile, stagedAsset);
  await writeFile(stagedManifest, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });

  let assetCommit = null;
  let manifestCommit = null;
  try {
    assetCommit = await replaceWithRollback({ staged: stagedAsset, destination, backup: assetBackup });
    await testHooks.afterAssetCommit?.();
    manifestCommit = await replaceWithRollback({ staged: stagedManifest, destination: manifestFile, backup: manifestBackup });
    await testHooks.afterManifestCommit?.();
    return { destination, manifestFile, manifest, idempotent: false };
  } catch (error) {
    await rm(destination, { force: true }).catch(() => {});
    if (assetCommit?.hadDestination) await rename(assetBackup, destination).catch(() => {});
    if (manifestCommit) {
      await rm(manifestFile, { force: true }).catch(() => {});
      if (manifestCommit.hadDestination) await rename(manifestBackup, manifestFile).catch(() => {});
    }
    throw error;
  } finally {
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
  }
}

function runProcess(executable, args, { timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, shell: false });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;
    const append = (current, chunk) => `${current}${chunk}`.slice(-1024 * 1024);
    child.stdout.on('data', chunk => { stdout = append(stdout, chunk); });
    child.stderr.on('data', chunk => { stderr = append(stderr, chunk); });
    const timer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.on('error', error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`Blender normalization timed out after ${timeoutMs}ms: ${(stderr || stdout).trim().slice(-4000)}`));
        return;
      }
      if (code === 0) resolve({ code, stdout, stderr });
      else reject(new Error(`Blender normalization exited ${code}: ${(stderr || stdout).trim().slice(-4000)}`));
    });
  });
}

function isFiniteVector(value) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
}

const NORMALIZATION_COUNT_FIELDS = [
  'object_count', 'mesh_count', 'triangle_count', 'material_count', 'texture_count',
  'armature_count', 'animation_count', 'singular_transform_count', 'sheared_transform_count',
  'negative_determinant_count', 'non_unit_scale_count', 'non_finite_material_value_count',
  'degenerate_triangle_count', 'non_finite_vertex_count', 'missing_material_slot_count',
];

function validateMetricShape(metrics, label) {
  if (!isObject(metrics)) throw new Error(`${label} metrics are missing`);
  if (NORMALIZATION_COUNT_FIELDS.some(field => !Number.isSafeInteger(metrics[field]) || metrics[field] < 0)) {
    throw new Error(`${label} metrics contain an invalid count`);
  }
  if (!isFiniteVector(metrics.bounds_min) || !isFiniteVector(metrics.bounds_max) || !isFiniteVector(metrics.dimensions)) {
    throw new Error(`${label} metrics contain invalid bounds`);
  }
  if (!Number.isFinite(metrics.max_dimension) || metrics.max_dimension <= 0) {
    throw new Error(`${label} maximum dimension is invalid`);
  }
  for (const field of ['material_names', 'texture_names', 'root_names']) {
    if (!Array.isArray(metrics[field]) || metrics[field].some(value => !isNonEmpty(value))) {
      throw new Error(`${label} metrics contain invalid ${field}`);
    }
  }
  if (metrics.material_names.length !== metrics.material_count || metrics.texture_names.length !== metrics.texture_count) {
    throw new Error(`${label} metric names do not match their declared counts`);
  }
}

function validateNormalizationMetrics(metrics, label, assetId, budgets) {
  validateMetricShape(metrics, label);
  if (metrics.max_dimension > budgets.maxDimension) throw new Error(`${label} maximum dimension is outside budget`);
  const rootName = `BrainBite_${assetId}_ROOT`;
  if (metrics.root_names.length !== 1 || metrics.root_names[0] !== rootName) {
    throw new Error(`${label} metrics do not identify the canonical root`);
  }
  const zeroFields = NORMALIZATION_COUNT_FIELDS.slice(5);
  if (zeroFields.some(field => metrics[field] !== 0)) throw new Error(`${label} metrics contain rejected static-asset state`);
  if (new Set(metrics.material_names).size !== metrics.material_names.length) throw new Error(`${label} material names are not unique`);
  const materialPrefix = new RegExp(`^BB_${assetId}_[0-9]{3}_`);
  if (metrics.material_names.some(name => !materialPrefix.test(name))) throw new Error(`${label} material names are not canonical`);
  const [minX, minY, minZ] = metrics.bounds_min;
  const [maxX, maxY] = metrics.bounds_max;
  if (Math.abs((minX + maxX) * 0.5) > 1e-5 || Math.abs((minY + maxY) * 0.5) > 1e-5 || Math.abs(minZ) > 1e-5) {
    throw new Error(`${label} metrics do not prove a bottom-center pivot`);
  }
}

function reachableNodeIndices(nodes, rootIndex) {
  const reachable = new Set();
  const pending = [rootIndex];
  while (pending.length) {
    const index = pending.pop();
    if (!Number.isSafeInteger(index) || index < 0 || index >= nodes.length) throw new Error('normalized GLB contains an invalid child node');
    if (reachable.has(index)) continue;
    reachable.add(index);
    pending.push(...(nodes[index].children ?? []));
  }
  return reachable;
}

function validateNormalizedArtifacts({ output, report, blendStat, assetId, inputSha256, budgets, sourceInspection }) {
  const inspection = inspectGlb(output, budgets);
  const outputSha256 = sha256(output);
  if (!inspection.valid) throw new Error(`normalized GLB failed strict validation: ${inspection.reasons.join('; ')}`);
  if (output.length > budgets.maxBytes) throw new Error(`normalized GLB exceeds maxBytes (${output.length} > ${budgets.maxBytes})`);
  if (report.schema !== NORMALIZATION_SCHEMA || report.status !== 'passed' || report.asset_id !== assetId) {
    throw new Error('Blender normalization report identity or status is invalid');
  }
  if (report.source_sha256 !== inputSha256 || report.output_sha256 !== outputSha256) {
    throw new Error('Blender normalization report hashes do not match files');
  }
  if (
    report.mode !== 'static-prop'
    || report.units !== 'meters'
    || report.pivot !== 'bottom-center'
    || !isNonEmpty(report.pipeline_version)
    || !isNonEmpty(report.blender_version)
  ) {
    throw new Error('Blender normalization report contract is incomplete');
  }
  validateMetricShape(report.source_metrics, 'source');
  if (
    sourceInspection.metrics.nodes !== report.source_metrics.object_count
    || sourceInspection.metrics.materials !== report.source_metrics.material_count
    || sourceInspection.metrics.images !== report.source_metrics.texture_count
    || sourceInspection.metrics.animations !== report.source_metrics.animation_count
    || report.source_metrics.mesh_count < sourceInspection.metrics.meshes
    || report.source_metrics.triangle_count < sourceInspection.metrics.triangles
  ) {
    throw new Error('source metrics do not match the approved GLB');
  }
  validateNormalizationMetrics(report.normalized_metrics, 'normalized', assetId, budgets);
  validateNormalizationMetrics(report.reimport_metrics, 're-import', assetId, budgets);
  const exactEquivalentFields = [
    'object_count', 'mesh_count', 'triangle_count', 'material_count', 'material_names',
    'texture_count', 'texture_names', 'root_names', 'armature_count', 'animation_count', 'singular_transform_count',
    'sheared_transform_count', 'negative_determinant_count', 'non_unit_scale_count',
    'non_finite_material_value_count', 'degenerate_triangle_count', 'non_finite_vertex_count',
    'missing_material_slot_count',
  ];
  const withinTolerance = (left, right) => Math.abs(left - right) <= 1e-4;
  const vectorsMatch = (left, right) => left.length === right.length && left.every((value, index) => withinTolerance(value, right[index]));
  if (
    exactEquivalentFields.some(field => JSON.stringify(report.normalized_metrics[field]) !== JSON.stringify(report.reimport_metrics[field]))
    || ['bounds_min', 'bounds_max', 'dimensions'].some(field => !vectorsMatch(report.normalized_metrics[field], report.reimport_metrics[field]))
    || !withinTolerance(report.normalized_metrics.max_dimension, report.reimport_metrics.max_dimension)
  ) {
    throw new Error('normalized and re-import metrics are inconsistent');
  }
  const reimport = report.reimport_metrics;
  if (
    inspection.metrics.nodes !== reimport.object_count
    || inspection.metrics.meshes !== reimport.mesh_count
    || inspection.metrics.triangles !== reimport.triangle_count
    || inspection.metrics.materials !== reimport.material_count
    || inspection.metrics.images !== reimport.texture_count
  ) {
    throw new Error('normalization report metrics do not match the output GLB');
  }
  const expectedGltfBoundsMin = [reimport.bounds_min[0], reimport.bounds_min[2], -reimport.bounds_max[1]];
  const expectedGltfBoundsMax = [reimport.bounds_max[0], reimport.bounds_max[2], -reimport.bounds_min[1]];
  if (
    !vectorsMatch(inspection.geometry.boundsMin, expectedGltfBoundsMin)
    || !vectorsMatch(inspection.geometry.boundsMax, expectedGltfBoundsMax)
    || JSON.stringify(inspection.geometry.materialNames) !== JSON.stringify([...reimport.material_names].sort())
  ) {
    throw new Error('normalization report geometry or material names do not match the output GLB');
  }
  const rootName = `BrainBite_${assetId}_ROOT`;
  const roots = inspection.gltf.nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.name === rootName);
  const scene = inspection.gltf.scenes[inspection.gltf.scene ?? 0];
  if (roots.length !== 1 || scene.nodes?.length !== 1 || scene.nodes[0] !== roots[0].index) {
    throw new Error('normalized GLB does not expose exactly one canonical scene root');
  }
  const root = roots[0].node;
  if (reachableNodeIndices(inspection.gltf.nodes, roots[0].index).size !== inspection.gltf.nodes.length) {
    throw new Error('normalized GLB contains nodes outside the canonical root hierarchy');
  }
  const translation = root.translation ?? [0, 0, 0];
  const rotation = root.rotation ?? [0, 0, 0, 1];
  const scale = root.scale ?? [1, 1, 1];
  const identityTransform = translation.length === 3 && translation.every(value => Math.abs(value) <= 1e-6)
    && rotation.length === 4 && rotation.every((value, index) => Math.abs(value - (index === 3 ? 1 : 0)) <= 1e-6)
    && scale.length === 3 && scale.every(value => Math.abs(value - 1) <= 1e-6)
    && root.matrix === undefined;
  if (
    root.mesh !== undefined
    || !identityTransform
    || root.extras?.brainbite_asset_id !== assetId
    || root.extras?.brainbite_units !== 'meters'
    || root.extras?.brainbite_pivot !== 'bottom-center'
    || root.extras?.brainbite_pipeline !== 'static-prop-normalization'
  ) {
    throw new Error('normalized GLB canonical root metadata is invalid');
  }
  if (!blendStat.isFile() || blendStat.size < 32) throw new Error('Blender source file was not produced');
  return inspection;
}

export async function normalizeApprovedAsset({
  assetId,
  inputSha256,
  root,
  blenderPath,
  normalizerPath = fileURLToPath(new URL('./blender/normalize_intake.py', import.meta.url)),
  runBlender = runProcess,
}) {
  safeId(assetId, 'assetId');
  safeHash(inputSha256);
  if (!isNonEmpty(blenderPath)) throw new Error('blenderPath is required');
  const approvedFile = within(root, 'approved', `${assetId}.glb`);
  const approvedManifestFile = within(root, 'approved-manifests', `${assetId}.json`);
  const [approvedBytes, approvedManifest] = await Promise.all([readFile(approvedFile), readJson(approvedManifestFile)]);
  if (
    sha256(approvedBytes) !== inputSha256
    || approvedManifest.schema !== PROMOTION_SCHEMA
    || approvedManifest.lifecycle !== 'PROMOTED'
    || approvedManifest.assetId !== assetId
    || approvedManifest.inputSha256 !== inputSha256
  ) {
    throw new Error('approved asset or manifest does not match the requested source hash');
  }
  const budgets = approvedManifest.budgets;
  const requestReasons = validateRequest({
    ...approvedManifest,
    schema: REQUEST_SCHEMA,
    assetId,
    expectedSha256: inputSha256,
  }, inputSha256, approvedBytes.length);
  if (requestReasons.length) throw new Error(`approved manifest provenance is invalid: ${requestReasons.join('; ')}`);
  const sourceInspection = inspectGlb(approvedBytes, budgets);
  if (!sourceInspection.valid) throw new Error(`approved GLB failed strict revalidation: ${sourceInspection.reasons.join('; ')}`);

  const destinationRoot = within(root, 'normalized', assetId, inputSha256);
  const destination = path.join(destinationRoot, `${assetId}.glb`);
  const blendFile = path.join(destinationRoot, `${assetId}.blend`);
  const reportFile = path.join(destinationRoot, 'normalization.json');
  let destinationExists = false;
  try {
    destinationExists = (await stat(destinationRoot)).isDirectory();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (destinationExists) {
    try {
      const [output, report, blendStat] = await Promise.all([readFile(destination), readJson(reportFile), stat(blendFile)]);
      validateNormalizedArtifacts({ output, report, blendStat, assetId, inputSha256, budgets, sourceInspection });
      return { destination, blendFile, reportFile, report, idempotent: true };
    } catch (error) {
      throw new Error(`existing normalization output is incomplete or invalid: ${error.message}`);
    }
  }

  const stagingRoot = within(root, '.staging', `normalize-${assetId}-${inputSha256}-${process.pid}-${Date.now()}`);
  const stagedOutput = path.join(stagingRoot, `${assetId}.glb`);
  const stagedBlend = path.join(stagingRoot, `${assetId}.blend`);
  const stagedReport = path.join(stagingRoot, 'normalization.json');
  await mkdir(stagingRoot, { recursive: true });
  try {
    const result = await runBlender(blenderPath, [
      '--factory-startup', '--background', '--disable-autoexec',
      '--python', normalizerPath, '--',
      '--input', approvedFile,
      '--output', stagedOutput,
      '--blend', stagedBlend,
      '--report', stagedReport,
      '--asset-id', assetId,
      '--max-triangles', String(budgets.maxTriangles),
      '--max-materials', String(budgets.maxMaterials),
      '--max-textures', String(budgets.maxTextures),
      '--max-dimension', String(budgets.maxDimension),
    ]);
    const processLog = `${result.stderr ?? ''}\n${result.stdout ?? ''}`;
    const reportedFailure = processLog.match(/NORMALIZE FAIL[^\r\n]*/);
    if (reportedFailure) throw new Error(reportedFailure[0]);
    const [output, report, blendStat] = await Promise.all([readFile(stagedOutput), readJson(stagedReport), stat(stagedBlend)]);
    validateNormalizedArtifacts({ output, report, blendStat, assetId, inputSha256, budgets, sourceInspection });
    await mkdir(path.dirname(destinationRoot), { recursive: true });
    await rename(stagingRoot, destinationRoot);
    return { destination, blendFile, reportFile, report, processExitCode: result.code, idempotent: false };
  } catch (error) {
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    if (!key?.startsWith('--') || rest[index + 1] === undefined) throw new Error(`invalid argument near ${key ?? '(end)'}`);
    options[key.slice(2)] = rest[index + 1];
  }
  return { command, options };
}

function requireOption(options, name) {
  if (!options[name]) throw new Error(`--${name} is required`);
  return options[name];
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const defaultRoot = fileURLToPath(new URL('../assets/intake/', import.meta.url));
  const root = path.resolve(options.root ?? defaultRoot);
  let result;
  if (command === 'intake') {
    result = await intakeAsset({ inputPath: path.resolve(requireOption(options, 'input')), requestPath: path.resolve(requireOption(options, 'request')), root });
  } else if (command === 'validate') {
    const inputPath = path.resolve(requireOption(options, 'input'));
    const bytes = await readFile(inputPath);
    const request = await readJson(path.resolve(requireOption(options, 'request')));
    const inputSha256 = sha256(bytes);
    const reasons = [...validateRequest(request, inputSha256, bytes.length), ...inspectGlb(bytes, request.budgets).reasons];
    result = { valid: reasons.length === 0, inputSha256, reasons: [...new Set(reasons)] };
    if (!result.valid) process.exitCode = 1;
  } else if (command === 'approve') {
    result = await approveAsset({ assetId: requireOption(options, 'asset-id'), inputSha256: requireOption(options, 'sha256'), approvedBy: requireOption(options, 'approved-by'), root });
  } else if (command === 'promote') {
    result = await promoteAsset({ assetId: requireOption(options, 'asset-id'), inputSha256: requireOption(options, 'sha256'), root });
  } else if (command === 'normalize') {
    result = await normalizeApprovedAsset({
      assetId: requireOption(options, 'asset-id'),
      inputSha256: requireOption(options, 'sha256'),
      blenderPath: path.resolve(requireOption(options, 'blender')),
      root,
    });
  } else {
    throw new Error('usage: intake-glb.mjs <validate|intake|approve|promote|normalize> [options]');
  }
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(`ASSET INTAKE FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
