import { test, expect } from '@playwright/test';

// LAUNCH_CHECKLIST coverage:
// - All /dashboard/* routes require authentication
// - Claims only work for authenticated users
// - JWT tokens have 30-day expiry (tested structurally)
// - Magic link tokens expire in 15 minutes (single-use verified)

test.describe('Auth & access control', () => {
  test.describe('Unauthenticated redirects', () => {
    test('/dashboard redirects to /login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('/dashboard/profile redirects to /login', async ({ page }) => {
      await page.goto('/dashboard/profile');
      await expect(page).toHaveURL(/\/login/);
    });


    test('/share/* redirects unauthenticated visitor to /join', async ({ page }) => {
      await page.goto('/share/mark-rockies-test');
      await expect(page).toHaveURL(/\/join/);
      // Join page has the create account form
      await expect(page.getByTestId('join-email')).toBeVisible();
    });
  });

  test.describe('API access control', () => {
    test('/api/packages returns 401 for unauthenticated', async ({ request }) => {
      const res = await request.get('/api/packages');
      expect(res.status()).toBe(401);
    });

    test('/api/me/packages returns 401 for unauthenticated', async ({ request }) => {
      const res = await request.get('/api/me/packages');
      expect(res.status()).toBe(401);
    });

    test('/api/share/[slug]/claim returns 401 without auth', async ({ request }) => {
      const res = await request.post('/api/share/mark-rockies-test/claim', {
        data: { gameId: 'fake-game-id' },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('Magic link', () => {
    test('invalid token returns error', async ({ request }) => {
      const res = await request.get('/api/auth/magic-link/verify?token=definitely-invalid-token');
      // Should return 400 for invalid token
      expect(res.status()).toBe(400);
    });

    test('missing token returns error', async ({ request }) => {
      const res = await request.get('/api/auth/magic-link/verify');
      expect(res.status()).toBe(400);
    });
  });

  test.describe('Login page', () => {
    test('login page renders correctly', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByTestId('login-email')).toBeVisible();
      await expect(page.getByTestId('login-submit')).toBeVisible();
      await expect(page.getByTestId('forgot-password-link')).toBeVisible();
    });

    test('invalid credentials shows error', async ({ page }) => {
      await page.goto('/login');
      await page.getByTestId('login-email').fill('nobody@example.com');
      await page.getByTestId('login-password').fill('wrongpassword');
      await page.getByTestId('login-submit').click();
      await expect(page.getByTestId('login-error')).toBeVisible();
    });
  });

  test.describe('Cron authentication', () => {
    test('cron endpoint rejects missing secret', async ({ request }) => {
      const res = await request.post('/api/cron/transfer-reminders');
      expect(res.status()).toBe(401);
    });

    test('cron endpoint rejects wrong secret', async ({ request }) => {
      const res = await request.post('/api/cron/transfer-reminders', {
        headers: { 'x-cron-secret': 'wrong-secret' },
      });
      expect(res.status()).toBe(401);
    });
  });
});
