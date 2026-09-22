import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { stagedRoot, verifyNativeShell } from '../scripts/native/verify-shell.mjs';

test('native package uses staged assets without an HTTP listener', () => {
  const result = verifyNativeShell();
  assert.ok(result.shellFiles >= 5);
  assert.ok(result.stagedFiles > 20);
  assert.equal(fs.existsSync(path.join(stagedRoot, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(stagedRoot, 'app.js')), true);
  assert.equal(fs.existsSync(path.join(stagedRoot, 'presentation', 'boot.mjs')), true);
});
