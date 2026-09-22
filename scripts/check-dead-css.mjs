#!/usr/bin/env node
// Reports CSS class and id selectors that no source file can produce.
//
// A selector is reported when it names a class or id that appears in no scanned consumer
// file. Because a compound selector such as `.battle-target .old-dock` can never match
// once `.old-dock` is gone, the report is the authoritative cleanup list.
//
// Usage:
//   node scripts/check-dead-css.mjs            # diagnostic, always exits 0
//   node scripts/check-dead-css.mjs --strict   # exits 1 when anything is reported
//
// Dynamic class construction (for example `rail-${kind}`) would read as dead here, so
// confirm any hit against the source before deleting it.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const strict = process.argv.includes('--strict');
const SOURCE_DIRS = ['presentation', 'content', 'tests', 'scripts'];
const ROOT_FILES = ['index.html', 'app.js', 'brainbite-core.mjs', 'service-worker.js'];

const files = ROOT_FILES.filter(existsSync);
for (const dir of SOURCE_DIRS) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.(mjs|js|ts|html)$/.test(entry.name)) files.push(`${dir}/${entry.name}`);
  }
}
const consumers = files.map(file => { try { return readFileSync(file, 'utf8'); } catch { return ''; } }).join('\n');
const css = readFileSync('styles.css', 'utf8');

// Collect selector preludes only. Declaration values (which contain `#rrggbb` colours)
// must not be mistaken for id selectors, so the walker recurses into at-rule bodies and
// treats everything up to each `{` as a selector.
const preludes = [];
function collectPreludes(text) {
  let index = 0;
  let mark = 0;
  while (index < text.length) {
    const char = text[index];
    if (char === '/' && text[index + 1] === '*') {
      const close = text.indexOf('*/', index + 2);
      index = close === -1 ? text.length : close + 2;
      continue;
    }
    if (char === ';') { index += 1; mark = index; continue; }
    if (char === '{') {
      const prelude = text.slice(mark, index);
      let depth = 1, cursor = index + 1;
      while (cursor < text.length && depth > 0) {
        const next = text[cursor];
        if (next === '/' && text[cursor + 1] === '*') {
          const close = text.indexOf('*/', cursor + 2);
          cursor = close === -1 ? text.length : close + 2;
          continue;
        }
        if (next === '{') depth += 1;
        else if (next === '}') depth -= 1;
        cursor += 1;
      }
      const body = text.slice(index + 1, cursor - 1);
      const trimmed = prelude.trim();
      if (trimmed.startsWith('@')) collectPreludes(body);
      else preludes.push(prelude);
      index = cursor;
      mark = index;
      continue;
    }
    index += 1;
  }
}
collectPreludes(css);

const classes = new Set();
const ids = new Set();
for (const prelude of preludes) {
  for (const match of prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(match[1]);
  for (const match of prelude.matchAll(/#([_a-zA-Z][\w-]*)/g)) ids.add(match[1]);
}

const referenced = name => new RegExp(`(^|[^\\w-])${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}([^\\w-]|$)`).test(consumers);
const deadClasses = [...classes].filter(name => !referenced(name)).sort();
const deadIds = [...ids].filter(name => !referenced(name)).sort();

console.log(`scanned ${files.length} consumer files; ${classes.size} class and ${ids.size} id selectors in styles.css`);
if (!deadClasses.length && !deadIds.length) {
  console.log('No dead selectors found.');
  process.exit(0);
}
if (deadClasses.length) {
  console.log(`\n${deadClasses.length} class selector(s) with no consumer:`);
  console.log(`  ${deadClasses.join(' ')}`);
}
if (deadIds.length) {
  console.log(`\n${deadIds.length} id selector(s) with no consumer:`);
  console.log(`  ${deadIds.join(' ')}`);
}
process.exit(strict ? 1 : 0);
