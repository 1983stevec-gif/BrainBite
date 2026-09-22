#!/usr/bin/env node
// Fails when a script or test hardcodes a loopback port that is not the configured one.
//
// Two separate harnesses drifted to port 4317 while the Playwright global setup serves on
// 4318: `tests/webgl-accessibility.spec.js` (four tests that could never pass) and
// `scripts/probe-performance.mjs` (a probe that silently measured nothing). Both are
// fixed; this check keeps the next one from happening.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const CONFIG = 'playwright.config.js';
const configured = (() => {
  const text = readFileSync(CONFIG, 'utf8');
  const match = text.match(/BRAINBITE_TEST_PORT\s*\|\|\s*(\d+)/);
  return match ? match[1] : null;
})();

const files = [];
for (const dir of ['tests', 'scripts']) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.(mjs|js)$/.test(entry.name)) files.push(`${dir}/${entry.name}`);
  }
}

const LOOPBACK = /(?:127\.0\.0\.1|localhost):(\d{2,5})/g;
const problems = [];
for (const file of files) {
  // The config itself defines the port, the accessibility contract manages its own server,
  // and scratch files are ignored. The local certification runner used to be exempted here,
  // which hid a server on port 4317 that no test ever reached.
  if (file === CONFIG
    || file.endsWith('accessibility-contract.test.mjs')
    || file.includes('/.tmp-')) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const match of line.matchAll(LOOPBACK)) {
      if (match[1] === configured) continue;
      problems.push(`${file}:${index + 1} hardcodes loopback port ${match[1]} but ${CONFIG} serves on ${configured}`);
    }
  });
}

console.log(`test port drift: ${files.length} files checked against port ${configured}`);
if (problems.length) {
  console.error(`\n${problems.length} hardcoded port(s) that will not reach the test server:`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nDerive the port from BRAINBITE_TEST_PORT or PLAYWRIGHT_BASE_URL instead.');
  process.exit(1);
}
console.log('Every harness reaches the configured test server.');
