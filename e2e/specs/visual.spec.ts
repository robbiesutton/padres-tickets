import { test, expect } from '@playwright/test';

// Visual regression tests — chromium-desktop only (via playwright.config.ts snapshotPathTemplate).
// Baselines live in e2e/specs/__screenshots__/ and are committed to the repo.
// First run on a new scene: creates the baseline file, does NOT fail CI.
// Subsequent runs: diff against the baseline; fail if delta > maxDiffPixelRatio (1%).
//
// To update baselines after an intentional UI change:
//   npx playwright test e2e/specs/visual.spec.ts --update-snapshots

// Pages that don't require auth
test.describe('Public pages', () => {
  test('landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page).toHaveScreenshot('login.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('signup page', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('signup.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('join page', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByTestId('join-email')).toBeVisible();
    await expect(page).toHaveScreenshot('join.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('forgot-password.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

// Pages that require holder auth
test.describe('Authenticated pages', () => {
  test.use({ storageState: 'e2e/.auth/holder.json' });

  test('dashboard — game list', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for content to settle before screenshotting
    await expect(page.getByTestId('dashboard-nav')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('dashboard nav bar', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-nav')).toBeVisible();
    const nav = page.getByTestId('dashboard-nav');
    await expect(nav).toHaveScreenshot('dashboard-nav.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('profile page', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL(/\/dashboard\/profile/);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('profile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

// Share page — two views, no auth needed (public-facing page)
test.describe('Share page', () => {
  const TEST_SLUG = 'mark-rockies-test';

  test('share page calendar view (unauthenticated join redirect)', async ({
    page,
  }) => {
    // Unauthenticated visitors are redirected to /join
    await page.goto(`/share/${TEST_SLUG}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('share-join-redirect.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  // Authenticated share page tests require the DB user to be the package
  // owner, but the Vercel preview DB is a separate Neon branch from the CI
  // seed DB. The seeded ownership doesn't carry over, so holder@test.com
  // ends up as a claimer (FTU view) producing an inconsistent baseline.
  // Skipped here — visual coverage of the authenticated share page belongs
  // on a dedicated visual regression PR that owns the full DB setup.
  test.describe.skip('Authenticated share page', () => {
    test.use({ storageState: 'e2e/.auth/holder.json' });

    test('share page list view', async ({ page }) => {
      await page.goto(`/share/${TEST_SLUG}`);
      await page.waitForLoadState('networkidle');
      // Switch to list view
      const listToggle = page.locator(
        '[data-testid="view-toggle-list"]:visible'
      );
      if ((await listToggle.count()) > 0) {
        await listToggle.first().click();
        await page.waitForLoadState('networkidle');
      }
      // Wait for game cards to be fully painted before screenshotting.
      await page.waitForSelector('[data-testid="game-card"]', { state: 'visible', timeout: 5000 }).catch(() => {});
      await expect(page).toHaveScreenshot('share-list-view.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('share page calendar view', async ({ page }) => {
      await page.goto(`/share/${TEST_SLUG}`);
      await page.waitForLoadState('networkidle');
      const calToggle = page.locator(
        '[data-testid="view-toggle-calendar"]:visible'
      );
      if ((await calToggle.count()) > 0) {
        await calToggle.first().click();
        await page.waitForLoadState('networkidle');
      }
      await expect(page).toHaveScreenshot('share-calendar-view.png', {
        maxDiffPixelRatio: 0.01,
      });
    });
  });
});

// Mobile visual regression — runs on iPhone 13 via @mobile grep
test.describe('@mobile Mobile visual regression', () => {
  test('@mobile join page on mobile', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByTestId('join-email')).toBeVisible();
    await expect(page).toHaveScreenshot('mobile-join.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('@mobile login page on mobile', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page).toHaveScreenshot('mobile-login.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('@mobile share page (unauthenticated redirect) on mobile', async ({
    page,
  }) => {
    await page.goto('/share/mark-rockies-test');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('mobile-share-redirect.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test.describe('@mobile Authenticated mobile views', () => {
    test.use({ storageState: 'e2e/.auth/holder.json' });

    test('@mobile dashboard on mobile', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByTestId('dashboard-nav')).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('mobile-dashboard.png', {
        maxDiffPixelRatio: 0.01,
      });
    });

    test('@mobile share page list view on mobile', async ({ page }) => {
      await page.goto('/share/mark-rockies-test');
      await page.waitForLoadState('networkidle');
      const listToggle = page.locator(
        '[data-testid="view-toggle-list"]:visible'
      );
      if ((await listToggle.count()) > 0) {
        // Use evaluate() to fire a direct DOM click — Playwright's locator.click()
        // times out on webkit-iphone-13 even with force:true due to actionability
        // machinery differences. evaluate() bypasses that entirely.
        await page.evaluate(() => {
          const btn = [...document.querySelectorAll('[data-testid="view-toggle-list"]')]
            .find(el => window.getComputedStyle(el).display !== 'none') as HTMLElement | undefined;
          btn?.click();
        });
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      }
      await expect(page).toHaveScreenshot('mobile-share-list.png', {
        maxDiffPixelRatio: 0.01,
      });
    });
  });
});
