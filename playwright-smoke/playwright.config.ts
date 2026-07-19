import { defineConfig, devices } from '@playwright/test';

/**
 * Prueba funcional simple de Alahia ERP (Dev).
 * El video se guarda en ./videos
 */
export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'videos',
  use: {
    baseURL: process.env.ALAHIA_BASE_URL || 'http://localhost:8100',
    headless: false,
    channel: 'chrome',
    viewport: { width: 1366, height: 768 },
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    video: {
      mode: 'on',
      size: { width: 1366, height: 768 },
    },
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
