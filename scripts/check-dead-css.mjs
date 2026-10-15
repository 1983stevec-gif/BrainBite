#!/usr/bin/env node
// Reports CSS class and id selectors that no source file can produce, plus cascade hazards.
//
// A selector is reported when it names a class or id that appears in no scanned consumer
// file. Because a compound selector such as `.battle-target .old-dock` can never match
// once `.old-dock` is gone, the report is the authoritative cleanup list.
//
// Usage:
//   node scripts/check-dead-css.mjs            # exits 1 on a new !important shadow
//   node scripts/check-dead-css.mjs --strict   # also exits 1 for dead selectors
//   node scripts/check-dead-css.mjs --css file # inspect another stylesheet
//   node scripts/check-dead-css.mjs --verbose  # list every duplicate declaration
//
// Dynamic class construction (for example `rail-${kind}`) would read as dead here, so
// confirm any hit against the source before deleting it.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const strict = process.argv.includes('--strict');
const verbose = process.argv.includes('--verbose');
const cssFlag = process.argv.indexOf('--css');
const cssFile = cssFlag === -1 ? 'styles.css' : process.argv[cssFlag + 1];
if (!cssFile) throw new Error('--css requires a file path');
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
const css = readFileSync(cssFile, 'utf8');

// These pre-existing, intentional theme overrides are tracked explicitly. A new override,
// including another property on one of these selectors, remains a failing hazard.
const IMPORTANT_SHADOW_ALLOWLIST = new Set([
  '.rail-brain|background|#home .home-target.adventure-home.home-shell .adventure-destinations .rail-brain',
  '.rail-base|background|#home .home-target.adventure-home.home-shell .adventure-destinations .rail-base',
  '.rail-shop|background|#home .home-target.adventure-home.home-shell .adventure-destinations .rail-shop',
  '.rail-worlds|background|#home .home-target.adventure-home.home-shell .adventure-destinations .rail-worlds',
  '[hidden]|display|html.presentation-webgl .home-target [hidden]',
  '[hidden]|display|html.presentation-webgl .battle-target [hidden]',
]);

// Collect selector preludes only. Declaration values (which contain `#rrggbb` colours)
// must not be mistaken for id selectors, so the walker recurses into at-rule bodies and
// treats everything up to each `{` as a selector.
const rules = [];
const lineAt = offset => css.slice(0, offset).split('\n').length;
const splitSelectors = prelude => {
  const selectors = [];
  let mark = 0, quote = '', squareDepth = 0, roundDepth = 0;
  for (let index = 0; index < prelude.length; index += 1) {
    const char = prelude[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '[') squareDepth += 1;
    else if (char === ']') squareDepth -= 1;
    else if (char === '(') roundDepth += 1;
    else if (char === ')') roundDepth -= 1;
    else if (char === ',' && squareDepth === 0 && roundDepth === 0) {
      selectors.push(prelude.slice(mark, index).trim());
      mark = index + 1;
    }
  }
  selectors.push(prelude.slice(mark).trim());
  return selectors.filter(Boolean);
};

function collectDeclarations(body, bodyOffset) {
  const declarations = [];
  let mark = 0, quote = '', roundDepth = 0;
  const collect = end => {
    const declaration = body.slice(mark, end);
    const match = declaration.match(/^\s*(--[\w-]+|[-_a-zA-Z][\w-]*)\s*:\s*([\s\S]*)$/);
    if (match) {
      const propertyOffset = declaration.indexOf(match[1]);
      declarations.push({
        property: match[1].toLowerCase(),
        important: /!\s*important\b/i.test(match[2]),
        line: lineAt(bodyOffset + mark + propertyOffset),
      });
    }
    mark = end + 1;
  };
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '(') roundDepth += 1;
    else if (char === ')') roundDepth -= 1;
    else if (char === ';' && roundDepth === 0) collect(index);
  }
  collect(body.length);
  return declarations;
}

function collectRules(text, textOffset = 0, context = []) {
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
      const trimmed = prelude.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (trimmed.startsWith('@')) collectRules(body, textOffset + index + 1, [...context, trimmed]);
      else rules.push({
        selectors: splitSelectors(trimmed),
        declarations: collectDeclarations(body, textOffset + index + 1),
        context,
      });
      index = cursor;
      mark = index;
      continue;
    }
    index += 1;
  }
}
collectRules(css);

