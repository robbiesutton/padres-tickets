'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/primary-button';

export default function Home() {
  const router = useRouter();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [sharedLink, setSharedLink] = useState('');

  const howItWorksRef = useRef<HTMLDivElement>(null);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);
  const [pricingVisible, setPricingVisible] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  useEffect(() => {
    const options = { threshold: 0.1, rootMargin: '0px 0px' };
    const refs = [
      { ref: howItWorksRef, set: setHowItWorksVisible },
      { ref: pricingRef, set: setPricingVisible },
      { ref: feedbackRef, set: setFeedbackVisible },
    ];
    const observers = refs.map(({ ref, set }) => {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) set(true); },
        options
      );
      if (ref.current) observer.observe(ref.current);
      return observer;
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [validating, setValidating] = useState(false);
  async function handleGoToLink() {
    setLinkError('');
    try {
      let slug = sharedLink.trim();
      if (slug.includes('/share/')) {
        const url = new URL(slug.startsWith('http') ? slug : `https://${slug}`);
        const parts = url.pathname.split('/share/');
        slug = parts[1]?.split('/')[0]?.split('?')[0] || '';
      }
      if (!slug) {
        setLinkError('Please paste a valid BenchBuddy link');
        return;
      }

      setValidating(true);
      try {
        const res = await fetch(`/api/share/${slug}/check`);
        if (!res.ok) {
          setLinkError("We couldn't find that link. Double-check it and try again.");
          return;
        }
      } catch {
        setLinkError('Something went wrong. Please try again.');
        return;
      } finally {
        setValidating(false);
      }

      router.push(`/share/${slug}`);
    } catch {
      setLinkError('Please paste a valid BenchBuddy link');
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-[#1B1716]">
      <style>{`
        @keyframes splashWave {
          0% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
          25% { transform: perspective(400px) rotateY(5deg) skewY(-2deg); }
          50% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
          75% { transform: perspective(400px) rotateY(-5deg) skewY(2deg); }
          100% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
        }
        @keyframes splashFadeOut {
          0% { opacity: 0; }
          8% { opacity: 0.5; }
          25% { opacity: 0.5; }
          100% { opacity: 0.05; }
        }
        @keyframes stadiumFadeIn {
          0% { opacity: 0; }
          8% { opacity: 0.5; }
          25% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      <style>{`
        @keyframes waveFlag {
          0% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
          25% { transform: perspective(400px) rotateY(5deg) skewY(-2deg); }
          50% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
          75% { transform: perspective(400px) rotateY(-5deg) skewY(2deg); }
          100% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
        }
      `}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6">
        <a href="/" className="flex items-center gap-2">
          <img
            src="/benchbuddy-mark-white.svg"
            alt="BenchBuddy"
            className="w-8 h-8"
            style={{
              animation: 'waveFlag 6s ease-in-out infinite',
              transformOrigin: 'center center',
            }}
          />
          <span
            className="text-xl font-bold text-white"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            BenchBuddy
          </span>
        </div>
        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="/login"
            className="text-base font-medium text-white/60 hover:text-white transition-colors"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="h-10 px-4 rounded-lg border border-white text-white text-base font-medium flex items-center justify-center hover:bg-[#dcd7d4] hover:text-[#2c2a2b] hover:border-[#2c2a2b] transition-colors"
          >
            Get Started
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-3 bg-[#1B1716]">
          <a
            href="/login"
            className="h-11 flex items-center justify-center rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="h-11 flex items-center justify-center rounded-lg border border-white text-white text-sm font-medium hover:bg-[#dcd7d4] hover:text-[#2c2a2b] hover:border-[#2c2a2b] transition-colors"
          >
            Get Started
          </a>
        </div>
      )}

      {/* Hero */}
      <section className="relative h-[calc(100vh-72px)] max-h-[900px] flex items-center overflow-hidden">
        {/* Red splash background layer — behind everything, fades to reveal stadium */}
        {/* Red splash — starts at 50%, holds 1s, fades to 5% over 5s, stays permanently */}
        <div
          className="absolute inset-0 z-0 bg-[#810100] flex items-center justify-center"
          style={{ opacity: 0, animation: 'splashFadeOut 6s ease-out forwards' }}
        >
          <img
            src="/benchbuddy-mark-white.svg"
            alt=""
            className="w-56 h-56 md:w-72 md:h-72"
            style={{
              animation: 'splashWave 3s ease-in-out infinite',
              transformOrigin: 'center center',
              opacity: 0.25,
            }}
          />
        </div>

        {/* Background image — starts at 50%, holds 1s, fades to 100% over 5s */}
        <div
          className="absolute inset-0 z-[1] bg-cover bg-center"
          style={{ backgroundImage: 'url(/hero-stadium.jpg)', opacity: 0, animation: 'stadiumFadeIn 6s ease-out forwards' }}
        />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/80 via-black/50 to-transparent" style={{ opacity: 0, animation: 'stadiumFadeIn 6s ease-out forwards' }} />
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/70 via-black/30 to-transparent" style={{ opacity: 0, animation: 'stadiumFadeIn 6s ease-out forwards' }} />

        {/* Content */}
        <div className="relative z-10 px-6 md:px-12 w-full -mt-12">
          <div className="max-w-3xl flex flex-col gap-6">
            {/* Alert */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E41837]/20 bg-[#E41837]/10 text-sm font-medium text-white/70 w-fit">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-[#E41837] animate-ping opacity-75" />
                <span className="relative w-2 h-2 rounded-full bg-[#E41837]" />
              </span>
              First year free during early access
            </span>

            {/* Headline */}
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Share your
              <br />
              season tickets
              <br />
              effortlessly.
            </h1>

            {/* Subtitle */}
            <p className="-mt-0 max-w-lg text-base md:text-lg text-white/50 leading-relaxed">
              Ditch the spreadsheets and group text. Share a link with your circle and let them claim the games they want - no wasted tickets, no crazy fees, just that simple.
            </p>

            {/* CTA */}
            <div className="mt-8">
              <a
                href="/signup"
                className="group inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white text-[#2c2a2b] text-base font-bold hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors"
              >
                Share My Tickets
                <span className="text-[#2c2a2b] transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
              </a>
            </div>

            {/* Secondary link */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/40">Were you shared a link?</span>
              <button
                onClick={() => setShowLinkInput(true)}
                className="text-white/70 underline underline-offset-2 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-sm"
              >
                Enter it here
              </button>
            </div>

            {showLinkInput && (
              <div className="max-w-md space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sharedLink}
                    onChange={(e) => setSharedLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !validating && handleGoToLink()}
                    disabled={validating}
                    placeholder="e.g. benchbuddy.com/share/mark-rockies"
                    className="flex-1 h-11 px-3 rounded-lg border border-white/20 bg-white/10 text-white text-sm outline-none placeholder:text-white/30 focus:border-white/40"
                    autoFocus
                  />
                  <button
                    onClick={handleGoToLink}
                    disabled={validating}
                    className="h-10 px-4 rounded-lg bg-white text-[#2c2a2b] text-base font-medium hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validating ? 'Checking...' : 'Go'}
                  </button>
                </div>
                {linkError && (
                  <p className="text-sm text-[#E41837]">{linkError}</p>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howItWorksRef} className="px-6 md:px-12 pt-16 pb-[88px] md:pt-24 md:pb-[120px] bg-[#2c2a2b]">
        <div className="max-w-5xl mx-auto">
          <p
            className="text-[20px] font-semibold text-white/40 uppercase tracking-widest mb-4 transition-all duration-700"
            style={{
              opacity: howItWorksVisible ? 1 : 0,
              transform: howItWorksVisible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            How it works
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-16 transition-all duration-700 delay-150"
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              opacity: howItWorksVisible ? 1 : 0,
              transform: howItWorksVisible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            Three simple steps
          </h2>
          <div className="grid gap-12 md:gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Set Up Your Tickets',
                desc: 'Select your team, enter your seat details, and your full season schedule loads automatically.',
              },
              {
                step: '02',
                title: 'Share Your Link',
                desc: 'Get a unique link for your tickets. Send it to friends and family via text, email, or any app.',
              },
              {
                step: '03',
                title: 'Friends Claim Games',
                desc: 'They browse available dates, claim the games they want, and you get notified to transfer tickets.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="transition-all duration-700"
                style={{
                  opacity: howItWorksVisible ? 1 : 0,
                  transform: howItWorksVisible ? 'translateY(0)' : 'translateY(32px)',
                  transitionDelay: `${300 + i * 150}ms`,
                }}
              >
                <span className="text-[20px] font-semibold text-white/30 mb-4 block">
                  {item.step}
                </span>
                <div className="h-px bg-white/15 mb-6" />
                <h3 className="text-base font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-sm md:text-base text-white/60 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thin divider line */}
      <div className="mx-6 md:mx-12 h-px bg-white/10" />

      {/* Pricing */}
      <section ref={pricingRef} className="px-6 md:px-12 py-16 md:py-24 bg-[#f5f4f2]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:gap-16">
          {/* Left — text content */}
          <div className="flex-1 mb-10 md:mb-0">
            <p
              className="text-[20px] font-semibold text-[#2c2a2b]/50 uppercase tracking-widest mb-4 transition-all duration-700"
              style={{
                opacity: pricingVisible ? 1 : 0,
                transform: pricingVisible ? 'translateY(0)' : 'translateY(24px)',
              }}
            >
              Pricing
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#2c2a2b] mb-4 transition-all duration-700"
              style={{
                fontFamily: 'var(--font-syne), sans-serif',
                opacity: pricingVisible ? 1 : 0,
                transform: pricingVisible ? 'translateY(0)' : 'translateY(24px)',
                transitionDelay: '150ms',
              }}
            >
              Your first year is free
            </h2>
            <p
              className="text-base text-[#6b6764] leading-relaxed max-w-sm transition-all duration-700"
              style={{
                opacity: pricingVisible ? 1 : 0,
                transform: pricingVisible ? 'translateY(0)' : 'translateY(24px)',
                transitionDelay: '300ms',
              }}
            >
              Sign up during early access and get your entire first year on us — no credit card required.
            </p>
          </div>

          {/* Right — card */}
          <div
            className="w-full md:w-[420px] shrink-0 rounded-lg border border-[#eceae5] bg-white overflow-hidden text-left transition-all duration-700"
            style={{
              opacity: pricingVisible ? 1 : 0,
              transform: pricingVisible ? 'translateY(0)' : 'translateY(32px)',
              transitionDelay: '400ms',
            }}
          >
            {/* Red accent bar */}
            <div className="h-1 bg-[#810100]" />

            <div className="p-8 md:p-10">
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0F6E56]/20 bg-[#0F6E56]/10 text-sm font-medium text-[#0F6E56]">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-[#0F6E56] animate-ping opacity-75" />
                  <span className="relative w-2 h-2 rounded-full bg-[#0F6E56]" />
                </span>
                Early Access
              </span>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl md:text-5xl font-bold text-[#8e8985] line-through leading-none" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>$39.99</span>
                <span className="text-4xl md:text-5xl font-bold text-[#2c2a2b] leading-none" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>$0</span>
              </div>
              <p className="text-sm text-[#8e8985] mt-2">per year &middot; first year free</p>
            </div>

            {/* Benefits */}
            <div className="flex flex-col gap-4 mb-8">
              {[
                'Share games with unlimited friends',
                'Track claims, revenue, and status in one place',
                'Cancel anytime — no commitment',
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                    <path d="M5 13l4 4L19 7" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm text-[#2c2a2b]">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="/signup"
              className="w-full h-12 rounded-lg bg-[#2c2a2b] text-white text-base font-semibold flex items-center justify-center hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors mb-3"
            >
              Start Free for a Year
            </a>
            <p className="text-xs text-[#8e8985] text-center">
              Cancel anytime. You won&apos;t be charged until your free month ends.
            </p>
            </div>
          </div>
        </div>
      </section>

      {/* Thin divider line */}
      <div className="mx-6 md:mx-12 h-px bg-white/10" />

      {/* Feedback */}
      <section ref={feedbackRef} className="relative py-24 md:py-32 overflow-hidden">
        {/* Background image */}
        <style>{`
          @keyframes panCrowd {
            0% { background-position: 70% 50%; }
            100% { background-position: 30% 50%; }
          }
        `}</style>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/crowd-fists.jpg)',
            backgroundSize: '120%',
            animation: 'panCrowd 12s ease-out forwards',
          }}
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 px-6 md:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
          <p
            className="text-[20px] font-semibold text-white/30 uppercase tracking-widest mb-6 transition-all duration-700"
            style={{
              opacity: feedbackVisible ? 1 : 0,
              transform: feedbackVisible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            Feedback
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4 transition-all duration-700"
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              opacity: feedbackVisible ? 1 : 0,
              transform: feedbackVisible ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '150ms',
            }}
          >
            Help us improve
          </h2>
          <p
            className="text-base text-white/60 leading-relaxed max-w-md mb-8 transition-all duration-700"
            style={{
              opacity: feedbackVisible ? 1 : 0,
              transform: feedbackVisible ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '300ms',
            }}
          >
            We&apos;re in early access and building this for you. Got ideas, found
            a bug, or want to tell us what&apos;s working?
          </p>
          <a
            href="mailto:hello@getbenchbuddy.com"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white bg-transparent px-4 text-base font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] hover:border-[#2c2a2b] transition-colors transition-all duration-700"
            style={{
              opacity: feedbackVisible ? 1 : 0,
              transform: feedbackVisible ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '450ms',
            }}
          >
            Send Us Feedback
          </a>
        </div>
      </section>

    </div>
  );
}
