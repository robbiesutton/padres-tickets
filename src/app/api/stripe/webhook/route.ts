import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await prisma.subscription.upsert({
        where: { userId },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
          status: subscription.status === 'trialing' ? 'TRIALING' : 'ACTIVE',
          billingCycle: 'ANNUAL',
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        create: {
          userId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
          status: subscription.status === 'trialing' ? 'TRIALING' : 'ACTIVE',
          billingCycle: 'ANNUAL',
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const existing = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!existing) break;

      const statusMap: Record<string, 'ACTIVE' | 'TRIALING' | 'CANCELLED' | 'PAST_DUE'> = {
        active: 'ACTIVE',
        trialing: 'TRIALING',
        past_due: 'PAST_DUE',
        canceled: 'CANCELLED',
        unpaid: 'PAST_DUE',
      };

      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: statusMap[subscription.status] || 'ACTIVE',
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          stripePriceId: subscription.items.data[0]?.price.id,
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = invoice.parent?.subscription_details?.subscription;
      const subId = typeof subRef === 'string' ? subRef : subRef?.id;
      if (subId) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { status: 'PAST_DUE' },
        });
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = invoice.parent?.subscription_details?.subscription;
      const subId = typeof subRef === 'string' ? subRef : subRef?.id;
      if (subId) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { status: 'ACTIVE' },
        });
      }
      break;
    }
  }

  return Response.json({ received: true });
}
