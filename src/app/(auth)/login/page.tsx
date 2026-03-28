'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SetupLayout,
  StepHeadline,
  StepSubhead,
  FormLabel,
  PrimaryButton,
  GhostButton,
} from '@/components/setup-layout';

const inputClass = "block w-full h-12 px-4 bg-white border-[1.5px] border-[#eceae5] rounded-lg text-[15px] font-medium text-[#1a1a1a] outline-none transition-all hover:border-[#b5b1ab] focus:border-[#2c2a2b] focus:ring-[3px] focus:ring-[#2c2a2b]/10";

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
    e.preventDefault(); if (!email) return; setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/check-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!data.exists) { setError('No account found with this email. Would you like to sign up?'); setLoading(false); return; }
      if (data.hasPassword) { setHasPassword(true); setStep('password'); }
      else {
        const mlRes = await fetch('/api/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        if (mlRes.ok) setStep('magic-link-sent');
        else { const mlData = await mlRes.json(); setError(mlData.error || 'Failed to send login link'); }
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError('Invalid password');
    else router.push('/dashboard');
  }

  async function handleSendMagicLink() {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      if (res.ok) setStep('magic-link-sent');
      else { const data = await res.json(); setError(data.error || 'Failed to send login link'); }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  // Magic link sent
  if (step === 'magic-link-sent') {
    return (
      <SetupLayout>
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-14 h-14 rounded-full bg-[#E1F5EE] flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#0F6E56" strokeWidth="1.2" />
              <path d="M2 4l6 4.5L14 4" stroke="#0F6E56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <StepHeadline>Check your email</StepHeadline>
          <p className="text-sm text-[#8e8985] leading-relaxed max-w-[360px] mb-6">
            We sent a sign-in link to <strong className="text-[#2c2a2b]">{email}</strong>. Click it to log in.
          </p>
          <button onClick={() => { setStep('email'); setPassword(''); }} className="text-sm text-[#2c2a2b] font-medium underline bg-transparent border-none cursor-pointer">
            Use a different email
          </button>
        </div>
      </SetupLayout>
    );
  }

  return (
    <SetupLayout>
      <div className="flex flex-col flex-1">
        <StepHeadline>Sign in to BenchBuddy</StepHeadline>
        <StepSubhead>
          {step === 'email' ? 'Enter your email to get started' : `Signing in as ${email}`}
        </StepSubhead>

        {verified && (
          <div className="rounded-lg bg-[#E1F5EE] text-[#0F6E56] px-4 py-3 text-sm font-medium mb-4">
            Email verified! You can now sign in.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-[#FEE2E2] text-[#DC2626] px-4 py-3 text-sm font-medium mb-4">
            {error}
            {error.includes('sign up') && <a href="/signup" className="ml-1 font-medium underline">Sign up</a>}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div>
              <FormLabel>Email</FormLabel>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoFocus />
            </div>
            <PrimaryButton disabled={loading}>
              {loading ? 'Checking...' : 'Continue'}
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-16`} autoFocus />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <PrimaryButton disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </PrimaryButton>
            <div className="flex justify-between text-sm">
              <GhostButton onClick={() => { setStep('email'); setPassword(''); setError(''); }}>← Back</GhostButton>
              <button type="button" onClick={handleSendMagicLink} disabled={loading} className="text-[#2c2a2b] font-medium underline text-sm bg-transparent border-none cursor-pointer">
                Email me a sign-in link instead
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-2 text-center text-sm mt-8">
          <a href="/forgot-password" className="text-[#2c2a2b] font-medium underline">Forgot password?</a>
          <p className="text-[#8e8985]">
            Don&apos;t have an account? <a href="/signup" className="text-[#2c2a2b] font-medium underline">Sign up</a>
          </p>
        </div>
      </div>
    </SetupLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><p className="text-[#8e8985]">Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
