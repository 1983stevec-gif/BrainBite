#!/usr/bin/env node
// Fails when the service worker precaches something that is not on disk, and verifies
// generated font integrity.
//
// `cache.addAll` is all-or-nothing, so a single missing URL makes the whole install
// reject and offline support disappears. Nothing enforced that before this check.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const problems = [];
const REQUIRED_PRECACHE_LISTS = ['CORE', 'OFFLINE_CONTENT'];
// The current mandatory install inventory is 40 CORE URLs (including './') plus 30
// OFFLINE_CONTENT URLs. Keep that baseline from silently shrinking or becoming empty.
const MINIMUM_PRECACHE_URLS = 70;

const sw = readFileSync('service-worker.js', 'utf8');
const urls = [...new Set([...sw.matchAll(/['"]\.\/([^'"]+)['"]/g)].map(match => match[1]))];
const missing = urls.filter(path => !existsSync(path));
for (const path of missing) problems.push(`service-worker.js precaches missing file: ${path}`);

const precacheUrls = new Set();
for (const name of REQUIRED_PRECACHE_LISTS) {
  const list = sw.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!list) {
    problems.push(`service-worker.js is missing required precache list ${name}`);
    continue;
  }
  for (const match of list[1].matchAll(/(['"])(\.\/[^'"]*)\1/g)) precacheUrls.add(match[2]);
}
if (precacheUrls.size < MINIMUM_PRECACHE_URLS) {
  problems.push(`service-worker.js mandatory precache inventory has ${precacheUrls.size} URL(s); expected at least ${MINIMUM_PRECACHE_URLS}`);
}

// Comments cannot prove wiring: inspect the install listener after removing them, then require
// every mandatory list to be passed to cache.addAll somewhere in that install path.
const uncommented = sw
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
const installStart = uncommented.search(/self\.addEventListener\(\s*['"]install['"]/);
const nextListener = installStart < 0 ? -1 : uncommented.indexOf('self.addEventListener', installStart + 1);
const installPath = installStart < 0 ? '' : uncommented.slice(installStart, nextListener < 0 ? undefined : nextListener);
const addAllArguments = [...installPath.matchAll(/cache\.addAll\s*\(([^)]*)\)/g)].map(match => match[1]);
if (!installPath) problems.push('service-worker.js has no install event path');
if (!addAllArguments.length) problems.push('service-worker.js install path does not call cache.addAll');
for (const name of REQUIRED_PRECACHE_LISTS) {
  if (!addAllArguments.some(argument => new RegExp(`\\b${name}\\b`).test(argument))) {
    problems.push(`service-worker.js install cache.addAll does not consume required precache list ${name}`);
  }
}

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

console.log(`precache: ${urls.length} URL(s) checked, ${missing.length} missing; ${precacheUrls.size} mandatory install URL(s); fonts: ${fontsChecked} hash(es) verified`);
if (problems.length) {
  console.error(`\n${problems.length} asset integrity problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log('Every precached asset exists, mandatory lists reach install cache.addAll, and every generated font matches its recorded hash.');
