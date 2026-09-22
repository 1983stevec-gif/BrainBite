import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, availableLessons, selectLesson, validateLesson } from '../content/code-bridge-curriculum.mjs';

test('Coding Bridge curriculum lessons are deterministic and allowlisted', () => {
  assert.equal(LESSONS.length, 4);
  assert.deepEqual(LESSONS.map(lesson => lesson.id), ['bridge-basics', 'bridge-gate', 'bridge-platform', 'bridge-expert']);
  for (const lesson of LESSONS) assert.equal(validateLesson(lesson).commands.length > 0, true);
  assert.throws(() => validateLesson({ id: 'unsafe', program: 'fetch()' }), /Unsupported command/);
});

test('Coding Bridge curriculum unlocks lessons through evidence prerequisites', () => {
  assert.deepEqual(availableLessons({}).map(lesson => lesson.id), ['bridge-basics']);
  const basics = { 'bridge-basics': { masteryScore: 80 } };
  assert.deepEqual(availableLessons(basics).map(lesson => lesson.id), ['bridge-gate']);
  assert.equal(selectLesson(basics).id, 'bridge-gate');
  const all = { 'bridge-basics': { masteryScore: 80 }, 'bridge-gate': { confidence: 0.8 }, 'bridge-platform': { masteryState: 'Mastered' } };
  assert.deepEqual(availableLessons(all).map(lesson => lesson.id), ['bridge-expert']);
});

test('Coding Bridge curriculum rejects unsupported or empty lesson programs', () => {
  assert.throws(() => validateLesson({ id: 'empty', program: '# comment only' }), /contain a command/);
  assert.throws(() => validateLesson({ id: 'unsafe', program: 'globalThis.process.exit()' }), /Unsupported command/);
});
