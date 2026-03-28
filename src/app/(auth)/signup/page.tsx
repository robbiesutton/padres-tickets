'use client';

import { useState } from 'react';
import {
  SetupLayout,
  StepHeadline,
  StepSubhead,
  FormLabel,
  PrimaryButton,
} from '@/components/setup-layout';

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'HOLDER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  function update(field: string, value: string) { setForm((prev) => ({ ...prev, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, agreedToTerms, marketingOptIn }) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(true);
  }

  const inputClass = "block w-full h-12 px-4 bg-white border-[1.5px] border-[#eceae5] rounded-lg text-[15px] font-medium text-[#1a1a1a] outline-none transition-all hover:border-[#b5b1ab] focus:border-[#2c2a2b] focus:ring-[3px] focus:ring-[#2c2a2b]/10";

  if (success) {
    return (
      <SetupLayout showSidebar={false}>
        <a href="/" className="fixed top-6 left-6 flex items-center gap-1.5 text-base font-medium text-[#2c2a2b] hover:text-[#1a1a1a] no-underline transition-colors z-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Back
        </a>
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="text-5xl mb-5">✉️</div>
          <StepHeadline>Check your email</StepHeadline>
          <p className="text-sm text-[#8e8985] leading-relaxed max-w-[360px]">
            We sent a confirmation link to <strong className="text-[#2c2a2b]">{form.email}</strong>. Click the link to verify your email and you&apos;ll be signed in automatically.
          </p>
        </div>
      </SetupLayout>
    );
  }

  return (
    <SetupLayout showSidebar={false}>
      <a href="/" className="fixed top-6 left-6 flex items-center gap-1.5 text-base font-medium text-[#2c2a2b] hover:text-[#1a1a1a] no-underline transition-colors z-10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Back
      </a>
      <div className="flex flex-col flex-1 justify-center max-w-[380px] mx-auto w-full">
        <StepHeadline>Create your account</StepHeadline>
        <StepSubhead>Start sharing your season tickets with friends and family.</StepSubhead>

        {error && (
          <div className="rounded-lg bg-[#FEE2E2] text-[#DC2626] px-4 py-3 text-sm font-medium mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <p className="mt-1.5 text-xs text-[#2c2a2b]">Minimum 8 characters</p>
          </div>

          <div>
            <FormLabel>I am a...</FormLabel>
            <div className="flex gap-3 mt-1">
              <label className={`flex-1 cursor-pointer rounded-lg h-11 flex items-center justify-center text-sm font-medium transition-all ${form.role === 'HOLDER' ? 'bg-[#2c2a2b] text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b]' : 'border border-[#eceae5] bg-white text-[#2c2a2b] hover:bg-[#f5f4f2]'}`}>
                <input type="radio" name="role" value="HOLDER" checked={form.role === 'HOLDER'} onChange={(e) => update('role', e.target.value)} className="sr-only" />
                Season ticket holder
              </label>
              <label className={`flex-1 cursor-pointer rounded-lg h-11 flex items-center justify-center text-sm font-medium transition-all ${form.role === 'CLAIMER' ? 'bg-[#2c2a2b] text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b]' : 'border border-[#eceae5] bg-white text-[#2c2a2b] hover:bg-[#f5f4f2]'}`}>
                <input type="radio" name="role" value="CLAIMER" checked={form.role === 'CLAIMER'} onChange={(e) => update('role', e.target.value)} className="sr-only" />
                Friend / claimer
              </label>
            </div>
          </div>

          {/* Consent */}
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#2c2a2b] shrink-0" />
              <span className="text-[#2c2a2b] leading-relaxed">
                I agree to the <a href="/terms" target="_blank" className="text-[#2c2a2b] font-medium underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-[#2c2a2b] font-medium underline">Privacy Policy</a>
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#2c2a2b] shrink-0" />
              <span className="text-[#2c2a2b] leading-relaxed">
                I&apos;d like to receive updates and game-day tips from BenchBuddy
              </span>
            </label>
          </div>

          <PrimaryButton disabled={loading || !agreedToTerms}>
            {loading ? 'Creating account...' : 'Create account'}
          </PrimaryButton>
        </form>

        <p className="text-center text-sm text-[#8e8985] mt-6">
          Already have an account? <a href="/login" className="text-[#2c2a2b] font-medium underline">Sign in</a>
        </p>
      </div>
    </SetupLayout>
  );
}
