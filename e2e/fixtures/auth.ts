import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';

// Logs in as the seeded holder once and saves storageState.
// Tests load it via: use: { storageState: 'e2e/.auth/holder.json' }
// If login fails (e.g. seed not run, wrong NEXTAUTH_URL), a warning is printed
// and the file is not written. Tests that require auth will fail individually.
// Claimer (magic-link only) is handled per-test via Mailosaur in Phase 2.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseURL}/login`);
    await page.getByTestId('login-email').fill(process.env.TEST_HOLDER_EMAIL || 'holder@test.com');
    await page.getByTestId('login-password').fill(process.env.TEST_HOLDER_PASSWORD || 'password123');
    await page.getByTestId('login-submit').click();

    await page.waitForURL(`${baseURL}/dashboard`, { timeout: 10000 });
    await page.context().storageState({ path: 'e2e/.auth/holder.json' });
    console.log('[globalSetup] Holder auth state saved to e2e/.auth/holder.json');
  } catch {
    console.warn('[globalSetup] WARNING: Could not log in as holder — auth-dependent tests will fail.');
    console.warn('[globalSetup] Ensure seed-test.ts has been run and NEXTAUTH_URL matches the test server.');
    // Write an empty state file so tests that declare storageState don't crash on file-not-found
    fs.mkdirSync('e2e/.auth', { recursive: true });
    fs.writeFileSync('e2e/.auth/holder.json', JSON.stringify({ cookies: [], origins: [] }));
  } finally {
    await browser.close();
  }
}