const importantDeclarations = [];
const importantShadows = [];
const allowedImportantShadows = [];
const duplicateDeclarations = [];
const lastDeclaration = new Map();
const contextKey = context => context.join(' > ');
const selectorExtends = (selector, earlierSelector) => selector === earlierSelector
  || selector.endsWith(` ${earlierSelector}`)
  || selector.endsWith(`>${earlierSelector}`)
  || selector.endsWith(`+${earlierSelector}`)
  || selector.endsWith(`~${earlierSelector}`);

for (const rule of rules) {
  for (const selector of rule.selectors) {
    for (const declaration of rule.declarations) {
      const duplicateKey = `${contextKey(rule.context)}|${selector}|${declaration.property}`;
      const earlierDuplicate = lastDeclaration.get(duplicateKey);
      if (earlierDuplicate) duplicateDeclarations.push({
        selector,
        property: declaration.property,
        earlierLine: earlierDuplicate.line,
        laterLine: declaration.line,
      });
      lastDeclaration.set(duplicateKey, declaration);

      if (!declaration.important) continue;
      for (const earlier of importantDeclarations) {
        if (earlier.property !== declaration.property || !selectorExtends(selector, earlier.selector)) continue;
        const shadow = {
          earlierSelector: earlier.selector,
          laterSelector: selector,
          property: declaration.property,
          earlierLine: earlier.line,
          laterLine: declaration.line,
        };
        const allowKey = `${earlier.selector}|${declaration.property}|${selector}`;
        if (IMPORTANT_SHADOW_ALLOWLIST.has(allowKey)) allowedImportantShadows.push(shadow);
        else importantShadows.push(shadow);
      }
      importantDeclarations.push({ selector, property: declaration.property, line: declaration.line });
    }
  }
}

const classes = new Set();
const ids = new Set();
for (const rule of rules) {
  for (const selector of rule.selectors) {
    for (const match of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(match[1]);
    for (const match of selector.matchAll(/#([_a-zA-Z][\w-]*)/g)) ids.add(match[1]);
  }
}

const referenced = name => new RegExp(`(^|[^\\w-])${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}([^\\w-]|$)`).test(consumers);
const deadClasses = [...classes].filter(name => !referenced(name)).sort();
const deadIds = [...ids].filter(name => !referenced(name)).sort();

console.log(`scanned ${files.length} consumer files; ${classes.size} class and ${ids.size} id selectors in ${cssFile}`);
if (allowedImportantShadows.length) {
  console.log(`\n${allowedImportantShadows.length} allowlisted !important shadow(s):`);
  for (const item of allowedImportantShadows) {
    console.log(`  ${item.property}: ${item.earlierSelector} (line ${item.earlierLine}) -> ${item.laterSelector} (line ${item.laterLine})`);
  }
}
if (duplicateDeclarations.length) {
  console.log(`\n${duplicateDeclarations.length} duplicate selector declaration(s) (diagnostic only):`);
  const displayedDuplicates = verbose ? duplicateDeclarations : duplicateDeclarations.slice(-20);
  if (!verbose && displayedDuplicates.length < duplicateDeclarations.length) {
    console.log(`  showing newest ${displayedDuplicates.length}; use --verbose for all`);
  }
  for (const item of displayedDuplicates) {
    console.log(`  ${item.selector} re-declares ${item.property} (lines ${item.earlierLine}, ${item.laterLine})`);
  }
}
if (importantShadows.length) {
  console.error(`\n${importantShadows.length} unallowlisted !important shadow(s):`);
  for (const item of importantShadows) {
    console.error(`  ${item.property}: ${item.earlierSelector} (line ${item.earlierLine}) -> ${item.laterSelector} (line ${item.laterLine})`);
  }
}
if (!deadClasses.length && !deadIds.length) {
  console.log('No dead selectors found.');
} else if (deadClasses.length) {
  console.log(`\n${deadClasses.length} class selector(s) with no consumer:`);
  console.log(`  ${deadClasses.join(' ')}`);
}
if (deadIds.length) {
  console.log(`\n${deadIds.length} id selector(s) with no consumer:`);
  console.log(`  ${deadIds.join(' ')}`);
}
process.exit(importantShadows.length || (strict && (deadClasses.length || deadIds.length)) ? 1 : 0);
