import { test, expect } from '@playwright/test';

const assets = ['mascot', 'jungle_props', 'portal', 'answer_pillars', 'kraken'];

test('world art is available from the install cache before an app visit', async ({ page, context }) => {
  const artPaths = [
    '/assets/art/number-nebula.svg',
    '/assets/art/wordwood.svg',
    '/assets/art/language-portals.svg',
  ];

  // This page renders no world art, so only service-worker installation can cache the SVGs.
  await page.goto('/privacy.html');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
  });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  const results = await page.evaluate(async paths => Promise.all(paths.map(async path => {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      return {
        path,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        body: await response.text(),
      };
    } catch (error) {
      return { path, error: String(error) };
    }
  })), artPaths);

  for (const result of results) {
    expect(result.error, result.path).toBeUndefined();
    expect(result.ok, result.path).toBe(true);
    expect(result.contentType, result.path).toContain('image/svg+xml');
    expect(result.body, result.path).toMatch(/<svg[\s>]/);
  }
});

test('parsed GLB documents are cached and scene disposal only detaches their shared resources', async ({ page }) => {
  const glbRequests = [];
  page.on('request', request => { if (/\.glb($|\?)/.test(request.url())) glbRequests.push(request.url().split('/').pop()); });
  await page.goto('/?presentation=webgl');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.BrainBiteGltfCache?.size?.() || 0)).toBeGreaterThan(0);
  const afterHome = { size: await page.evaluate(() => window.BrainBiteGltfCache.size()), clones: await page.evaluate(() => window.BrainBiteGltfCache.clones()), requests: glbRequests.length };
  expect(afterHome.requests).toBeGreaterThan(0);

  const probedResources = await page.evaluate(async () => {
    const { loadGltfAsset, disposeGltfAsset } = await import('/presentation/gltf-assets.mjs');
    const root = await loadGltfAsset('mascot');
    const resources = new Set();
    root.traverse(child => {
      if (child.geometry) resources.add(child.geometry);
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!material) continue;
        resources.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
      }
      if (child.skeleton?.boneTexture) resources.add(child.skeleton.boneTexture);
    });
    const probe = { disposals: 0, root };
    for (const resource of resources) resource.addEventListener('dispose', () => { probe.disposals += 1; });
    window.__sharedGltfDisposalProbe = probe;
    disposeGltfAsset(root);
    return resources.size;
  });
  expect(probedResources).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__sharedGltfDisposalProbe.disposals)).toBe(0);

  // Move to the battle and back: the same assets must come from the cache, not the network.
  await page.evaluate(() => window.BrainBiteGame.startMission(1));
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
  await page.evaluate(() => document.querySelector('nav button[data-screen="home"]')?.click());
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.BrainBiteGltfCache.clones())).toBeGreaterThan(afterHome.clones);
  expect(await page.evaluate(() => window.__sharedGltfDisposalProbe.disposals)).toBe(0);

  const after = { size: await page.evaluate(() => window.BrainBiteGltfCache.size()), clones: await page.evaluate(() => window.BrainBiteGltfCache.clones()) };
  const repeatRequests = glbRequests.slice(afterHome.requests).filter(name => glbRequests.slice(0, afterHome.requests).includes(name));
  expect(repeatRequests, `repeated GLB downloads: ${repeatRequests.join(', ')}`).toEqual([]);
  // More mounts than parsed documents proves the cache is being reused.
  expect(after.clones).toBeGreaterThan(after.size);
  expect(after.size).toBeLessThanOrEqual(assets.length);
});

test('generated GLBs are served and loaded by both live scenes', async ({ page, request }) => {
  for (const asset of assets) {
    const response = await request.get(`/assets/generated/blender/glb/brainbite_${asset}.glb`);
    expect(response.ok(), asset).toBe(true);
    expect((await response.body()).subarray(0, 4).toString(), asset).toBe('glTF');
  }

  const loaded = new Set();
  page.on('requestfinished', request => {
    const match = request.url().match(/brainbite_(.+)\.glb$/);
    if (match) loaded.add(match[1]);
  });
  await page.goto('/?presentation=webgl');
  await expect.poll(() => [...loaded].sort()).toEqual(['jungle_props', 'mascot', 'portal']);
  await page.evaluate(() => window.BrainBiteGame.startMission(1));
  await expect.poll(() => [...loaded].sort()).toEqual(assets.slice().sort());
  await expect(page.locator('.webgl-answer-controls button')).toHaveCount(4);
});

test('a failed GLB request keeps the procedural scene operational', async ({ page }) => {
  await page.route('**/brainbite_portal.glb', route => route.abort());
  await page.goto('/?presentation=webgl');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await page.getByRole('button', { name: /enter the 3d play portal/i }).click();
  await expect(page.locator('#game canvas.webgl-canvas')).toHaveCount(1);
});

test('ordinary missions do not present the Fraction Kraken encounter', async ({ page }) => {
  await page.goto('/?presentation=webgl');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await page.evaluate(() => window.BrainBiteGame.startPracticeMission(3));
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-encounter', 'activity');
  await expect(page.locator('#bossBox')).toBeHidden();
  await page.evaluate(() => window.BrainBiteGame.startPracticeMission(10));
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-encounter', 'boss');
  await expect(page.locator('#bossName')).toHaveText('Astro Muncher');
});

