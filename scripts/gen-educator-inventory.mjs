import fs from 'node:fs';

const app = fs.readFileSync('app.js', 'utf8');
const re = /\{id:(\d+),title:'([^']+)',world:'([^']+)',skill:'([^']+)',prompt:'([^']+)',correct:\[([^\]]*)\]/g;
const missions = [...app.matchAll(re)].map((m) => ({
  id: Number(m[1]),
  title: m[2],
  world: m[3],
  skill: m[4],
  prompt: m[5],
  correct: m[6],
  boss: /boss:true/.test(app.slice(m.index, m.index + 280)),
}));

const lines = [
  '# Educator mission inventory (age-fit / correctness review)',
  '',
  'Source: `app.js` MISSIONS. Check prompts match skills and targets are age-appropriate.',
  '',
  '| ID | World | Title | Skill | Prompt | Boss |',
  '| --- | --- | --- | --- | --- | --- |',
];
for (const m of missions) {
  lines.push(`| ${m.id} | ${m.world} | ${m.title} | ${m.skill} | ${m.prompt} | ${m.boss ? 'yes' : ''} |`);
}
lines.push('', 'Record PASS/FAIL in `docs/BATCH_8_STATUS_TRACKER.md` Gate 8.5 educator row.', '');
fs.writeFileSync('docs/GATE_8_5_EDUCATOR_INVENTORY.md', lines.join('\n'));
console.log(`Wrote ${missions.length} missions`);
