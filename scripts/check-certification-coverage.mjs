#!/usr/bin/env node
/**
 * Fails when a browser spec the Playwright config runs is missing from the local
 * certification groups.
 *
 * `tests/bubble-reef-preview.spec.js` was in the config's `testMatch` but in no
 * certification group, so `npm run certify:local` ran 159 of the 161 browser tests and
 * still reported a clean sweep. A certification that silently skips specs is worse than
 * no certification, because it looks complete.
 */
import { existsSync, readFileSync } from 'node:fs';

const CONFIG = 'playwright.config.js';
const CERTIFICATION = 'scripts/certify-local-release.mjs';

const config = readFileSync(CONFIG, 'utf8');
const matchBlock = config.match(/testMatch:\s*\[([^\]]*)\]/);
if (!matchBlock) {
  console.error(`Could not read testMatch from ${CONFIG}; the coverage check cannot run.`);
  process.exit(1);
}

const specs = [...matchBlock[1].matchAll(/'([^']+\.spec\.js)'/g)].map(match => match[1]);
if (!specs.length) {
  console.error(`No specs found in the ${CONFIG} testMatch.`);
  process.exit(1);
}

const certification = readFileSync(CERTIFICATION, 'utf8');
const problems = [];

for (const spec of specs) {
  if (!existsSync(`tests/${spec}`)) {
    problems.push(`tests/${spec} is in the ${CONFIG} testMatch but does not exist`);
    continue;
  }
  if (!certification.includes(spec)) {
    problems.push(`tests/${spec} runs in the config but is in no certification group`);
  }
}

console.log(`certification coverage: ${specs.length} configured spec(s) checked against ${CERTIFICATION}`);
if (problems.length) {
  console.error(`\n${problems.length} spec(s) the local certification would skip:`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nAdd the spec to a browser group in the certification runner.');
  process.exit(1);
}
console.log('Every configured browser spec runs in the local certification.');
