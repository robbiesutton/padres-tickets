'use client';

import posthog from 'posthog-js';
import { PostHogProvider, usePostHog } from 'posthog-js/react';
import { Suspense, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalyticsConsent } from '@/components/cookie-consent';

function PostHogInit() {
  const { data: session } = useSession();
  const hasConsent = useAnalyticsConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!hasConsent || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        capture_pageview: false,
        capture_pageleave: true,
        person_profiles: 'identified_only',
      });
    }
  }, [hasConsent]);

  useEffect(() => {
    if (hasConsent && ph) ph.capture('$pageview');
  }, [pathname, searchParams, hasConsent, ph]);

  useEffect(() => {
    if (session?.user?.id && hasConsent && ph) {
      ph.identify(session.user.id, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      });
    }
  }, [session, hasConsent, ph]);

  return null;
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogInit />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}
