import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputArg = process.argv[2] || '_site';
const outputRoot = path.resolve(repoRoot, outputArg);

if (outputRoot === repoRoot || !outputRoot.startsWith(`${repoRoot}${path.sep}`)) {
  throw new Error(`Refusing to stage outside the repository: ${outputRoot}`);
}

const runtimeFiles = [
  'index.html',
  'app.js',
  'brainbite-core.mjs',
  'styles.css',
  'fonts.css',
  'sw-register.js',
  'service-worker.js',
  'manifest.webmanifest',
  'privacy.html',
  'terms.html',
  'support.html',
];

const runtimeDirectories = [
  'assets/art',
  'assets/fonts',
  'assets/generated/blender/glb',
  'audio',
  'content',
  'icons',
  'presentation',
  'vendor',
];

function copyRequired(relativePath) {
  const source = path.join(repoRoot, relativePath);
  if (!fs.existsSync(source)) throw new Error(`Required runtime path is missing: ${relativePath}`);
  fs.cpSync(source, path.join(outputRoot, relativePath), { recursive: true });
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
for (const relativePath of runtimeFiles) copyRequired(relativePath);
for (const relativePath of runtimeDirectories) copyRequired(relativePath);

const forbidden = ['.git', '.github', '.cursor', 'AGENTS.md', 'docs', 'tests', 'scripts', 'release-evidence', 'node_modules'];
const leaked = forbidden.filter(relativePath => fs.existsSync(path.join(outputRoot, relativePath)));
if (leaked.length) throw new Error(`Developer-only paths leaked into the runtime package: ${leaked.join(', ')}`);

let fileCount = 0;
const allowedExtensions = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.png', '.glb', '.webmanifest', '.woff2']);
const invalidRuntimeFiles = [];
const countFiles = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) countFiles(fullPath);
    else {
      fileCount += 1;
      if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
        invalidRuntimeFiles.push(path.relative(outputRoot, fullPath));
      }
    }
  }
};
countFiles(outputRoot);
if (invalidRuntimeFiles.length) throw new Error(`Non-runtime files entered the public package: ${invalidRuntimeFiles.join(', ')}`);
console.log(`Staged ${fileCount} runtime files in ${path.relative(repoRoot, outputRoot)}.`);
