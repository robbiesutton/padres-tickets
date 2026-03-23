'use client';

import { useState } from 'react';

export function MagicLinkLogin() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email || !email.includes('@')) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-background flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#0F6E56" strokeWidth="1.2" />
              <path d="M2 4l6 4.5L14 4" stroke="#0F6E56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-base font-medium text-foreground mb-1">
            Check your email
          </div>
          <div className="text-xs text-muted">
            We sent a login link to <strong>{email}</strong>. Click it to view
            and manage your reservations.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-10 text-center">
        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-background flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 4l6 4.5L14 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-base font-medium text-foreground mb-1">
          View your reservations
        </div>
        <div className="text-xs text-muted mb-4">
          Enter the email you used when reserving tickets.
        </div>
        <input
          type="email"
          placeholder="name@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full max-w-[320px] px-3 py-2.5 rounded-lg border border-border text-sm outline-none mx-auto block text-center mb-3 focus:border-navy"
        />
        {error && (
          <div className="text-xs text-error mb-2">{error}</div>
        )}
        <button
          className="w-full max-w-[320px] py-[11px] rounded-lg bg-navy text-white border-none text-base font-medium cursor-pointer mx-auto block disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading || !email.includes('@')}
        >
          {loading ? 'Sending...' : 'Send me a login link'}
        </button>
        <div className="text-[10px] text-muted mt-2">
          We&apos;ll email you a link to view and manage your games.
        </div>
      </div>
    </div>
  );
}
