'use client';

import { Analytics } from '@vercel/analytics/next';
import { useAnalyticsConsent } from './cookie-consent';

export function ConditionalAnalytics() {
  const allowed = useAnalyticsConsent();
  if (!allowed) return null;
  return <Analytics />;
}
