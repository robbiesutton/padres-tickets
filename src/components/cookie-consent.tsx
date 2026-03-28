'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'custom';

interface CookiePrefs {
  essential: boolean; // always true
  analytics: boolean;
}

const STORAGE_KEY = 'bb_cookie_consent';

function getStoredPrefs(): CookiePrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storePrefs(prefs: CookiePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Dispatch custom event so Analytics component can react
  window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: prefs }));
}

export function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>('pending');
  const [showManage, setShowManage] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    const prefs = getStoredPrefs();
    if (prefs) {
      setStatus(prefs.analytics ? 'accepted' : 'rejected');
    }
  }, []);

  if (status !== 'pending') return null;

  function handleAcceptAll() {
    storePrefs({ essential: true, analytics: true });
    setStatus('accepted');
  }

  function handleRejectAll() {
    storePrefs({ essential: true, analytics: false });
    setStatus('rejected');
  }

  function handleSavePreferences() {
    storePrefs({ essential: true, analytics: analyticsEnabled });
    setStatus(analyticsEnabled ? 'accepted' : 'custom');
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-foreground/10 shadow-lg p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        {showManage ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Cookie Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-lg border border-foreground/10 p-3">
                <div>
                  <p className="text-sm font-medium">Essential Cookies</p>
                  <p className="text-xs text-foreground/50">Required for authentication and core functionality</p>
                </div>
                <input type="checkbox" checked disabled className="opacity-50" />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-foreground/10 p-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Analytics Cookies</p>
                  <p className="text-xs text-foreground/50">Help us understand how you use BenchBuddy</p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                />
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSavePreferences}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowManage(false)}
                className="rounded-lg border border-foreground/20 px-4 py-2 text-sm"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-foreground/70">
                We use cookies to improve your experience. Essential cookies are required for the
                site to function. Analytics cookies help us understand usage.{' '}
                <Link href="/cookies" className="underline">
                  Learn more
                </Link>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleRejectAll}
                className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium"
              >
                Reject All
              </button>
              <button
                onClick={() => setShowManage(true)}
                className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium"
              >
                Manage
              </button>
              <button
                onClick={handleAcceptAll}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white"
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for other components to check consent
export function useAnalyticsConsent(): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const prefs = getStoredPrefs();
    setAllowed(prefs?.analytics ?? false);

    function handleChange(e: Event) {
      const detail = (e as CustomEvent<CookiePrefs>).detail;
      setAllowed(detail.analytics);
    }

    window.addEventListener('cookie-consent-change', handleChange);
    return () => window.removeEventListener('cookie-consent-change', handleChange);
  }, []);

  return allowed;
}
