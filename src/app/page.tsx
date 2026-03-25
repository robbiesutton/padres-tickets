'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/primary-button';

export default function Home() {
  const router = useRouter();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [sharedLink, setSharedLink] = useState('');
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 100);
    const removeTimer = setTimeout(() => setSplashVisible(false), 5100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);
  const [linkError, setLinkError] = useState('');
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

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

  const images = [
    { src: '/hero-stadium.jpg', alt: 'Stadium panoramic view' },
    { src: '/stadium-crowd.jpg', alt: 'Crowd at the game' },
    { src: '/stadium-field.jpg', alt: 'View of the field' },
    { src: '/stadium-night.jpg', alt: 'Night game atmosphere' },
    { src: '/stadium-seats.jpg', alt: 'Stadium seats view' },
  ];

  return (
    <div className="flex flex-1 flex-col bg-[#1B1716]">
      {/* Splash Screen */}
      {splashVisible && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#810100] transition-opacity duration-[5000ms] ease-out"
          style={{ opacity: splashFading ? 0 : 1 }}
        >
          <style>{`
            @keyframes splashWave {
              0% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
              25% { transform: perspective(400px) rotateY(5deg) skewY(-2deg); }
              50% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
              75% { transform: perspective(400px) rotateY(-5deg) skewY(2deg); }
              100% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
            }
          `}</style>
          <img
            src="/benchbuddy-mark-white.svg"
            alt="BenchBuddy"
            className="w-56 h-56 md:w-72 md:h-72"
            style={{
              animation: 'splashWave 3s ease-in-out infinite',
              transformOrigin: 'center center',
              opacity: 0.25,
            }}
          />
        </div>
      )}

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
          <button
            onClick={() => setShowLinkInput(true)}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Have a link?
          </button>
          <a
            href="/login"
            className="text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="h-10 px-5 rounded-lg border-[1.5px] border-white/30 text-white text-sm font-medium flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[calc(100vh-72px)] flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/hero-stadium.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 px-6 md:px-12 w-full">
          <div className="max-w-2xl flex flex-col gap-6">
            {/* Headline */}
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Share your season
              <br />
              tickets effortlessly
            </h1>

            {/* Subtitle */}
            <p className="max-w-lg text-base md:text-lg text-white/50 leading-relaxed">
              Set up once, share a link, and let friends and family claim the
              games they want. No more back-and-forth texts.
            </p>

            {/* CTA */}
            <div>
              <a
                href="/signup"
                className="inline-flex items-center gap-3 h-11 px-6 rounded-lg bg-white text-[#1B1716] text-base font-medium hover:bg-[#dcd7d4] transition-colors"
              >
                Share My Tickets
                <span className="text-[#8e8985]">&rarr;</span>
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
                    className="h-11 px-5 rounded-lg bg-white text-[#1B1716] text-sm font-medium hover:bg-white/90 transition-colors"
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

      {/* Animated Logo Section */}
      <section className="flex items-center justify-center py-20 md:py-28">
        <style>{`
          @keyframes waveFlag {
            0% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
            25% { transform: perspective(400px) rotateY(5deg) skewY(-2deg); }
            50% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
            75% { transform: perspective(400px) rotateY(-5deg) skewY(2deg); }
            100% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
          }
        `}</style>
        <img
          src="/benchbuddy-mark-white.svg"
          alt="BenchBuddy"
          className="w-24 h-24 md:w-32 md:h-32 opacity-80"
          style={{
            animation: 'waveFlag 6s ease-in-out infinite',
            transformOrigin: 'center center',
          }}
        />
      </section>

      {/* Image Grid — Sport Cover inspired with hover opacity shifts */}
      <section className="px-6 md:px-12 pb-16 md:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[280px]">
          {images.map((img, i) => {
            const spans = [
              'md:col-span-7 md:row-span-2',    // Large left
              'md:col-span-5 md:row-span-1',     // Top right
              'md:col-span-5 md:row-span-1',     // Bottom right
              'md:col-span-6 md:row-span-1',     // Bottom left
              'md:col-span-6 md:row-span-1',     // Bottom right
            ];
            const mobileSpan = i === 0 ? 'col-span-2' : 'col-span-1';
            const isHovered = hoveredImage === i;
            const someHovered = hoveredImage !== null;

            return (
              <div
                key={i}
                className={`${mobileSpan} ${spans[i]} relative overflow-hidden rounded-lg cursor-pointer transition-all duration-500`}
                style={{
                  opacity: someHovered ? (isHovered ? 1 : 0.4) : 1,
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={() => setHoveredImage(i)}
                onMouseLeave={() => setHoveredImage(null)}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                  style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
                />
                {/* Subtle dark gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Thin divider line */}
      <div className="mx-6 md:mx-12 h-px bg-white/10" />

      {/* How it works */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-medium text-white/30 uppercase tracking-widest mb-4">
            How it works
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-16"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
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
            ].map((item) => (
              <div key={item.step}>
                <span className="text-sm font-medium text-white/20 mb-4 block">
                  {item.step}
                </span>
                <div className="h-px bg-white/10 mb-6" />
                <h3 className="text-lg font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
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
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-5xl mx-auto md:flex md:items-start md:gap-16">
          <div className="md:flex-1 mb-8 md:mb-0">
            <p className="text-sm font-medium text-white/30 uppercase tracking-widest mb-4">
              Pricing
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Free during
              <br />
              early access
            </h2>
            <p className="text-base text-white/50 leading-relaxed max-w-sm">
              We&apos;re building BenchBuddy for the community. Get full access
              while we&apos;re in beta — no credit card required.
            </p>
          </div>
          <div className="md:w-[360px] rounded-xl border border-white/10 bg-white/5 p-8">
            <p className="text-3xl font-bold text-white">Free</p>
            <p className="mt-1 text-sm text-white/40">during early access</p>
            <ul className="mt-6 space-y-3 text-base text-white/70">
              {[
                '1 ticket package',
                'Unlimited games',
                'Unlimited sharing',
                'Transfer coordination',
                'Payment tracking',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-[#0F6F57] font-bold text-lg">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="mt-6 w-full h-11 rounded-lg bg-white text-[#1B1716] text-base font-medium flex items-center justify-center hover:bg-white/90 transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </section>

      {/* Thin divider line */}
      <div className="mx-6 md:mx-12 h-px bg-white/10" />

      {/* Feedback */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-5xl mx-auto md:flex md:items-center md:justify-between">
          <div className="mb-6 md:mb-0">
            <p className="text-sm font-medium text-white/30 uppercase tracking-widest mb-4">
              Feedback
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-3"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Help us improve
            </h2>
            <p className="text-base text-white/50 leading-relaxed max-w-md">
              We&apos;re in early access and building this for you. Got ideas, found
              a bug, or want to tell us what&apos;s working?
            </p>
          </div>
          <a
            href="mailto:feedback@benchbuddy.app"
            className="inline-flex h-11 items-center justify-center rounded-lg border-[1.5px] border-white/30 bg-transparent px-6 text-base font-medium text-white hover:bg-white/10 transition-colors"
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
