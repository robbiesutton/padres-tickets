// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState, useEffect, use } from 'react';

interface PackageInfo {
  id: string;
  team: string;
  section: string;
  row: string | null;
  seatCount: number;
  season: string;
  shareLinkSlug: string;
}

export default function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/packages/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setPkg(data.package);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!pkg) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-foreground/50">Loading...</p>
      </div>
    );
  }

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/${pkg.shareLinkSlug}`
      : `/share/${pkg.shareLinkSlug}`;

  const shareTitle = `Check out my ${pkg.team} tickets on BenchBuddy`;
  const shareText = `I'm sharing my ${pkg.team} season tickets. Claim the games you want!`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed — fall back to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }

  function handleEmailShare() {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Share Your Tickets</h1>
        <div className="rounded-lg bg-foreground/5 p-4 text-sm">
          <p className="font-medium">{pkg.team}</p>
          <p className="text-foreground/60">
            {pkg.season} &middot; Section {pkg.section}
            {pkg.row ? `, Row ${pkg.row}` : ''} &middot; {pkg.seatCount} seats
          </p>
        </div>

        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-sm font-medium">Your share link</p>
          <p className="mt-1 break-all font-mono text-sm text-brand-600">
            {shareUrl}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopy}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={handleNativeShare}
            className="rounded-lg border border-foreground/20 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5"
          >
            Share via Text / App
          </button>

          <button
            onClick={handleEmailShare}
            className="rounded-lg border border-foreground/20 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5"
          >
            Share via Email
          </button>
        </div>

        <a
          href={`/share/${pkg.shareLinkSlug}`}
          target="_blank"
          className="block text-center text-sm text-brand-600 hover:underline"
        >
          Preview what your friends will see
        </a>
      </div>
    </div>
  );
}
