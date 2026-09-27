import { defineConfig } from '@playwright/test';

const testPort = Number(process.env.BRAINBITE_TEST_PORT || 4318);
const testBaseUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  globalSetup: './tests/playwright-global-setup.mjs',
  testDir: 'tests',
  testMatch: ['release.spec.js', 'brainbase.spec.js', 'match.spec.js', 'activity-families.spec.js', 'webgl.spec.js', 'webgl-accessibility.spec.js', 'webgl-assets.spec.js', 'bubble-reef-preview.spec.js', 'native-shell.spec.js'],
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : [['line']],
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || '.playwright-results',
  // Gate 8.4 / release suite validates shipping 2D DOM, not Batch 9 MATCH plates.
  use: {
    baseURL: testBaseUrl,
    trace: 'on-first-retry',
  },
});
