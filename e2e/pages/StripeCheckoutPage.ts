import { Page } from '@playwright/test';
import { TEST_CARDS } from '../fixtures/stripe';

export class StripeCheckoutPage {
  constructor(private page: Page) {}

  async fillCard(cardNumber = TEST_CARDS.success) {
    // Stripe Checkout is in an iframe — locate by frame URL
    const frame = this.page.frameLocator('iframe[src*="stripe.com"]').first();
    await frame.locator('[placeholder="Card number"]').fill(cardNumber);
    await frame.locator('[placeholder="MM / YY"]').fill('12/30');
    await frame.locator('[placeholder="CVC"]').fill('123');
  }

  async submit() {
    await this.page.getByRole('button', { name: /subscribe|pay/i }).click();
  }
}
