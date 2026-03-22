// Analytics service — abstract interface for event tracking.
// Swap the implementation to PostHog, Mixpanel, Vercel Analytics, etc.

type EventProperties = Record<string, string | number | boolean | null>;

interface AnalyticsEvent {
  name: string;
  properties?: EventProperties;
}

// In-memory buffer for dev mode; production would send to provider
const devBuffer: AnalyticsEvent[] = [];

export function trackEvent(name: string, properties?: EventProperties) {
  const event: AnalyticsEvent = { name, properties };

  if (process.env.NODE_ENV === 'development') {
    devBuffer.push(event);
    console.log(`[analytics] ${name}`, properties || '');
    return;
  }

  // Production: send to analytics provider
  // TODO: Wire up PostHog, Mixpanel, or Vercel Analytics
  // Example with PostHog:
  // posthog.capture(name, properties);
}

// Server-side event tracking (for API routes)
export function trackServerEvent(name: string, properties?: EventProperties) {
  trackEvent(name, properties);
}

// Predefined event names for type safety
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

  // Engagement
  DASHBOARD_VISIT: 'dashboard_visit',
  FILTER_USED: 'filter_used',
} as const;
