// Captures home and battle screens in the live WebGL and DOM presentations at the
// rubric viewports, and writes side-by-side images against the approved targets.
// Output goes to .ui-captures/ (git-ignored). It never writes into docs/references/.
//
//   npm run capture:ui                      all modes and viewports
//   npm run capture:ui -- --mode webgl      one mode
//   npm run capture:ui -- --size 1280x800   one viewport
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBrainBiteServer } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.ui-captures');
const port = Number(process.env.BRAINBITE_TEST_PORT || 4318);
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const MODES = arg('mode') ? [arg('mode')] : ['webgl', 'dom'];
const SIZES = (arg('size') ? [arg('size')] : ['1024x682', '1280x800', '1920x1080', '390x844'])
  .map((s) => { const [w, h] = s.split('x').map(Number); return { w, h }; });
const TARGETS = { home: 'docs/references/home-dashboard-target.jpg', battle: 'docs/references/battle-hud-target.jpg' };
const BOSS_MISSION_ID = 10; // Astro Muncher, the first math boss

await mkdir(out, { recursive: true });
let server = null;
try {
  server = await createBrainBiteServer({ port });
} catch (error) {
  if (error?.code !== 'EADDRINUSE') throw error;
  server = null; // reuse a server that is already running on the port
}

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const written = [];
async function shot(page, name) {
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file });
  written.push(file);
  return file;
}
async function sideBySide(page, screen, file, size) {
  const target = await readFile(path.join(root, TARGETS[screen]));
  const current = await readFile(file);
  const html = `<body style="margin:0;background:#111;display:flex;gap:8px;align-items:flex-start">
    <figure style="margin:0;color:#fff;font:14px sans-serif"><img src="data:image/jpeg;base64,${target.toString('base64')}" style="width:640px;display:block">target</figure>
    <figure style="margin:0;color:#fff;font:14px sans-serif"><img src="data:image/png;base64,${current.toString('base64')}" style="width:640px;display:block">current ${size.w}x${size.h}</figure></body>`;
  const p = await browser.newPage({ viewport: { width: 1296, height: Math.round(640 * Math.max(682 / 1024, size.h / size.w)) + 30 } });
  await p.setContent(html);
  const sbs = file.replace(/\.png$/, '-vs-target.png');
  await p.screenshot({ path: sbs, fullPage: true });
  await p.close();
  written.push(sbs);
}

for (const mode of MODES) {
  for (const size of SIZES) {
    const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', (e) => console.error(`[${mode} ${size.w}] pageerror`, e.message));
    const tag = `${mode}-${size.w}`;
    await page.goto(`http://127.0.0.1:${port}/?presentation=${mode}`, { waitUntil: 'networkidle' });
    if (await page.locator('#firstRunName').isVisible().catch(() => false)) {
      await page.fill('#firstRunName', 'Alex');
      await page.locator('#firstRunConfirm').click().catch(() => {});
    }
    await page.waitForTimeout(5000);
    await sideBySide(page, 'home', await shot(page, `home-${tag}`), size);

    await page.evaluate(() => window.BrainBiteGame.startMission(1));
    await page.waitForTimeout(6000);
    await sideBySide(page, 'battle', await shot(page, `battle-${tag}`), size);

    await page.evaluate(() => {
      const state = window.BrainBiteGame.getState();
      const choices = window.BrainBiteGame.pillarChoices();
      const correct = choices.find((v) => (state.webglRemaining || state.m.correct || []).map(String).includes(String(v))) || state.m.correct[0];
      window.BrainBiteGame.tryAnswer(correct);
    });
    await page.waitForTimeout(700);
    await shot(page, `battle-correct-${tag}`);

    await page.evaluate((id) => window.BrainBiteGame.startPracticeMission(id), BOSS_MISSION_ID);
    await page.waitForTimeout(6000);
    await shot(page, `boss-${tag}`);
    await context.close();
  }
}
await browser.close();
if (server) await new Promise((resolve) => server.close(resolve));
await writeFile(path.join(out, 'index.json'), JSON.stringify({ capturedAt: new Date().toISOString(), files: written.map((f) => path.relative(root, f)) }, null, 2));
console.log(`capture:ui wrote ${written.length} image(s) to ${path.relative(root, out)}/`);
