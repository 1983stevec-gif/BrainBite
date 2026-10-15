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
const groupsBlock = certification.match(/const\s+browserGroups\s*=\s*\[([\s\S]*?)\n\s*\];/);
if (!groupsBlock) {
  console.error(`Could not read browserGroups from ${CERTIFICATION}; the coverage check cannot run.`);
  process.exit(1);
}

// Only quoted spec paths inside literal browser-group entries count. In particular, a spec
// name in a nearby comment is not evidence that the certification executes that spec.
const certificationSpecs = [];
const uncommentedGroups = groupsBlock[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
for (const entry of uncommentedGroups.matchAll(/^\s*\[\s*(['"])[^'"\r\n]+\1\s*,([^\]\r\n]*)\]\s*,?\s*$/gm)) {
  for (const spec of entry[2].matchAll(/(['"])(tests\/[^'"\r\n]+\.spec\.js)\1/g)) {
    certificationSpecs.push(spec[2].replace(/^\.\//, '').replace(/^tests\//, ''));
  }
}
const configuredSpecs = new Set(specs.map(spec => spec.replace(/^\.\//, '').replace(/^tests\//, '')));
const coveredSpecs = new Set(certificationSpecs);

for (const spec of configuredSpecs) {
  if (!existsSync(`tests/${spec}`)) {
    problems.push(`tests/${spec} is in the ${CONFIG} testMatch but does not exist`);
    continue;
  }
  if (!coveredSpecs.has(spec)) {
    problems.push(`tests/${spec} runs in the config but is in no certification group`);
  }
}
for (const spec of coveredSpecs) {
  if (!configuredSpecs.has(spec)) problems.push(`tests/${spec} is in a certification group but not in the ${CONFIG} testMatch`);
}

console.log(`certification coverage: ${configuredSpecs.size} configured spec(s), ${coveredSpecs.size} grouped spec(s)`);
if (problems.length) {
  console.error(`\n${problems.length} certification coverage problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nMake the literal browser-group spec paths exactly match the Playwright testMatch.');
  process.exit(1);
}
console.log('The configured and certified browser spec sets match exactly.');
