// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState, useEffect } from 'react';

interface Claim {
  id: string;
  status: string;
  claimedAt: string;
  paymentStatus: string;
  transferStatus: string;
  game: {
    id: string;
    date: string;
    time: string | null;
    opponent: string;
    pricePerTicket: number | null;
    notes: string | null;
  };
  package: {
    team: string;
    section: string;
    row: string | null;
    seats: string;
    seatCount: number;
    season: string;
  };
  holder: {
    firstName: string;
    lastName: string;
  };
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    UNPAID: 'bg-yellow-100 text-yellow-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REQUESTED: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    WAIVED: 'bg-gray-100 text-gray-600',
    NOT_STARTED: 'bg-gray-100 text-gray-600',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

export default function MyGamesPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/claims/mine')
      .then((res) => (res.ok ? res.json() : { claims: [] }))
      .then((data) => {
        if (!cancelled) {
          setClaims(data.claims);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRelease(claimId: string) {
    if (
      !confirm(
        'Release this claim? The tickets will become available to others.'
      )
    ) {
      return;
    }

    setReleasingId(claimId);
    const res = await fetch(`/api/claims/${claimId}`, { method: 'DELETE' });

    if (res.ok) {
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to release claim');
    }
    setReleasingId(null);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-foreground/50">Loading your games...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">My Games</h1>

        {claims.length === 0 ? (
          <div className="rounded-lg border border-foreground/10 py-16 text-center">
            <p className="text-lg text-foreground/50">
              You haven&apos;t claimed any games yet.
            </p>
            <p className="mt-2 text-sm text-foreground/40">
              Ask a friend with season tickets for their BenchBuddy link!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const d = new Date(claim.game.date);
              const isPast = d < new Date();

              return (
                <div
                  key={claim.id}
                  className={`rounded-lg border border-foreground/10 p-4 ${isPast ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {claim.package.team} vs {claim.game.opponent}
                        </p>
                        {isPast && (
                          <span className="text-xs text-foreground/40">
                            Past
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/60">
                        {d.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {claim.game.time ? ` at ${claim.game.time}` : ''}
                      </p>
                      <p className="text-sm text-foreground/60">
                        Section {claim.package.section}
                        {claim.package.row
                          ? `, Row ${claim.package.row}`
                          : ''}{' '}
                        &middot; {claim.package.seatCount} seats &middot; From{' '}
                        {claim.holder.firstName} {claim.holder.lastName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-foreground/40">
                          Payment:
                        </span>
                        {statusBadge(claim.paymentStatus)}
                        <span className="text-xs text-foreground/40">
                          Transfer:
                        </span>
                        {statusBadge(claim.transferStatus)}
                        {claim.game.pricePerTicket !== null &&
                          Number(claim.game.pricePerTicket) > 0 && (
                            <span className="text-xs text-foreground/50">
                              ${Number(claim.game.pricePerTicket)}/ticket
                            </span>
                          )}
                      </div>
                    </div>
                    {!isPast && (
                      <button
                        onClick={() => handleRelease(claim.id)}
                        disabled={releasingId === claim.id}
                        className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {releasingId === claim.id ? 'Releasing...' : 'Release'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
