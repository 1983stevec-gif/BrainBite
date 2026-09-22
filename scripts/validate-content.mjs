import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const contentDir = path.join(repoRoot, 'content');
const sidecarFileName = 'skill-links.v1.json';
const sidecarPath = process.env.BRAINBITE_SKILL_LINKS_PATH
  ? path.resolve(process.env.BRAINBITE_SKILL_LINKS_PATH)
  : path.join(contentDir, sidecarFileName);
const require = createRequire(import.meta.url);
const registry = require(path.join(contentDir, 'experience-registry.js'));
const core = await import(pathToFileURL(path.join(repoRoot, 'brainbite-core.mjs')).href);

const files = fs.readdirSync(contentDir)
  .filter(file => file.endsWith('.json') && file !== sidecarFileName)
  .sort();
const taxonomy = core.curriculumTaxonomy();
const failedMessages = [];
const discoveredItems = [];
let rawAnswerSets = 0;
let rawValidAnswerSets = 0;
let registryRawValidAnswerSets = 0;

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function answerBearing(value) {
  return Array.isArray(value?.correct) && Array.isArray(value?.wrong);
}

function sourceSkillId(value, context) {
  for (const candidate of [value?.skillId, value?.skill]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return context.sourceSkillId || null;
}

function validateAnswerSet(value, file, jsonPath, collect, context) {
  if (!answerBearing(value)) return;
  rawAnswerSets += 1;
  if (typeof value.prompt !== 'string' || !value.prompt.trim()) fail(`${file}${jsonPath}: missing prompt`);
  const correct = new Set(value.correct.map(String));
  const wrong = new Set(value.wrong.map(String));
  if (correct.size !== value.correct.length) fail(`${file}${jsonPath}: duplicate correct answers`);
  if (wrong.size !== value.wrong.length) fail(`${file}${jsonPath}: duplicate wrong answers`);
  for (const answer of correct) {
    if (wrong.has(answer)) fail(`${file}${jsonPath}: answer appears in correct and wrong`);
  }
  if (!value.correct.length) fail(`${file}${jsonPath}: no correct answer`);
  rawValidAnswerSets += 1;
  if (collect) {
    collect.push({
      identity: `${file}::${jsonPath}`,
      source: file,
      path: jsonPath,
      sourceSkillId: sourceSkillId(value, context),
      value,
    });
  }
}

function walk(value, file, jsonPath, context = {}, collect = null) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, file, `${jsonPath}[${index}]`, context, collect));
    return;
  }
  if (!isObject(value)) return;

  if (answerBearing(value)) {
    validateAnswerSet(value, file, jsonPath, collect, context);
  }

  for (const [key, child] of Object.entries(value)) {
    let childContext = context;
    if (context.skillContainer) {
      childContext = { sourceSkillId: key, skillContainer: false };
    } else if (key === 'skills' || key === 'questionSets') {
      childContext = { ...context, skillContainer: true };
    }
    walk(child, file, `${jsonPath}.${key}`, childContext, collect);
  }
}

function assertManifestParity(manifest) {
  if (manifest.registryVersion !== registry.registryVersion) {
    fail(`content-manifest.json: registryVersion ${manifest.registryVersion} does not match ${registry.registryVersion}`);
  }
  const expectedWorlds = registry.worlds.map(world => ({
    id: world.id,
    name: world.name,
    missions: [...world.missionIds],
  }));
  if (JSON.stringify(manifest.worlds) !== JSON.stringify(expectedWorlds)) {
    fail('content-manifest.json: worlds or mission ordering do not match the canonical registry');
  }
  const expectedBosses = registry.bosses.filter(boss => boss.liveMissionBoss).map(boss => boss.name);
  if (JSON.stringify(manifest.bosses) !== JSON.stringify(expectedBosses)) {
    fail('content-manifest.json: live bosses do not match the canonical registry');
  }
}

function normalizeGrade(value) {
  if (value === 'K' || value === 'k') return 'K';
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 6 ? String(number) : null;
}

function gradeCompatible(value, canonicalGrade) {
  if (value === undefined || value === null || String(value).trim() === '') return true;
  const text = String(value).trim();
  const normalizedCanonical = normalizeGrade(canonicalGrade);
  const range = text.match(/^(K|k|[1-6])\s*-\s*(K|k|[1-6])$/);
  if (range) {
    const start = normalizeGrade(range[1]);
    const end = normalizeGrade(range[2]);
    const order = ['K', '1', '2', '3', '4', '5', '6'];
    return order.indexOf(normalizedCanonical) >= order.indexOf(start)
      && order.indexOf(normalizedCanonical) <= order.indexOf(end);
  }
  return normalizeGrade(text) === normalizedCanonical;
}

