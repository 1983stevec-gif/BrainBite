import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['release.spec.js', 'brainbase.spec.js'],
  fullyParallel: false,
  workers: 1,
  reporter: [['line']],
  use: { baseURL: 'http://127.0.0.1:8080' },
  webServer: {
    command: 'node scripts/serve.mjs',
    port: 8080,
    reuseExistingServer: true,
  },
});
