#!/usr/bin/env node
/**
 * Reports what the 3D assets actually cost to download.
 *
 * `npm run probe:performance` gates the raw byte count, which is the conservative,
 * server-independent number: a host that does not compress serves every one of those
 * bytes. That number looks alarming (3.2 MB), but the redundancy it measures is exactly
 * what an HTTP compressor removes, because the pipeline duplicates whole spheres and
 * float32 buffers repeat almost perfectly.
 *
 * This reports raw, gzip, and brotli for each asset so the real transfer cost is a
 * measurement rather than an assumption. It is what ruled out Draco compression: the
 * compressed GLBs were 693 KB raw but a 500 KB decoder was needed to read them, which is
 * a wash against 771 KB gzipped, and it would have cost two CSP relaxations
 * (`'wasm-unsafe-eval'` and a blob worker) on an app that deliberately ships `script-src
 * 'self'`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const repo = resolve(import.meta.dirname, '..');
const kitDir = resolve(repo, 'assets/generated/blender');
const manifest = JSON.parse(readFileSync(resolve(kitDir, 'manifest.json'), 'utf8'));

const kb = bytes => `${Math.round(bytes / 1024)} KB`;
const percent = (part, whole) => `${Math.round((1 - part / whole) * 100)}%`;

let raw = 0;
let gzip = 0;
let brotli = 0;
const rows = [];

for (const asset of manifest.assets ?? []) {
  const bytes = readFileSync(resolve(kitDir, 'glb', asset.file));
  const gz = gzipSync(bytes, { level: 9 }).length;
  const br = brotliCompressSync(bytes, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
  raw += bytes.length;
  gzip += gz;
  brotli += br;
  rows.push({ file: asset.file, raw: bytes.length, gzip: gz, brotli: br });
}

const width = Math.max(...rows.map(row => row.file.length), 10);
console.log('3D asset transfer cost\n');
console.log(`${'asset'.padEnd(width)}  ${'raw'.padStart(9)}  ${'gzip'.padStart(9)}  ${'brotli'.padStart(9)}`);
for (const row of rows) {
  console.log(`${row.file.padEnd(width)}  ${kb(row.raw).padStart(9)}  ${kb(row.gzip).padStart(9)}  ${kb(row.brotli).padStart(9)}`);
}
console.log(`${'total'.padEnd(width)}  ${kb(raw).padStart(9)}  ${kb(gzip).padStart(9)}  ${kb(brotli).padStart(9)}`);
console.log(`\ncompression removes ${percent(gzip, raw)} of the raw bytes (gzip) and ${percent(brotli, raw)} (brotli).`);
console.log('The performance probe gates the raw column, so the budget stays meaningful on a host that does not compress.');
