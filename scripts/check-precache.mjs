#!/usr/bin/env node
// Fails when the service worker precaches something that is not on disk, and verifies
// generated font integrity.
//
// `cache.addAll` is all-or-nothing, so a single missing URL makes the whole install
// reject and offline support disappears. Nothing enforced that before this check.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const problems = [];

const sw = readFileSync('service-worker.js', 'utf8');
const urls = [...new Set([...sw.matchAll(/['"]\.\/([^'"]+)['"]/g)].map(match => match[1]))];
const missing = urls.filter(path => !existsSync(path));
for (const path of missing) problems.push(`service-worker.js precaches missing file: ${path}`);

// Font integrity: fonts.css records the sha256 of every generated font file.
let fontsChecked = 0;
if (existsSync('fonts.css')) {
  const css = readFileSync('fonts.css', 'utf8');
  for (const match of css.matchAll(/\/\*\s*sha256:([0-9a-f]{64})\s+(\S+)\s*\*\//g)) {
    const [, expected, file] = match;
    if (!existsSync(file)) { problems.push(`fonts.css references missing font: ${file}`); continue; }
    const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
    fontsChecked += 1;
    if (actual !== expected) problems.push(`font integrity mismatch: ${file} (expected ${expected.slice(0, 16)}…, found ${actual.slice(0, 16)}…)`);
  }
}

console.log(`precache: ${urls.length} URL(s) checked, ${missing.length} missing; fonts: ${fontsChecked} hash(es) verified`);
if (problems.length) {
  console.error(`\n${problems.length} asset integrity problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log('Every precached asset exists and every generated font matches its recorded hash.');
