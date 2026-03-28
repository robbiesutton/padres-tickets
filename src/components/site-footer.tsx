'use client';

import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Row 1: Primary links */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-6">
          <Link href="/about" className="text-sm text-foreground/60 hover:text-foreground">
            About
          </Link>
          <Link href="/#how-it-works" className="text-sm text-foreground/60 hover:text-foreground">
            How It Works
          </Link>
          <Link href="/faq" className="text-sm text-foreground/60 hover:text-foreground">
            FAQ
          </Link>
          <Link href="/contact" className="text-sm text-foreground/60 hover:text-foreground">
            Contact Us
          </Link>
        </div>

        {/* Row 2: Legal links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
          <Link href="/terms" className="text-xs text-foreground/40 hover:text-foreground/60">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-xs text-foreground/40 hover:text-foreground/60">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="text-xs text-foreground/40 hover:text-foreground/60">
            Cookie Policy
          </Link>
          <Link href="/acceptable-use" className="text-xs text-foreground/40 hover:text-foreground/60">
            Acceptable Use
          </Link>
          <Link href="/do-not-sell" className="text-xs text-foreground/40 hover:text-foreground/60">
            Do Not Sell My Personal Information
          </Link>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('bb_cookie_consent');
                window.location.reload();
              }
            }}
            className="text-xs text-foreground/40 hover:text-foreground/60"
          >
            Cookie Preferences
          </button>
        </div>

        {/* Row 3: Bottom bar */}
        <div className="border-t border-foreground/10 pt-6">
          <p className="text-xs text-foreground/40 mb-2">
            &copy; {new Date().getFullYear()} BenchBuddy. All rights reserved.
          </p>
          <p className="text-xs text-foreground/30 leading-relaxed">
            BenchBuddy is an independent platform and is not affiliated with,
            endorsed by, or connected to any sports team, league, or ticketing
            provider. All team names, logos, and trademarks are the property of
            their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
