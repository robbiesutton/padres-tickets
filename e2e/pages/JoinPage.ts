import { Page, expect } from '@playwright/test';

export class JoinPage {
  constructor(private page: Page) {}

  async goto(fromSlug?: string) {
    const url = fromSlug ? `/join?from=${fromSlug}` : '/join';
    await this.page.goto(url);
  }

  async fill(opts: { firstName: string; lastName: string; email: string; password: string }) {
    await this.page.getByTestId('join-first-name').fill(opts.firstName);
    await this.page.getByTestId('join-last-name').fill(opts.lastName);
    await this.page.getByTestId('join-email').fill(opts.email);
    await this.page.getByTestId('join-password').fill(opts.password);
    await this.page.getByTestId('join-terms-checkbox').check();
  }

  async submit() {
    await this.page.getByTestId('join-submit').click();
  }

  async createAccount(opts: { firstName: string; lastName: string; email: string; password: string }) {
    await this.fill(opts);
    await this.submit();
  }

  error() {
    return this.page.getByTestId('join-error');
  }

  async assertRedirectedToShare(slug: string) {
    await expect(this.page).toHaveURL(new RegExp(`/share/${slug}`));
  }
}