function assertCompatibleMetadata(entry, item, canonical) {
  for (const subject of [item.value?.subject, entry.subject]) {
    if (subject !== undefined && subject !== null && String(subject).trim() && subject !== canonical.subject) {
      fail(`${entry.source}${entry.path}: subject ${subject} contradicts ${entry.canonicalSkillId}`);
    }
  }

  for (const grade of [item.value?.grade, item.value?.gradeBand, entry.grade, entry.gradeBand]) {
    if (!gradeCompatible(grade, canonical.grade)) {
      fail(`${entry.source}${entry.path}: grade ${grade} contradicts ${entry.canonicalSkillId}`);
    }
  }

  for (const family of [item.value?.family, item.value?.activityFamily, entry.family]) {
    if (family === undefined || family === null || String(family).trim() === '') continue;
    const values = Array.isArray(family) ? family : [family];
    if (values.some(value => !canonical.supportedActivityTypes.includes(value))) {
      fail(`${entry.source}${entry.path}: activity family ${values.join(', ')} is not supported by ${entry.canonicalSkillId}`);
    }
  }
}

function assertSidecar(sidecar, items) {
  if (!isObject(sidecar)) fail(`${sidecarFileName}: invalid root`);
  if (sidecar.version !== '1.0.0') fail(`${sidecarFileName}: version must be 1.0.0`);
  if (sidecar.status !== 'reconciled') fail(`${sidecarFileName}: status must be reconciled`);
  if (sidecar.approvalScope !== 'schema-and-taxonomy-linkage-only') {
    fail(`${sidecarFileName}: approvalScope must be schema-and-taxonomy-linkage-only`);
  }
  if (sidecar.educatorApprovalRequired !== true) {
    fail(`${sidecarFileName}: educatorApprovalRequired must be true`);
  }
  const expectedLinkageRule = {
    appliesTo: ['packs', 'entries'],
    taxonomyLinkedDoesNotGrant: ['runtime-approval', 'child-approval'],
  };
  if (JSON.stringify(sidecar.linkageRule) !== JSON.stringify(expectedLinkageRule)) {
    fail(`${sidecarFileName}: linkageRule must deny automatic runtime and child approval for packs and entries`);
  }
  if (sidecar.taxonomyVersion !== taxonomy.version) {
    fail(`${sidecarFileName}: taxonomyVersion ${sidecar.taxonomyVersion} does not match ${taxonomy.version}`);
  }
  if (!Array.isArray(sidecar.packs)) fail(`${sidecarFileName}: packs must be an array`);
  if (!Array.isArray(sidecar.entries)) fail(`${sidecarFileName}: entries must be an array`);

  const expectedFiles = new Set(files);
  const packMap = new Map();
  for (const pack of sidecar.packs) {
    if (!isObject(pack) || typeof pack.source !== 'string' || !pack.source.trim()) {
      fail(`${sidecarFileName}: every pack classification needs a source`);
    }
    if (packMap.has(pack.source)) fail(`${sidecarFileName}: duplicate pack classification ${pack.source}`);
    if (!expectedFiles.has(pack.source)) fail(`${sidecarFileName}: pack classification references missing file ${pack.source}`);
    if (!['reference', 'answer-bearing'].includes(pack.status)) {
      fail(`${sidecarFileName}: invalid pack status for ${pack.source}`);
    }
    if (!['non-runtime', 'not-approved-by-linkage'].includes(pack.runtime)) {
      fail(`${sidecarFileName}: invalid pack runtime for ${pack.source}`);
    }
    packMap.set(pack.source, pack);
  }
  if (packMap.size !== expectedFiles.size || [...expectedFiles].some(file => !packMap.has(file))) {
    fail(`${sidecarFileName}: pack classifications do not cover all ${files.length} JSON packs`);
  }

  const answerFiles = new Set(items.map(item => item.source));
  for (const file of files) {
    const pack = packMap.get(file);
    const expectedAnswerPack = answerFiles.has(file);
    if (expectedAnswerPack && (pack.status !== 'answer-bearing' || pack.runtime !== 'not-approved-by-linkage')) {
      fail(`${sidecarFileName}: ${file} must be answer-bearing content that is not runtime-approved by linkage`);
    }
    if (!expectedAnswerPack && (pack.status !== 'reference' || pack.runtime !== 'non-runtime')) {
      fail(`${sidecarFileName}: ${file} must be non-runtime reference content`);
    }
  }

  const itemMap = new Map(items.map(item => [item.identity, item]));
  const entryMap = new Map();
  let taxonomyLinked = 0;
  let quarantined = 0;
  for (const entry of sidecar.entries) {
    if (!isObject(entry) || typeof entry.source !== 'string' || typeof entry.path !== 'string') {
      fail(`${sidecarFileName}: every entry needs source and path`);
    }
    const identity = `${entry.source}::${entry.path}`;
    if (entryMap.has(identity)) fail(`${sidecarFileName}: duplicate sidecar identity ${identity}`);
    const item = itemMap.get(identity);
    if (!item) fail(`${sidecarFileName}: entry references missing file/path ${identity}`);
    if (entry.sourceSkillId !== undefined && (typeof entry.sourceSkillId !== 'string' || !entry.sourceSkillId.trim())) {
      fail(`${sidecarFileName}: invalid sourceSkillId for ${identity}`);
    }
    if (item.sourceSkillId && entry.sourceSkillId !== item.sourceSkillId) {
      fail(`${sidecarFileName}: sourceSkillId mismatch for ${identity}`);
    }
    if (!item.sourceSkillId && entry.sourceSkillId !== undefined) {
      fail(`${sidecarFileName}: sourceSkillId was invented for ${identity}`);
    }

    const hasCanonical = typeof entry.canonicalSkillId === 'string' && entry.canonicalSkillId.trim();
    const hasReason = typeof entry.unlinkedReason === 'string' && entry.unlinkedReason.trim();
    if (!['linked', 'quarantined'].includes(entry.status)) {
      fail(`${sidecarFileName}: invalid entry status for ${identity}`);
    }
    if (entry.status === 'linked') {
      if (!hasCanonical || hasReason) fail(`${sidecarFileName}: linked entry must have only canonicalSkillId ${identity}`);
      const canonical = taxonomy.skills.find(skill => skill.id === entry.canonicalSkillId);
      if (!canonical) fail(`${sidecarFileName}: invalid canonical skill ${entry.canonicalSkillId} for ${identity}`);
      assertCompatibleMetadata(entry, item, canonical);
      taxonomyLinked += 1;
    } else {
      if (hasCanonical || !hasReason) fail(`${sidecarFileName}: quarantined entry must have only unlinkedReason ${identity}`);
      quarantined += 1;
    }
    entryMap.set(identity, entry);
  }

  if (entryMap.size !== itemMap.size || [...itemMap.keys()].some(identity => !entryMap.has(identity))) {
    const missing = [...itemMap.keys()].filter(identity => !entryMap.has(identity));
    fail(`${sidecarFileName}: expected exactly one entry per answer-bearing item; missing ${missing.join(', ') || 'unknown item'}`);
  }
  return { taxonomyLinked, quarantined };
}

