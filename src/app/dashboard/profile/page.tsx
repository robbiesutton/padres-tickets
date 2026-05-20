'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useDashboardContext } from '../layout';
import { getTeamColors, isColorDark } from '@/lib/team-colors';
import { getOpponentAbbr } from '@/lib/game-utils';
import { SHOW_PACKAGE_SWITCHER } from '@/lib/feature-flags';

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
  venmoHandle: string | null;
  zelleInfo: string | null;
  subscription: SubscriptionInfo | null;
}

const ALL_NAV_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
    requiresOwner: false,
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'seat-info',
    label: 'Seats',
    requiresOwner: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    id: 'payment-info',
    label: 'Payments',
    requiresOwner: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12V7H5a2 2 0 010-4h14v4" />
        <path d="M3 5v14a2 2 0 002 2h16v-5" />
        <path d="M18 12a2 2 0 000 4h4v-4z" />
      </svg>
    ),
  },
  {
    id: 'subscription',
    label: 'Subscription',
    requiresOwner: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: 'shared-tickets',
    label: 'Shared with me',
    requiresOwner: false,
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

const inputClass =
  'block w-full px-3 py-2.5 rounded-lg border border-[#eceae5] bg-white text-sm outline-none focus:border-[#2c2a2b] transition-colors';

const boneStyle = {
  background: 'linear-gradient(90deg, #e8e4df 25%, #f5f2ef 50%, #e8e4df 75%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
};

function Bone({
  w,
  h,
  r = 4,
  delay = 0,
  className = '',
}: {
  w: string;
  h: string;
  r?: number | string;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        ...boneStyle,
        width: w,
        height: h,
        borderRadius: typeof r === 'number' ? `${r}px` : r,
        animationDelay: `${delay}s`,
        flexShrink: 0,
      }}
    />
  );
}

