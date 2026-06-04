import { test, expect } from '@playwright/test';

// @smoke — minimal tests that prove the pipe is working.
// Run with: npm run test:smoke
// These must pass before writing any further specs.
//
// NOTE: The share page is protected by middleware — unauthenticated visitors
// are redirected to /join (the claimer signup page). Auth-dependent tests
// (holder dashboard, actual share page) live in Phase 2 specs.

test.describe('@smoke — core pages load', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('signup page renders', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('signup-email')).toBeVisible();
    await expect(page.getByTestId('signup-submit')).toBeVisible();
  });

  test('legal pages return 200', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/cookies']) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} should return 200`).toBe(200);
    }
  });

  test('share link redirects unauthenticated visitor to join page', async ({ page }) => {
    // Middleware redirects /share/* to /join?from=<slug> for unauthenticated users
    await page.goto('/share/mark-rockies-test');
    await expect(page).toHaveURL(/\/join/);
    // Join page is the claimer signup form
    await expect(page.getByRole('button', { name: /create account|sign up|continue/i })).toBeVisible();
  });

  test('unknown share slug redirects to join page', async ({ page }) => {
    // Middleware redirects all /share/* before the page can call notFound()
    await page.goto('/share/this-slug-does-not-exist-xyz');
    await expect(page).toHaveURL(/\/join/);
  });
});
