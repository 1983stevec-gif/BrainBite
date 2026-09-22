#!/usr/bin/env node
// Generates the integrity manifest for the closed-beta runtime package.
//
// The previous CHECKSUMS.json was hand-maintained and had drifted: 45 of its 176 entries
// pointed at files that no longer exist (old .wav audio, removed tests and scripts) and 20
// no longer matched. This manifest is derived from the same allowlist that builds the
// package, so it cannot describe anything the package does not contain.
//
// Usage:
//   npm run package:manifest     # regenerate release-evidence/package-manifest.json
//   npm run check:stage          # verify the package against this manifest
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const stageRoot = resolve(repoRoot, '.native-site-manifest');
const manifestPath = resolve(repoRoot, 'release-evidence', 'package-manifest.json');

export async function collectPackageFiles(root) {
  const files = [];
  const walk = async (dir, prefix = '') => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(resolve(dir, entry.name), relative);
      else files.push(relative);
    }
  };
  await walk(root);
  return files.sort();
}

export async function hashFile(absolute) {
  const bytes = await readFile(absolute);
  return { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
}

export async function buildManifest(root) {
  const files = await collectPackageFiles(root);
  const entries = {};
  for (const relative of files) entries[relative] = await hashFile(resolve(root, relative));
  return { schema: 'brainbite.package-manifest.v1', generatedAt: new Date().toISOString(), files: entries };
}

async function stagePackage() {
  execFileSync(process.execPath, [resolve(repoRoot, 'scripts/stage-site.mjs'), stageRoot], { cwd: repoRoot, stdio: 'pipe' });
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename);
if (invokedDirectly) {
  await stagePackage();
  const manifest = await buildManifest(stageRoot);
  await mkdir(resolve(repoRoot, 'release-evidence'), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await rm(stageRoot, { recursive: true, force: true });
  const total = Object.values(manifest.files).reduce((sum, entry) => sum + entry.bytes, 0);
  console.log(JSON.stringify({ files: Object.keys(manifest.files).length, totalBytes: total, output: 'release-evidence/package-manifest.json' }, null, 1));
}
