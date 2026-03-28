'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      // Send a magic link so they can sign in without their password
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        // Always show success to prevent email enumeration
        setSent(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#E1F5EE] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#0F6E56" strokeWidth="1.2" />
              <path d="M2 4l6 4.5L14 4" stroke="#0F6E56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-[#8e8985]">
            We sent a sign-in link to <strong>{email}</strong>. Click it to access your account.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-sm text-[#2c2a2b] font-medium underline"
            >
              Use a different email
            </button>
            <p className="text-xs text-[#8e8985]">
              <a href="/login" className="underline">Back to sign in</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Forgot your password?</h1>
          <p className="mt-2 text-sm text-[#8e8985]">
            Enter your email and we&apos;ll send you a link to sign in.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-[#FEE2E2] p-3 text-sm text-[#DC2626]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2c2a2b] text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] h-10 rounded-lg text-base font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send sign-in link'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8e8985]">
          Remember your password?{' '}
          <a href="/login" className="text-[#2c2a2b] font-medium underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
