#!/usr/bin/env node
// Fails when the closed-beta runtime package is incomplete or leaks developer material.
//
// The native/offline package is built from an explicit allowlist. Adding a runtime file
// without updating that list silently ships a broken app: `fonts.css`, `sw-register.js`,
// and the font files were all missing from the package until this check existed.
//
// Usage: node scripts/check-stage.mjs
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildManifest } from './package-manifest.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const stageRoot = resolve(repoRoot, '.native-site-check');
const CACHE_PREFIX = 'brainbite-v2.0-shell-runtime-';
const CACHE_PROBLEM_PREFIX = 'service-worker CACHE mismatch:';

export function runtimeFingerprint(files) {
  const canonical = Object.keys(files)
    .filter(relativePath => relativePath !== 'service-worker.js')
    .sort((left, right) => left.localeCompare(right, 'en'))
    .map(relativePath => `${relativePath}\0${files[relativePath].sha256}\n`)
    .join('');
  return createHash('sha256').update(canonical).digest('hex');
}

export function expectedRuntimeCache(files) {
  return `${CACHE_PREFIX}${runtimeFingerprint(files)}`;
}

export function parseStaticCacheName(source) {
  const declaration = source.match(/^\uFEFF?[ \t]*const[ \t]+CACHE[ \t]*=[ \t]*(['"])([^'"\r\n]*)\1[ \t]*;[ \t]*(?:\r?\n|$)/);
  return declaration ? declaration[2] : null;
}

export function runtimeCacheProblem(files, serviceWorkerSource) {
  const expected = expectedRuntimeCache(files);
  const found = parseStaticCacheName(serviceWorkerSource);
  if (found === expected) return null;
  const displayedFound = found === null ? '<not a plain string literal>' : found;
  return `${CACHE_PROBLEM_PREFIX} expected "${expected}"; found "${displayedFound}". Set CACHE to "${expected}" then run npm run package:manifest.`;
}

async function main() {
  execFileSync(process.execPath, [resolve(repoRoot, 'scripts/stage-site.mjs'), stageRoot], { cwd: repoRoot, stdio: 'pipe' });

  const problems = [];
  const staged = new Set();
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(resolve(dir, entry.name), relative);
      else staged.add(relative);
    }
  };
  walk(stageRoot);

  // Calculate the cache key from the staged package, never from the recorded manifest. This
  // means regenerating a stale manifest cannot hide a runtime change that needs a new cache.
  const actual = (await buildManifest(stageRoot)).files;

  // Every precached asset must ship, or the installed app cannot work offline.
  const sw = readFileSync(resolve(repoRoot, 'service-worker.js'), 'utf8');
  const precached = [...new Set([...sw.matchAll(/['"]\.\/([^'"]+)['"]/g)].map(match => match[1]))];
  for (const asset of precached) {
    if (!staged.has(asset)) problems.push(`precached asset is not staged: ${asset}`);
  }

  const cacheProblem = runtimeCacheProblem(actual, sw);
  if (cacheProblem) problems.push(cacheProblem);

  // Every local file index.html pulls in must ship.
  const html = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)="(?!https?:|#|mailto:)([^"]+)"/g)].map(match => match[1].replace(/^\.\//, ''));
  for (const reference of references) {
    if (!staged.has(reference)) problems.push(`index.html references an unstaged file: ${reference}`);
  }

  // Generated fonts are referenced from fonts.css rather than index.html.
  const fontsCss = readFileSync(resolve(repoRoot, 'fonts.css'), 'utf8');
  for (const match of fontsCss.matchAll(/url\('([^']+)'\)/g)) {
    if (!staged.has(match[1])) problems.push(`fonts.css references an unstaged file: ${match[1]}`);
  }

  // Developer material must never ship.
  const forbidden = ['docs', 'tests', 'scripts', 'release-evidence', 'node_modules', 'AGENTS.md', 'package.json'];
  for (const relative of forbidden) {
    if (staged.has(relative) || existsSync(resolve(stageRoot, relative))) problems.push(`developer-only path leaked into the package: ${relative}`);
  }

  // The integrity manifest must describe exactly this package. Regenerate it with
  // `npm run package:manifest` whenever the runtime allowlist or a runtime file changes.
  const manifestPath = resolve(repoRoot, 'release-evidence', 'package-manifest.json');
  let manifestChecked = 0;
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const recorded = manifest.files || {};
    for (const [relative, entry] of Object.entries(recorded)) {
      const current = actual[relative];
      if (!current) { problems.push(`package manifest lists a file that is not packaged: ${relative}`); continue; }
      manifestChecked += 1;
      if (current.sha256 !== entry.sha256) problems.push(`package manifest digest mismatch: ${relative}`);
    }
    for (const relative of Object.keys(actual)) {
      if (!recorded[relative]) problems.push(`packaged file missing from the manifest: ${relative}`);
    }
  } else {
    problems.push('release-evidence/package-manifest.json is missing; run npm run package:manifest');
  }

  rmSync(stageRoot, { recursive: true, force: true });

  console.log(`runtime cache: ${expectedRuntimeCache(actual)}; ${cacheProblem ? 'CACHE mismatch' : 'CACHE matches'}`);
  console.log(`staged package: ${staged.size} files; ${precached.length} precached asset(s), ${references.length} index.html reference(s), ${manifestChecked} manifest entr(ies) checked`);
  if (problems.length) {
    console.error(`\n${problems.length} package problem(s):`);
    for (const problem of problems) console.error(`  ${problem}`);
    // A digest mismatch means the manifest is simply stale, and the fix is to regenerate it.
    // Cache-key failures carry their own exact remediation and do not turn manifest drift into
    // a staging-rule failure.
    const nonCacheProblems = problems.filter(problem => !problem.startsWith(CACHE_PROBLEM_PREFIX));
    const onlyDigestDrift = nonCacheProblems.length > 0
      && nonCacheProblems.every(problem => /digest mismatch|missing from the manifest/.test(problem));
    if (onlyDigestDrift) console.error('\nRun npm run package:manifest to record the current files.');
    else if (nonCacheProblems.length) console.error('\nUpdate scripts/stage-site.mjs so the runtime package matches what the app loads.');
    process.exit(1);
  }
  console.log('The closed-beta package is complete and free of developer material.');
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename);
if (invokedDirectly) await main();
