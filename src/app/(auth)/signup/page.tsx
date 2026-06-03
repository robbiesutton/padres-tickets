'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import {
  SetupLayout,
  StepHeadline,
  StepSubhead,
  FormLabel,
} from '@/components/setup-layout';

type FieldKey =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'password'
  | 'terms';
type Errors = Partial<Record<FieldKey, string>>;
type Touched = Partial<Record<FieldKey, boolean>>;

const NAME_RE = /^[\p{L}\s'-]{2,}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Please enter your name';
  if (!NAME_RE.test(v)) return 'Please enter your name';
  return null;
}

function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Please enter a valid email address';
  if (!EMAIL_RE.test(v)) return 'Please enter a valid email address';
  return null;
}

function validatePhone(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Please enter a valid phone number';
  if (v.startsWith('+')) {
    const digits = v.slice(1).replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15)
      return 'Please enter a valid phone number';
    return null;
  }
  const digits = v.replace(/\D/g, '');
  if (digits.length !== 10) return 'Please enter a valid phone number';
  return null;
}

function validatePassword(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters';
  return null;
}

function formatPhone(value: string): string {
  if (value.startsWith('+')) {
    return '+' + value.slice(1).replace(/[^\d]/g, '');
  }
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const ph = usePostHog();

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function runValidator(
    field: FieldKey,
    value: string,
    agreed: boolean = agreedToTerms
  ): string | null {
    if (field === 'firstName')
      return validateName(value) ? 'Please enter your first name' : null;
    if (field === 'lastName')
      return validateName(value) ? 'Please enter your last name' : null;
    if (field === 'email') return validateEmail(value);
    if (field === 'phone') return validatePhone(value);
    if (field === 'password') return validatePassword(value);
    if (field === 'terms')
      return agreed
        ? null
        : 'Please agree to the Terms of Service and Privacy Policy to continue';
    return null;
  }

  function setFieldValue(
    field: 'firstName' | 'lastName' | 'email' | 'phone' | 'password',
    value: string
  ) {
    const newValue = field === 'phone' ? formatPhone(value) : value;
    setForm((prev) => ({ ...prev, [field]: newValue }));
    // Rule B (re-validate on input after first error): if field is touched OR password (which is Rule B from start), re-run validator.
    const shouldLiveValidate = touched[field] || field === 'password';
    if (shouldLiveValidate) {
      const err = runValidator(field, newValue);
      setErrors((prev) => ({ ...prev, [field]: err ?? undefined }));
    }
  }

  function handleBlur(
    field: 'firstName' | 'lastName' | 'email' | 'phone' | 'password'
  ) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = runValidator(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err ?? undefined }));
    if (err) ph?.capture('signup_field_error', { field, error: err });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    // Validate every field; collect errors.
    const next: Errors = {};
    (['firstName', 'lastName', 'email', 'phone', 'password'] as const).forEach(
      (f) => {
        const err = runValidator(f, form[f]);
        if (err) next[f] = err;
      }
    );
    if (!agreedToTerms)
      next.terms =
        'Please agree to the Terms of Service and Privacy Policy to continue';

    setErrors(next);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      terms: true,
    });

    if (Object.keys(next).length > 0) {
      // Focus first invalid field in DOM order.
      const refMap = {
        firstName: firstNameRef,
        lastName: lastNameRef,
        email: emailRef,
        phone: phoneRef,
        password: passwordRef,
      };
      const order: Array<
        'firstName' | 'lastName' | 'email' | 'phone' | 'password'
      > = ['firstName', 'lastName', 'email', 'phone', 'password'];
      const firstInvalid = order.find((f) => next[f]);
      if (firstInvalid) refMap[firstInvalid].current?.focus();
      return;
    }

    ph?.capture('signup_submitted');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agreedToTerms, marketingOptIn }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.');
        ph?.capture('signup_failed', { error: data.error });
        setLoading(false);
        return;
      }
      ph?.capture('signup_succeeded', { userId: data.data?.id });
      window.location.href = '/packages/new';
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      ph?.capture('signup_failed', { error: 'network_error' });
      setLoading(false);
    }
  }

  function inputClass(hasError: boolean, extra: string = '') {
    const base =
      'block w-full h-12 px-4 bg-white border-[1.5px] rounded-lg text-base font-medium text-[#1a1a1a] outline-none transition-all';
    const ok =
      'border-[#eceae5] hover:border-[#b5b1ab] focus:border-[#2c2a2b] focus:ring-[3px] focus:ring-[#2c2a2b]/10';
    const err =
      'border-[#dc2626] hover:border-[#dc2626] focus:border-[#dc2626] focus:ring-[3px] focus:ring-[#dc2626]/12';
    return `${base} ${hasError ? err : ok} ${extra}`;
  }

  // Password field gets error styling as soon as the user has typed something invalid (Rule B from start).
  const passwordHasError =
    form.password.length > 0 && !!validatePassword(form.password);
  const passwordReqMet = form.password.length >= 8;

  return (
    <SetupLayout showSidebar={false}>
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-1.5 text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] no-underline transition-colors z-10"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>
      <div className="flex flex-col flex-1 md:justify-center max-w-[380px] mx-auto w-full pt-12 md:pt-0">
        <div className="text-center">
          <StepHeadline>Create your account</StepHeadline>
          <StepSubhead>
            Start sharing your season tickets with friends and family.
          </StepSubhead>
        </div>

        {submitError && (
          <div
            data-testid="signup-error"
            className="rounded-lg bg-[#FEE2E2] text-[#DC2626] px-4 py-3 text-sm font-medium mb-4"
          >
            {submitError}
          </div>
        )}

        <form
          data-testid="signup-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>First name</FormLabel>
              <input
                data-testid="signup-first-name"
                ref={firstNameRef}
                type="text"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => setFieldValue('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                className={inputClass(!!errors.firstName)}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? 'err-firstName' : undefined
                }
              />
              {errors.firstName && (
                <FieldError id="err-firstName">{errors.firstName}</FieldError>
              )}
            </div>
            <div>
              <FormLabel>Last name</FormLabel>
              <input
                data-testid="signup-last-name"
                ref={lastNameRef}
                type="text"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => setFieldValue('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                className={inputClass(!!errors.lastName)}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'err-lastName' : undefined}
              />
              {errors.lastName && (
                <FieldError id="err-lastName">{errors.lastName}</FieldError>
              )}
            </div>
          </div>

          <div>
            <FormLabel>Email</FormLabel>
            <input
              data-testid="signup-email"
              ref={emailRef}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={(e) => setFieldValue('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={inputClass(!!errors.email)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'err-email' : undefined}
            />
            {errors.email && (
              <FieldError id="err-email">{errors.email}</FieldError>
            )}
          </div>

          <div>
            <FormLabel>Phone number</FormLabel>
            <input
              ref={phoneRef}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setFieldValue('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              className={inputClass(!!errors.phone)}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'err-phone' : undefined}
            />
            {errors.phone && (
              <FieldError id="err-phone">{errors.phone}</FieldError>
            )}
          </div>

          <div>
            <FormLabel>Password</FormLabel>
            <div className="relative">
              <input
                data-testid="signup-password"
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setFieldValue('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={inputClass(passwordHasError, 'pr-16')}
                aria-invalid={passwordHasError}
                aria-describedby="pwd-reqs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div id="pwd-reqs" className="mt-2 flex flex-col gap-1.5">
              <PasswordReq met={passwordReqMet}>
                At least 8 characters
              </PasswordReq>
            </div>
            {touched.password && errors.password && (
              <FieldError>{errors.password}</FieldError>
            )}
          </div>

          {/* Consent */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                <input
                  data-testid="signup-terms-checkbox"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    ph?.capture('signup_terms_toggled', { checked: e.target.checked });
                    if (touched.terms) {
                      setErrors((prev) => ({
                        ...prev,
                        terms: e.target.checked
                          ? undefined
                          : 'Please agree to the Terms of Service and Privacy Policy to continue',
                      }));
                    }
                  }}
                  className="mt-0.5 w-5 h-5 accent-[#2c2a2b] shrink-0"
                  aria-invalid={!!errors.terms}
                />
                <span className="text-[#8e8985] leading-relaxed">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    onClick={() => ph?.capture('signup_legal_link_clicked', { link: 'terms' })}
                    className="text-[#8e8985] underline"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    onClick={() => ph?.capture('signup_legal_link_clicked', { link: 'privacy' })}
                    className="text-[#8e8985] underline"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.terms && <FieldError>{errors.terms}</FieldError>}
            </div>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => {
                  setMarketingOptIn(e.target.checked);
                  ph?.capture('signup_marketing_toggled', { checked: e.target.checked });
                }}
                className="mt-0.5 w-5 h-5 accent-[#2c2a2b] shrink-0"
              />
              <span className="text-[#8e8985] leading-relaxed">
                I&apos;d like to receive updates from BenchBuddy
              </span>
            </label>
          </div>

          <button
            data-testid="signup-submit"
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-[#2c2a2b] text-white text-sm font-medium cursor-pointer border-none transition-all hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8e8985] mt-6 pb-8">
          Already have an account?{' '}
          <a
            href="/login"
            onClick={() => ph?.capture('signup_login_link_clicked')}
            className="text-[#8e8985] underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </SetupLayout>
  );
}

function FieldError({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-[#dc2626]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="mt-0.5 shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

function PasswordReq({
  met,
  children,
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-2 text-[13px]"
      style={{ fontWeight: 400 }}
    >
      <span
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: 16,
          height: 16,
          backgroundColor: met ? '#2d6a4f' : 'transparent',
          border: met ? 'none' : '1px solid #8E8985',
        }}
        aria-hidden
      >
        {met && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span style={{ color: met ? '#1B1716' : '#8E8985' }}>{children}</span>
    </div>
  );
}
