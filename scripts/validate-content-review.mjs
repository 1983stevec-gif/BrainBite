import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import reviewManifest from '../content/content-review-manifest.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const contentDir = path.join(repoRoot, 'content');
const require = createRequire(import.meta.url);
const registry = require(path.join(contentDir, 'experience-registry.js'));
const core = await import(pathToFileURL(path.join(repoRoot, 'brainbite-core.mjs')).href);
const sidecarPath = path.join(contentDir, 'skill-links.v1.json');

function canonicalize(value) {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

function digest(value) {
  return crypto.createHash('sha256').update(canonicalize(value), 'utf8').digest('hex');
}

function jsonPathTokens(jsonPath) {
  if (typeof jsonPath !== 'string' || !jsonPath.startsWith('$')) return null;
  const tokens = [];
  const matcher = /(?:\.([A-Za-z0-9_-]+)|\[(\d+)\])/g;
  let match;
  let consumed = 0;
  const tail = jsonPath.slice(1);
  while ((match = matcher.exec(tail))) {
    if (match.index !== consumed) return null;
    tokens.push(match[1] !== undefined ? match[1] : Number(match[2]));
    consumed = matcher.lastIndex;
  }
  return consumed === tail.length ? tokens : null;
}

function valueAtJsonPath(value, jsonPath) {
  const tokens = jsonPathTokens(jsonPath);
  if (!tokens) return undefined;
  return tokens.reduce((current, token) => current?.[token], value);
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function sameValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function addExpected(expected, approvals, findings, { identity, kind, source, provenance, value, evidence, taxonomy, quarantineReasons, runtimeStatus }) {
  // A reviewer finding quarantines the record exactly as an automated reason does, so a
  // rejected record can never be approved and never becomes production-eligible.
  const finding = findings?.[identity] || null;
  const allReasons = finding ? [...quarantineReasons, `reviewer-rejected: ${finding.reason}`] : quarantineReasons;
  const productionRegistry = kind === 'registry-mission' && allReasons.length === 0;
  const approved = allReasons.length === 0 && Boolean(approvals[identity]);
  const productionEligible = productionRegistry || approved;
  expected.push({
    identity,
    kind,
    source,
    provenance,
    digest: digest(value),
    evidence,
    taxonomy,
    quarantineStatus: allReasons.length ? 'quarantined' : 'clear',
    quarantineReasons: allReasons,
    reviewStatus: finding ? 'rejected' : approved ? 'approved' : 'pending-educator',
    reviewerFinding: finding ? { reviewer: finding.reviewer, rejectedAt: finding.rejectedAt, reason: finding.reason } : null,
    runtimeStatus: productionEligible ? 'production-reviewed' : runtimeStatus,
    runtimePrototype: !productionEligible,
    runtimeProduction: productionEligible,
    promotionStatus: allReasons.length ? 'quarantined' : productionEligible ? 'production-reviewed' : 'pending-educator',
  });
}

function readJson(fileName, errors) {
  const filePath = path.join(contentDir, fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${fileName}: unable to read JSON source (${error.message})`);
    return null;
  }
}

function expectedSources(errors, approvals = {}, findings = {}) {
  const expected = [];
  const add = entry => addExpected(expected, approvals, findings, entry);
  const taxonomy = core.curriculumTaxonomy();
  const taxonomyById = new Map(Array.isArray(taxonomy?.skills) ? taxonomy.skills.map(skill => [skill.id, skill]) : []);

  if (!Array.isArray(registry.missions)) {
    errors.push('experience-registry.js: missions export is missing');
  } else {
    registry.missions.forEach((mission, index) => {
      add({
        identity: `registry-mission:${mission.id}`,
        kind: 'registry-mission',
        source: {
          file: 'content/experience-registry.js',
          export: 'missions',
          path: `$.missions[${index}]`,
          sourceId: String(mission.id),
        },
        provenance: {
          authority: 'experience-registry.js',
          declaration: 'canonical missions export',
          exactSource: `missions[${index}]`,
        },
        value: mission,
        evidence: ['experience-registry.validateRegistry', 'mission-shape-and-answer-partition'],
        taxonomy: null,
        quarantineReasons: [],
        runtimeStatus: 'internal-review',
      });
    });
  }

  if (!isObject(core.CURRICULUM_ITEM_TEMPLATES)) {
    errors.push('brainbite-core.mjs: CURRICULUM_ITEM_TEMPLATES export is missing');
  } else {
    for (const [skillId, template] of Object.entries(core.CURRICULUM_ITEM_TEMPLATES)) {
      const skill = taxonomyById.get(skillId);
      if (!skill) errors.push(`brainbite-core.mjs: template ${skillId} has no canonical taxonomy skill`);
      add({
        identity: `generated-template:${skillId}`,
        kind: 'generated-template',
        source: {
          file: 'brainbite-core.mjs',
          export: 'CURRICULUM_ITEM_TEMPLATES',
          path: `$.CURRICULUM_ITEM_TEMPLATES[${JSON.stringify(skillId)}]`,
          sourceId: skillId,
        },
        provenance: {
          authority: 'brainbite-core.mjs',
          declaration: 'canonical generated curriculum template',
          exactSource: `CURRICULUM_ITEM_TEMPLATES[${JSON.stringify(skillId)}]`,
        },
        value: template,
        evidence: ['brainbite-core.validateGeneratedChallenge', 'brainbite-core.verifyCurriculumAnswer', 'template-semantic-verification'],
        taxonomy: skill ? {
          version: taxonomy.version,
          skillId,
          subject: skill.subject,
          grade: skill.grade,
          domain: skill.domain,
        } : null,
        quarantineReasons: [],
        runtimeStatus: 'internal-review',
      });
    }
  }

  const sidecar = readJson('skill-links.v1.json', errors);
  if (!isObject(sidecar) || !Array.isArray(sidecar.entries)) {
    errors.push('skill-links.v1.json: entries must be an array');
    return expected;
  }

  const sidecarIdentities = new Set();
  for (const entry of sidecar.entries) {
    if (!isObject(entry) || !nonEmpty(entry.source) || !nonEmpty(entry.path)) {
      errors.push('skill-links.v1.json: every entry needs a source and path');
      continue;
    }
    const sidecarIdentity = `${entry.source}::${entry.path}`;
    if (sidecarIdentities.has(sidecarIdentity)) errors.push(`skill-links.v1.json: duplicate entry ${sidecarIdentity}`);
    sidecarIdentities.add(sidecarIdentity);

    const sourceValue = readJson(entry.source, errors);
    const value = sourceValue === null ? undefined : valueAtJsonPath(sourceValue, entry.path);
    if (value === undefined) {
      errors.push(`skill-links.v1.json: source path does not resolve ${sidecarIdentity}`);
      continue;
    }
    if (!Array.isArray(value.correct) || !Array.isArray(value.wrong) || typeof value.prompt !== 'string' || !value.prompt.trim()) {
      errors.push(`${sidecarIdentity}: source value is not a complete answer-bearing item`);
    }
    if (!['linked', 'quarantined'].includes(entry.status)) {
      errors.push(`${sidecarIdentity}: invalid sidecar status ${entry.status}`);
    }
    const linked = entry.status === 'linked';
    const canonical = linked ? taxonomyById.get(entry.canonicalSkillId) : null;
    if (linked && !canonical) errors.push(`${sidecarIdentity}: missing canonical taxonomy skill ${entry.canonicalSkillId}`);
    if (!linked && (!nonEmpty(entry.unlinkedReason) || entry.canonicalSkillId !== undefined)) {
      errors.push(`${sidecarIdentity}: quarantined entry needs only an unlinked reason`);
    }
    if (linked && (!nonEmpty(entry.canonicalSkillId) || entry.unlinkedReason !== undefined)) {
      errors.push(`${sidecarIdentity}: linked entry needs only a canonical skill ID`);
    }

    add({
      identity: `json-pack-item:${sidecarIdentity}`,
      kind: 'json-pack-item',
      source: {
        file: `content/${entry.source}`,
        sidecar: 'content/skill-links.v1.json',
        path: entry.path,
        sourceId: sidecarIdentity,
      },
      provenance: {
        authority: 'content/skill-links.v1.json',
        declaration: 'answer-bearing pack item classification',
        exactSource: `${entry.source}${entry.path}`,
      },
      value,
      evidence: linked
        ? ['scripts/validate-content.mjs:answer-shape', 'skill-links.v1:linked-taxonomy-metadata']
        : ['scripts/validate-content.mjs:answer-shape', 'skill-links.v1:quarantine-reason'],
      taxonomy: linked && canonical ? {
        version: taxonomy.version,
        skillId: entry.canonicalSkillId,
        sourceSkillId: entry.sourceSkillId,
        subject: entry.subject,
        linkage: 'linked',
      } : null,
      quarantineReasons: linked ? [] : [entry.unlinkedReason],
      runtimeStatus: linked ? 'non-production' : 'quarantined',
    });
  }

  return expected;
}

function validateRecord(record, expected, errors, approvals = {}) {
  if (!isObject(record)) {
    errors.push('manifest: every record must be an object');
    return;
  }
  if (record.identity !== expected.identity) errors.push(`${expected.identity}: identity mismatch`);
  if (record.kind !== expected.kind) errors.push(`${expected.identity}: kind mismatch`);
  for (const field of ['source', 'provenance']) {
    if (!sameValue(record[field], expected[field])) errors.push(`${expected.identity}: ${field} is stale or mismatched`);
  }
  if (record.digest?.algorithm !== 'sha256' || record.digest?.encoding !== 'hex' || record.digest?.input !== 'canonical-json-source-value') {
    errors.push(`${expected.identity}: invalid digest contract`);
  }
  if (record.digest?.value !== expected.digest) errors.push(`${expected.identity}: stale source digest`);
  if (record.verification?.status !== 'validated' || record.verification?.mode !== 'programmatic') {
    errors.push(`${expected.identity}: missing programmatic verification status`);
  }
  if (!sameValue(record.verification?.evidence, expected.evidence)) errors.push(`${expected.identity}: verification evidence mismatch`);
  if (!sameValue(record.taxonomy, expected.taxonomy)) errors.push(`${expected.identity}: taxonomy linkage mismatch`);
  // An approval is only valid while the reviewed source is unchanged: the digest check
  // above already fails a stale approval, and this block enforces the reviewer contract.
  const approval = approvals[record.identity] || null;
  if (approval) {
    if (record.quarantine?.status === 'quarantined') errors.push(`${expected.identity}: a quarantined record can never be educator-approved`);
    if (record.educatorReview?.status !== 'approved') errors.push(`${expected.identity}: approval data exists but educator review is not approved`);
    if (!sameValue(record.educatorReview?.reviewer, approval.reviewer)) errors.push(`${expected.identity}: approval reviewer metadata mismatch`);
    if (record.educatorReview?.reviewedAt !== approval.reviewedAt) errors.push(`${expected.identity}: approval timestamp mismatch`);
    if (record.runtime?.production !== true || record.runtime?.prototype !== false) errors.push(`${expected.identity}: an approved record must be promoted to production`);
    if (record.promotion?.status !== 'production-reviewed') errors.push(`${expected.identity}: an approved record must be promoted to production-reviewed`);
  } else if (expected.reviewStatus === 'rejected') {
    if (record.educatorReview?.status !== 'rejected') errors.push(`${expected.identity}: a rejected record must carry the rejected review status`);
    if (!sameValue(record.educatorReview?.reviewer, expected.reviewerFinding?.reviewer)) errors.push(`${expected.identity}: rejection reviewer metadata mismatch`);
    if (record.educatorReview?.reviewedAt !== expected.reviewerFinding?.rejectedAt) errors.push(`${expected.identity}: rejection timestamp mismatch`);
    if (record.runtime?.production === true || record.runtime?.prototype !== true) errors.push(`${expected.identity}: a rejected record must not be production-eligible`);
  } else if (record.educatorReview?.status !== 'pending-educator' || record.educatorReview?.reviewer !== null || record.educatorReview?.reviewedAt !== null) {
    errors.push(`${expected.identity}: educator review must remain pending with no reviewer metadata`);
  }
  if (!sameValue(record.reviewerFinding, expected.reviewerFinding)) errors.push(`${expected.identity}: reviewer finding mismatch`);
  if (record.verification?.approved !== undefined || record.approved !== undefined || record.educatorApproved !== undefined) {
    errors.push(`${expected.identity}: ambiguous approval metadata is not allowed`);
  }
  if (record.quarantine?.status !== expected.quarantineStatus || !sameValue(record.quarantine?.reasons, expected.quarantineReasons)) {
    errors.push(`${expected.identity}: quarantine state mismatch`);
  }
  if (record.runtime?.status !== expected.runtimeStatus || record.runtime?.prototype !== expected.runtimePrototype || record.runtime?.production !== expected.runtimeProduction) {
    errors.push(`${expected.identity}: runtime status mismatch`);
  }
  if (record.promotion?.status !== expected.promotionStatus) errors.push(`${expected.identity}: promotion status mismatch`);
}

function validateContentReview({ manifest = null } = {}) {
  const errors = [];
  const sourceManifest = manifest || reviewManifest.getReviewManifest();
  const approvals = sourceManifest?.approvals && typeof sourceManifest.approvals === 'object' ? sourceManifest.approvals : {};
  const findings = sourceManifest?.reviewerFindings && typeof sourceManifest.reviewerFindings === 'object' ? sourceManifest.reviewerFindings : {};
  const expected = expectedSources(errors, approvals, findings);
  const records = Array.isArray(sourceManifest?.records) ? sourceManifest.records : [];
  const expectedByIdentity = new Map();
  const actualIdentities = new Set();

  if (sourceManifest?.version !== '3.3.0' || sourceManifest?.manifestVersion !== '3.3.0' || sourceManifest?.schemaVersion !== 1) {
    errors.push('manifest: unsupported or stale manifest version');
  }
  if (!sameValue(sourceManifest?.digestContract, {
    algorithm: 'sha256',
    encoding: 'hex',
    input: 'canonical-json-source-value',
    canonicalization: 'JSON objects use lexicographically sorted keys; arrays preserve order.',
  })) errors.push('manifest: digest contract mismatch');
  if (records.length !== expected.length) errors.push(`manifest: expected ${expected.length} records, found ${records.length}`);
  for (const item of expected) {
    if (expectedByIdentity.has(item.identity)) errors.push(`source inventory: duplicate expected identity ${item.identity}`);
    expectedByIdentity.set(item.identity, item);
  }
  for (const record of records) {
    if (!isObject(record) || !nonEmpty(record.identity)) {
      errors.push('manifest: record identity is missing');
      continue;
    }
    if (actualIdentities.has(record.identity)) errors.push(`manifest: duplicate record ${record.identity}`);
    actualIdentities.add(record.identity);
    const expectedRecord = expectedByIdentity.get(record.identity);
    if (!expectedRecord) {
      errors.push(`manifest: extra or stale record ${record.identity}`);
      continue;
    }
    validateRecord(record, expectedRecord, errors, approvals);
  }
  for (const item of expected) {
    if (!actualIdentities.has(item.identity)) errors.push(`manifest: missing record ${item.identity}`);
  }

  const summary = {
    registryMissions: expected.filter(item => item.kind === 'registry-mission').length,
    generatedTemplates: expected.filter(item => item.kind === 'generated-template').length,
    jsonPackItems: expected.filter(item => item.kind === 'json-pack-item').length,
    linkedJsonPackItems: expected.filter(item => item.kind === 'json-pack-item' && item.quarantineStatus === 'clear').length,
    quarantinedJsonPackItems: expected.filter(item => item.kind === 'json-pack-item' && item.quarantineStatus === 'quarantined').length,
    totalRecords: expected.length,
  };
  if (summary.registryMissions !== 30) errors.push(`source inventory: expected 30 registry missions, found ${summary.registryMissions}`);
  if (summary.generatedTemplates !== 35) errors.push(`source inventory: expected 35 generated templates, found ${summary.generatedTemplates}`);
  if (summary.jsonPackItems !== 40) errors.push(`source inventory: expected 40 JSON pack items, found ${summary.jsonPackItems}`);
  if (summary.linkedJsonPackItems !== 17) errors.push(`source inventory: expected 17 linked JSON items, found ${summary.linkedJsonPackItems}`);
  if (summary.quarantinedJsonPackItems !== 23) errors.push(`source inventory: expected 23 quarantined JSON items, found ${summary.quarantinedJsonPackItems}`);
  if (!sameValue(sourceManifest?.coverage, summary)) errors.push('manifest: coverage counts do not match source inventory');

  return { valid: errors.length === 0, errors, summary };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateContentReview();
  if (!result.valid) {
    for (const error of result.errors) console.error(`FAIL content-review ${error}`);
    process.exitCode = 1;
  } else {
    console.log('OK content/content-review-manifest.js');
    console.log(`Validated ${result.summary.totalRecords} records: ${result.summary.registryMissions} missions, ${result.summary.generatedTemplates} generated templates, ${result.summary.jsonPackItems} JSON pack items.`);
    console.log(`JSON pack control state: linked=${result.summary.linkedJsonPackItems} non-production, quarantined=${result.summary.quarantinedJsonPackItems}.`);
  }
}

export { canonicalize, digest, validateContentReview };