test('responsive scene resize keeps the portal and canvas inside their host', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 853 });
  await page.goto('/?presentation=webgl');
  const portal = page.getByRole('button', { name: /enter the 3d play portal/i });
  await expect(portal).toBeVisible();
  for (const width of [1280, 390, 1920]) {
    await page.setViewportSize({ width, height: 853 });
    await expect.poll(() => page.evaluate(() => {
      const element = document.querySelector('#home .home-stage');
      const host = element.getBoundingClientRect();
      const canvas = document.querySelector('#home canvas.webgl-canvas').getBoundingClientRect();
      const button = document.querySelector('.webgl-home-portal').getBoundingClientRect();
      return Math.abs(element.clientWidth - canvas.width) < 2 && button.left >= host.left && button.right <= host.right
        && button.top >= host.top && button.bottom <= host.bottom
        && document.documentElement.scrollWidth <= innerWidth;
    })).toBe(true);
  }
});

test('cached 3D scenes reopen offline with their shared environment dependency', async ({ page, context }) => {
  await page.goto('/?presentation=webgl');
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(async () => {
    const paths = ['/presentation/jungle-environment.mjs', '/presentation/props.mjs', '/presentation/programmable-bit.mjs',
      '/presentation/character-animation.mjs', '/presentation/graphics-quality.mjs', '/presentation/surface-textures.mjs',
      '/presentation/performance-budget.mjs', '/assets/generated/blender/glb/brainbite_answer_pillars.glb'];
    return (await Promise.all(paths.map(path => caches.match(path)))).every(Boolean);
  })).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#home canvas.webgl-canvas')).toHaveCount(1);
  await page.getByRole('button', { name: /enter the 3d play portal/i }).click();
  await expect(page.locator('.webgl-answer-controls button')).toHaveCount(4);
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-encounter', 'activity');
});

test('animated Bite and real quality budgets load in both scenes', async ({ page }) => {
  await page.goto('/?presentation=webgl');
  const home = page.locator('#home .home-stage');
  await expect(home).toHaveAttribute('data-character-animated', 'true');
  await page.evaluate(() => {
    document.documentElement.classList.remove('low-end-device', 'quality-balanced');
    document.documentElement.classList.add('quality-ultra');
  });
  await expect(home).toHaveAttribute('data-shadow-size', '2048');
  await page.evaluate(() => {
    document.documentElement.classList.remove('quality-ultra');
    document.documentElement.classList.add('quality-performance');
  });
  await expect(home).toHaveAttribute('data-shadow-size', '0');
  await expect(home).toHaveAttribute('data-pixel-ratio', '1');
  await page.evaluate(() => window.BrainBiteGame.startPracticeMission(3));
  await expect(page.locator('#game .battle-frame')).toHaveAttribute('data-character-animated', 'true');
});

test('live WebGL scenes expose frame and scene-load budget evidence', async ({ page }) => {
  const createLongTask = () => page.evaluate(() => {
    const startedAt = performance.now();
    while (performance.now() - startedAt < 80) {
      // Keep the main thread busy long enough to emit a PerformanceLongTaskTiming entry.
    }
  });
  await page.goto('/?presentation=webgl');
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport()?.home?.metrics?.sceneLoad?.count || 0)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport()?.home?.metrics?.frame?.count || 0)).toBeGreaterThan(2);
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport()?.home?.assetTiming?.count || 0)).toBe(3);
  const homeLongTaskCount = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().home.metrics.longTask.count);
  await createLongTask();
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport()?.home?.metrics?.longTask?.count || 0)).toBeGreaterThan(homeLongTaskCount);
  const homeReport = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().home);
  expect(homeReport.metrics.sceneLoad.count).toBe(1);
  expect(homeReport.metrics.frame.p95).not.toBeNull();
  expect(homeReport.metrics.longTask.count).toBeGreaterThan(homeLongTaskCount);
  expect(homeReport.metrics.rendererGeometries.count).toBeGreaterThan(0);
  expect(homeReport.metrics.renderCalls.max).toBeLessThanOrEqual(200);
  expect(homeReport.assetTiming.count).toBeGreaterThan(0);

  await page.evaluate(() => window.BrainBiteGame.startMission(1));
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport()?.battle?.metrics?.sceneLoad?.count || 0)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport()?.battle?.metrics?.frame?.count || 0)).toBeGreaterThan(2);
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport()?.battle?.assetTiming?.count || 0)).toBe(3);
  const battleLongTaskCount = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().battle.metrics.longTask.count);
  await createLongTask();
  await expect.poll(() => page.evaluate(() => window.BrainBitePresentation?.getPerformanceReport()?.battle?.metrics?.longTask?.count || 0)).toBeGreaterThan(battleLongTaskCount);
  const battleReport = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().battle);
  expect(battleReport.metrics.sceneLoad.count).toBe(1);
  expect(battleReport.metrics.frame.p99).not.toBeNull();
  expect(battleReport.metrics.longTask.count).toBeGreaterThan(battleLongTaskCount);
  expect(battleReport.metrics.rendererGeometries.count).toBeGreaterThan(0);
  expect(battleReport.assetTiming.count).toBeGreaterThan(0);
  const runtimeReport = await page.evaluate(() => window.BrainBitePresentation.getPerformanceReport().runtime);
  expect(runtimeReport.metrics.save.count).toBeGreaterThan(0);
});
