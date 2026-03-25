'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface SubscriptionInfo {
  plan: 'FREE' | 'PRO';
  status: 'ACTIVE' | 'TRIALING' | 'CANCELLED' | 'PAST_DUE';
  billingCycle: 'MONTHLY' | 'ANNUAL' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  venmoHandle: string | null;
  zelleInfo: string | null;
  subscription: SubscriptionInfo | null;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    venmoHandle: '',
    zelleInfo: '',
  });

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setMessage({ type: 'success', text: 'Subscription activated!' });
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/users/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setProfile(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || '',
          venmoHandle: data.venmoHandle || '',
          zelleInfo: data.zelleInfo || '',
        });
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setMessage({ type: 'success', text: 'Settings saved!' });
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to save' });
    }
  }

  async function handleSubscribe() {
    setSubLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start checkout' });
        setSubLoading(false);
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
      setSubLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel? You\'ll keep access until the end of your billing period.')) {
      return;
    }
    setSubLoading(true);
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' });
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                subscription: prev.subscription
                  ? { ...prev.subscription, cancelAtPeriodEnd: true }
                  : null,
              }
            : null
        );
        setMessage({ type: 'success', text: 'Subscription will cancel at end of period' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to cancel' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    }
    setSubLoading(false);
  }

  async function handleResubscribe() {
    setSubLoading(true);
    try {
      const res = await fetch('/api/stripe/resubscribe', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                subscription: prev.subscription
                  ? { ...prev.subscription, cancelAtPeriodEnd: false }
                  : null,
              }
            : null
        );
        setMessage({ type: 'success', text: 'Subscription reactivated!' });
        setSubLoading(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to resubscribe' });
        setSubLoading(false);
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
      setSubLoading(false);
    }
  }

  async function handleManageBilling() {
    setSubLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to open billing' });
        setSubLoading(false);
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
      setSubLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function renderSubscriptionSection() {
    const sub = profile?.subscription;
    const isActive = sub?.status === 'ACTIVE' || sub?.status === 'TRIALING';
    const isPendingCancel = isActive && sub?.cancelAtPeriodEnd;

    // Past due — needs payment update
    if (sub?.status === 'PAST_DUE') {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Subscription</h2>
          <div className="rounded-lg border border-[#DC2626]/20 bg-[#FEE2E2] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#DC2626]">Payment Failed</p>
                <p className="text-sm text-[#DC2626]">
                  Please update your payment method to keep your subscription active.
                </p>
              </div>
              <span className="rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-medium text-[#DC2626]">
                Past Due
              </span>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={subLoading}
              className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {subLoading ? 'Loading...' : 'Update Payment Method'}
            </button>
          </div>
        </div>
      );
    }

    // Pending cancel
    if (isPendingCancel) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Subscription</h2>
          <div className="rounded-lg border border-[#FAC775] bg-[#FAEEDA] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#2c2a2b]">Cancelling</p>
                <p className="text-sm text-[#2c2a2b]">
                  Your subscription will end on{' '}
                  {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : 'end of period'}.
                  You&apos;ll keep access until then.
                </p>
              </div>
              <span className="rounded-full bg-[#FAEEDA] px-3 py-1 text-xs font-medium text-[#2c2a2b]">
                Cancelling
              </span>
            </div>
            <button
              onClick={handleResubscribe}
              disabled={subLoading}
              className="mt-3 w-full rounded-lg bg-[#2c2a2b] px-4 py-2 text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50"
            >
              {subLoading ? 'Loading...' : 'Keep My Subscription'}
            </button>
          </div>
        </div>
      );
    }

    // Active or trialing
    if (isActive) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Subscription</h2>
          <div className="rounded-lg border border-[#eceae5] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">BenchBuddy</p>
                <p className="text-sm text-[#8e8985]">
                  {sub?.status === 'TRIALING' && sub.trialEnd
                    ? `Free trial ends ${formatDate(sub.trialEnd)}`
                    : sub?.currentPeriodEnd
                      ? `Renews ${formatDate(sub.currentPeriodEnd)}`
                      : '$39.99/year'}
                </p>
              </div>
              <span className="rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-medium text-[#0F6E56]">
                {sub?.status === 'TRIALING' ? 'Trial' : 'Active'}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleManageBilling}
                disabled={subLoading}
                className="flex-1 rounded-lg border-[1.5px] border-black bg-transparent text-black hover:bg-[#f5f4f2] transition-colors px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Manage Billing
              </button>
              <button
                onClick={handleCancel}
                disabled={subLoading}
                className="flex-1 rounded-lg border-[1.5px] border-black bg-transparent text-black hover:bg-[#f5f4f2] transition-colors px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Not subscribed (no subscription, cancelled, or free)
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Subscription</h2>
        <div className="rounded-lg border border-[#eceae5] p-4">
          <div className="mb-3">
            <p className="font-medium">Subscribe to BenchBuddy</p>
            <p className="text-sm text-[#8e8985]">
              Share your season tickets with friends and family.
            </p>
          </div>
          <div className="rounded-lg border border-[#eceae5] bg-[#f5f4f2] p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-bold text-[#2c2a2b]">$39.99</p>
                <p className="text-sm text-[#2c2a2b] font-medium underline">per year</p>
              </div>
              <p className="text-sm font-medium text-[#2c2a2b]">
                First month free
              </p>
            </div>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={subLoading}
            className="mt-3 w-full rounded-lg bg-[#2c2a2b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50"
          >
            {subLoading ? 'Loading...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[#8e8985]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        {message && (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.type === 'success'
                ? 'bg-[#E1F5EE] text-[#0F6E56]'
                : 'bg-[#FEE2E2] text-[#DC2626]'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Profile</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium">First name</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium">Last name</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] bg-[#f5f4f2] text-sm text-[#8e8985]"
              />
              <p className="mt-1 text-xs text-[#8e8985]">
                Contact support to change your email
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="Optional"
                className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>

          {/* Payment section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Payment Info</h2>
            <p className="text-sm text-[#8e8985]">
              Share your payment details so claimers know how to pay you.
            </p>
            <div>
              <label className="block text-sm font-medium">Venmo Handle</label>
              <input
                type="text"
                value={form.venmoHandle}
                onChange={(e) => update('venmoHandle', e.target.value)}
                placeholder="@your-handle"
                className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Zelle Email / Phone
              </label>
              <input
                type="text"
                value={form.zelleInfo}
                onChange={(e) => update('zelleInfo', e.target.value)}
                placeholder="email or phone for Zelle"
                className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>

          {/* Subscription section */}
          {renderSubscriptionSection()}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#2c2a2b] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        {/* Logout */}
        <div className="border-t border-[#eceae5] pt-6">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full rounded-lg border-[1.5px] border-black bg-transparent text-black hover:bg-[#f5f4f2] transition-colors px-6 py-2.5 text-sm font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
