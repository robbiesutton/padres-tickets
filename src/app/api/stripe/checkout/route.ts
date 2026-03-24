import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/services/subscription';

export async function POST() {
  const sessionUser = await requireAuth();
  if (!sessionUser) {
    return jsonError('Unauthorized', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      subscription: {
        select: { stripeSubscriptionId: true, status: true },
      },
    },
  });

  if (!user) {
    return jsonError('User not found', 404);
  }

  // Don't allow checkout if already subscribed
  if (
    user.subscription?.status === 'ACTIVE' ||
    user.subscription?.status === 'TRIALING'
  ) {
    return jsonError('Already subscribed', 400);
  }

  const customerId = await getOrCreateStripeCustomer(
    user.id,
    user.email,
    `${user.firstName} ${user.lastName}`
  );

  // Offer trial only to first-time subscribers
  const isFirstTime = !user.subscription?.stripeSubscriptionId;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ANNUAL_ID!,
        quantity: 1,
      },
    ],
    subscription_data: isFirstTime
      ? { trial_period_days: 30, metadata: { userId: user.id } }
      : { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    success_url: `${baseUrl}/dashboard/settings?subscription=success`,
    cancel_url: `${baseUrl}/dashboard/settings?subscription=cancelled`,
    metadata: { userId: user.id },
  });

  return jsonSuccess({ url: session.url });
}
