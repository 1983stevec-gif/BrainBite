import { parseProgram } from './code-bridge.mjs';

const LESSONS = Object.freeze([
  Object.freeze({ id: 'bridge-basics', title: 'Open the Bridge', difficulty: 'easy', prerequisites: [], support: 'guided', reviewStatus: 'internal-review', program: 'bridge.open()\nplayer.move()', success: Object.freeze({ bridgeOpen: true, movedAtLeast: 1 }) }),
  Object.freeze({ id: 'bridge-gate', title: 'Unlock the Gate', difficulty: 'normal', prerequisites: ['bridge-basics'], support: 'visual', reviewStatus: 'internal-review', program: 'bridge.open()\nplayer.move()\ngate.unlock()\nlight.on()', success: Object.freeze({ bridgeOpen: true, gateUnlocked: true }) }),
  Object.freeze({ id: 'bridge-platform', title: 'Move the Platform', difficulty: 'normal', prerequisites: ['bridge-gate'], support: 'hint', reviewStatus: 'internal-review', program: 'bridge.open()\nplatform.move(3)\nplayer.jump()\ngate.unlock()', success: Object.freeze({ bridgeOpen: true, gateUnlocked: true, jumped: true, platformOffsetAtLeast: 3 }) }),
  Object.freeze({ id: 'bridge-expert', title: 'Power the Jungle Route', difficulty: 'hard', prerequisites: ['bridge-platform'], support: 'independent', reviewStatus: 'internal-review', program: 'bridge.open()\nplatform.move(5)\nplayer.move()\nplayer.jump()\nlight.on()\ngate.unlock()', success: Object.freeze({ bridgeOpen: true, gateUnlocked: true, jumped: true, lightOn: true, movedAtLeast: 1, platformOffsetAtLeast: 5 }) }),
]);

function cloneLesson(lesson) {
  return Object.freeze({ ...lesson, prerequisites: Object.freeze([...lesson.prerequisites]), success: Object.freeze({ ...lesson.success }) });
}

function validateLesson(lesson) {
  if (!lesson || typeof lesson.id !== 'string' || typeof lesson.program !== 'string') throw new TypeError('Lesson requires an id and program.');
  const commands = parseProgram(lesson.program);
  if (!commands.length) throw new Error('Lesson program must contain a command.');
  return Object.freeze({ lesson: cloneLesson(lesson), commands: Object.freeze(commands.map(command => Object.freeze({ ...command }))) });
}

function normalizeStates(states = {}) {
  return states instanceof Map ? Object.fromEntries(states) : states;
}

function isPrerequisiteMet(states, id) {
  const state = normalizeStates(states)[id];
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
  return (candidates[0] || availableLessons(states, { includeMastered: true })[0] || null);
}

export { LESSONS, validateLesson, availableLessons, selectLesson };

if (typeof window !== 'undefined') window.BrainBiteCodeCurriculum = Object.freeze({ LESSONS, validateLesson, availableLessons, selectLesson });
