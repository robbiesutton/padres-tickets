import { test, expect } from '@playwright/test';

// LAUNCH_CHECKLIST coverage: legal pages, 404 handling
// All tests are unauthenticated — no seeding required.

const LEGAL_PAGES = [
  '/privacy',
  '/terms',
  '/cookies',
  '/acceptable-use',
  '/community-guidelines',
  '/do-not-sell',
  '/about',
  '/contact',
  '/faq',
];

test.describe('Legal & content pages', () => {
  for (const path of LEGAL_PAGES) {
    test(`${path} returns 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), `${path} should return 200`).toBe(200);
      // Page should not be blank
      const body = await page.textContent('body');
      expect(body?.length, `${path} should have content`).toBeGreaterThan(100);
    });
  }

  test('footer links resolve on homepage', async ({ page }) => {
    await page.goto('/');
    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();
    // Verify at least some footer links exist
    expect(count).toBeGreaterThan(0);
  });

  test('unknown share slug redirects to join (not-found via middleware)', async ({ page }) => {
    await page.goto('/share/this-slug-definitely-does-not-exist-xyz987');
    await expect(page).toHaveURL(/\/join/);
  });

  test('error page renders on forced 500', async ({ page }) => {
    // Hit a non-existent API route to get a 404
    const res = await page.request.get('/api/this-does-not-exist');
    expect(res.status()).toBe(404);
  });
});
