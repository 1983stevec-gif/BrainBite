import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, deserializeProject, resetProject, runProject, serializeProject } from '../content/code-lab.mjs';

test('Code Lab projects execute only safe bridge programs and report success', () => {
  const project = createProject({ id: 'first-bridge', name: 'First Bridge', program: 'bridge.open()\ngate.unlock()' });
  const result = runProject(project);
  assert.equal(result.success, true);
  assert.equal(result.project.lastRun.success, true);
  assert.equal(result.result.trace.length, 2);
  assert.throws(() => createProject({ id: 'unsafe', program: 'fetch()' }), /Unsupported command/);
});

test('Code Lab serialization is versioned and reset clears run history', () => {
  const project = createProject({ id: 'reset-me', program: 'bridge.open()\ngate.unlock()' });
  const ran = runProject(project).project;
  const restored = deserializeProject(serializeProject(ran));
  assert.equal(restored.id, 'reset-me');
  assert.equal(restored.lastRun.success, true);
  assert.equal(resetProject(restored).lastRun, null);
  assert.throws(() => deserializeProject(JSON.stringify({ schemaVersion: 99 })), /Unsupported/);
});
