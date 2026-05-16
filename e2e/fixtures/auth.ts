import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';

const HOLDER_EMAIL = process.env.TEST_HOLDER_EMAIL || 'holder@test.com';
const HOLDER_PASSWORD = process.env.TEST_HOLDER_PASSWORD || 'password123';

// Ensures holder@test.com exists and saves storageState.
// API-first: POST /api/auth/signup (200=created, 409=exists — both OK),
// then log in via UI to get the NextAuth JWT session cookie.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  fs.mkdirSync('e2e/.auth', { recursive: true });

  const bypassSecret = process.env.VERCEL_BYPASS_SECRET;
  const extraHTTPHeaders: Record<string, string> = bypassSecret
    ? { 'x-vercel-protection-bypass': bypassSecret }
    : {};

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, extraHTTPHeaders });

  try {
    const signupRes = await context.request.post('/api/auth/signup', {
      data: { firstName: 'Mark', lastName: 'Thompson', email: HOLDER_EMAIL, password: HOLDER_PASSWORD, agreedToTerms: true, marketingOptIn: false },
    });
    console.log(`[globalSetup] Signup API → ${signupRes.status()}`);

    const page = await context.newPage();
    await page.goto('/login');
    await page.getByTestId('login-email').fill(HOLDER_EMAIL);
    await page.getByTestId('login-password').fill(HOLDER_PASSWORD);
    await page.getByTestId('login-submit').click();

    try {
      await page.waitForURL(/\/dashboard|\/packages\/new/, { timeout: 15000 });
      await context.storageState({ path: 'e2e/.auth/holder.json' });
      console.log('[globalSetup] Auth saved. URL:', page.url());
    } catch {
      const errorText = await page.getByTestId('login-error').textContent().catch(() => 'none');
      console.warn(`[globalSetup] Login failed. URL: ${page.url()}, error: ${errorText}`);
      fs.writeFileSync('e2e/.auth/holder.json', JSON.stringify({ cookies: [], origins: [] }));
    }
  } catch (err) {
    console.warn('[globalSetup] Error:', err);
    fs.writeFileSync('e2e/.auth/holder.json', JSON.stringify({ cookies: [], origins: [] }));
  } finally {
    await context.close();
    await browser.close();
  }
}
