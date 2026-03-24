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
      subscription: true,
    },
  });

  if (!user) {
    return jsonError('User not found', 404);
  }

  const sub = user.subscription;

  // Case 1: Pending cancellation — undo it
  if (sub?.cancelAtPeriodEnd && sub.stripeSubscriptionId && sub.status !== 'CANCELLED') {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await prisma.subscription.update({
      where: { userId: user.id },
      data: { cancelAtPeriodEnd: false },
    });

    return jsonSuccess({ message: 'Subscription reactivated' });
  }

  // Case 2: Fully cancelled — create new checkout session
  const customerId = await getOrCreateStripeCustomer(
    user.id,
    user.email,
    `${user.firstName} ${user.lastName}`
  );

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
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    success_url: `${baseUrl}/dashboard/settings?subscription=success`,
    cancel_url: `${baseUrl}/dashboard/settings?subscription=cancelled`,
    metadata: { userId: user.id },
  });

  return jsonSuccess({ url: session.url });
}
