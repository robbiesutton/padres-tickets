import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'playwright-report/results.json' }], ['github']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Pass Vercel deployment protection bypass header when testing against previews
    extraHTTPHeaders: process.env.VERCEL_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_SECRET }
      : {},
  },
  globalSetup: './e2e/fixtures/auth.ts',
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit-iphone-13',
      use: { ...devices['iPhone 13'] },
      grep: /@mobile/,
    },
    {
      name: 'chromium-pixel-5',
      use: { ...devices['Pixel 5'] },
      grep: /@mobile/,
    },
  ],
});
