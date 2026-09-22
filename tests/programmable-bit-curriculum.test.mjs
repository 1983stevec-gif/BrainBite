import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, availableLessons, selectLesson, validateLesson } from '../content/programmable-bit-curriculum.mjs';

test('Programmable Bit lessons are deterministic and bounded to allowlisted actions', () => {
  assert.equal(LESSONS.length, 4);
  assert.deepEqual(LESSONS.map(lesson => lesson.id), [
    'bit-first-spark',
    'bit-kind-cheer',
    'bit-collect-move',
    'bit-jungle-routine',
  ]);
  assert.deepEqual(LESSONS.map(lesson => lesson.targetEvent), ['correct', 'mistake', 'collect', 'correct']);
  for (const lesson of LESSONS) {
    assert.equal(validateLesson(lesson).actions.length, lesson.behaviorSteps.length);
    assert.equal(Object.isFrozen(lesson), true);
    assert.equal(Object.isFrozen(lesson.behaviorSteps), true);
  }
  assert.deepEqual(availableLessons({}).map(lesson => lesson.id), ['bit-first-spark']);
  assert.deepEqual(availableLessons({}).map(lesson => lesson.id), ['bit-first-spark']);
});

test('Programmable Bit lessons unlock in prerequisite order and select deterministically', () => {
  const first = { 'bit-first-spark': { masteryScore: 80 } };
  const second = { ...first, 'bit-kind-cheer': { confidence: 0.8 } };
  const third = { ...second, 'bit-collect-move': { masteryState: 'Mastered' } };
  assert.deepEqual(availableLessons(first).map(lesson => lesson.id), ['bit-kind-cheer']);
  assert.equal(selectLesson(first).id, 'bit-kind-cheer');
  assert.deepEqual(availableLessons(second).map(lesson => lesson.id), ['bit-collect-move']);
  assert.deepEqual(availableLessons(third).map(lesson => lesson.id), ['bit-jungle-routine']);
  assert.deepEqual(availableLessons(new Map(Object.entries(first))).map(lesson => lesson.id), ['bit-kind-cheer']);
  assert.equal(selectLesson({}, { difficulty: 'hard' }), null);
});

test('Programmable Bit lesson validation rejects empty IDs, malformed prerequisites, and unsafe actions', () => {
  const base = LESSONS[0];
  assert.throws(() => validateLesson({ ...base, id: '   ' }), /non-empty id/);
  assert.throws(() => validateLesson({ ...base, prerequisites: ['not-a-real-lesson'] }), /Unknown lesson prerequisite/);
  assert.throws(() => validateLesson({ ...base, prerequisites: [null] }), /valid lesson IDs/);
  assert.throws(() => validateLesson({ ...base, behaviorSteps: ['globalThis.alert(1)'] }), /Unsupported Bit action/);
  assert.throws(() => validateLesson({ ...base, behaviorSteps: [] }), /contain an action/);
});

test('Programmable Bit lessons remain explicitly in production internal review', () => {
  for (const lesson of LESSONS) {
    assert.equal(lesson.reviewStatus, 'internal-review');
    assert.equal(Object.hasOwn(lesson, 'approved'), false);
    assert.equal(Object.hasOwn(lesson, 'educatorApproved'), false);
  }
  assert.throws(() => validateLesson({ ...LESSONS[0], reviewStatus: 'approved' }), /internal-review/);
  assert.throws(() => validateLesson({ ...LESSONS[0], educatorApproved: true }), /cannot claim educator approval/);
});
