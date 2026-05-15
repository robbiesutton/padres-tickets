import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';

const HOLDER_EMAIL = process.env.TEST_HOLDER_EMAIL || 'holder@test.com';
const HOLDER_PASSWORD = process.env.TEST_HOLDER_PASSWORD || 'password123';

// Ensures holder@test.com exists in the preview DB and saves storageState.
// Strategy:
// 1. Try to log in — works if seed already ran against the right branch
// 2. If login fails, sign up — handles the case where the Vercel preview uses
//    a per-PR Neon branch that hasn't been seeded yet
// 3. If signup also fails, save empty state so tests fail individually (not globally)
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  fs.mkdirSync('e2e/.auth', { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Step 1: try to log in
    const loggedIn = await tryLogin(page, baseURL);

    if (loggedIn) {
      await page.context().storageState({ path: 'e2e/.auth/holder.json' });
      console.log('[globalSetup] Logged in as existing holder.');
    } else {
      // Step 2: account may not exist in this DB branch — sign up
      console.log('[globalSetup] Login failed — attempting signup to create holder account...');
      const signedup = await trySignup(page, baseURL);

      if (signedup) {
        await page.context().storageState({ path: 'e2e/.auth/holder.json' });
        console.log('[globalSetup] Signed up and saved holder auth state.');
      } else {
        console.warn('[globalSetup] WARNING: Could not log in or sign up — holder auth tests will fail.');
        fs.writeFileSync('e2e/.auth/holder.json', JSON.stringify({ cookies: [], origins: [] }));
      }
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

async function trySignup(page: import('@playwright/test').Page, baseURL: string): Promise<boolean> {
  try {
    await page.goto(`${baseURL}/signup`);
    await page.getByTestId('signup-first-name').fill('Mark');
    await page.getByTestId('signup-last-name').fill('Thompson');
    await page.getByTestId('signup-email').fill(HOLDER_EMAIL);
    await page.getByTestId('signup-password').fill(HOLDER_PASSWORD);
    await page.getByTestId('signup-terms-checkbox').check();
    await page.getByTestId('signup-submit').click();
    // Signup redirects to /packages/new — that's success
    await page.waitForURL(/\/packages\/new|\/dashboard/, { timeout: 12000 });
    return true;
  } catch {
    return false;
  }
}
