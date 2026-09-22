import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  'release/v14-evidence.json',
  'docs/RELEASE_EVIDENCE.md',
  'docs/BATCH_8_EXTERNAL_LAUNCH_PLAN.md',
  'docs/BATCH_8_STATUS_TRACKER.md',
  'docs/CURSOR_HANDOFF.md',
  'TEST_RESULTS.md'
];

let failed = false;
const allowForeignCheckout = process.argv.includes('--allow-foreign-checkout');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`);
    failed = true;
  }
}

if (!failed) {
  const evidence = JSON.parse(fs.readFileSync('release/v14-evidence.json', 'utf8'));
  const expected = {
    command: 'npm run release:check',
    result: 'PASS',
    contentPacksValidated: 29,
    questionSetsValidated: 40,
    unitTests: 123,
    playwrightTests: 118
  };

  for (const [key, value] of Object.entries(expected)) {
    if (evidence.automatedGate?.[key] !== value) {
      console.error(`Evidence mismatch for automatedGate.${key}`);
      failed = true;
    }
  }

  if (!Array.isArray(evidence.verifiedSurface) || evidence.verifiedSurface.length < 10) {
    console.error('Evidence verifiedSurface is incomplete');
    failed = true;
  }

  if (!Array.isArray(evidence.manualGateRequired) || evidence.manualGateRequired.length < 5) {
    console.error('Evidence manualGateRequired is incomplete');
    failed = true;
  }

  if (evidence.nextPhaseDoc !== 'docs/GATE_8_4_OPERATOR_CHECKLIST.md') {
    console.error('Evidence nextPhaseDoc is incorrect');
    failed = true;
  }

  try {
    if (allowForeignCheckout) {
      console.log('Evidence checkout provenance comparison skipped explicitly for CI.');
    } else {
    const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (evidence.git?.branch !== branch) {
      console.error(`Evidence branch mismatch: recorded ${evidence.git?.branch}, current ${branch}`);
      failed = true;
    }
    if (evidence.git?.commit !== commit) {
      console.error(`Evidence commit mismatch: recorded ${evidence.git?.commit}, current ${commit}`);
      failed = true;
    }
    if (evidence.git?.workingTreeClean === true && execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) {
      console.error('Evidence claims a clean working tree, but current working tree is dirty');
      failed = true;
    }
    }
  } catch (error) {
    console.error(`Unable to verify git provenance: ${error.message}`);
    failed = true;
  }

  const doc = fs.readFileSync('docs/RELEASE_EVIDENCE.md', 'utf8');
  for (const token of ['Automated Gate', 'Remaining External Gates', 'Cursor Continuation Rule']) {
    if (!doc.includes(token)) {
      console.error(`Release evidence doc missing section: ${token}`);
      failed = true;
    }
  }

  const tracker = fs.readFileSync('docs/BATCH_8_STATUS_TRACKER.md', 'utf8');
  for (const token of ['Gate 8.1 Real Git Checkout', 'Gate 8.4 Real Device Matrix', 'Closeout']) {
    if (!tracker.includes(token)) {
      console.error(`Batch 8 tracker missing section: ${token}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Release evidence validated.');
