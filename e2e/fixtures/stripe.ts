import Stripe from 'stripe';

export const TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
};

// Generates a valid Stripe webhook signature header for test payloads.
// Use this instead of the Stripe CLI background process — no external process,
// fully deterministic, uses STRIPE_WEBHOOK_SECRET_TEST env var.
export function generateTestWebhookHeader(payload: string): string {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST!, { typescript: true });
  const secret = process.env.STRIPE_WEBHOOK_SECRET_TEST!;
  const timestamp = Math.floor(Date.now() / 1000);
  return stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp });
}

export function makeSubscriptionEvent(type: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    data: {
      object: {
        id: 'sub_test_123',
        object: 'subscription',
        status: 'active',
        items: { data: [{ price: { id: 'price_test' }, current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30 }] },
        cancel_at_period_end: false,
        trial_end: null,
        customer: 'cus_test_123',
        ...overrides,
      },
    },
    ...overrides,
  };
}
