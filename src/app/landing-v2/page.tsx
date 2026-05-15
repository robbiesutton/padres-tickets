'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node) &&
          hamburgerRef.current && !hamburgerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

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
      <nav className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
        </Link>
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
            className="h-10 px-4 rounded-lg bg-white text-[#2c2a2b] text-base font-bold flex items-center justify-center hover:bg-[#dcd7d4] transition-colors"
          >
            Share my tickets
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          ref={hamburgerRef}
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
        <div ref={mobileMenuRef} className="md:hidden px-6 md:px-12 lg:px-20 pb-4 flex flex-col gap-3 bg-[#1B1716]">
          <a
            href="/login"
            className="h-11 flex items-center justify-center rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="h-11 flex items-center justify-center rounded-lg bg-white text-[#2c2a2b] text-sm font-bold hover:bg-[#dcd7d4] transition-colors"
          >
            Share my tickets
          </a>
        </div>
      )}

      {/* Hero */}
      <section className="relative lg:h-[650px] flex items-center lg:items-start overflow-hidden bg-[#1B1716]">

        {/* Content */}
        <div className="relative z-10 px-6 md:px-12 lg:px-20 w-full">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:justify-center items-center gap-8 md:gap-16 lg:gap-24">
          <div className="max-w-xl flex flex-col gap-0 md:gap-6 pt-10 md:pt-6 pb-14 md:pb-[72px] lg:pt-20 lg:pb-24">
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
              className="mt-6 md:mt-0 text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Share your season tickets.
            </h1>

            {/* Subtitle */}
            <p className="md:hidden mt-4 max-w-lg text-base text-white/50 leading-relaxed">
              Share your link. They claim the games they want. No group texts, no crazy fees.
            </p>
            <p className="hidden md:block -mt-0 max-w-lg text-base md:text-lg text-white/50 leading-relaxed">
              Share your personal link and let them claim the games they want. No wasted tickets, no group texts, no crazy fees.
            </p>

            {/* CTA */}
            <div className="mt-8">
              <a
                href="/signup"
                className="group inline-flex w-full md:w-auto items-center justify-center md:justify-start gap-2 h-12 md:h-10 px-4 rounded-lg bg-white text-[#2c2a2b] text-base font-bold hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors"
              >
                Share my tickets
                <span className="text-[#2c2a2b] transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
              </a>
            </div>

            {/* Secondary link */}
            <div className="mt-5 md:mt-0 flex items-center gap-2 text-base md:text-sm">
              <span className="text-white/40">Got a link from a friend?</span>
              <button
                onClick={() => setShowLinkInput(true)}
                className="text-white/70 underline underline-offset-2 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-base md:text-sm py-2"
              >
                Enter it here
              </button>
            </div>

            {showLinkInput && (
              <div className="mt-5 md:mt-0 max-w-md space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sharedLink}
                    onChange={(e) => setSharedLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !validating && handleGoToLink()}
                    disabled={validating}
                    placeholder="e.g. benchbuddy.com/share/mark-rockies"
                    className="flex-1 h-12 md:h-11 px-3 rounded-lg border border-white/20 bg-white/10 text-white text-base md:text-sm outline-none placeholder:text-white/30 focus:border-white/40"
                    autoFocus
                  />
                  <button
                    onClick={handleGoToLink}
                    disabled={validating}
                    className="h-12 md:h-10 px-4 rounded-lg bg-white text-[#2c2a2b] text-base font-medium hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Hero visual — floating claimer calendar (desktop only) */}
          <div className="hidden lg:flex lg:w-[520px] lg:ml-4 lg:shrink-0 relative items-center justify-center lg:pb-0 lg:p-0">
            {/* Gold halo */}
            <div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                width: 800,
                height: 800,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background:
                  'radial-gradient(closest-side, rgba(212, 160, 23, 0.10), rgba(212, 160, 23, 0.04) 55%, transparent 75%)',
              }}
            />
            <HeroCalendar />
          </div>

          </div>
        </div>
      </section>

      {/* Product showcase — Share + Claim merged */}
      <section className="bg-[#F5F4F2] py-10 md:py-[72px] lg:py-24 px-5 md:px-8">
        <div className="max-w-[1120px] mx-auto flex flex-col gap-10 md:gap-12 lg:gap-16">
          {/* Row 1 — Share */}
          <div className="flex flex-col md:flex-row md:items-center md:gap-16 lg:gap-24">
            <div className="flex-1 mb-10 md:mb-0">
              <p className="text-xs font-semibold text-[#810100] uppercase tracking-widest mb-3">Share</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1B1716] mb-4" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>Text a link, share your season</h2>
              <p className="text-base text-[#8e8985] leading-relaxed max-w-md">Get a unique link with a calendar of your available games. Send it to anyone via text, email, or any app.</p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex flex-col items-end" style={{ gap: 6 }}>
                <ShareBubble />
                <SharePreviewCard />
              </div>
            </div>
          </div>

          {/* Row 2 — Claim */}
          <div className="flex flex-col md:flex-row-reverse md:items-center md:gap-16 lg:gap-24">
            <div className="flex-1 mb-10 md:mb-0">
              <p className="text-xs font-semibold text-[#810100] uppercase tracking-widest mb-3">Claim</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1B1716] mb-4" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>They pick a game and claim it</h2>
              <p className="text-base text-[#8e8985] leading-relaxed max-w-md">They see every available date, the opponent, the time, and the price. One tap to claim. You get notified instantly.</p>
            </div>
            <div className="flex-1 flex justify-center">
              {/* Claim popover — mirrors /share/padres-section203 */}
              <div
                className="relative bg-white w-[340px] lg:w-[290px] max-w-full"
                style={{
                  borderRadius: 16,
                  border: '1px solid #E5E5EA',
                  padding: '20px 24px',
                  boxShadow:
                    '0 24px 48px -16px rgba(28, 23, 22, 0.18), 0 4px 12px -2px rgba(28, 23, 22, 0.08)',
                }}
              >
                {/* Header row: COL badge + matchup */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="rounded-full flex items-center justify-center shrink-0"
                    style={{ width: 48, height: 48, backgroundColor: '#33006F' }}
                  >
                    <span className="text-white font-bold tracking-wide" style={{ fontSize: 14 }}>COL</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[18px] font-bold text-[#1B1716]" style={{ lineHeight: 1.2 }}>
                      vs Colorado Rockies
                    </div>
                    <div className="text-[14px] text-[#8E8985]" style={{ marginTop: 2 }}>
                      Tuesday, April 7, 2026
                    </div>
                  </div>
                </div>

                {/* Detail lines */}
                <div className="flex flex-col gap-1.5 mb-4">
                  <div className="text-[14px] text-[#1B1716]">7:10 PM &bull; Petco Park</div>
                  <div className="text-[14px] text-[#8E8985]">Section 203 &middot; Row 5 &middot; Seats 1-2</div>
                  <div className="text-[14px] font-semibold text-[#1B1716]">2 tickets &middot; $90 total</div>
                </div>

                {/* Claim button */}
                <button
                  type="button"
                  className="w-full text-white border-none cursor-pointer"
                  style={{
                    backgroundColor: '#2C2A2B',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Block 3 — Track */}
      <section className="bg-white py-10 md:py-[72px] lg:py-24 px-5 md:px-8">
        <div className="max-w-[1120px] mx-auto flex flex-col md:grid md:grid-cols-[1fr_1.4fr] md:gap-12 md:items-center">
          <div className="mb-10 md:mb-0">
            <p className="text-xs font-semibold text-[#810100] uppercase tracking-widest mb-3">Track and manage</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1B1716] mb-4" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>Always know where your tickets are going</h2>
            <p className="text-base text-[#8e8985] leading-relaxed max-w-md">See who claimed what, which games are still available, and your full season at a glance. You have full control to easily manage your tickets.</p>
          </div>
          <div className="flex justify-center">
            <div
              className="relative w-full flex items-center justify-center p-6 md:p-8 lg:p-12 rounded-xl overflow-visible"
              style={{
                background:
                  'radial-gradient(ellipse 700px 520px at 50% 50%, rgba(229, 171, 0, 0.08) 0%, rgba(229, 171, 0, 0.03) 40%, rgba(0,0,0,0) 75%), linear-gradient(135deg, #2C2A2B, #3a3839)',
              }}
            >
              <div className="hidden md:block w-full">
                <DashboardPanel />
              </div>
              <div className="md:hidden w-full">
                <TrackAndManageMobileMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howItWorksRef} className="px-5 md:px-8 py-10 md:py-[72px] lg:py-24 bg-[#F5F4F2]">
        <div className="max-w-[1120px] mx-auto">
          <p
            className="text-[20px] font-semibold text-[#810100] uppercase tracking-widest mb-4 transition-all duration-700"
            style={{
              opacity: howItWorksVisible ? 1 : 0,
              transform: howItWorksVisible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            How it works
          </p>
          <h2
            className="text-2xl md:text-4xl font-bold text-[#1B1716] mb-8 md:mb-12 transition-all duration-700 delay-150"
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              opacity: howItWorksVisible ? 1 : 0,
              transform: howItWorksVisible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            Share in three steps
          </h2>
          <div className="flex flex-col gap-12 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-0 md:[grid-template-rows:auto_auto_auto_auto]">
            {[
              {
                step: '01',
                title: 'Set up your tickets',
                desc: 'Select your team, enter your seat details, and your full season schedule loads automatically.',
                snippet: <SetupSnippet />,
              },
              {
                step: '02',
                title: 'Share your link',
                desc: 'Get a unique link for your tickets. Send it to anyone via text, email, or any app.',
                snippet: <ShareLinkSnippet />,
              },
              {
                step: '03',
                title: 'Friends claim games',
                desc: 'They browse available dates, claim the games they want, and you get notified to transfer tickets.',
                snippet: <ClaimToastSnippet />,
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="transition-all duration-700 flex flex-col md:grid md:[grid-row:span_4] md:[grid-template-rows:subgrid] md:gap-y-0"
                style={{
                  opacity: howItWorksVisible ? 1 : 0,
                  transform: howItWorksVisible ? 'translateY(0)' : 'translateY(32px)',
                  transitionDelay: `${300 + i * 150}ms`,
                }}
              >
                <div className="md:row-start-2 w-8 h-8 rounded-full bg-[#810100] text-white text-sm font-bold flex items-center justify-center mb-3">
                  {item.step.replace('0', '')}
                </div>
                <h3 className="md:row-start-3 text-base font-semibold text-[#1B1716] mb-2">
                  {item.title}
                </h3>
                <p className="md:row-start-4 text-base text-[#8e8985] leading-relaxed mb-6 md:mb-0">
                  {item.desc}
                </p>
                <div className="md:row-start-1 mb-0 md:mb-6 md:flex md:items-center md:justify-start">
                  {item.snippet}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing */}
      <section ref={pricingRef} className="px-5 md:px-8 py-10 md:py-[72px] lg:py-24 bg-white">
        <div className="max-w-[1120px] mx-auto flex flex-col md:flex-row md:items-center md:gap-16">
          {/* Left — text content */}
          <div className="flex-1 mb-10 md:mb-0">
            <p
              className="text-[20px] font-semibold text-[#810100] uppercase tracking-widest mb-4 transition-all duration-700"
              style={{
                opacity: pricingVisible ? 1 : 0,
                transform: pricingVisible ? 'translateY(0)' : 'translateY(24px)',
              }}
            >
              Pricing
            </p>
            <h2
              className="text-2xl md:text-4xl font-bold text-[#2c2a2b] mb-4 transition-all duration-700"
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
              Sign up during early access and get your entire first year on us. No credit card required.
            </p>
          </div>

          {/* Right — card */}
          <div
            className="w-full md:w-[420px] shrink-0 bg-white text-left transition-all duration-700"
            style={{
              borderRadius: 16,
              padding: 32,
              boxShadow:
                '0 24px 48px -16px rgba(28, 23, 22, 0.18), 0 4px 12px -2px rgba(28, 23, 22, 0.08)',
              opacity: pricingVisible ? 1 : 0,
              transform: pricingVisible ? 'translateY(0)' : 'translateY(32px)',
              transitionDelay: '400ms',
            }}
          >
            {/* Badge */}
            <div className="mb-6">
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: '#F5F4F2', color: '#1B1716' }}
              >
                Early Access
              </span>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div
                className="font-bold leading-none text-[#1B1716]"
                style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 48 }}
              >
                $0
              </div>
              <p className="text-[14px] text-[#8E8985] mt-2">per year</p>
              <p className="text-[13px] text-[#8E8985] mt-1">$39.99/year after early access</p>
            </div>

            {/* Benefits */}
            <div className="flex flex-col gap-4 mb-8">
              {[
                'Share your season with anyone. No limit.',
                'See who claimed what. Names, not numbers.',
                'Cancel anytime',
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                    <path d="M5 13l4 4L19 7" stroke="#810100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm text-[#1B1716]">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="/signup"
              className="w-full text-white text-base font-semibold flex items-center justify-center transition-colors mb-3"
              style={{
                backgroundColor: '#1B1716',
                borderRadius: 8,
                padding: 14,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2C2A2B'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1B1716'; }}
            >
              Start free for a year
            </a>
            <p className="text-xs text-[#8E8985] text-center">
              Cancel anytime. You won&apos;t be charged until your free year ends.
            </p>
          </div>
        </div>
      </section>


      {/* Feedback */}
      <section ref={feedbackRef} className="relative py-10 md:py-[72px] lg:py-24 overflow-hidden">
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
        <div className="relative z-10 px-5 md:px-8 max-w-[1120px] mx-auto text-center flex flex-col items-center">
          <p
            className="text-[20px] font-semibold uppercase tracking-widest mb-6 transition-all duration-700"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              opacity: feedbackVisible ? 1 : 0,
              transform: feedbackVisible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            Feedback
          </p>
          <h2
            className="text-2xl md:text-4xl font-bold text-white mb-4 transition-all duration-700"
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
            className="inline-flex w-full md:w-auto h-12 md:h-10 items-center justify-center rounded-lg border border-white bg-transparent px-4 text-base font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] hover:border-[#2c2a2b] transition-colors transition-all duration-700"
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

type Status = 'going' | 'claimed' | 'available';

interface PanelGame {
  dow: string;
  date: string;
  time: string;
  oppAbbr: string;
  oppColor: string;
  opponent: string;
  price: number;
  status: Status;
  claimerName?: string;
}

const TEAM_PRIMARY = '#2F241D'; // Padres dark brown
const TEAM_ACCENT = '#FFC425'; // Padres gold

function DashboardPanel() {
  const games: PanelGame[] = [
    { dow: 'FRI', date: '3', time: '7:10 PM', oppAbbr: 'SF', oppColor: '#FD5A1E', opponent: 'vs San Francisco Giants', price: 55, status: 'claimed', claimerName: 'Margo Coleman' },
    { dow: 'SAT', date: '4', time: '5:40 PM', oppAbbr: 'COL', oppColor: '#33006F', opponent: 'vs Colorado Rockies', price: 55, status: 'available' },
  ];

  return (
    <div
      className="relative bg-white w-full max-w-[640px] lg:max-w-[580px] px-4 py-4 md:px-6 md:py-5"
      style={{
        borderRadius: 16,
        border: '1px solid #E8E4DF',
        boxShadow:
          '0 32px 64px -20px rgba(0, 0, 0, 0.5), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center min-w-0">
          <span
            className="text-[20px] md:text-[24px] font-bold text-[#1B1716] truncate"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            My season
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-[13px] font-medium text-[#8E8985] bg-transparent border-none cursor-pointer hover:text-[#2c2a2b] transition-colors shrink-0"
          aria-label="Share your link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <span className="hidden md:inline">Share your link</span>
        </button>
      </div>

      {/* Stats block */}
      <div
        className="rounded-xl p-3 md:p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3"
        style={{
          backgroundColor: TEAM_PRIMARY,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <StatCard value="20" label="Total games" highlight={false} />
        <StatCard value="3" label="Claimed" highlight={false} />
        <StatCard value="12" label="Available" highlight={true} />
        <StatCard value="$90" label="Collected" highlight={true} />
      </div>

      {/* Filter chips — 5 pill chips */}
      <div
        className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        <PillChip dotColor="#2C2A2B" label="Going Myself" count={2} />
        <PillChip dotColor="#E5AB00" label="Available" count={14} />
        <PillChip dotColor="#4A7C59" label="Claimed" count={3} />
        <PillChip dotColor="#8E8985" label="Sold" count={0} />
        <PillChip dotColor="#C44545" label="Unavailable" count={0} />
      </div>

      {/* Month section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-sm" style={{ backgroundColor: '#E5AB00' }} />
        <span className="text-sm font-semibold text-[#1B1716]">April 2026</span>
        <span className="text-sm text-[#8E8985]">· 11 games</span>
      </div>

      {/* Game rows — each is its own card */}
      <div className="flex flex-col gap-2">
        {games.map((g, i) => (
          <GameRow key={i} game={g} />
        ))}
      </div>
    </div>
  );
}

function TrackAndManageMobileMockup() {
  return (
    <div
      className="bg-white w-full"
      style={{
        borderRadius: 16,
        border: '1px solid #E8E4DF',
        padding: 16,
        boxShadow: '0 32px 64px -20px rgba(0, 0, 0, 0.5), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="font-bold text-[#1B1716]"
          style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 22 }}
        >
          My season
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8985" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      </div>

      {/* 2x2 stats grid — same color treatment as desktop StatCard */}
      <div
        className="rounded-xl p-3 mb-4 grid grid-cols-2 gap-2"
        style={{
          backgroundColor: TEAM_PRIMARY,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <StatCard value="20" label="Total games" highlight={false} />
        <StatCard value="3" label="Claimed" highlight={false} />
        <StatCard value="12" label="Available" highlight={true} />
        <StatCard value="$90" label="Collected" highlight={true} />
      </div>

      {/* Single representative game row — claimed (LAD) */}
      <div
        className="flex items-center gap-2 bg-white"
        style={{
          border: '1px solid #E8E4DF',
          borderRadius: 12,
          padding: 12,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="flex flex-col items-center w-[40px] shrink-0">
          <span className="text-[10px] font-semibold uppercase text-[#8E8985] tracking-wide">FRI</span>
          <span className="text-[22px] font-bold text-[#1B1716] leading-none">3</span>
          <span className="text-[10px] font-medium text-[#8E8985] uppercase mt-0.5">Apr</span>
        </div>
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{ width: 36, height: 36, backgroundColor: '#005A9C' }}
        >
          <span className="text-white text-[11px] font-bold tracking-wide">LAD</span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[14px] font-bold text-[#1B1716] truncate">vs LA Dodgers</span>
          <span className="text-[12px] text-[#8E8985] truncate">7:10 PM &bull; Margo Coleman</span>
        </div>
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{ width: 28, height: 28, backgroundColor: '#2d6a4f' }}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, highlight }: { value: string; label: string; highlight: boolean }) {
  const accent = TEAM_ACCENT;
  const bg = highlight ? `${accent}26` : 'rgba(255,255,255,0.08)'; // 26 ~= 15% alpha hex
  const borderColor = highlight ? `${accent}4D` : 'rgba(255,255,255,0.10)'; // 4D ~= 30% alpha
  const numberColor = highlight ? accent : '#FFFFFF';
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[10px] px-2 py-3 md:py-4"
      style={{ backgroundColor: bg, border: `1px solid ${borderColor}` }}
    >
      <p
        className="font-extrabold leading-none mb-1 text-[24px] md:text-[28px]"
        style={{ color: numberColor }}
      >
        {value}
      </p>
      <p className="text-[9px] md:text-[10px] font-semibold text-white/60 uppercase tracking-[0.04em] whitespace-nowrap">
        {label}
      </p>
    </div>
  );
}

function PillChip({ dotColor, label, count }: { dotColor: string; label: string; count: number }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 shrink-0"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #DCD7D4',
        borderRadius: 999,
        padding: '8px 14px',
      }}
    >
      <span className="rounded-full shrink-0" style={{ width: 7, height: 7, backgroundColor: dotColor }} />
      <span className="text-[13px] text-[#1B1716] whitespace-nowrap">{label}</span>
      <span className="text-[12px] text-[#8E8985] whitespace-nowrap font-medium">{count}</span>
    </div>
  );
}

function GameRow({ game }: { game: PanelGame }) {
  const statusText =
    game.status === 'going' ? 'Going Myself' :
    game.status === 'claimed' ? game.claimerName ?? 'Claimed' :
    'Available';

  return (
    <div
      className="flex items-center gap-2 md:gap-4 bg-white"
      style={{
        border: '1px solid #E8E4DF',
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      {/* Date block */}
      <div className="flex flex-col items-center w-[40px] md:w-[52px] shrink-0">
        <span className="text-[10px] font-semibold uppercase text-[#8E8985] tracking-wide">{game.dow}</span>
        <span className="text-[22px] md:text-[24px] font-bold text-[#1B1716] leading-none">{game.date}</span>
        <span className="text-[10px] md:text-[11px] font-medium text-[#8E8985] uppercase mt-0.5">Apr</span>
      </div>

      {/* Team badge */}
      <div
        className="rounded-full flex items-center justify-center shrink-0"
        style={{ width: 36, height: 36, backgroundColor: game.oppColor }}
      >
        <span className="text-white text-[11px] md:text-[12px] font-bold tracking-wide">{game.oppAbbr}</span>
      </div>

      {/* Game info */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[15px] md:text-[16px] font-bold text-[#1B1716] truncate">
          {game.opponent}
        </span>

        {/* Mobile meta: time • status */}
        <span className="md:hidden text-[12px] text-[#8E8985] truncate">
          {game.time} • {statusText}
        </span>

        {/* Desktop meta: time • claimer · $price/ticket */}
        <span className="hidden md:inline text-[13px] text-[#8E8985] truncate">
          {game.time}
          {game.claimerName && <> • {game.claimerName}</>}
          <> · ${game.price}/ticket</>
        </span>
      </div>

      {/* Status pill — desktop only */}
      <div className="hidden md:flex">
        <StatusPill status={game.status} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const config = {
    going:     { label: 'Going Myself', dot: '#2C2A2B', bg: '#E8E5E0', text: '#2C2A2B', lock: false },
    available: { label: 'Available',    dot: '#E5AB00', bg: '#FDF6E3', text: '#2C2A2B', lock: false },
    claimed:   { label: 'Claimed',      dot: '#4A7C59', bg: '#E8F5E4', text: '#2D6A4F', lock: true  },
  } as const;
  const c = config[status];
  return (
    <div
      className="inline-flex items-center gap-1.5 shrink-0"
      style={{
        backgroundColor: c.bg,
        borderRadius: 999,
        padding: '6px 10px',
      }}
    >
      <span className="rounded-full shrink-0" style={{ width: 7, height: 7, backgroundColor: c.dot }} />
      <span className="text-[12px] md:text-[13px] font-medium whitespace-nowrap" style={{ color: c.text }}>
        {c.label}
      </span>
      {c.lock && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      )}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

const SNIPPET_SHADOW =
  '0 24px 48px -16px rgba(28, 23, 22, 0.18), 0 4px 12px -2px rgba(28, 23, 22, 0.08)';

function SetupSnippet() {
  return (
    <div
      className="bg-white w-full max-w-[320px]"
      style={{
        border: '1px solid #E8E4DF',
        borderRadius: 12,
        padding: 16,
        boxShadow: SNIPPET_SHADOW,
      }}
    >
      <p className="text-[10px] font-semibold uppercase text-[#8E8985] mb-2.5" style={{ letterSpacing: '0.05em' }}>
        Set up
      </p>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{ width: 28, height: 28, backgroundColor: '#d4a017' }}
        >
          <span className="text-[12px] font-bold tracking-wide text-white">SD</span>
        </div>
        <span className="text-[14px] font-bold text-[#1B1716] truncate">San Diego Padres</span>
      </div>
      <p className="text-[12px] text-[#8E8985] mb-4">Sec 203 · Row 5 · Seats 1-2</p>
      <button
        type="button"
        className="w-full text-white text-[12px] font-medium border-none cursor-pointer flex items-center justify-center gap-1"
        style={{
          backgroundColor: '#2C2A2B',
          borderRadius: 8,
          padding: '8px 14px',
        }}
      >
        Continue
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>
    </div>
  );
}

function ShareLinkSnippet() {
  return (
    <div
      className="bg-white w-full max-w-[320px]"
      style={{
        border: '1px solid #E8E4DF',
        borderRadius: 12,
        padding: 16,
        boxShadow: SNIPPET_SHADOW,
      }}
    >
      <p className="text-[10px] font-semibold uppercase text-[#8E8985] mb-2.5" style={{ letterSpacing: '0.05em' }}>
        Your link
      </p>
      <div
        className="flex items-center gap-1.5 mb-2.5 min-w-0"
        style={{
          backgroundColor: '#F9F6F0',
          border: '1px solid #DCD7D4',
          borderRadius: 8,
          padding: '10px 12px',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8985" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        <span className="text-[12px] text-[#1B1716] truncate">benchbuddy.com/coleman-2026</span>
      </div>
      <button
        type="button"
        className="w-full text-white text-[12px] font-medium border-none cursor-pointer"
        style={{
          backgroundColor: '#2C2A2B',
          borderRadius: 8,
          padding: '8px 14px',
        }}
      >
        Copy
      </button>
    </div>
  );
}

function ClaimToastSnippet() {
  return (
    <div
      className="bg-white w-full max-w-[320px] flex items-center gap-3"
      style={{
        border: '1px solid #E8E4DF',
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: SNIPPET_SHADOW,
      }}
    >
      {/* Date block */}
      <div className="flex flex-col items-center w-[36px] shrink-0">
        <span className="text-[10px] font-semibold uppercase text-[#8E8985] tracking-wide">FRI</span>
        <span className="text-[24px] font-bold text-[#1B1716] leading-none">3</span>
        <span className="text-[11px] font-medium text-[#8E8985] mt-0.5">Apr</span>
      </div>

      {/* Claimed check circle (replaces team badge) */}
      <div
        className="rounded-full flex items-center justify-center shrink-0"
        style={{ width: 36, height: 36, backgroundColor: '#2d6a4f' }}
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Game info */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[14px] font-bold text-[#1B1716] truncate">vs LA Dodgers</span>
        <span className="text-[12px] text-[#8E8985] truncate">7:10 PM &bull; Margo Coleman</span>
      </div>
    </div>
  );
}

function ShareBubble() {
  return (
    <div
      className="text-white text-[15px] max-w-[300px] lg:max-w-[256px]"
      style={{
        backgroundColor: '#34C759',
        padding: '10px 14px',
        borderRadius: '18px 18px 4px 18px',
        lineHeight: 1.4,
        boxShadow:
          '0 8px 16px -4px rgba(52, 199, 89, 0.25), 0 2px 6px -1px rgba(28, 23, 22, 0.08)',
      }}
    >
      Hey want to go to the Dodgers game Friday?
    </div>
  );
}

function SharePreviewCard() {
  return (
    <div
      className="bg-white w-full max-w-[340px] lg:max-w-[290px]"
      style={{
        border: '1px solid #E5E5EA',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow:
          '0 24px 48px -16px rgba(28, 23, 22, 0.18), 0 4px 12px -2px rgba(28, 23, 22, 0.08)',
      }}
    >
      {/* Top image area — branded fallback OG */}
      <div
        className="flex items-center justify-center"
        style={{
          height: 130,
          backgroundColor: '#2C2A2B',
          padding: '0 40px',
        }}
        aria-hidden
      >
        <img
          src="/benchbuddy-lockup-white.svg"
          alt=""
          style={{ width: '85%', maxWidth: 220, height: 'auto' }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '14px 24px' }}>
        <p className="text-[15px] text-[#1B1716]" style={{ fontWeight: 600, lineHeight: 1.3, textWrap: 'balance' }}>
          Robbie shared Padres tickets with you
        </p>
        <p className="text-[12px] text-[#8E8985]" style={{ marginTop: 4 }}>getbenchbuddy.com</p>
        <p className="text-[13px]" style={{ color: '#555555', lineHeight: 1.4, marginTop: 4 }}>
          Browse available games and claim the ones you want.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Hero floating calendar (animated) ---------------- */

const TEAM_COLORS: Record<string, string> = {
  LAD: '#005A9C',
  SF: '#FD5A1E',
  AZ: '#A71930',
  COL: '#33006F',
  MIL: '#12284B',
  ATL: '#CE1141',
  NYM: '#002D72',
  PHI: '#E81828',
  CIN: '#C6011F',
  PIT: '#FDB827',
};

type HeroDay =
  | null
  | { type: 'game'; team: keyof typeof TEAM_COLORS; dimmed?: boolean }
  | { type: 'claimed' };

// April 2026 — 30 days, starts on Wednesday (offset 3)
const APRIL_GAMES: Record<number, HeroDay> = {
  1: { type: 'game', team: 'LAD', dimmed: true },
  3: { type: 'claimed' },
  4: { type: 'game', team: 'LAD' },
  7: { type: 'game', team: 'COL' },
  8: { type: 'game', team: 'COL' },
  11: { type: 'game', team: 'SF', dimmed: true },
  14: { type: 'game', team: 'AZ' },
  18: { type: 'claimed' },
  21: { type: 'game', team: 'PIT' },
  25: { type: 'game', team: 'ATL', dimmed: true },
  30: { type: 'game', team: 'NYM' },
};

const PADRES_PRIMARY = '#2F241D';
const CLAIMED_GREEN = '#0f6f57';

function HeroCheck({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" aria-hidden>
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The COL April-7 cell — the animation target. Forwards a ref to the badge so
// the parent can measure it and anchor the cursor + popover.
function HeroAnimatedColCell({
  badgeRef,
  claimed,
}: {
  badgeRef: React.RefObject<HTMLDivElement | null>;
  claimed: boolean;
}) {
  return (
    <div className="aspect-square flex items-center justify-center">
      <div
        ref={badgeRef}
        className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-full flex items-center justify-center text-[11px] md:text-[12px] font-bold text-white relative"
        style={{
          backgroundColor: claimed ? CLAIMED_GREEN : TEAM_COLORS.COL,
          transition: 'background-color 320ms ease, transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: claimed ? 'scale(1)' : 'scale(1)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            opacity: claimed ? 0 : 1,
            transition: 'opacity 220ms ease',
          }}
        >
          COL
        </span>
        <span
          style={{
            position: 'absolute',
            opacity: claimed ? 1 : 0,
            transform: claimed ? 'scale(1)' : 'scale(0.7)',
            transition: 'opacity 220ms ease 120ms, transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms',
          }}
        >
          <HeroCheck size={20} />
        </span>
      </div>
    </div>
  );
}

function HeroDayCell({ day, data }: { day: number; data: HeroDay }) {
  if (!data) {
    return (
      <div className="aspect-square flex items-center justify-center">
        <span className="text-[13px] md:text-[15px] text-[#8e8985]">{day}</span>
      </div>
    );
  }
  if (data.type === 'claimed') {
    return (
      <div className="aspect-square flex items-center justify-center">
        <div className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-full bg-[#0f6f57] flex items-center justify-center">
          <HeroCheck size={22} />
        </div>
      </div>
    );
  }
  const color = TEAM_COLORS[data.team];
  return (
    <div className="aspect-square flex items-center justify-center">
      <div
        className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-full flex items-center justify-center text-[11px] md:text-[12px] font-bold text-white"
        style={{ backgroundColor: color, opacity: data.dimmed ? 0.18 : 1 }}
      >
        {data.team}
      </div>
    </div>
  );
}

// Custom cursor — black arrow with white outline, drop shadow.
function HeroCursor() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }} aria-hidden>
      <path
        d="M3 2 L3 18 L7.5 13.5 L10.5 19.5 L13 18 L10 12 L16 12 Z"
        fill="#1B1716"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroPopover({
  visible,
  confirmed,
  left,
  top,
  claimBtnRef,
  claimPressed,
}: {
  visible: boolean;
  confirmed: boolean;
  left: number;
  top: number;
  claimBtnRef: React.RefObject<HTMLDivElement | null>;
  claimPressed: boolean;
}) {
  return (
    <div
      className="absolute hidden md:block"
      style={{
        left,
        top,
        width: 240,
        transform: `translateY(-50%) scale(${visible ? 1 : 0.92})`,
        transformOrigin: 'left center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 220ms ease, transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      <div
        className="bg-white"
        style={{
          borderRadius: 12,
          border: `1px solid ${confirmed ? CLAIMED_GREEN : '#e5e3df'}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          transition: 'border-color 240ms ease',
        }}
      >
        <div style={{ padding: 18 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
            <div
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center font-bold text-white text-[12px] relative shrink-0"
              style={{
                backgroundColor: confirmed ? CLAIMED_GREEN : TEAM_COLORS.COL,
                transition: 'background-color 320ms ease',
              }}
            >
              <span style={{ position: 'absolute', opacity: confirmed ? 0 : 1, transition: 'opacity 220ms ease' }}>COL</span>
              <span
                style={{
                  position: 'absolute',
                  opacity: confirmed ? 1 : 0,
                  transform: confirmed ? 'scale(1)' : 'scale(0.7)',
                  transition: 'opacity 220ms ease 120ms, transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms',
                }}
              >
                <HeroCheck size={22} />
              </span>
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#2c2a2b]" style={{ lineHeight: 1.2 }}>
                vs Colorado Rockies
              </div>
              <div className="text-[12px] text-[#8e8985]" style={{ marginTop: 2 }}>
                Tuesday, April 7, 2026
              </div>
            </div>
          </div>

          <div className="text-[12px] text-[#8e8985]" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            <div>7:10 PM &bull; Petco Park</div>
            <div>Section 203 &middot; Row 5 &middot; Seats 1-2</div>
            <div className="text-[#2c2a2b] font-medium">2 tickets &middot; $90 total</div>
          </div>

          <div
            ref={claimBtnRef}
            className="w-full rounded-lg text-white text-[14px] font-medium flex items-center justify-center"
            style={{
              height: 40,
              backgroundColor: confirmed ? '#fff' : PADRES_PRIMARY,
              color: confirmed ? CLAIMED_GREEN : '#fff',
              border: confirmed ? `1.5px solid ${CLAIMED_GREEN}` : 'none',
              transform: claimPressed && !confirmed ? 'scale(0.98)' : 'scale(1)',
              transition:
                'background-color 240ms ease, color 240ms ease, border-color 240ms ease, transform 120ms ease',
            }}
          >
            {confirmed ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <HeroCheck size={14} color={CLAIMED_GREEN} />
                Claimed
              </span>
            ) : (
              'Claim'
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCalendar() {
  const panelRef = useRef<HTMLDivElement>(null);
  const colBadgeRef = useRef<HTMLDivElement | null>(null);
  const claimBtnRef = useRef<HTMLDivElement | null>(null);

  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [cursor, setCursor] = useState({ x: 60, y: 50, visible: false, duration: 0, pressed: false });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ left: 0, top: 0 });

  // Decide animation eligibility + run loop in one effect (avoids race
  // between detection and loop on first mount).
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (reduced || isMobile) {
      startTransition(() => {
        setAnimationsEnabled(false);
        setClaimed(true); // static end state — COL is already a green check
      });
      return;
    }
    // Animations enabled — proceed to loop below.
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let resumeFromHidden = false;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(() => resolve(), ms);
      });

    function measureBadgeCenter() {
      const panel = panelRef.current;
      const badge = colBadgeRef.current;
      if (!panel || !badge) return null;
      const p = panel.getBoundingClientRect();
      const b = badge.getBoundingClientRect();
      return {
        x: b.left - p.left + b.width / 2,
        y: b.top - p.top + b.height / 2,
        left: b.left - p.left,
        right: b.right - p.left,
        panelWidth: p.width,
      };
    }

    function measureClaimCenter() {
      const panel = panelRef.current;
      const btn = claimBtnRef.current;
      if (!panel || !btn) return null;
      const p = panel.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      return {
        x: b.left - p.left + b.width / 2,
        y: b.top - p.top + b.height / 2,
      };
    }

    async function loop() {
      while (!cancelled) {
        // Reset state
        setClaimed(false);
        setConfirmed(false);
        setPopoverOpen(false);
        setCursor((c) => ({ ...c, visible: false, duration: 0, pressed: false, x: 60, y: 50 }));
        await wait(500);
        if (cancelled) return;

        // 0.5s — cursor fades in (start position upper-left of panel)
        setCursor((c) => ({ ...c, visible: true, duration: 0, x: 80, y: 60 }));
        await wait(50); // let it appear
        if (cancelled) return;

        // 0.5–1.8s — move toward COL badge (1.3s)
        const badge = measureBadgeCenter();
        if (badge) {
          // Smart popover placement — right of badge if it fits, else left, else clamp.
          const POPOVER_W = 240;
          const PAD = 20;
          let popLeft = badge.right + 12;
          if (popLeft + POPOVER_W > badge.panelWidth - PAD) {
            popLeft = badge.left - POPOVER_W - 12;
            if (popLeft < PAD) {
              popLeft = badge.panelWidth - POPOVER_W - PAD;
            }
          }
          setPopoverPos({ left: popLeft, top: badge.y });
          setCursor((c) => ({ ...c, x: badge.x, y: badge.y, duration: 1300 }));
        }
        await wait(1300);
        if (cancelled) return;

        // 1.8–2.0s — click pulse on cursor
        setCursor((c) => ({ ...c, pressed: true, duration: 0 }));
        await wait(150);
        setCursor((c) => ({ ...c, pressed: false }));
        await wait(50);
        if (cancelled) return;

        // 2.0–2.4s — popover fades/scales in
        setPopoverOpen(true);
        await wait(400);
        if (cancelled) return;

        // 2.4–3.4s — pause to read
        await wait(1000);
        if (cancelled) return;

        // 3.4–4.0s — move to Claim button (600ms)
        const claim = measureClaimCenter();
        if (claim) {
          setCursor((c) => ({ ...c, x: claim.x, y: claim.y, duration: 600 }));
        }
        await wait(600);
        if (cancelled) return;

        // 4.0–4.2s — click Claim
        setCursor((c) => ({ ...c, pressed: true, duration: 0 }));
        await wait(150);
        setCursor((c) => ({ ...c, pressed: false }));
        await wait(50);
        if (cancelled) return;

        // 4.2s — calendar badge AND popover state flip simultaneously
        setClaimed(true);
        setConfirmed(true);
        await wait(2400); // absorb time (matches prior total of 600 + 600 + 1200)
        if (cancelled) return;

        // 6.6–7.0s — fade out popover + cursor
        setPopoverOpen(false);
        setCursor((c) => ({ ...c, visible: false, duration: 0 }));
        await wait(400);
        if (cancelled) return;

        // 7.0–8.0s — beat
        await wait(1000);
        if (cancelled) return;
      }
    }

    function onVisibility() {
      if (document.hidden) {
        cancelled = true;
        if (timeoutId) clearTimeout(timeoutId);
        resumeFromHidden = true;
      } else if (resumeFromHidden) {
        resumeFromHidden = false;
        cancelled = false;
        loop();
      }
    }

    document.addEventListener('visibilitychange', onVisibility);
    loop();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className="relative bg-white w-full"
      style={{
        maxWidth: 520,
        borderRadius: 20,
        border: '1px solid #E8E4DF',
        padding: 20,
        boxShadow:
          '0 40px 80px -24px rgba(0, 0, 0, 0.55), 0 12px 32px -6px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Single month grid */}
      <div>
        <div
          className="text-[18px] md:text-[20px] font-bold text-[#1B1716] text-left"
          style={{ fontFamily: 'var(--font-syne), sans-serif', marginBottom: 4 }}
        >
          Adam&apos;s season
        </div>
        <div className="text-[13px] text-[#8e8985] text-left" style={{ marginBottom: 14 }}>
          April 2026
        </div>
        <div className="grid grid-cols-7" style={{ gap: 4 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div
              key={`hdr-${i}`}
              className="text-[11px] md:text-[12px] text-[#8e8985] text-center font-semibold uppercase tracking-wider"
              style={{ paddingTop: 4, paddingBottom: 6 }}
            >
              {d}
            </div>
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            if (day === 7) {
              return <HeroAnimatedColCell key={day} badgeRef={colBadgeRef} claimed={claimed} />;
            }
            return <HeroDayCell key={day} day={day} data={APRIL_GAMES[day] ?? null} />;
          })}
        </div>
      </div>

      {/* Popover overlay */}
      <HeroPopover
        visible={popoverOpen}
        confirmed={confirmed}
        left={popoverPos.left}
        top={popoverPos.top}
        claimBtnRef={claimBtnRef}
        claimPressed={cursor.pressed && popoverOpen && !confirmed}
      />

      {/* Cursor overlay (desktop only) */}
      {animationsEnabled && (
        <div
          className="hidden md:block absolute pointer-events-none"
          aria-hidden
          style={{
            left: 0,
            top: 0,
            transform: `translate(${cursor.x - 4}px, ${cursor.y - 4}px) scale(${cursor.pressed ? 0.85 : 1})`,
            transition:
              cursor.duration > 0
                ? `transform ${cursor.duration}ms cubic-bezier(0.4, 0, 0.2, 1)`
                : 'transform 120ms ease',
            opacity: cursor.visible ? 1 : 0,
            zIndex: 40,
          }}
        >
          <HeroCursor />
        </div>
      )}
    </div>
  );
}
