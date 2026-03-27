'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { useDashboardContext } from '../layout';

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

interface PackageListItem {
  id: string;
  team: string;
  section: string;
  season: string;
  shareLinkSlug: string;
  seatPhotoUrl: string | null;
  description: string | null;
  perks: string[];
  _count: { games: number; invitations: number };
}

const AVAILABLE_PERKS = [
  'Shaded seats',
  'Behind home plate',
  'Premium',
  'Craft beer nearby',
  'Easy parking',
  'Club access',
  'Great for kids',
  'Aisle seats',
];

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { packages, selectedPkg: ctxPkg, selectedPkgId: ctxPkgId, setSelectedPkgId: ctxSetPkgId, loading } = useDashboardContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingSeat, setSavingSeat] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    venmoHandle: '',
    zelleInfo: '',
  });

  const [seatForm, setSeatForm] = useState({
    seatPhotoUrl: '' as string | null,
    description: '',
    perks: [] as string[],
  });

  // Sync selected package from context
  useEffect(() => {
    if (ctxPkgId && !selectedPkgId) {
      setSelectedPkgId(ctxPkgId);
    }
  }, [ctxPkgId, selectedPkgId]);

  // Init seat form when package is available
  useEffect(() => {
    const pkg = packages.find((p) => p.id === selectedPkgId);
    if (pkg) {
      setSeatForm({
        seatPhotoUrl: pkg.seatPhotoUrl || null,
        description: pkg.description || '',
        perks: pkg.perks || [],
      });
    }
  }, [selectedPkgId, packages]);

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setMessage({ type: 'success', text: 'Subscription activated!' });
    }
  }, [searchParams]);

  // Load profile
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
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  function handlePkgChange(pkgId: string) {
    setSelectedPkgId(pkgId);
    ctxSetPkgId(pkgId);
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function togglePerk(perk: string) {
    setSeatForm((prev) => ({
      ...prev,
      perks: prev.perks.includes(perk)
        ? prev.perks.filter((p) => p !== perk)
        : [...prev.perks, perk],
    }));
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
      setMessage({ type: 'success', text: 'Profile saved!' });
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to save' });
    }
  }

  async function handleSaveSeatInfo() {
    if (!selectedPkgId) return;
    setSavingSeat(true);
    setMessage(null);

    const res = await fetch(`/api/packages/${selectedPkgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatPhotoUrl: seatForm.seatPhotoUrl,
        description: seatForm.description,
        perks: seatForm.perks,
      }),
    });

    setSavingSeat(false);

    if (res.ok) {
      setMessage({ type: 'success', text: 'Seat info saved!' });
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to save seat info' });
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSeatForm((prev) => ({ ...prev, seatPhotoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
        <p className="text-[#8e8985]">Loading profile...</p>
      </div>
    );
  }

  const selectedPkg = packages.find((p) => p.id === selectedPkgId);

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8 bg-[#fefefe]">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
          My Profile
        </h1>

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

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#2c2a2b] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Seat Info section */}
        {packages.length > 0 && (
          <div className="space-y-4 border-t border-[#eceae5] pt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Seat Info</h2>
              {packages.length > 1 && (
                <select
                  value={selectedPkgId || ''}
                  onChange={(e) => handlePkgChange(e.target.value)}
                  className="rounded-lg border border-[#eceae5] px-3 py-1.5 text-sm"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.team} — {p.section}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-sm text-[#8e8985]">
              This info is shown to claimers when they view your share link.
            </p>

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Seat Photo</label>
              <div
                className="relative w-full h-[180px] rounded-lg border border-dashed border-[#eceae5] overflow-hidden cursor-pointer hover:border-[#8e8985] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {seatForm.seatPhotoUrl ? (
                  <>
                    <Image
                      src={seatForm.seatPhotoUrl}
                      alt="View from seat"
                      fill
                      className="object-cover"
                      sizes="100vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 hover:opacity-100 bg-black/50 px-3 py-1.5 rounded-lg">
                        Change photo
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-[#8e8985]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className="text-sm font-medium">Upload a photo of your view</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {seatForm.seatPhotoUrl && (
                <button
                  type="button"
                  className="mt-2 text-sm text-[#8e8985] hover:text-[#DC2626] transition-colors"
                  onClick={() => setSeatForm((prev) => ({ ...prev, seatPhotoUrl: null }))}
                >
                  Remove photo
                </button>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={seatForm.description}
                onChange={(e) =>
                  setSeatForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Tell claimers about your seats — e.g., great view of the field, close to concessions..."
                rows={3}
                className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A] resize-none"
              />
            </div>

            {/* Perks */}
            <div>
              <label className="block text-sm font-medium mb-2">Perks</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_PERKS.map((perk) => {
                  const selected = seatForm.perks.includes(perk);
                  return (
                    <button
                      key={perk}
                      type="button"
                      onClick={() => togglePerk(perk)}
                      className={`inline-flex items-center h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#E1F5EE] border-[#0F6E56] text-[#0F6E56]'
                          : 'bg-white border-[#8e8985]/75 text-[#8e8985] hover:border-[#2c2a2b] hover:text-[#2c2a2b]'
                      }`}
                    >
                      {selected && (
                        <svg className="w-3 h-3 mr-1.5" viewBox="0 0 16 16" fill="none">
                          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {perk}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSeatInfo}
              disabled={savingSeat}
              className="w-full rounded-lg bg-[#2c2a2b] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50"
            >
              {savingSeat ? 'Saving...' : 'Save Seat Info'}
            </button>
          </div>
        )}

        {/* Subscription section */}
        <div className="border-t border-[#eceae5] pt-8">
          {renderSubscriptionSection()}
        </div>

        {/* New Package CTA */}
        <div className="rounded-xl border border-[#eceae5] bg-[#f5f4f2] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#2c2a2b] flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-[#2c2a2b]">Create another package</p>
              <p className="text-sm text-[#8e8985] mt-1">
                Share tickets from a different section or season.
              </p>
              <a
                href="/dashboard/packages/new"
                className="inline-flex items-center mt-3 h-9 px-4 rounded-lg border-[1.5px] border-black bg-transparent text-black text-sm font-medium hover:bg-white transition-colors"
              >
                New Package
              </a>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-[#eceae5] pt-6 pb-8">
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
