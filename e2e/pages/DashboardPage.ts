import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  nav() {
    return this.page.getByTestId('dashboard-nav');
  }

  accountAvatar() {
    return this.page.getByTestId('account-avatar');
  }

  packageSwitcher() {
    return this.page.getByTestId('package-switcher');
  }

  async assertVisible() {
    await expect(this.nav()).toBeVisible();
  }
}
