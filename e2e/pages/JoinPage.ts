import { Page, expect } from '@playwright/test';
import { TESTIDS } from '../../src/lib/testids';

export class JoinPage {
  constructor(private page: Page) {}

  async goto(fromSlug?: string) {
    const url = fromSlug ? `/join?from=${fromSlug}` : '/join';
    await this.page.goto(url);
  }

  async fill(opts: { firstName: string; lastName: string; email: string; password: string; phone?: string }) {
    await this.page.getByTestId(TESTIDS.joinFirstName).fill(opts.firstName);
    await this.page.getByTestId(TESTIDS.joinLastName).fill(opts.lastName);
    await this.page.getByTestId(TESTIDS.joinEmail).fill(opts.email);
    await this.page.getByTestId(TESTIDS.joinPhone).fill(opts.phone ?? '5551234567');
    await this.page.getByTestId(TESTIDS.joinPassword).fill(opts.password);
    await this.page.getByTestId(TESTIDS.joinTermsCheckbox).check();
  }

  async submit() {
    await this.page.getByTestId(TESTIDS.joinSubmit).click();
  }

  async createAccount(opts: { firstName: string; lastName: string; email: string; password: string; phone?: string }) {
    await this.fill(opts);
    await this.submit();
  }

  error() {
    return this.page.getByTestId(TESTIDS.joinError);
  }

  async assertRedirectedToShare(slug: string) {
    await expect(this.page).toHaveURL(new RegExp(`/share/${slug}`));
  }
}
