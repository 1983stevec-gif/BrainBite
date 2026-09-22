#!/usr/bin/env node
// Fails when a browser test targets a screen, id, or element that no longer exists.
//
// The 2026-09-20 navigation rework left the release suite targeting
// `nav button[data-screen="settings"]`, which no longer existed, so the whole suite could
// not run. This check catches that drift at validation time instead of at test time.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const TEST_FILES = [];
for (const dir of ['tests']) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.(spec\.js|test\.mjs)$/.test(entry.name)) TEST_FILES.push(`${dir}/${entry.name}`);
  }
}

const SOURCES = ['index.html', 'app.js', 'brainbite-core.mjs', 'service-worker.js', 'privacy.html', 'support.html', 'terms.html'];
for (const dir of ['presentation', 'content']) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.(mjs|js)$/.test(entry.name)) SOURCES.push(`${dir}/${entry.name}`);
  }
}
const sourceText = SOURCES.filter(existsSync).map(file => readFileSync(file, 'utf8')).join('\n');

// Screens the router can show, plus ids and classes any source declares.
const screenIds = new Set([...sourceText.matchAll(/data-screen="([\w-]+)"/g)].map(m => m[1]));
for (const match of sourceText.matchAll(/show\('([\w-]+)'\)/g)) screenIds.add(match[1]);
for (const match of sourceText.matchAll(/\bid="([A-Za-z][\w-]*)"/g)) screenIds.add(match[1]);

const dynamicPrefixes = new Set([
  ...[...sourceText.matchAll(/\.id\s*=\s*`([A-Za-z][\w-]*)\$\{/g)].map(m => m[1]),
  ...[...sourceText.matchAll(/\bid="([A-Za-z][\w-]*)\$\{/g)].map(m => m[1]),
]);

const problems = [];
// Which data-screen targets actually live inside a <nav>? The 2026-09-20 rework moved
// Settings out of the child dock, so `nav button[data-screen="settings"]` could never
// match. That structural drift is what broke the whole release suite.
const navScreens = new Set();
const html = existsSync('index.html') ? readFileSync('index.html', 'utf8') : '';
for (const match of html.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/g)) {
  for (const inner of match[1].matchAll(/data-screen="([\w-]+)"/g)) navScreens.add(inner[1]);
}
for (const file of TEST_FILES) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  // `data-screen="x"` targets must be real screens.
  for (const match of text.matchAll(/data-screen="([\w-]+)"/g)) {
    if (!screenIds.has(match[1])) problems.push(`${file}: data-screen="${match[1]}" is not a screen or element id`);
  }
  // A locator that scopes to `nav` must point at a control that is inside a nav.
  lines.forEach((line, index) => {
    for (const match of line.matchAll(/nav\s+button\[data-screen="([\w-]+)"\]/g)) {
      if (!navScreens.has(match[1])) problems.push(`${file}:${index + 1} nav button[data-screen="${match[1]}"] is not inside a <nav> in index.html`);
    }
  });
  lines.forEach((line, index) => {
    for (const match of line.matchAll(/(?:locator|querySelector|querySelectorAll)\(\s*['"`]#([A-Za-z][\w-]*)['"`]/g)) {
      const id = match[1];
      if (screenIds.has(id)) continue;
      if ([...dynamicPrefixes].some(prefix => id.startsWith(prefix))) continue;
      // A test may deliberately assert that something is gone.
      const window = [lines[index - 1] ?? '', line, lines[index + 1] ?? ''].join('\n');
      if (/toHaveCount\(\s*0|toBeHidden|not\.toBeVisible|not\.toBeAttached|toHaveCount\(0\)/.test(window)) continue;
      // The id may be assigned through a helper rather than an `id="..."` literal.
      if (new RegExp(`['"\`]${id}['"\`]`).test(sourceText)) continue;
      problems.push(`${file}:${index + 1} #${id} is not declared by any source`);
    }
  });
}

console.log(`test selector drift: ${TEST_FILES.length} test files checked against ${screenIds.size} known targets`);
if (problems.length) {
  console.error(`\n${problems.length} stale test target(s):`);
  for (const problem of [...new Set(problems)]) console.error(`  ${problem}`);
  process.exit(1);
}
console.log('Every test target resolves to a real screen, element, or declared id.');
