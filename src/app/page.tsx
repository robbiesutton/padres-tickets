// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/primary-button';

export default function Home() {
  const router = useRouter();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [sharedLink, setSharedLink] = useState('');
  const [linkError, setLinkError] = useState('');

  function handleGoToLink() {
    setLinkError('');
    try {
      // Accept full URLs or just the slug
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
    <div className="flex flex-1 flex-col bg-[#fefefe]">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Share your season tickets effortlessly
        </h1>
        <p className="max-w-lg text-lg text-[#8e8985]">
          BenchBuddy makes it easy for season ticket holders to share games with
          friends and family. Set up once, share a link, let them claim.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <PrimaryButton href="/signup" className="px-8">
            I Have Season Tickets
          </PrimaryButton>
          <button
            onClick={() => setShowLinkInput(true)}
            className="rounded-lg border-[1.5px] border-black bg-transparent px-8 py-3 text-sm font-medium text-foreground hover:bg-[#f5f4f2] transition-colors"
          >
            I Was Shared a Link
          </button>
        </div>

        {showLinkInput && (
          <div className="w-full max-w-md space-y-3">
            <p className="text-sm text-[#8e8985]">
              Paste the link your friend shared with you:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={sharedLink}
                onChange={(e) => setSharedLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoToLink()}
                placeholder="e.g. benchbuddy.com/share/mark-rockies"
                className="flex-1 rounded-lg px-2.5 py-2 rounded-[7px] border border-[#eceae5] text-sm outline-none focus:border-[#1B2A4A]"
                autoFocus
              />
              <PrimaryButton onClick={handleGoToLink} className="px-5">
                Go
              </PrimaryButton>
            </div>
            {linkError && (
              <p className="text-sm text-[#DC2626]">{linkError}</p>
            )}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-[#f5f4f2] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold">How It Works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Set Up Your Package',
                desc: 'Select your team, enter your seat details, and your full season schedule loads automatically.',
              },
              {
                step: '2',
                title: 'Share Your Link',
                desc: 'Get a unique link for your tickets. Send it to friends and family via text, email, or any app.',
              },
              {
                step: '3',
                title: 'Friends Claim Games',
                desc: 'They browse available dates, claim the games they want, and you get notified to transfer tickets.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2c2a2b] text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-[#8e8985]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold">
            Everything You Need
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                title: 'Automatic Schedule Loading',
                desc: 'Select your MLB team and all home games load instantly. No manual entry.',
              },
              {
                title: 'Transfer Coordination',
                desc: 'Get step-by-step instructions for your ticketing platform. One-click to mark as transferred.',
              },
              {
                title: 'Payment Tracking',
                desc: 'Track who owes what. Share free or set per-ticket prices. No money flows through us.',
              },
              {
                title: 'Multi-Package Support',
                desc: 'Have seats for multiple teams or sections? Manage them all from one dashboard.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[#eceae5] bg-white p-6"
              >
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-[#8e8985]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#f5f4f2] px-6 py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold">Simple Pricing</h2>
          <div className="rounded-xl border border-[#eceae5] bg-white p-8">
            <p className="text-3xl font-bold">Free</p>
            <p className="mt-1 text-sm text-[#8e8985]">
              during early access
            </p>
            <ul className="mt-6 space-y-2 text-left text-sm">
              {[
                '1 ticket package',
                'Unlimited games',
                'Unlimited sharing',
                'Transfer coordination',
                'Payment tracking',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#0F6E56]">&#10003;</span> {item}
                </li>
              ))}
            </ul>
            <PrimaryButton href="/signup" className="mt-6 w-full">
              Get Started Free
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">FAQ</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Does BenchBuddy handle the actual ticket transfer?',
                a: 'No. BenchBuddy coordinates who gets which games and provides transfer instructions. You transfer tickets through your ticketing platform (Ticketmaster, AXS, etc.).',
              },
              {
                q: 'Does money flow through BenchBuddy?',
                a: 'No. Payment is handled directly between you and your friends via Venmo, Zelle, or however you prefer. BenchBuddy just tracks the status.',
              },
              {
                q: 'Which teams are supported?',
                a: 'All 30 MLB teams are supported at launch. NBA, NFL, NHL, and MLS coming soon.',
              },
              {
                q: 'Do my friends need an account?',
                a: 'They can browse available games without an account. A lightweight account (just email and name) is needed to claim.',
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-1 text-sm text-[#8e8985]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">
          Ready to share your tickets?
        </h2>
        <PrimaryButton href="/signup" className="px-8">
          Get Started Free
        </PrimaryButton>
      </section>
    </div>
  );
}
