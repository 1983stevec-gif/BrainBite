#!/usr/bin/env node
/**
 * Reports what the 3D assets actually cost to download.
 *
 * `npm run probe:performance` gates the raw byte count, which is the conservative,
 * server-independent number: a host that does not compress serves every one of those
 * bytes.
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
import { DEFAULT_PAYLOAD_BUDGET } from '../presentation/performance-budget.mjs';

const repo = resolve(import.meta.dirname, '..');
const manifestPath = resolve(repo, 'release-evidence/package-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

// Packaged 3D payload is every GLB plus authored raster art used as a runtime surface.
// Keeping the raster rule directory-wide is deliberately conservative: a newly packaged
// surface texture cannot disappear from the budget merely because nobody updates a list.
const isPackaged3DAsset = path => (
  /\.glb$/i.test(path)
  || /^assets\/art\/.*\.(?:avif|bmp|gif|jpe?g|png|webp)$/i.test(path)
);
const assets = Object.entries(manifest.files ?? {})
  .filter(([path]) => isPackaged3DAsset(path))
  .sort(([left], [right]) => left.localeCompare(right));

if (!assets.length) throw new Error('Package manifest contains no packaged 3D assets');

const kb = bytes => `${Math.round(bytes / 1024)} KB`;
const percent = (part, whole) => `${Math.round((1 - part / whole) * 100)}%`;
const exact = bytes => `${bytes.toLocaleString('en-US')} bytes`;

let raw = 0;
let gzip = 0;
let brotli = 0;
const rows = [];

for (const [file, entry] of assets) {
  const bytes = readFileSync(resolve(repo, file));
  if (bytes.length !== entry.bytes) {
    throw new Error(`${file} is ${bytes.length} bytes on disk but ${entry.bytes} bytes in the package manifest`);
  }
  const gz = gzipSync(bytes, { level: 9 }).length;
  const br = brotliCompressSync(bytes, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
  raw += bytes.length;
  gzip += gz;
  brotli += br;
  rows.push({ file, raw: bytes.length, gzip: gz, brotli: br });
}

const width = Math.max(...rows.map(row => row.file.length), 10);
console.log('Packaged 3D asset transfer cost\n');
console.log(`${'asset'.padEnd(width)}  ${'raw'.padStart(14)}  ${'gzip'.padStart(14)}  ${'brotli'.padStart(14)}`);
for (const row of rows) {
  console.log(`${row.file.padEnd(width)}  ${exact(row.raw).padStart(14)}  ${exact(row.gzip).padStart(14)}  ${exact(row.brotli).padStart(14)}`);
}
console.log(`${'total'.padEnd(width)}  ${exact(raw).padStart(14)}  ${exact(gzip).padStart(14)}  ${exact(brotli).padStart(14)}`);
console.log(`\ncompression removes ${percent(gzip, raw)} of the raw bytes (gzip) and ${percent(brotli, raw)} (brotli).`);
const budget = DEFAULT_PAYLOAD_BUDGET.assetBytes;
const budgetState = raw > budget ? `OVER by ${exact(raw - budget)}` : `within by ${exact(budget - raw)}`;
console.log(`Raw payload budget: ${exact(raw)} ${raw > budget ? '>' : '<='} ${exact(budget)} — ${budgetState}.`);
console.log(`Rounded totals: raw ${kb(raw)}, gzip ${kb(gzip)}, brotli ${kb(brotli)}.`);
