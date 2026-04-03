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
} from '@/components/setup-layout';

const inputClass = "block w-full h-12 px-4 bg-white border-[1.5px] border-[#eceae5] rounded-lg text-[15px] font-medium text-[#1a1a1a] outline-none transition-all hover:border-[#b5b1ab] focus:border-[#2c2a2b] focus:ring-[3px] focus:ring-[#2c2a2b]/10";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError('Invalid email or password');
    else router.push(from ? (from.startsWith('/') ? from : `/share/${from}`) : '/dashboard');
  }

  return (
    <SetupLayout showSidebar={false}>
      <button
        onClick={() => { window.location.href = '/'; }}
        className="fixed top-6 left-6 flex items-center gap-1.5 text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer transition-colors z-10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>
      <div className="flex flex-col flex-1 justify-center max-w-[380px] mx-auto w-full">
        <div className="text-center">
          <StepHeadline>Sign in</StepHeadline>
          <StepSubhead>Welcome back to BenchBuddy</StepSubhead>
        </div>

        {error && (
          <div className="rounded-lg bg-[#FEE2E2] text-[#DC2626] px-4 py-3 text-sm font-medium mb-4">
            {error}
            {error.includes('sign up') && <a href="/signup" className="ml-1 font-medium underline">Sign up</a>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <FormLabel>Email</FormLabel>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoFocus />
          </div>
          <div>
            <FormLabel>Password</FormLabel>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-16`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full h-12 rounded-lg bg-[#2c2a2b] text-white text-sm font-medium cursor-pointer border-none transition-all hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="flex flex-col gap-2 text-center text-sm mt-8">
          <a href="/forgot-password" className="text-[#8e8985] underline">Forgot password?</a>
          <p className="text-[#8e8985]">
            Don&apos;t have an account? <a href="/signup" className="text-[#8e8985] underline">Sign up</a>
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
