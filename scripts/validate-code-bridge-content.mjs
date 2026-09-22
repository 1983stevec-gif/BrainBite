import { LESSONS, validateLesson } from '../content/code-bridge-curriculum.mjs';

const errors = [];
const ids = new Set();
for (const lesson of LESSONS) {
  if (ids.has(lesson.id)) errors.push(`duplicate lesson id: ${lesson.id}`);
  ids.add(lesson.id);
  if (lesson.reviewStatus !== 'internal-review') errors.push(`${lesson.id}: lesson must remain internal-review until approval`);
  try { validateLesson(lesson); } catch (error) { errors.push(`${lesson.id}: ${error.message}`); }
  for (const prerequisite of lesson.prerequisites) if (!LESSONS.some(candidate => candidate.id === prerequisite)) errors.push(`${lesson.id}: missing prerequisite ${prerequisite}`);
}
for (const lesson of LESSONS) {
  const seen = new Set([lesson.id]);
  const visit = id => {
    const node = LESSONS.find(candidate => candidate.id === id);
    for (const prerequisite of node?.prerequisites || []) {
      if (seen.has(prerequisite)) errors.push(`${lesson.id}: prerequisite cycle at ${prerequisite}`);
      else { seen.add(prerequisite); visit(prerequisite); }
    }
  };
  visit(lesson.id);
}
if (errors.length) { for (const error of errors) console.error(`FAIL coding-content ${error}`); process.exitCode = 1; }
else console.log(`OK Coding Bridge curriculum: ${LESSONS.length} lessons validated; runtime status internal-review.`);
