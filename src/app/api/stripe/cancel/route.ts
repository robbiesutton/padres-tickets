import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const sessionUser = await requireAuth();
  if (!sessionUser) {
    return jsonError('Unauthorized', 401);
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: sessionUser.id },
    select: { stripeSubscriptionId: true, status: true },
  });

  if (!sub?.stripeSubscriptionId) {
    return jsonError('No active subscription found', 400);
  }

  if (sub.status === 'CANCELLED') {
    return jsonError('Subscription is already cancelled', 400);
  }

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { userId: sessionUser.id },
    data: { cancelAtPeriodEnd: true },
  });

  return jsonSuccess({ message: 'Subscription will cancel at period end' });
}