try {
  const taxonomyValidation = core.validateCurriculumTaxonomy(taxonomy);
  if (!taxonomyValidation.valid) fail(`brainbite-core.mjs: ${taxonomyValidation.errors.join(' ')}`);
  if (taxonomy.skills.length !== 35) fail(`brainbite-core.mjs: expected 35 canonical skills, found ${taxonomy.skills.length}`);
  walk(registry.missions, 'experience-registry.js', '$.missions');
  registryRawValidAnswerSets = rawValidAnswerSets;
  console.log('OK experience-registry.js');
} catch (error) {
  failedMessages.push(`FAIL experience-registry.js ${error.message}`);
  console.error(`FAIL experience-registry.js ${error.message}`);
}

for (const file of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf8'));
    if (!isObject(data)) fail(`${file}: invalid root`);
    const items = [];
    walk(data, file, '$', {}, items);
    discoveredItems.push(...items);
    if (file === 'content-manifest.json') assertManifestParity(data);
    console.log('OK', file);
  } catch (error) {
    failedMessages.push(`FAIL ${file} ${error.message}`);
    console.error(`FAIL ${file} ${error.message}`);
  }
}

let linkage = null;
try {
  const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf8'));
  linkage = assertSidecar(sidecar, discoveredItems);
  console.log('OK', path.relative(repoRoot, sidecarPath).split(path.sep).join('/'));
} catch (error) {
  failedMessages.push(`FAIL ${sidecarFileName} ${error.message}`);
  console.error(`FAIL ${sidecarFileName} ${error.message}`);
}

if (failedMessages.length) process.exit(1);

const jsonAnswerSets = discoveredItems.length;
console.log(`Validated registry plus ${files.length} packs and ${rawValidAnswerSets} question sets.`);
console.log(`Answer counts (JSON packs): raw-valid=${jsonAnswerSets} taxonomy-linked=${linkage.taxonomyLinked} quarantined/unlinked=${linkage.quarantined}.`);
console.log(`All raw-answer sets: raw-valid=${rawValidAnswerSets} (registry=${registryRawValidAnswerSets}, json=${jsonAnswerSets}).`);
