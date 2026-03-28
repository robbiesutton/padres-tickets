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
    const options = { threshold: 0.3, rootMargin: '-50px 0px' };
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
  const [linkError, setLinkError] = useState('');
  function handleGoToLink() {
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
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-4">
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
      </nav>

      {/* Hero */}
      <section className="relative h-[calc(100vh-72px)] flex items-center overflow-hidden">
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
              Free during early access
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
              Set up once, share a link, and let friends and family claim the
              games they want. No more back-and-forth texts.
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
                    onKeyDown={(e) => e.key === 'Enter' && handleGoToLink()}
                    placeholder="e.g. benchbuddy.com/share/mark-rockies"
                    className="flex-1 h-11 px-3 rounded-lg border border-white/20 bg-white/10 text-white text-sm outline-none placeholder:text-white/30 focus:border-white/40"
                    autoFocus
                  />
                  <button
                    onClick={handleGoToLink}
                    className="h-10 px-4 rounded-lg bg-white text-[#2c2a2b] text-base font-medium hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors"
                  >
                    Go
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
      <section ref={howItWorksRef} className="px-6 md:px-12 pt-16 pb-[88px] md:pt-24 md:pb-[120px]">
        <div className="max-w-5xl mx-auto">
          <p
            className="text-[20px] font-semibold text-white/30 uppercase tracking-widest mb-4 transition-all duration-700"
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
                title: 'Set Up Your Package',
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
                <span className="text-[20px] font-semibold text-white/20 mb-4 block">
                  {item.step}
                </span>
                <div className="h-px bg-white/10 mb-6" />
                <h3 className="text-base font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-sm md:text-base text-white/50 leading-relaxed">
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
      <section ref={pricingRef} className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-lg mx-auto text-center flex flex-col items-center">
          {/* Header */}
          <p
            className="text-[20px] font-semibold text-white/30 uppercase tracking-widest mb-4 transition-all duration-700"
            style={{
              opacity: pricingVisible ? 1 : 0,
              transform: pricingVisible ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            Pricing
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4 transition-all duration-700"
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              opacity: pricingVisible ? 1 : 0,
              transform: pricingVisible ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '150ms',
            }}
          >
            Free during early access
          </h2>
          <p
            className="text-base text-white/50 leading-relaxed max-w-sm mb-10 transition-all duration-700"
            style={{
              opacity: pricingVisible ? 1 : 0,
              transform: pricingVisible ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '300ms',
            }}
          >
            We&apos;re building BenchBuddy for the community. Get full access
            while we&apos;re in beta — no credit card required.
          </p>

          {/* Card */}
          <div
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center transition-all duration-700"
            style={{
              opacity: pricingVisible ? 1 : 0,
              transform: pricingVisible ? 'translateY(0)' : 'translateY(32px)',
              transitionDelay: '400ms',
            }}
          >
            {/* Badge */}
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#0F6F57]/15 border border-[#0F6F57]/30 text-sm font-semibold text-[#0F6F57] uppercase tracking-wider mb-6">
              Early Access — Free
            </span>

            {/* Price */}
            <p className="text-5xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>$0</p>
            <p className="text-sm text-white/40 mb-8">forever during early access</p>

            {/* Features */}
            <ul className="w-full space-y-0 text-left mb-8">
              {[
                '1 ticket package',
                'Unlimited games',
                'Unlimited sharing',
                'Transfer coordination',
                'Payment tracking',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0">
                  <span className="w-6 h-6 rounded-full bg-[#0F6F57]/15 flex items-center justify-center shrink-0">
                    <span className="text-[#0F6F57] text-xs font-bold">&#10003;</span>
                  </span>
                  <span className="text-base text-white/70">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="/signup"
              className="w-full h-12 rounded-lg bg-white text-[#2c2a2b] text-base font-bold flex items-center justify-center hover:bg-[#dcd7d4] transition-colors mb-3"
            >
              Share My Tickets — It&apos;s Free
            </a>
            <p className="text-xs text-white/30">
              No credit card required &middot; Set up in under 2 minutes
            </p>
          </div>

          {/* Stats */}
          <div
            className="flex items-center justify-center gap-8 md:gap-12 mt-12 transition-all duration-700"
            style={{
              opacity: pricingVisible ? 1 : 0,
              transform: pricingVisible ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '550ms',
            }}
          >
            {[
              { value: '2,400+', label: 'Season ticket holders' },
              { value: '12,000+', label: 'Games shared' },
              { value: '4.9★', label: 'User rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
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
            href="mailto:feedback@benchbuddy.app"
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

      {/* Footer */}
      <div className="mx-6 md:mx-12 h-px bg-white/10" />
      <footer className="px-6 md:px-12 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/benchbuddy-mark-white.svg" alt="" className="w-5 h-5 opacity-40" />
          <span className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} BenchBuddy
          </span>
        </div>
        <span className="text-xs text-white/20">
          Not affiliated with any sports league or team.
        </span>
      </footer>
    </div>
  );
}
