const SUPPORT_LEVELS = Object.freeze(['independent', 'assisted', 'guided']);
const SCORED_ATTEMPTS = new WeakSet();

function normalizeTarget(value) {
  return String(value ?? '').normalize('NFC').trim();
}

function normalizeTyped(value) {
  return String(value ?? '').normalize('NFC');
}

function compareTyped(target, typed) {
  const expected = normalizeTarget(target);
  const actual = normalizeTyped(typed);
  const length = Math.max(expected.length, actual.length);
  let correct = 0;
  for (let index = 0; index < length; index += 1) {
    if (expected[index] && expected[index] === actual[index]) correct += 1;
  }
  const keystrokes = Math.max(actual.length, 0);
  const accuracy = keystrokes === 0 ? 0 : Math.max(0, Math.min(1, correct / Math.max(length, 1)));
  return { expected, actual, correctCharacters: correct, expectedCharacters: expected.length, keystrokes, accuracy };
}

function classifySupport({ hints = 0, readAloud = false, guided = false } = {}) {
  if (guided) return 'guided';
  if (readAloud || Number(hints) > 0) return 'assisted';
  return 'independent';
}

function scoreTypingAttempt({ target, typed, elapsedMs = 0, hints = 0, readAloud = false, guided = false } = {}) {
  const comparison = compareTyped(target, typed);
  const milliseconds = Number.isFinite(Number(elapsedMs)) ? Math.max(0, Number(elapsedMs)) : 0;
  const minutes = milliseconds / 60000;
  const wpm = minutes > 0 ? Math.round((comparison.actual.length / 5) / minutes) : 0;
  const support = classifySupport({ hints, readAloud, guided });
  const independent = support === 'independent';
  const correct = comparison.expected.length > 0 && comparison.expected === comparison.actual;
  const attemptId = normalizeTarget(arguments[0]?.attemptId);
  const plausibleTiming = comparison.expected.length > 0 && milliseconds >= Math.max(250, comparison.expected.length * 100);
  const result = Object.freeze({
    ...comparison,
    attemptId,
    elapsedMs: milliseconds,
    wpm: Math.max(0, wpm),
    support,
    independent,
    plausibleTiming,
    independentEligible: independent && plausibleTiming,
    correct,
    valid: !!attemptId && comparison.expected.length > 0,
  });
  SCORED_ATTEMPTS.add(result);
  return result;
}

function buildProgressSnapshot(attempts = []) {
  const seen = new Set();
  const list = (Array.isArray(attempts) ? attempts : []).filter(attempt => {
    if (!SCORED_ATTEMPTS.has(attempt) || !attempt.valid || !attempt.attemptId || seen.has(attempt.attemptId)) return false;
    seen.add(attempt.attemptId);
    return true;
  });
  const total = list.length;
  const correct = list.filter(attempt => attempt.correct).length;
  const independentAttempts = list.filter(attempt => attempt.independentEligible);
  const independentCorrect = independentAttempts.filter(attempt => attempt.correct).length;
  const accuracy = total ? correct / total : 0;
  const characterAccuracy = total ? list.reduce((sum, attempt) => sum + attempt.accuracy, 0) / total : 0;
  const independentAccuracy = independentAttempts.length ? independentCorrect / independentAttempts.length : 0;
  const confidence = Math.max(0, Math.min(1, independentAccuracy * 0.6 + characterAccuracy * 0.25 + accuracy * 0.15));
  return Object.freeze({
    attempts: total,
    correct,
    accuracy,
    characterAccuracy,
    independentAttempts: independentAttempts.length,
    independentCorrect,
    independentAccuracy,
    confidence,
    masteryEligible: independentAttempts.length >= 4 && independentAccuracy >= 0.8 && confidence >= 0.75,
  });
}

export { SUPPORT_LEVELS, normalizeTarget, normalizeTyped, compareTyped, classifySupport, scoreTypingAttempt, buildProgressSnapshot };

if (typeof window !== 'undefined') {
  window.BrainBiteTyping = Object.freeze({
    SUPPORT_LEVELS,
    normalizeTarget,
    normalizeTyped,
    compareTyped,
    classifySupport,
    scoreTypingAttempt,
    buildProgressSnapshot,
  });
}
