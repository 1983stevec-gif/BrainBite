import { LESSONS, validateLesson } from '../content/programmable-bit-curriculum.mjs';

for (const lesson of LESSONS) validateLesson(lesson);

const ids = new Set(LESSONS.map(lesson => lesson.id));
if (ids.size !== LESSONS.length) throw new Error('Programmable Bit lesson IDs must be unique.');
for (const lesson of LESSONS) {
  for (const prerequisite of lesson.prerequisites) {
    if (!ids.has(prerequisite)) throw new Error('Unknown Bit lesson prerequisite: '+prerequisite);
  }
}
if (LESSONS.some(lesson => lesson.reviewStatus !== 'internal-review')) {
  throw new Error('Programmable Bit lessons must remain internal-review until educator approval.');
}
console.log('OK Programmable Bit curriculum: '+LESSONS.length+' lessons validated; runtime status internal-review.');
