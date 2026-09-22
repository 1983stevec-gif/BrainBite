#!/usr/bin/env node
// Fails when a browser test aggregates over a DOM collection that may be empty.
//
// Two tests in this repository were green while asserting nothing:
// `Math.min(...buttons.map(...))` is `Infinity` for an empty list, and
// `[].every(...)` is `true`. Both passed while the elements they targeted did not exist.
//
// Only locator-derived collections are in scope. A `.every()` over an array returned by
// `page.evaluate` is a normal assertion and is not reported.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const files = [];
for (const dir of ['tests']) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.spec.js')) files.push(`${dir}/${entry.name}`);
  }
}

// Names bound to a DOM collection, either directly or through evaluateAll.
const problems = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n');
  const collectionNames = new Set();
  for (const match of source.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?[^\n]*evaluateAll\(/g)) collectionNames.add(match[1]);
  for (const match of source.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?[^\n]*\$\$\(/g)) collectionNames.add(match[1]);
  for (const match of source.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?[^\n]*\.all\(\)/g)) collectionNames.add(match[1]);

  lines.forEach((line, index) => {
    const aggregates = /Math\.(?:min|max)\(\s*\.\.\./.test(line) || /\.every\(/.test(line);
    if (!aggregates) return;
    // Only care when the aggregate reads from a DOM collection.
    const mentionsCollection = [...collectionNames].some(name => new RegExp(`\\b${name}\\b`).test(line));
    const inlineLocator = /evaluateAll\(|\$\$\(/.test(line);
    if (!mentionsCollection && !inlineLocator) return;
    const window = [lines[index - 2] ?? '', lines[index - 1] ?? '', line, lines[index + 1] ?? '', lines[index + 2] ?? ''].join('\n');
    const guarded = /toHaveCount\(\s*[1-9]/.test(window)
      || /toHaveLength\(\s*[1-9]/.test(window)
      || /\.length\s*(?:>|>=|===|==|!==|!=)\s*[1-9]/.test(window)
      || /\.length\s*&&/.test(window)
      || /elements\.length|buttons\.length|items\.length/.test(window);
    if (!guarded) problems.push(`${file}:${index + 1} aggregates a DOM collection without a length guard`);
  });
}

console.log(`vacuous assertion scan: ${files.length} browser test files`);
if (problems.length) {
  console.error(`\n${problems.length} unguarded DOM aggregate assertion(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nAdd a length guard (for example `await expect(locator).toHaveCount(n)`) before aggregating.');
  process.exit(1);
}
console.log('No unguarded DOM aggregate assertions found.');
