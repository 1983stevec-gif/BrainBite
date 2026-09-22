import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildManifest, hashFile } from '../scripts/package-manifest.mjs';

// The package manifest passed on the Windows workstation and failed in Linux CI on six
// files, because the Windows working copy had mixed CRLF/LF endings while CI checked out
// LF. Text hashing is now line-ending independent; these tests keep it that way.
const dir = await mkdtemp(join(tmpdir(), 'brainbite-manifest-'));
test.after(async () => { await rm(dir, { recursive: true, force: true }); });

test('text hashing ignores CRLF versus LF so the manifest is platform independent', async () => {
  const lf = join(dir, 'sample.js');
  const crlf = join(dir, 'sample-crlf.js');
  await writeFile(lf, 'const a = 1;\nconst b = 2;\n', 'utf8');
  await writeFile(crlf, 'const a = 1;\r\nconst b = 2;\r\n', 'utf8');
  const [first, second] = await Promise.all([hashFile(lf), hashFile(crlf)]);
  assert.equal(first.sha256, second.sha256, 'CRLF and LF text must hash identically');
  assert.equal(first.bytes, second.bytes, 'reported size must be the normalized size');
});

test('binary assets are hashed byte for byte and are never normalized', async () => {
  const binary = join(dir, 'asset.glb');
  const binaryCrlf = join(dir, 'asset-crlf.glb');
  await writeFile(binary, Buffer.from([0x67, 0x6c, 0x54, 0x46, 0x0a]));
  await writeFile(binaryCrlf, Buffer.from([0x67, 0x6c, 0x54, 0x46, 0x0d, 0x0a]));
  const [first, second] = await Promise.all([hashFile(binary), hashFile(binaryCrlf)]);
  assert.notEqual(first.sha256, second.sha256, 'a byte difference in a binary must change the digest');
});

test('a manifest covers every file in the package directory', async () => {
  const packageDir = join(dir, 'package');
  await writeFile(join(dir, 'unused.txt'), 'ignored', 'utf8').catch(() => {});
  const { mkdir } = await import('node:fs/promises');
  await mkdir(join(packageDir, 'nested'), { recursive: true });
  await writeFile(join(packageDir, 'index.html'), '<!doctype html>\n', 'utf8');
  await writeFile(join(packageDir, 'nested', 'app.js'), 'export {};\n', 'utf8');
  const manifest = await buildManifest(packageDir);
  assert.deepEqual(Object.keys(manifest.files).sort(), ['index.html', 'nested/app.js']);
  assert.equal(manifest.schema, 'brainbite.package-manifest.v1');
  for (const entry of Object.values(manifest.files)) assert.match(entry.sha256, /^[0-9a-f]{64}$/);
});
