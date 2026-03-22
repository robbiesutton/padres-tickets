// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  venmoHandle: string | null;
  zelleInfo: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-foreground/50">Loading settings...</p>
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
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
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
                  className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium">Last name</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="mt-1 block w-full rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm text-foreground/50"
              />
              <p className="mt-1 text-xs text-foreground/40">
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
                className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Payment section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Payment Info</h2>
            <p className="text-sm text-foreground/60">
              Share your payment details so claimers know how to pay you.
            </p>
            <div>
              <label className="block text-sm font-medium">Venmo Handle</label>
              <input
                type="text"
                value={form.venmoHandle}
                onChange={(e) => update('venmoHandle', e.target.value)}
                placeholder="@your-handle"
                className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
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
                className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Subscription stub */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Subscription</h2>
            <div className="rounded-lg border border-foreground/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-foreground/60">
                    1 package, unlimited games
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
