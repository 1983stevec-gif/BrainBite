#!/usr/bin/env node
/**
 * Fails when CI does not run the complete Playwright testMatch through every
 * partition of its shard matrix, or pins individual specs that can drift.
 */
import { readFileSync } from 'node:fs';

const CONFIG = 'playwright.config.js';
const WORKFLOW = '.github/workflows/ci.yml';

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

const workflow = readFileSync(WORKFLOW, 'utf8');
// Comments do not execute specs and must not be mistaken for pinned test arguments.
const activeWorkflow = workflow
  .split(/\r?\n/)
  .filter(line => !line.trimStart().startsWith('#'))
  .map(line => line.replace(/\s+#.*$/, ''))
  .join('\n');
const lines = activeWorkflow.split('\n');
const e2eLineIndexes = lines
  .map((line, index) => line.includes('npm run test:e2e') ? index : -1)
  .filter(index => index !== -1);
const problems = [];

const pinnedSpecs = [...new Set(
  [...activeWorkflow.matchAll(/(?:tests\/)?[A-Za-z0-9_./-]+\.spec\.(?:[cm]?js|tsx?)/g)]
    .map(match => match[0]),
)];
if (pinnedSpecs.length) {
  problems.push(`CI pins individual spec(s): ${pinnedSpecs.join(', ')}`);
}

let matrixShards = [];
let shardTotal = null;
if (e2eLineIndexes.length !== 1) {
  problems.push(`Expected exactly one CI test:e2e invocation, found ${e2eLineIndexes.length}`);
} else {
  const commandIndex = e2eLineIndexes[0];
  let jobStart = commandIndex;
  while (jobStart >= 0 && !/^  [A-Za-z0-9_-]+:\s*$/.test(lines[jobStart])) jobStart -= 1;
  let jobEnd = commandIndex + 1;
  while (jobEnd < lines.length && !/^  [A-Za-z0-9_-]+:\s*$/.test(lines[jobEnd])) jobEnd += 1;
  const job = lines.slice(Math.max(0, jobStart), jobEnd).join('\n');
  const matrixMatch = job.match(/^\s*shard:\s*\[([^\]]+)\]\s*$/m);
  if (!matrixMatch) {
    problems.push('The CI test:e2e job has no literal shard matrix');
  } else {
    matrixShards = matrixMatch[1].split(',').map(value => Number(value.trim()));
    if (matrixShards.some(value => !Number.isInteger(value) || value < 1)) {
      problems.push(`The CI shard matrix is invalid: [${matrixMatch[1]}]`);
    }
  }

  const shardMatch = lines[commandIndex].match(/--shard\s*=\s*\$\{\{\s*matrix\.shard\s*\}\}\s*\/\s*(\d+)/);
  if (!shardMatch) {
    problems.push('The CI test:e2e command must use --shard=${{ matrix.shard }}/TOTAL');
  } else {
    shardTotal = Number(shardMatch[1]);
  }
}

if (matrixShards.length && shardTotal !== null) {
  const expectedShards = Array.from({ length: shardTotal }, (_, index) => index + 1);
  if (matrixShards.length !== expectedShards.length || matrixShards.some((value, index) => value !== expectedShards[index])) {
    problems.push(`The CI shard matrix [${matrixShards.join(', ')}] does not cover every shard from 1 through ${shardTotal}`);
  }
}

const shardSummary = shardTotal === null ? 'unknown shard total' : `${matrixShards.length}/${shardTotal} shard(s)`;
console.log(`CI coverage: ${specs.length} configured spec(s), ${shardSummary}`);
if (problems.length) {
  console.error(`\n${problems.length} CI coverage problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(`\nRun test:e2e through a complete shard matrix without literal spec paths in ${WORKFLOW}.`);
  process.exit(1);
}
