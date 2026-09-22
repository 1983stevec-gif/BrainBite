import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = process.env.BB_CAPTURE_DIR || fileURLToPath(new URL('../release-evidence/visual/', import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, width, height] of [['desktop', 1280, 853], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /THREE\.WebGLProgram|VALIDATE_STATUS|shader error|Error compiling/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    await page.addInitScript(() => {
      window.loadedSceneAssets = [];
      document.addEventListener('bb:webgl-asset-loaded', event => {
        window.loadedSceneAssets.push(event.detail.asset);
      }, true);
    });
    await page.goto(`http://127.0.0.1:` + String(process.env.BRAINBITE_TEST_PORT || 4318) + '/?presentation=webgl');
    await page.waitForFunction(() => ['mascot', 'portal', 'jungle'].every(x => window.loadedSceneAssets.includes(x)));
    await page.waitForTimeout(250);
    const homePerformance = await page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport?.().home || null);
    const homeLayout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
    }));
    await page.screenshot({ path: `${output}/${name}-home.png`, fullPage: true });
    // Use the actual math boss mission so the retained evidence covers the
    // boss arena instead of an ordinary Jungle Circuit encounter.
    await page.evaluate(() => window.BrainBiteGame.startMission(1));
    await page.waitForFunction(() => ['mascot', 'pillars', 'kraken'].filter((asset, index, list) => list.indexOf(asset) === index)
      .every(x => window.loadedSceneAssets.includes(x)));
    await page.waitForTimeout(250);
    const battlePerformance = await page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport?.().battle || null);
    const battleLayout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
    }));
    await page.screenshot({ path: `${output}/${name}-battle.png`, fullPage: true });
    const evidence = await page.evaluate(({ viewport, homePerformance, battlePerformance, homeLayout, battleLayout }) => ({
      viewport,
      errors: [],
      assets: window.loadedSceneAssets,
      layout: { home: homeLayout, battle: battleLayout },
      performance: {
        home: homePerformance,
        battle: battlePerformance,
        runtime: window.BrainBitePresentation?.getPerformanceReport?.().runtime || null,
      },
    }), { viewport: name, homePerformance, battlePerformance, homeLayout, battleLayout });
    evidence.errors = errors;
    await writeFile(`${output}/${name}-metrics.json`, JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence));
    if (errors.length) throw new Error(`${name} runtime errors`);
    await page.close();
  }
} finally { await browser.close(); }
