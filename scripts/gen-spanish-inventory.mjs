import fs from 'node:fs';

const app = fs.readFileSync('app.js', 'utf8');
const re = /\{id:(\d+),title:'([^']+)',world:'([^']+)',skill:'([^']+)',prompt:'([^']+)',correct:\[([^\]]*)\],wrong:\[([^\]]*)\]/g;
const missions = [...app.matchAll(re)].map((m) => ({
  id: Number(m[1]),
  title: m[2],
  world: m[3],
  skill: m[4],
  prompt: m[5],
  correct: m[6],
  wrong: m[7],
}));
const spanish = missions.filter((m) => m.world === 'spanish');

const lines = [
  '# Spanish content inventory (for fluent review)',
  '',
  'Source: `app.js` MISSIONS. Check meaning, age fit, and diacritics/spelling.',
  '',
  '| ID | Title | Skill | Prompt | Correct | Wrong |',
  '| --- | --- | --- | --- | --- | --- |',
];
for (const m of spanish) {
  lines.push(`| ${m.id} | ${m.title} | ${m.skill} | ${m.prompt} | \`${m.correct}\` | \`${m.wrong}\` |`);
}
lines.push('', 'Record PASS/FAIL in `docs/BATCH_8_STATUS_TRACKER.md` Gate 8.5.', '');
fs.writeFileSync('docs/GATE_8_5_SPANISH_INVENTORY.md', lines.join('\n'));
console.log(`Wrote ${spanish.length} Spanish missions`);
