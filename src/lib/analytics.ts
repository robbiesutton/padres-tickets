import 'server-only';
import { PostHog } from 'posthog-node';

type EventProperties = Record<string, string | number | boolean | null>;

let _client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

export function trackServerEvent(
  name: string,
  properties?: EventProperties,
  userId?: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[analytics:server] ${name}`, properties ?? '');
    return;
  }
  const client = getClient();
  client?.capture({
    distinctId: userId ?? 'anonymous',
    event: name,
    properties,
  });
}

export const AnalyticsEvents = {
  // Funnel
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN: 'login',

  // Package setup
  PACKAGE_SETUP_STARTED: 'package_setup_started',
  PACKAGE_SETUP_STEP: 'package_setup_step',
  PACKAGE_SETUP_COMPLETED: 'package_setup_completed',

  // Sharing
  LINK_SHARED: 'link_shared',
  SHARE_LINK_OPENED: 'share_link_opened',

  // Claims
  CLAIM_STARTED: 'claim_started',
  CLAIM_COMPLETED: 'claim_completed',
  CLAIM_RELEASED: 'claim_released',

  // Transfers
  TRANSFER_MARKED_SENT: 'transfer_marked_sent',
  TRANSFER_MARKED_ACCEPTED: 'transfer_marked_accepted',

  // Payment
  PAYMENT_MARKED_PAID: 'payment_marked_paid',

  // Subscription
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Engagement
  DASHBOARD_VISIT: 'dashboard_visit',
  FILTER_USED: 'filter_used',
} as const;
