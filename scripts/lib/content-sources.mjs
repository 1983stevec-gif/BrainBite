// Shared source loading and resolution for the content review tools.
//
// The validator resolves the same values for its digest expectations. This module mirrors
// that resolution, and every tool that uses it re-verifies the computed digest against the
// manifest, so a resolver mistake fails loudly instead of silently approving wrong content.
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolvePath(here, '..', '..');

export async function loadSources() {
  const require = createRequire(import.meta.url);
  const registry = require(resolvePath(repoRoot, 'content/experience-registry.js'));
  const core = await import(pathToFileURL(resolvePath(repoRoot, 'brainbite-core.mjs')).href);
  return { registry, core };
}

export function jsonPathTokens(jsonPath) {
  if (typeof jsonPath !== 'string' || !jsonPath.startsWith('$')) return null;
  const tokens = [];
  const matcher = /(?:\.([A-Za-z0-9_-]+)|\[(\d+)\]|\["([^"]+)"\])/g;
  const tail = jsonPath.slice(1);
  let consumed = 0;
  let match;
  while ((match = matcher.exec(tail))) {
    if (match.index !== consumed) return null;
    tokens.push(match[1] !== undefined ? match[1] : match[2] !== undefined ? Number(match[2]) : match[3]);
    consumed = matcher.lastIndex;
  }
  return consumed === tail.length ? tokens : null;
}

export function valueAtJsonPath(value, jsonPath) {
  const tokens = jsonPathTokens(jsonPath);
  if (!tokens) return undefined;
  return tokens.reduce((current, token) => current?.[token], value);
}

// Resolves a manifest record's `source` to its live value.
export function resolveRecordValue(record, sources) {
  const { file, export: exportName, path: jsonPath } = record.source || {};
  if (!file) return { value: undefined, reason: 'record has no source file' };
  const absolute = resolvePath(repoRoot, file);
  if (!existsSync(absolute)) return { value: undefined, reason: `missing source file ${file}` };

  if (file.endsWith('.json')) {
    try {
      const parsed = JSON.parse(readFileSync(absolute, 'utf8'));
      return { value: valueAtJsonPath(parsed, jsonPath), reason: null };
    } catch (error) {
      return { value: undefined, reason: `unreadable JSON (${error.message})` };
    }
  }

  // Manifest paths are relative to the source file's root (for example
  // `$.missions[0]` or `$.CURRICULUM_ITEM_TEMPLATES["math-k-counting"]`), which is exactly
  // how the validator resolves the same values for its digest expectations.
  const root = file.endsWith('experience-registry.js') ? sources.registry : sources.core;
  if (root === undefined) return { value: undefined, reason: `cannot load source root for ${file}` };
  return { value: valueAtJsonPath(root, jsonPath), reason: null };
}

// A reviewer-facing view of a record's content. Registry missions and generated templates
// share prompt/answers/distractors; JSON pack items vary, so unknown shapes pass through.
export function describeContent(value) {
  if (!value || typeof value !== 'object') return { kind: 'opaque', preview: String(value ?? '') };
  const answers = value.answers || value.correct || value.targetSequence || value.platformOrder || null;
  const distractors = value.distractors || value.wrong || null;
  return {
    kind: 'prompt',
    prompt: value.prompt || value.title || value.question || '',
    answers: Array.isArray(answers) ? answers.map(String) : null,
    distractors: Array.isArray(distractors) ? distractors.map(String) : null,
    explanation: value.explanation || '',
    hint: value.hintMetadata?.hint || value.hint || '',
    skill: value.skill || value.skillId || value.curriculumSkillId || '',
    difficulty: value.difficulty ?? value.level ?? null,
    grade: value.grade ?? null,
    subject: value.subject ?? null,
  };
}
