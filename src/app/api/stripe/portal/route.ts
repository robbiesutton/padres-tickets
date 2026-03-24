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
    select: { stripeCustomerId: true },
  });

  if (!sub?.stripeCustomerId) {
    return jsonError('No billing account found', 400);
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/settings`,
  });

  return jsonSuccess({ url: session.url });
}
