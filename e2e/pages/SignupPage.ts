import { Page, expect } from '@playwright/test';

export class SignupPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/signup');
  }

  async fill(opts: { firstName: string; lastName: string; email: string; password: string }) {
    await this.page.getByTestId('signup-first-name').fill(opts.firstName);
    await this.page.getByTestId('signup-last-name').fill(opts.lastName);
    await this.page.getByTestId('signup-email').fill(opts.email);
    await this.page.getByTestId('signup-password').fill(opts.password);
    await this.page.getByTestId('signup-terms-checkbox').check();
  }

  async submit() {
    await this.page.getByTestId('signup-submit').click();
  }

  error() {
    return this.page.getByTestId('signup-error');
  }

  async assertOnDashboardOrPackageBuilder() {
    await expect(this.page).toHaveURL(/\/(dashboard|packages\/new)/);
  }
}
