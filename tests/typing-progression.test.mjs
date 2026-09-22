import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProgressSnapshot, classifySupport, scoreTypingAttempt } from '../content/typing-progression.mjs';

test('typing scoring reports normalized accuracy and WPM', () => {
  const result = scoreTypingAttempt({ attemptId: 'a1', target: 'forest', typed: 'forest', elapsedMs: 30000 });
  assert.equal(result.correct, true);
  assert.equal(result.accuracy, 1);
  assert.equal(result.wpm, 2);
  assert.equal(result.support, 'independent');
});

test('assistance is distinct from independent typing evidence', () => {
  assert.equal(classifySupport({ hints: 1 }), 'assisted');
  assert.equal(classifySupport({ readAloud: true }), 'assisted');
  assert.equal(classifySupport({ guided: true, hints: 0 }), 'guided');
  const snapshot = buildProgressSnapshot([
    scoreTypingAttempt({ attemptId: 'a2', target: 'cat', typed: 'cat', elapsedMs: 1000, hints: 1 }),
    scoreTypingAttempt({ attemptId: 'a3', target: 'dog', typed: 'dog', elapsedMs: 1000 }),
  ]);
  assert.equal(snapshot.correct, 2);
  assert.equal(snapshot.independentAttempts, 1);
  assert.equal(snapshot.independentCorrect, 1);
});

test('rapid random answers cannot become mastery', () => {
  const attempts = Array.from({ length: 12 }, (_, index) => scoreTypingAttempt({
    attemptId: `random-${index}`, target: `word-${index}`,
    typed: `guess-${index}`,
    elapsedMs: 20,
  }));
  const snapshot = buildProgressSnapshot(attempts);
  assert.equal(snapshot.correct, 0);
  assert.equal(snapshot.masteryEligible, false);
});

test('mastery requires repeated independent evidence rather than one lucky answer', () => {
  const attempts = [
    scoreTypingAttempt({ attemptId: 'a4', target: 'a', typed: 'a', elapsedMs: 1000 }),
    scoreTypingAttempt({ attemptId: 'a5', target: 'b', typed: 'b', elapsedMs: 1000 }),
    scoreTypingAttempt({ attemptId: 'a6', target: 'c', typed: 'c', elapsedMs: 1000 }),
  ];
  assert.equal(buildProgressSnapshot(attempts).masteryEligible, false);
  const mature = buildProgressSnapshot([...attempts, scoreTypingAttempt({ attemptId: 'a7', target: 'd', typed: 'd', elapsedMs: 1000 })]);
  assert.equal(mature.masteryEligible, true);
});

test('invalid, duplicate, and implausibly rapid evidence cannot grant mastery', () => {
  const blank = scoreTypingAttempt({ attemptId: 'blank', target: '   ', typed: '', elapsedMs: 30000 });
  const rapid = scoreTypingAttempt({ attemptId: 'rapid', target: 'a', typed: 'a', elapsedMs: 20 });
  assert.equal(blank.valid, false);
  assert.equal(blank.correct, false);
  assert.equal(rapid.independentEligible, false);
  const valid = scoreTypingAttempt({ attemptId: 'same', target: 'forest', typed: 'forest', elapsedMs: 30000 });
  const snapshot = buildProgressSnapshot([valid, valid, { ...valid, correct: false }, { ...valid, attemptId: 'forged', correct: true, valid: false }]);
  assert.equal(snapshot.attempts, 1);
  assert.equal(snapshot.masteryEligible, false);
  const forged = Array.from({ length: 4 }, (_, index) => ({ attemptId: `fake-${index}`, valid: true, correct: true, independentEligible: true, accuracy: 1 }));
  assert.equal(buildProgressSnapshot(forged).masteryEligible, false);
  const clones = Array.from({ length: 4 }, (_, index) => ({ ...valid, attemptId: `clone-${index}` }));
  assert.equal(buildProgressSnapshot(clones).masteryEligible, false);
});
