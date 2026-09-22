import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const nativeRoot = path.join(repoRoot, 'src-tauri');
export const stagedRoot = path.join(repoRoot, '.native-site');

const forbiddenRuntimePaths = [
  '.git',
  '.github',
  '.cursor',
  'AGENTS.md',
  'docs',
  'node_modules',
  'release-evidence',
  'scripts',
  'src-tauri',
  'tests',
];

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(absolutePath));
    else files.push(absolutePath);
  }
  return files;
}

export function verifyNativeShell() {
  const configPath = path.join(nativeRoot, 'tauri.conf.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const failures = [];

  if (config.identifier !== 'com.collinsventures.brainbite') failures.push('unexpected app identifier');
  if (config.productName !== 'BrainBite') failures.push('unexpected product name');
  if (Object.hasOwn(config.build ?? {}, 'devUrl')) failures.push('production config must not define devUrl');
  if (config.build?.frontendDist !== '../.native-site') failures.push('frontendDist must target the staged runtime');
  if (config.app?.windows?.[0]?.useHttpsScheme !== true) failures.push('the packaged asset protocol must use its secure scheme');
  if (config.app?.security?.capabilities?.length !== 1 || config.app.security.capabilities[0] !== 'default') {
    failures.push('only the minimal default capability may be enabled');
  }

  const capability = JSON.parse(fs.readFileSync(path.join(nativeRoot, 'capabilities', 'default.json'), 'utf8'));
  if (!Array.isArray(capability.permissions) || capability.permissions.length !== 0) {
    failures.push('native permissions must remain empty');
  }

  const shellFiles = walkFiles(nativeRoot).filter(file => !file.includes(`${path.sep}target${path.sep}`));
  const forbiddenNetworkOrigin = /(?:localhost|127\.0\.0\.1)/i;
  const listenerConfiguration = /(?:TcpListener|\.listen\s*\(|createServer\s*\()/;
  for (const file of shellFiles) {
    const relativePath = path.relative(repoRoot, file);
    const source = fs.readFileSync(file, 'utf8');
    if (forbiddenNetworkOrigin.test(source)) failures.push(`${relativePath} contains a loopback host`);
    if (listenerConfiguration.test(source)) failures.push(`${relativePath} contains listener configuration`);
  }

  if (!fs.existsSync(path.join(stagedRoot, 'index.html'))) failures.push('staged index.html is missing');
  for (const relativePath of forbiddenRuntimePaths) {
    if (fs.existsSync(path.join(stagedRoot, relativePath))) failures.push(`developer-only path leaked: ${relativePath}`);
  }

  if (failures.length) throw new Error(`Native shell verification failed:\n- ${failures.join('\n- ')}`);
  return { shellFiles: shellFiles.length, stagedFiles: walkFiles(stagedRoot).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = verifyNativeShell();
  console.log(`Verified ${result.shellFiles} native shell files and ${result.stagedFiles} staged runtime files.`);
  console.log('Production shell has no loopback URL, devUrl, listener, or native capability permissions.');
}

