/**
 * One-time Stripe setup script.
 * Creates the BenchBuddy product, annual price, webhook endpoint, and customer portal config.
 *
 * Usage: npx tsx scripts/setup-stripe.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function main() {
  console.log('Setting up Stripe for BenchBuddy...\n');

  // 1. Create product
  console.log('1. Creating product...');
  const product = await stripe.products.create({
    name: 'BenchBuddy',
    description:
      'Share your season tickets with friends and family. $39.99/year with a 1-month free trial.',
  });
  console.log(`   Product created: ${product.id}`);

  // 2. Create annual price
  console.log('2. Creating annual price ($39.99/year)...');
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 3999, // $39.99 in cents
    currency: 'usd',
    recurring: {
      interval: 'year',
    },
    lookup_key: 'benchbuddy_annual',
  });
  console.log(`   Price created: ${price.id}`);

  // 3. Create webhook endpoint (for production — local testing uses Stripe CLI)
  const baseUrl = process.env.NEXTAUTH_URL || 'https://getbenchbuddy.com';
  // Only create a webhook endpoint if we're not on localhost
  if (!baseUrl.includes('localhost')) {
    console.log('3. Creating webhook endpoint...');
    const webhook = await stripe.webhookEndpoints.create({
      url: `${baseUrl}/api/stripe/webhook`,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed',
        'invoice.paid',
      ],
    });
    console.log(`   Webhook created: ${webhook.id}`);
    console.log(`   Webhook secret: ${webhook.secret}`);
    console.log(`   → Add this as STRIPE_WEBHOOK_SECRET in your .env`);
  } else {
    console.log(
      '3. Skipping webhook endpoint (localhost detected). Use Stripe CLI for local testing:'
    );
    console.log(
      '   stripe listen --forward-to localhost:3000/api/stripe/webhook'
    );
  }

  // 4. Configure Customer Portal
  console.log('4. Configuring Customer Portal...');
  try {
    await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'BenchBuddy — Manage your subscription',
      },
      features: {
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
        },
        payment_method_update: {
          enabled: true,
        },
        invoice_history: {
          enabled: true,
        },
      },
    });
    console.log('   Customer Portal configured');
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.log(`   Portal config note: ${err.message || 'already configured'}`);
  }

  // 5. Output summary
  console.log('\n=== Setup Complete ===\n');
  console.log('Add these to your .env file:\n');
  console.log(`STRIPE_PRICE_ANNUAL_ID=${price.id}`);
  if (!baseUrl.includes('localhost')) {
    console.log('STRIPE_WEBHOOK_SECRET=<see webhook secret above>');
  } else {
    console.log(
      'STRIPE_WEBHOOK_SECRET=<get from: stripe listen --forward-to localhost:3000/api/stripe/webhook>'
    );
  }

  // Auto-append to .env if possible
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (!envContent.includes('STRIPE_PRICE_ANNUAL_ID')) {
      fs.appendFileSync(envPath, `\nSTRIPE_PRICE_ANNUAL_ID=${price.id}\n`);
      console.log('\n✓ STRIPE_PRICE_ANNUAL_ID auto-added to .env');
    }
  }
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
