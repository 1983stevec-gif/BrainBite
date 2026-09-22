import { EVENTS, MAX_BEHAVIOR_STEPS, parseAction } from './programmable-bits.mjs';

const LESSON_ID = /^[a-z0-9][a-z0-9-]{0,47}$/;
const DIFFICULTIES = Object.freeze(['easy', 'normal', 'hard']);
const MAX_HINTS = 3;

const LESSONS = Object.freeze([
  Object.freeze({
    id: 'bit-first-spark',
    title: 'Make Bit Glow',
    difficulty: 'easy',
    prerequisites: Object.freeze([]),
    targetEvent: 'correct',
    behaviorSteps: Object.freeze(['glow']),
    hints: Object.freeze(['Choose the glow action.', 'A correct answer can make Bit shine.']),
    reviewStatus: 'internal-review',
  }),
  Object.freeze({
    id: 'bit-kind-cheer',
    title: 'Add a Cheer',
    difficulty: 'easy',
    prerequisites: Object.freeze(['bit-first-spark']),
    targetEvent: 'mistake',
    behaviorSteps: Object.freeze(['cheer']),
    hints: Object.freeze(['Choose the cheer action.', 'Bit can encourage another try.']),
    reviewStatus: 'internal-review',
  }),
  Object.freeze({
    id: 'bit-collect-move',
    title: 'Collect and Move',
    difficulty: 'normal',
    prerequisites: Object.freeze(['bit-kind-cheer']),
    targetEvent: 'collect',
    behaviorSteps: Object.freeze(['move(2)', 'collect']),
    hints: Object.freeze(['Use a move from 1 to 3.', 'Add collect after the move.']),
    reviewStatus: 'internal-review',
  }),
  Object.freeze({
    id: 'bit-jungle-routine',
    title: 'Build a Jungle Routine',
    difficulty: 'hard',
    prerequisites: Object.freeze(['bit-collect-move']),
    targetEvent: 'correct',
    behaviorSteps: Object.freeze(['glow', 'cheer', 'move(3)']),
    hints: Object.freeze(['A routine can use more than one action.', 'Finish with a bounded move.']),
    reviewStatus: 'internal-review',
  }),
]);

const LESSON_BY_ID = new Map(LESSONS.map(lesson => [lesson.id, lesson]));

function cloneStep(step) {
  return step && typeof step === 'object' ? Object.freeze({ ...step }) : step;
}

function cloneLesson(lesson) {
  return Object.freeze({
    id: lesson.id,
    title: lesson.title,
    difficulty: lesson.difficulty,
    prerequisites: Object.freeze([...lesson.prerequisites]),
    targetEvent: lesson.targetEvent,
    behaviorSteps: Object.freeze(lesson.behaviorSteps.map(cloneStep)),
    hints: Object.freeze([...lesson.hints]),
    reviewStatus: lesson.reviewStatus,
  });
}

function rejectApprovalMetadata(lesson) {
  const approvalKeys = ['approved', 'educatorApproved', 'educatorApproval', 'educatorReview'];
  if (approvalKeys.some(key => Object.hasOwn(lesson, key))) {
    throw new Error('Programmable Bit lessons cannot claim educator approval.');
  }
}

function validatePrerequisites(lesson) {
  if (!Array.isArray(lesson.prerequisites)) throw new TypeError('Lesson prerequisites must be an array.');
  const seen = new Set();
  for (const prerequisite of lesson.prerequisites) {
    if (typeof prerequisite !== 'string' || !LESSON_ID.test(prerequisite)) {
      throw new TypeError('Lesson prerequisites must use valid lesson IDs.');
    }
    if (seen.has(prerequisite)) throw new Error(`Duplicate lesson prerequisite: ${prerequisite}`);
    if (prerequisite === lesson.id) throw new Error('A lesson cannot require itself.');
    if (!LESSON_BY_ID.has(prerequisite)) throw new Error(`Unknown lesson prerequisite: ${prerequisite}`);
    seen.add(prerequisite);
  }
}