function ProfileSkeleton() {
  return (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }`}</style>
      <div className="flex flex-1 bg-[#fefefe]">
        {/* Desktop sidebar skeleton */}
        <aside className="hidden md:flex md:flex-col w-[220px] shrink-0 border-r border-[#eceae5] pt-8 pl-8 pr-4 sticky top-[77px] self-start h-[calc(100vh-77px)]">
          <Bone w="120px" h="14px" delay={0} className="mb-6" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <Bone w="18px" h="18px" r="50%" delay={0} />
              <Bone w="60px" h="14px" delay={0.15} />
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2">
              <Bone w="18px" h="18px" r="50%" delay={0.3} />
              <Bone w="72px" h="14px" delay={0.45} />
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2">
              <Bone w="18px" h="18px" r="50%" delay={0.6} />
              <Bone w="88px" h="14px" delay={0.75} />
            </div>
            <div
              className="my-1 mx-3 border-t border-[#eceae5]"
              style={{ marginTop: 4, marginBottom: 4 }}
            />
            <div className="flex items-center gap-2.5 px-3 py-2">
              <Bone w="18px" h="18px" r="50%" delay={0.9} />
              <Bone w="56px" h="14px" delay={1.05} />
            </div>
          </div>
        </aside>

        {/* Mobile menu skeleton */}
        <div className="md:hidden flex-1 px-4 pt-4 pb-6 min-h-screen bg-white">
          <div className="flex flex-col">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-1 py-4"
                style={{
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                  borderBottomColor: '#eceae5',
                }}
              >
                <Bone w="18px" h="18px" r="50%" delay={i * 0.15} />
                <Bone
                  w={['100px', '60px', '72px', '88px'][i]}
                  h="16px"
                  delay={i * 0.15 + 0.1}
                />
                <div className="ml-auto">
                  <Bone w="16px" h="16px" r="50%" delay={i * 0.15 + 0.2} />
                </div>
              </div>
            ))}
            <div className="my-2" />
            <div className="flex items-center gap-3 px-1 py-4">
              <Bone w="18px" h="18px" r="50%" delay={0.75} />
              <Bone w="64px" h="16px" delay={0.9} />
            </div>
          </div>
        </div>

        {/* Desktop content skeleton */}
        <main className="hidden md:block flex-1 min-w-0 px-12 py-8 max-w-[720px]">
          <Bone w="80px" h="18px" delay={0} className="mb-2" />
          <Bone w="200px" h="14px" delay={0.15} className="mb-6" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Bone w="72px" h="14px" delay={0.3} className="mb-2" />
                <Bone w="100%" h="38px" r={8} delay={0.45} />
              </div>
              <div>
                <Bone w="68px" h="14px" delay={0.6} className="mb-2" />
                <Bone w="100%" h="38px" r={8} delay={0.75} />
              </div>
            </div>
            <div>
              <Bone w="40px" h="14px" delay={0.9} className="mb-2" />
              <Bone w="100%" h="38px" r={8} delay={1.05} />
            </div>
            <div>
              <Bone w="48px" h="14px" delay={1.2} className="mb-2" />
              <Bone w="100%" h="38px" r={8} delay={1.35} />
            </div>
            <Bone w="120px" h="40px" r={8} delay={1.5} />
          </div>
        </main>
      </div>
    </>
  );
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const {
    packages,
    selectedPkgId: ctxPkgId,
    setSelectedPkgId: ctxSetPkgId,
    loading,
  } = useDashboardContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'menu';
    return 'profile';
  });
  const [saving, setSaving] = useState(false);
  const [savingSeat, setSavingSeat] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
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
  });

  useEffect(() => {
    if (ctxPkgId && !selectedPkgId)
      startTransition(() => setSelectedPkgId(ctxPkgId));
  }, [ctxPkgId, selectedPkgId]);

  useEffect(() => {
    const pkg = packages.find((p) => p.id === selectedPkgId);
    if (pkg)
      startTransition(() =>
        setSeatForm({
          seatPhotoUrl: pkg.seatPhotoUrl || null,
          description: pkg.description || '',
        })
      );
  }, [selectedPkgId, packages]);

  useEffect(() => {
    if (searchParams.get('subscription') === 'success')
      startTransition(() =>
        setMessage({ type: 'success', text: 'Subscription activated!' })
      );
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/users/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        startTransition(() => {
          setProfile(data);
          setForm({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || '',
            venmoHandle: data.venmoHandle || '',
            zelleInfo: data.zelleInfo || '',
          });
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Clear message when switching sections
  useEffect(() => {
    startTransition(() => setMessage(null));
  }, [activeSection]);

  function handlePkgChange(pkgId: string) {
    setSelectedPkgId(pkgId);
    ctxSetPkgId(pkgId);
  }
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
      }),
    });
    setSavingSeat(false);
    if (res.ok) setMessage({ type: 'success', text: 'Changes saved!' });
    else {
      const data = await res.json();
      setMessage({
        type: 'error',
        text: data.error || 'Failed to save changes',
      });
    }
  }

  async function handleSavePaymentInfo() {
    setSavingPayment(true);
    setMessage(null);
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSavingPayment(false);
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setMessage({ type: 'success', text: 'Changes saved!' });
    } else {
      const data = await res.json();
      setMessage({
        type: 'error',
        text: data.error || 'Failed to save changes',
      });
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSeatForm((prev) => ({
        ...prev,
        seatPhotoUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubscribe() {
    setSubLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
        setSubLoading(false);
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
      setSubLoading(false);
    }
  }

  async function handleCancel() {
    if (
      !confirm(
        "Are you sure? You'll keep access until the end of your billing period."
      )
    )
      return;
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
        setMessage({
          type: 'success',
          text: 'Subscription will cancel at end of period',
        });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed' });
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
      if (data.url) window.location.href = data.url;
      else if (res.ok) {
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
        setMessage({ type: 'error', text: data.error || 'Failed' });
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
      if (data.url) window.location.href = data.url;
      else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
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

  const hasOwnedPackages = packages.some(
    (p) => p.role === 'OWNER' || p.role === 'CO_OWNER'
  );
  const fromShare = searchParams.get('from') === 'share';
  const shareSlug = searchParams.get('slug') || '';
  const [cameFromShare, setCameFromShare] = useState(fromShare);
  useEffect(() => {
    if (
      !fromShare &&
      typeof document !== 'undefined' &&
      document.referrer.includes('/share/')
    )
      startTransition(() => setCameFromShare(true));
  }, [fromShare]);
  const showOwnerTabs = hasOwnedPackages && !cameFromShare;
  const claimerPackages = packages.filter(
    (p) => p.role !== 'OWNER' && p.role !== 'CO_OWNER'
  );
  const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => {
    if (item.id === 'shared-tickets') return claimerPackages.length > 0;
    return !item.requiresOwner || showOwnerTabs;
  });

  if (loading) return <ProfileSkeleton />;

  // ─── Section Renderers ───────────────────────────────

  function renderProfile() {
    return (
      <>
        <h2 className="text-lg font-medium text-[#2c2a2b] mb-2">Profile</h2>
        <p className="text-sm text-[#3d3a38] mb-6 md:mb-8">
          Your personal information.
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2c2a2b] mb-2">
                First name
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2c2a2b] mb-2">
                Last name
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2c2a2b] mb-2">
              Email
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className={`${inputClass} bg-[#f5f4f2] text-[#8e8985]`}
            />
            <p className="mt-1.5 text-xs text-[#4a4745]">
              Contact support to change your email
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2c2a2b] mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto h-12 md:h-10 px-5 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </>
    );
  }

  function renderPaymentInfo() {
    return (
      <>
        <h2 className="text-lg font-medium text-[#2c2a2b] mb-2">Payments</h2>
        <p className="text-sm text-[#3d3a38] mb-6 md:mb-8">
          This info is shown to anyone who opens your share link so they know
          how to pay you.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2c2a2b] mb-2">
              Venmo{' '}
              <span className="font-normal text-[#8e8985]">(Optional)</span>
            </label>
            <input
              type="text"
              value={form.venmoHandle}
              onChange={(e) => update('venmoHandle', e.target.value)}
              placeholder="@yourhandle"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2c2a2b] mb-2">
              Zelle{' '}
              <span className="font-normal text-[#8e8985]">(Optional)</span>
            </label>
            <input
              type="text"
              value={form.zelleInfo}
              onChange={(e) => update('zelleInfo', e.target.value)}
              placeholder="(555) 555-5555"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={handleSavePaymentInfo}
            disabled={savingPayment}
            className="w-full md:w-auto h-12 md:h-10 px-5 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors disabled:opacity-50"
          >
            {savingPayment ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </>
    );
  }

  function renderSeatInfo() {
    return (
      <>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-medium text-[#2c2a2b]">Seats</h2>
          {SHOW_PACKAGE_SWITCHER && packages.length > 1 && (
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
        <p className="text-sm text-[#3d3a38] mb-6 md:mb-8">
          This info is shown to anyone who opens your share link.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2c2a2b] mb-2">
              Seat Photo
            </label>
            <div
              className="relative w-full h-[120px] md:h-[200px] rounded-lg border border-dashed border-[#eceae5] overflow-hidden cursor-pointer hover:border-[#8e8985] transition-colors group"
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 bg-black/50 px-3 py-1.5 rounded-lg transition-opacity">
                      Change photo
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-[#8e8985]">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-sm font-medium">
                    Upload a photo of your view
                  </span>
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
                className="mt-2 text-sm text-[#8e8985] hover:text-[#DC2626] transition-colors bg-transparent border-none cursor-pointer"
                onClick={() =>
                  setSeatForm((prev) => ({ ...prev, seatPhotoUrl: null }))
                }
              >
                Remove photo
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2c2a2b] mb-2">
              Description
            </label>
            <textarea
              value={seatForm.description}
              onChange={(e) =>
                setSeatForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your seats..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <button
            type="button"
            onClick={handleSaveSeatInfo}
            disabled={savingSeat}
            className="w-full md:w-auto h-12 md:h-10 px-5 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors disabled:opacity-50"
          >
            {savingSeat ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </>
    );
  }

  function renderSubscription() {
    const sub = profile?.subscription;
    const isActive = sub?.status === 'ACTIVE' || sub?.status === 'TRIALING';
    const isPendingCancel = isActive && sub?.cancelAtPeriodEnd;

    return (
      <>
        <h2 className="text-lg font-medium text-[#2c2a2b] mb-2">
          Subscription
        </h2>
        <p className="text-sm text-[#3d3a38] mb-6 md:mb-8">
          Manage your BenchBuddy subscription.
        </p>

        {sub?.status === 'PAST_DUE' ? (
          <div className="rounded-lg border border-[#DC2626]/20 bg-[#FEE2E2] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-[#DC2626]">Payment Failed</p>
              <span className="rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-medium text-[#DC2626]">
                Past Due
              </span>
            </div>
            <p className="text-sm text-[#DC2626] mb-4">
              Please update your payment method.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={subLoading}
              className="w-full h-12 md:h-10 rounded-lg bg-[#DC2626] text-sm font-medium text-white hover:bg-[#b91c1c] disabled:opacity-50"
            >
              {subLoading ? 'Loading...' : 'Update payment method'}
            </button>
          </div>
        ) : isPendingCancel ? (
          <div className="rounded-lg border border-[#FAC775] bg-[#FAEEDA] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-[#2c2a2b]">Cancelling</p>
              <span className="rounded-full bg-[#FAEEDA] border border-[#FAC775] px-3 py-1 text-xs font-medium text-[#2c2a2b]">
                Cancelling
              </span>
            </div>
            <p className="text-sm text-[#2c2a2b] mb-4">
              Ends on{' '}
              {sub.currentPeriodEnd
                ? formatDate(sub.currentPeriodEnd)
                : 'end of period'}
              . You&apos;ll keep access until then.
            </p>
            <button
              onClick={handleResubscribe}
              disabled={subLoading}
              className="w-full h-12 md:h-10 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50"
            >
              {subLoading ? 'Loading...' : 'Keep my subscription'}
            </button>
          </div>
        ) : isActive ? (
          <div className="rounded-lg border border-[#eceae5] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-[#2c2a2b]">BenchBuddy</p>
                <p className="text-sm text-[#3d3a38] mt-0.5">
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
            <div className="flex gap-3">
              <button
                onClick={handleManageBilling}
                disabled={subLoading}
                className="flex-1 h-12 md:h-10 rounded-lg border border-[#eceae5] bg-white text-sm font-medium text-[#2c2a2b] hover:bg-[#f5f4f2] transition-colors disabled:opacity-50"
              >
                Manage billing
              </button>
              <button
                onClick={handleCancel}
                disabled={subLoading}
                className="flex-1 h-12 md:h-10 rounded-lg border border-[#eceae5] bg-white text-sm font-medium text-[#2c2a2b] hover:bg-[#f5f4f2] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#eceae5] p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#2c2a2b]">
                BenchBuddy Season Pass
              </h3>
              <span className="rounded-full bg-[#fdf6e3] px-3 py-1 text-xs font-bold text-[#d4a017]">
                Free for early adopters
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[36px] font-extrabold text-[#2c2a2b] leading-none">
                  $39.99
                </span>
                <span className="text-base text-[#8e8985] font-medium">
                  / year
                </span>
              </div>
              <p className="text-sm text-[#3d3a38] mt-2">
                That&apos;s $3.33/mo to manage your entire season.
              </p>
            </div>

            {/* Benefits */}
            <div className="flex flex-col gap-3 mb-8">
              {[
                'Share your season with anyone — no limit',
                'Track claims, payments, and status in one place',
                'Cancel anytime',
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0 mt-0.5"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#d4a017"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm text-[#2c2a2b]">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={subLoading}
              className="w-full h-12 rounded-lg bg-[#2c2a2b] text-base font-semibold text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {subLoading ? 'Loading...' : 'Subscribe now'}
            </button>

            {/* Fine print */}
            <p className="text-xs text-[#8e8985] text-center mt-4">
              Cancel anytime. You won&apos;t be charged until your free year
              ends.
            </p>
          </div>
        )}
      </>
    );
  }

  function renderSharedTickets() {
    return (
      <>
        <h2 className="text-lg font-medium text-[#2c2a2b] mb-2">
          Shared with me
        </h2>
        <p className="text-sm text-[#3d3a38] mb-6 md:mb-8">
          Seasons people have shared with you.
        </p>
        <div className="flex flex-col gap-2 max-w-[400px]">
          {claimerPackages.map((pkg) => {
            const { primary, accent } = getTeamColors(pkg.team);
            // If accent is light (e.g. Dodgers white), it disappears on the
            // white card. Invert so the badge reads on either page background.
            const accentIsLight = !isColorDark(accent);
            const badgeBg = accentIsLight ? primary : accent;
            const badgeFg = accentIsLight ? accent : primary;
            return (
              <a
                key={pkg.id}
                href={`/share/${pkg.shareLinkSlug}`}
                className="flex items-center gap-3 px-3 py-3 rounded-lg border border-[#eceae5] bg-white hover:border-[#2c2a2b] transition-colors no-underline"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: badgeBg, color: badgeFg }}
                >
                  {getOpponentAbbr(pkg.team)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#2c2a2b] truncate">
                    Sec {pkg.section} &middot; Row {pkg.row} &middot; Seats{' '}
                    {pkg.seats}
                  </div>
                  {pkg.holderName && (
                    <div className="text-xs text-[#8e8985] mt-0.5 truncate">
                      Shared by {pkg.holderName}
                    </div>
                  )}
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8e8985"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </a>
            );
          })}
        </div>
      </>
    );
  }

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    profile: renderProfile,
    'seat-info': renderSeatInfo,
    'payment-info': renderPaymentInfo,
    subscription: renderSubscription,
    'shared-tickets': renderSharedTickets,
  };

  return (
    <div className="flex flex-1 bg-[#fefefe]">
      {/* ── Sidebar Nav (desktop) ── */}
      <aside className="hidden md:flex md:flex-col w-[220px] shrink-0 border-r border-[#eceae5] pt-8 pl-8 pr-4 sticky top-[77px] self-start h-[calc(100vh-77px)]">
        <Link
          href={
            cameFromShare && shareSlug ? `/share/${shareSlug}` : '/dashboard'
          }
          className="flex items-center gap-1.5 text-sm text-[#8e8985] hover:text-[#2c2a2b] transition-colors mb-6"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to my season
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer ${
                activeSection === item.id
                  ? 'bg-[#f5f4f2] text-[#2c2a2b]'
                  : 'bg-transparent text-[#8e8985] hover:text-[#2c2a2b] hover:bg-[#f5f4f2]'
              }`}
            >
              <span className="flex items-center justify-center w-[21px] shrink-0">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}

          <div
            className="my-1 mx-3 border-t border-[#eceae5]"
            style={{ marginTop: 4, marginBottom: 4 }}
          />

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm font-medium text-[#8e8985] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 transition-colors bg-transparent border-none cursor-pointer"
          >
            <span className="flex items-center justify-center w-[21px] shrink-0">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            Sign out
          </button>
        </nav>
      </aside>

      {/* ── Mobile ── */}
      <div className="md:hidden flex-1 px-4 pt-4 pb-6 min-h-screen bg-white">
        {activeSection === 'menu' ? (
          /* ── Menu list ── */
          <div>
            {message && (
              <div
                className={`rounded-lg p-3 text-sm mb-4 ${message.type === 'success' ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}
              >
                {message.text}
              </div>
            )}

            {/* Nav items */}
            <div className="flex flex-col">
              {/* Dashboard link — when coming from seller dashboard */}
              {!cameFromShare && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-1 py-4 no-underline border-b border-[#eceae5]"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                    borderBottomColor: '#eceae5',
                  }}
                >
                  <span className="text-[#8e8985]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </span>
                  <span className="flex-1 text-base font-medium text-[#2c2a2b]">
                    My season
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8e8985"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              )}
              {/* My Games link — when coming from share/claimer page */}
              {cameFromShare && (
                <button
                  onClick={() => {
                    if (shareSlug) {
                      window.location.href = `/share/${shareSlug}?tab=my-games`;
                    } else {
                      const ref = document.referrer;
                      if (ref && ref.includes('/share/')) {
                        const url = new URL(ref);
                        url.searchParams.set('tab', 'my-games');
                        window.location.href = url.toString();
                      } else {
                        window.history.back();
                      }
                    }
                  }}
                  className="flex items-center gap-3 px-1 py-4 border-none bg-transparent cursor-pointer text-left border-b border-[#eceae5] w-full"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                    borderBottomColor: '#eceae5',
                  }}
                >
                  <span className="text-[#8e8985]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      <path d="M2 12h20" />
                    </svg>
                  </span>
                  <span className="flex-1 text-base font-medium text-[#2c2a2b]">
                    My games
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8e8985"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="flex items-center gap-3 px-1 py-4 border-none bg-transparent cursor-pointer text-left border-b border-[#eceae5]"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                    borderBottomColor: '#eceae5',
                  }}
                >
                  <span className="text-[#8e8985]">{item.icon}</span>
                  <span className="flex-1 text-base font-medium text-[#2c2a2b]">
                    {item.label}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8e8985"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}

              {/* Divider */}
              <div className="my-2" />

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 px-1 py-4 border-none bg-transparent cursor-pointer text-left"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-base font-medium text-[#DC2626]">
                  Sign out
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* ── Section content ── */
          <div>
            {/* Back button */}
            <button
              onClick={() => setActiveSection('menu')}
              className="flex items-center gap-1.5 text-sm font-medium text-[#8e8985] bg-transparent border-none cursor-pointer mb-4 -ml-1"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>

            {message && (
              <div
                className={`rounded-lg p-3 text-sm mb-6 ${message.type === 'success' ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}
              >
                {message.text}
              </div>
            )}

            {sectionRenderers[activeSection]?.()}
          </div>
        )}
      </div>

      {/* ── Desktop Content Area ── */}
      <main className="hidden md:block flex-1 min-w-0 px-12 py-8 max-w-[720px]">
        {message && (
          <div
            className={`rounded-lg p-3 text-sm mb-6 ${message.type === 'success' ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}
          >
            {message.text}
          </div>
        )}
        {sectionRenderers[activeSection]?.()}
      </main>
    </div>
  );
}
