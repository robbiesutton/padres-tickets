import { Page, expect } from '@playwright/test';
import { TESTIDS } from '../../src/lib/testids';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  nav() {
    return this.page.getByTestId(TESTIDS.dashboardNav);
  }

  accountAvatar() {
    return this.page.getByTestId(TESTIDS.accountAvatar);
  }

  packageSwitcher() {
    return this.page.getByTestId(TESTIDS.packageSwitcher);
  }

  async assertVisible() {
    await expect(this.nav()).toBeVisible();
  }
}