function validateLesson(lesson) {
  if (!lesson || typeof lesson !== 'object' || Array.isArray(lesson)) throw new TypeError('Lesson must be an object.');
  rejectApprovalMetadata(lesson);
  if (typeof lesson.id !== 'string' || !lesson.id.trim()) throw new TypeError('Lesson requires a non-empty id.');
  if (!LESSON_ID.test(lesson.id) || lesson.id !== lesson.id.trim()) throw new TypeError('Lesson id must use lowercase letters, numbers, and hyphens.');
  if (typeof lesson.title !== 'string' || !lesson.title.trim()) throw new TypeError('Lesson requires a title.');
  if (!DIFFICULTIES.includes(lesson.difficulty)) throw new TypeError('Lesson difficulty is unsupported.');
  validatePrerequisites(lesson);
  if (!EVENTS.includes(lesson.targetEvent)) throw new Error(`Unsupported Bit event: ${String(lesson.targetEvent)}`);
  if (!Array.isArray(lesson.behaviorSteps) || lesson.behaviorSteps.length === 0) throw new Error('Lesson behaviorSteps must contain an action.');
  if (lesson.behaviorSteps.length > MAX_BEHAVIOR_STEPS) throw new Error(`Lesson behaviorSteps exceeds ${MAX_BEHAVIOR_STEPS} steps.`);
  const actions = Object.freeze(lesson.behaviorSteps.map(step => Object.freeze({ ...parseAction(step) })));
  if (!Array.isArray(lesson.hints) || lesson.hints.length === 0 || lesson.hints.length > MAX_HINTS || lesson.hints.some(hint => typeof hint !== 'string' || !hint.trim())) {
    throw new TypeError(`Lesson hints must contain 1-${MAX_HINTS} non-empty strings.`);
  }
  if (lesson.reviewStatus !== 'internal-review') throw new Error('Lesson reviewStatus must remain internal-review.');
  return Object.freeze({ lesson: cloneLesson(lesson), actions });
}

function validateCatalog() {
  const visiting = new Set();
  const visited = new Set();
  const visit = id => {
    if (visiting.has(id)) throw new Error(`Lesson prerequisite cycle at ${id}.`);
    if (visited.has(id)) return;
    visiting.add(id);
    const lesson = LESSON_BY_ID.get(id);
    for (const prerequisite of lesson.prerequisites) visit(prerequisite);
    visiting.delete(id);
    visited.add(id);
  };
  for (const lesson of LESSONS) {
    validateLesson(lesson);
    visit(lesson.id);
  }
}

function normalizeStates(states = {}) {
  return states instanceof Map ? Object.fromEntries(states) : states;
}

function isPrerequisiteMet(states, id) {
  const normalized = normalizeStates(states);
  const state = normalized && typeof normalized === 'object' && Object.hasOwn(normalized, id) ? normalized[id] : null;
  return !!state && (state.masteryState === 'Mastered' || Number(state.masteryScore) >= 70 || Number(state.confidence) >= 0.7);
}

function availableLessons(states = {}, { includeMastered = false } = {}) {
  const normalized = normalizeStates(states);
  return LESSONS.filter(lesson => {
    if (!includeMastered && isPrerequisiteMet(normalized, lesson.id)) return false;
    return lesson.prerequisites.every(id => isPrerequisiteMet(normalized, id));
  }).map(cloneLesson);
}

function selectLesson(states = {}, { difficulty = null } = {}) {
  const candidates = availableLessons(states).filter(lesson => !difficulty || lesson.difficulty === difficulty);
  return candidates[0] || availableLessons(states, { includeMastered: true }).find(lesson => !difficulty || lesson.difficulty === difficulty) || null;
}

validateCatalog();

export { LESSONS, validateLesson, availableLessons, selectLesson };

if (typeof window !== 'undefined') window.BrainBiteProgrammableBitCurriculum = Object.freeze({ LESSONS, validateLesson, availableLessons, selectLesson });
