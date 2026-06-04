'use client';

import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="bg-[#1B1716]">
      {/* Mobile footer (<768px) */}
      <div className="md:hidden px-5 pt-12 pb-8">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/benchbuddy-mark-white.svg"
            alt="BenchBuddy"
            className="w-7 h-7"
          />
          <span
            className="text-base font-bold text-white"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            BenchBuddy
          </span>
        </div>
        <p className="text-sm text-white/40 leading-relaxed mb-8 max-w-[280px]">
          Your seats. Your friends. Your price.
        </p>

        {/* PRODUCT + COMPANY columns */}
        <div className="flex gap-8 mb-10">
          <div className="flex flex-col gap-3">
            <p
              className="font-semibold uppercase"
              style={{
                fontSize: 11,
                letterSpacing: '0.06em',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Product
            </p>
            <Link
              href="/#how-it-works"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/faq"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              FAQ
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <p
              className="font-semibold uppercase"
              style={{
                fontSize: 11,
                letterSpacing: '0.06em',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Company
            </p>
            <Link
              href="/about"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Legal — single horizontal row */}
        <p
          className="leading-relaxed mb-6"
          style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)' }}
        >
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <span className="mx-2" aria-hidden>
            &middot;
          </span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span className="mx-2" aria-hidden>
            &middot;
          </span>
          <Link href="/cookies" className="hover:text-white transition-colors">
            Cookie Policy
          </Link>
        </p>

        {/* Divider */}
        <div className="h-px bg-white/10 my-4" />

        {/* Bottom rows */}
        <div className="flex flex-col gap-2">
          <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
            &copy; {new Date().getFullYear()} BenchBuddy. All rights reserved.
          </p>
          <p
            className="leading-relaxed"
            style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}
          >
            <Link
              href="/acceptable-use"
              className="hover:text-white/80 transition-colors"
            >
              Acceptable Use
            </Link>
            <span className="mx-2" aria-hidden>
              &middot;
            </span>
            <Link
              href="/do-not-sell"
              className="hover:text-white/80 transition-colors"
            >
              Do Not Sell My Info
            </Link>
            <span className="mx-2" aria-hidden>
              &middot;
            </span>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('bb_cookie_consent');
                  window.location.reload();
                }
              }}
              className="bg-transparent border-none p-0 cursor-pointer hover:text-white/80 transition-colors"
              style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}
            >
              Cookie Preferences
            </button>
          </p>
          <p
            className="leading-relaxed"
            style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}
          >
            Not affiliated with any sports team, league, or ticketing provider.
          </p>
        </div>
      </div>

      {/* Desktop / tablet footer (≥768px) */}
      <div className="hidden md:block w-full px-6 md:px-12 lg:px-16 xl:px-24 py-12 md:py-16">
        {/* Top: Brand + nav links */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 lg:gap-24 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/benchbuddy-mark-white.svg"
                alt="BenchBuddy"
                className="w-6 h-6"
              />
              <span
                className="text-base font-bold text-white"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                BenchBuddy
              </span>
            </div>
            <p className="text-sm text-white/40 max-w-[280px] leading-relaxed">
              Your seats. Your friends. Your price.
            </p>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 md:gap-x-16 lg:gap-x-20 gap-y-8">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                Product
              </p>
              <Link
                href="/#how-it-works"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/#pricing"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/faq"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                FAQ
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                Company
              </p>
              <Link
                href="/about"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                Legal
              </p>
              <Link
                href="/terms"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} BenchBuddy. All rights reserved.
            </p>
            <Link
              href="/acceptable-use"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Acceptable Use
            </Link>
            <Link
              href="/do-not-sell"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Do Not Sell My Info
            </Link>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('bb_cookie_consent');
                  window.location.reload();
                }
              }}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Cookie Preferences
            </button>
          </div>
          <p className="text-xs text-white/20 leading-relaxed md:text-right">
            Not affiliated with any sports team, league, or ticketing provider.
          </p>
        </div>
      </div>
    </footer>
  );
}
