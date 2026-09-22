#!/usr/bin/env node
// Fails when a script or test hardcodes an absolute host path.
//
// `scripts/smoke-pwa-installability.mjs` hardcoded `D:/Codex/Brainbite`, so every icon
// lookup failed on the Linux CI runner and the whole CI job failed. Derive paths from
// `import.meta.dirname`/`fileURLToPath` instead.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const files = [];
for (const dir of ['scripts', 'tests', 'presentation', 'content']) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.(mjs|js|ts)$/.test(entry.name)) files.push(`${dir}/${entry.name}`);
    else if (entry.isDirectory() && dir === 'scripts') {
      for (const nested of readdirSync(`${dir}/${entry.name}`, { withFileTypes: true })) {
        if (nested.isFile() && /\.(mjs|js|ts)$/.test(nested.name)) files.push(`${dir}/${entry.name}/${nested.name}`);
      }
    }
  }
}

// A Windows drive path or a POSIX absolute path inside a string literal.
const ABSOLUTE_PATH = /['"`](?:[A-Za-z]:[\\/][^'"`\n]*|\/(?:home|Users|root|mnt|workspace)\/[^'"`\n]*)['"`]/g;
const ALLOWED = [
  // POSIX-style URL paths are not host paths.
  /^['"`]\/\//
];

const problems = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (/^\s*(\/\/|\*|#)/.test(line)) return;
    for (const match of line.matchAll(ABSOLUTE_PATH)) {
      const value = match[0];
      if (ALLOWED.some(pattern => pattern.test(value))) continue;
      problems.push(`${file}:${index + 1} hardcodes an absolute host path: ${value.slice(0, 60)}`);
    }
  });
}

console.log(`host path scan: ${files.length} files`);
if (problems.length) {
  console.error(`\n${problems.length} hardcoded path(s) that will not exist on another host:`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nDerive the path from import.meta.dirname or fileURLToPath instead.');
  process.exit(1);
}
console.log('No hardcoded absolute host paths.');
