// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState } from 'react';

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'HOLDER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-[#8e8985]">
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click the link to verify your email and you&apos;ll be signed in
            automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-[#8e8985]">
            Start sharing your season tickets
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-[#FEE2E2] p-3 text-sm text-[#DC2626]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-sm font-medium">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-sm font-medium">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="mt-1 block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="block w-full px-2.5 py-2 rounded-[7px] border border-[#eceae5] pr-10 text-sm outline-none focus:border-[#1B2A4A]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e8985] hover:text-[#2c2a2b] text-xs px-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-xs text-[#8e8985]">
              Minimum 8 characters
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium">I am a...</label>
            <div className="mt-2 flex gap-3">
              <label
                className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-sm text-center transition-colors ${
                  form.role === 'HOLDER'
                    ? 'border-[#2c2a2b] bg-[#f5f4f2] font-medium'
                    : 'border-[#eceae5] bg-white hover:border-[#dcd7d4]'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="HOLDER"
                  checked={form.role === 'HOLDER'}
                  onChange={(e) => update('role', e.target.value)}
                  className="sr-only"
                />
                Season ticket holder
              </label>
              <label
                className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-sm text-center transition-colors ${
                  form.role === 'CLAIMER'
                    ? 'border-[#2c2a2b] bg-[#f5f4f2] font-medium'
                    : 'border-[#eceae5] bg-white hover:border-[#dcd7d4]'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="CLAIMER"
                  checked={form.role === 'CLAIMER'}
                  onChange={(e) => update('role', e.target.value)}
                  className="sr-only"
                />
                Friend / claimer
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2c2a2b] text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] h-10 rounded-lg text-base font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8e8985]">
          Already have an account?{' '}
          <a href="/login" className="text-[#2c2a2b] font-medium underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
