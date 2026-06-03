'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { AuthFormSkeleton } from '@/components/skeleton';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const ph = usePostHog();

  useEffect(() => {
    if (!token) ph?.capture('reset_password_invalid_token');
  }, [token, ph]);

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-sm text-[#8e8985]">
            This link is missing or invalid. Please request a new one.
          </p>
          <a
            href="/forgot-password"
            onClick={() =>
              ph?.capture('reset_password_request_new_link_clicked')
            }
            className="text-sm text-[#2c2a2b] font-medium underline"
          >
            Request new link
          </a>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    ph?.capture('reset_password_submitted');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        ph?.capture('reset_password_succeeded');
      } else {
        const data = await res.json();
        const errMsg =
          data.error || 'Failed to reset password. The link may have expired.';
        setError(errMsg);
        ph?.capture('reset_password_failed', { error: errMsg });
      }
    } catch {
      setError('Network error. Please try again.');
      ph?.capture('reset_password_failed', { error: 'network_error' });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#E1F5EE] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="#0F6E56"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Password reset</h1>
          <p className="text-sm text-[#8e8985]">
            Your password has been updated. You can now sign in.
          </p>
          <a
            href="/login"
            onClick={() => ph?.capture('reset_password_signin_clicked')}
            className="inline-block bg-[#2c2a2b] text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] h-10 rounded-lg text-base font-medium transition-colors px-6 leading-10"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="mt-2 text-sm text-[#8e8985]">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-[#FEE2E2] p-3 text-sm text-[#DC2626]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              New password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => ph?.capture('reset_password_password_focused')}
                className="block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] pr-10 text-sm outline-none focus:border-[#1B2A4A]"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  const next = !showPassword;
                  setShowPassword(next);
                  ph?.capture('reset_password_visibility_toggled', {
                    visible: next,
                  });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e8985] hover:text-[#2c2a2b] text-xs px-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-xs text-[#8e8985]">
              Must be at least 8 characters
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2c2a2b] text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] h-10 rounded-lg text-base font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton fields={2} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
