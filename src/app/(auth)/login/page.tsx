'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'password' | 'magic-link-sent'>('email');
  const [hasPassword, setHasPassword] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.exists) {
        setError('No account found with this email. Would you like to sign up?');
        setLoading(false);
        return;
      }

      if (data.hasPassword) {
        setHasPassword(true);
        setStep('password');
      } else {
        // No password — send magic link
        const mlRes = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (mlRes.ok) {
          setStep('magic-link-sent');
        } else {
          const mlData = await mlRes.json();
          setError(mlData.error || 'Failed to send login link');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid password');
    } else {
      router.push('/dashboard');
    }
  }

  async function handleSendMagicLink() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep('magic-link-sent');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send login link');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'magic-link-sent') {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#16a34a" strokeWidth="1.2" />
              <path d="M2 4l6 4.5L14 4" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-foreground/60">
            We sent a sign-in link to <strong>{email}</strong>. Click it to log in.
          </p>
          <button
            onClick={() => { setStep('email'); setPassword(''); }}
            className="text-sm text-brand-600 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to BenchBuddy</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {step === 'email'
              ? 'Enter your email to get started'
              : `Signing in as ${email}`}
          </p>
        </div>

        {verified && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            Email verified! You can now sign in.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
            {error.includes('sign up') && (
              <a href="/signup" className="ml-1 font-medium underline">
                Sign up
              </a>
            )}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-foreground/20 px-3 py-2 pr-10 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 text-xs px-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep('email'); setPassword(''); setError(''); }}
                className="text-foreground/50 hover:text-foreground"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={loading}
                className="text-brand-600 hover:underline"
              >
                Email me a sign-in link instead
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2 text-center text-sm">
          <a
            href="/forgot-password"
            className="block text-brand-600 hover:underline"
          >
            Forgot password?
          </a>
          <p className="text-foreground/60">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-brand-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><p className="text-foreground/50">Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
