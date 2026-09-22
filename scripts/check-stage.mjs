#!/usr/bin/env node
// Fails when the closed-beta runtime package is incomplete or leaks developer material.
//
// The native/offline package is built from an explicit allowlist. Adding a runtime file
// without updating that list silently ships a broken app: `fonts.css`, `sw-register.js`,
// and the font files were all missing from the package until this check existed.
//
// Usage: node scripts/check-stage.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const stageRoot = resolve(repoRoot, '.native-site-check');

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

// Every precached asset must ship, or the installed app cannot work offline.
const sw = readFileSync(resolve(repoRoot, 'service-worker.js'), 'utf8');
const precached = [...new Set([...sw.matchAll(/['"]\.\/([^'"]+)['"]/g)].map(match => match[1]))];
for (const asset of precached) {
  if (!staged.has(asset)) problems.push(`precached asset is not staged: ${asset}`);
}

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
  const { buildManifest } = await import('./package-manifest.mjs');
  const actual = (await buildManifest(stageRoot)).files;
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

console.log(`staged package: ${staged.size} files; ${precached.length} precached asset(s), ${references.length} index.html reference(s), ${manifestChecked} manifest entr(ies) checked`);
if (problems.length) {
  console.error(`\n${problems.length} package problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nUpdate scripts/stage-site.mjs so the runtime package matches what the app loads.');
  process.exit(1);
}
console.log('The closed-beta package is complete and free of developer material.');
