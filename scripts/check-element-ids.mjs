#!/usr/bin/env node
// Fails when app.js looks up an element id that the runtime never creates.
//
// Two live startup errors (`#installBtn`, `#updateStatus`) were found by hand this way.
// Ids built from a prefix at runtime (for example `bitAction-${event}`) are matched
// against the prefixes found in template literals so they are not false positives.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const APP = 'app.js';
const app = readFileSync(APP, 'utf8');

const lookupIds = new Set();
for (const match of app.matchAll(/\$\('([A-Za-z][\w-]*)'\)/g)) lookupIds.add(match[1]);
for (const match of app.matchAll(/\$\("([A-Za-z][\w-]*)"\)/g)) lookupIds.add(match[1]);
for (const match of app.matchAll(/getElementById\('([A-Za-z][\w-]*)'\)/g)) lookupIds.add(match[1]);
for (const match of app.matchAll(/getElementById\("([A-Za-z][\w-]*)"\)/g)) lookupIds.add(match[1]);

const declared = new Set();
const dynamicPrefixes = new Set();
const sources = ['index.html', APP, 'brainbite-core.mjs', 'service-worker.js', 'privacy.html', 'support.html', 'terms.html'];
for (const dir of ['presentation', 'content']) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.(mjs|js)$/.test(entry.name)) sources.push(`${dir}/${entry.name}`);
  }
}
for (const file of sources) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\bid="([A-Za-z][\w-]*)"/g)) declared.add(match[1]);
  for (const match of text.matchAll(/\.id\s*=\s*['"]([A-Za-z][\w-]*)['"]/g)) declared.add(match[1]);
  for (const match of text.matchAll(/\.id\s*=\s*`([A-Za-z][\w-]*)\$\{/g)) dynamicPrefixes.add(match[1]);
  for (const match of text.matchAll(/\bid="([A-Za-z][\w-]*)\$\{/g)) dynamicPrefixes.add(match[1]);
  for (const match of text.matchAll(/\bid='([A-Za-z][\w-]*)\$\{/g)) dynamicPrefixes.add(match[1]);
}

const missing = [...lookupIds]
  .filter(id => !declared.has(id) && ![...dynamicPrefixes].some(prefix => id.startsWith(prefix)))
  .sort();

console.log(`element ids: ${lookupIds.size} looked up, ${declared.size} declared, ${dynamicPrefixes.size} dynamic prefix(es)`);
if (missing.length) {
  console.error(`\n${missing.length} id(s) looked up but never created:`);
  for (const id of missing) console.error(`  #${id}`);
  process.exit(1);
}
console.log('Every looked-up element id is declared or created dynamically.');
