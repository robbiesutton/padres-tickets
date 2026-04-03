'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SetupLayout,
  StepHeadline,
  StepSubhead,
  FormLabel,
} from '@/components/setup-layout';

const inputClass = "block w-full h-12 px-4 bg-white border-[1.5px] border-[#eceae5] rounded-lg text-[15px] font-medium text-[#1a1a1a] outline-none transition-all hover:border-[#b5b1ab] focus:border-[#2c2a2b] focus:ring-[3px] focus:ring-[#2c2a2b]/10";

function JoinForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '';
  const holderName = searchParams.get('holder') || 'your friend';

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'CLAIMER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  function update(field: string, value: string) { setForm((prev) => ({ ...prev, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, agreedToTerms, marketingOptIn }) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    // Cookie is set server-side by the API route — just redirect
    window.location.href = from ? `/share/${from}` : '/dashboard';
  }

  return (
    <SetupLayout showSidebar={false}>
      <a href={from ? `/share/${from}` : '/'} className="fixed top-6 left-6 flex items-center gap-1.5 text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] no-underline transition-colors z-10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Back
      </a>
      <div className="flex flex-col flex-1 md:justify-center max-w-[380px] mx-auto w-full pt-12 md:pt-0">
        <div className="text-center">
          <StepHeadline>{holderName} shared tickets with you.</StepHeadline>
          <StepSubhead>Create a free account to browse games and reserve the ones you want.</StepSubhead>
        </div>

        {error && (
          <div className="rounded-lg bg-[#FEE2E2] text-[#DC2626] px-4 py-3 text-sm font-medium mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>First name</FormLabel>
              <input type="text" required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <FormLabel>Last name</FormLabel>
              <input type="text" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <FormLabel>Email</FormLabel>
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
          </div>

          <div>
            <FormLabel>Password</FormLabel>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} className={`${inputClass} pr-16`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#8e8985]">Minimum 8 characters</p>
          </div>

          {/* Consent */}
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#2c2a2b] shrink-0" />
              <span className="text-[#8e8985] leading-relaxed">
                I agree to the <a href="/terms" target="_blank" className="text-[#8e8985] underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-[#8e8985] underline">Privacy Policy</a>
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#2c2a2b] shrink-0" />
              <span className="text-[#8e8985] leading-relaxed">
                I&apos;d like to receive updates from BenchBuddy
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full h-12 rounded-lg bg-[#2c2a2b] text-white text-sm font-medium cursor-pointer border-none transition-all hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8e8985] mt-6 pb-8">
          Already have an account? <a href={from ? `/login?from=${from}` : '/login'} className="text-[#8e8985] underline">Sign in</a>
        </p>
      </div>
    </SetupLayout>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><p className="text-[#8e8985]">Loading...</p></div>}>
      <JoinForm />
    </Suspense>
  );
}
