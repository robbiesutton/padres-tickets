import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';

const HOLDER_EMAIL = process.env.TEST_HOLDER_EMAIL || 'holder@test.com';
const HOLDER_PASSWORD = process.env.TEST_HOLDER_PASSWORD || 'password123';

// Ensures holder@test.com exists in the preview DB and saves storageState.
// Strategy:
// 1. Try login via credentials
// 2. If that fails, create via /join page (no phone required; calls /api/auth/signup
//    which sets session cookie directly — works even without NEXTAUTH_SECRET in preview)
// 3. If both fail, save empty state and let auth-dependent tests fail individually
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  fs.mkdirSync('e2e/.auth', { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const loggedIn = await tryLogin(page, baseURL);

    if (loggedIn) {
      await page.context().storageState({ path: 'e2e/.auth/holder.json' });
      console.log('[globalSetup] Logged in as existing holder.');
      return;
    }

    console.log('[globalSetup] Login failed — creating holder via /join...');
    const created = await tryCreateViaJoin(page, baseURL);

    if (created) {
      await page.context().storageState({ path: 'e2e/.auth/holder.json' });
      console.log('[globalSetup] Created holder account and saved auth state.');
    } else {
      console.warn('[globalSetup] WARNING: Could not authenticate — holder auth tests will fail.');
      fs.writeFileSync('e2e/.auth/holder.json', JSON.stringify({ cookies: [], origins: [] }));
    }
  } catch (err) {
    console.warn('[globalSetup] Unexpected error:', err);
    fs.writeFileSync('e2e/.auth/holder.json', JSON.stringify({ cookies: [], origins: [] }));
  } finally {
    await browser.close();
  }
}

async function tryLogin(page: import('@playwright/test').Page, baseURL: string): Promise<boolean> {
  try {
    await page.goto(`${baseURL}/login`);
    await page.getByTestId('login-email').fill(HOLDER_EMAIL);
    await page.getByTestId('login-password').fill(HOLDER_PASSWORD);
    await page.getByTestId('login-submit').click();
    await page.waitForURL(`${baseURL}/dashboard`, { timeout: 12000 });
    return true;
  } catch {
    return false;
  }
}

async function tryCreateViaJoin(page: import('@playwright/test').Page, baseURL: string): Promise<boolean> {
  try {
    // /join has no phone field and calls /api/auth/signup directly
    await page.goto(`${baseURL}/join`);
    await page.getByTestId('join-first-name').fill('Mark');
    await page.getByTestId('join-last-name').fill('Thompson');
    await page.getByTestId('join-email').fill(HOLDER_EMAIL);
    await page.getByTestId('join-password').fill(HOLDER_PASSWORD);
    await page.getByTestId('join-terms-checkbox').check();
    await page.getByTestId('join-submit').click();
    // /join with no `from` param redirects to /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 12000 });
    return true;
  } catch {
    return false;
  }
}
