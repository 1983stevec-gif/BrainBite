import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildManifest, hashFile } from '../scripts/package-manifest.mjs';
import { expectedRuntimeCache, runtimeCacheProblem, runtimeFingerprint } from '../scripts/check-stage.mjs';
import { evidenceCheckForBranch } from '../scripts/lib/certification-policy.mjs';

// The package manifest passed on the Windows workstation and failed in Linux CI on six
// files, because the Windows working copy had mixed CRLF/LF endings while CI checked out
// LF. Text hashing is now line-ending independent; these tests keep it that way.
const dir = await mkdtemp(join(tmpdir(), 'brainbite-manifest-'));
test.after(async () => { await rm(dir, { recursive: true, force: true }); });

test('local certification uses strict provenance on main and branch-safe evidence elsewhere', () => {
  assert.equal(evidenceCheckForBranch('main'), 'check:evidence');
  assert.equal(evidenceCheckForBranch('mobile/runtime-readiness'), 'check:evidence:ci');
  assert.equal(evidenceCheckForBranch(''), 'check:evidence:ci');
});

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

const syntheticRuntime = {
  'app.js': { sha256: 'a'.repeat(64), bytes: 10 },
  'index.html': { sha256: 'b'.repeat(64), bytes: 20 },
  'service-worker.js': { sha256: 'c'.repeat(64), bytes: 30 },
};

test('runtime fingerprint changes when a packaged file digest changes', () => {
  const changed = structuredClone(syntheticRuntime);
  changed['app.js'].sha256 = 'd'.repeat(64);
  const serviceWorkerOnly = structuredClone(syntheticRuntime);
  serviceWorkerOnly['service-worker.js'].sha256 = 'f'.repeat(64);
  assert.notEqual(runtimeFingerprint(changed), runtimeFingerprint(syntheticRuntime));
  assert.equal(runtimeFingerprint(serviceWorkerOnly), runtimeFingerprint(syntheticRuntime), 'service-worker.js must not create a self-reference');
});

test('runtime fingerprint changes when a packaged path is added or removed', () => {
  const added = { ...syntheticRuntime, 'content/new.json': { sha256: 'e'.repeat(64), bytes: 40 } };
  const removed = structuredClone(syntheticRuntime);
  delete removed['index.html'];
  assert.notEqual(runtimeFingerprint(added), runtimeFingerprint(syntheticRuntime));
  assert.notEqual(runtimeFingerprint(removed), runtimeFingerprint(syntheticRuntime));
});

test('a mismatched or dynamically constructed service-worker CACHE fails comparison', () => {
  const expected = expectedRuntimeCache(syntheticRuntime);
  const mismatch = runtimeCacheProblem(syntheticRuntime, `const CACHE = 'brainbite-v2.0-shell-runtime-${'0'.repeat(64)}';`);
  assert.match(mismatch, /^service-worker CACHE mismatch:/);
  assert.match(mismatch, new RegExp(expected));
  assert.match(mismatch, /found "brainbite-v2\.0-shell-runtime-0{64}"/);
  assert.match(mismatch, /Set CACHE .* then run npm run package:manifest\.$/);
  assert.match(runtimeCacheProblem(syntheticRuntime, "const CACHE = 'brainbite-' + digest;"), /not a plain string literal/);
  assert.match(runtimeCacheProblem(syntheticRuntime, `/*\nconst CACHE = '${expected}';\n*/\nconst CACHE = prefix + digest;`), /not a plain string literal/);
});

test('the expected runtime cache uses the content-addressed constant format', () => {
  const expected = expectedRuntimeCache(syntheticRuntime);
  assert.equal(runtimeFingerprint(syntheticRuntime), 'a4fd618bf64a486ed8ba2351af228984fb82d114286a3d5809ba88f227cc516a');
  assert.equal(expected, `brainbite-v2.0-shell-runtime-${runtimeFingerprint(syntheticRuntime)}`);
  assert.match(expected, /^brainbite-v2\.0-shell-runtime-[0-9a-f]{64}$/);
  assert.equal(runtimeCacheProblem(syntheticRuntime, `const CACHE = '${expected}';`), null);
});
