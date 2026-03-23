'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { PackageInfo, MyGameClaim } from '../types';
import { MagicLinkLogin } from './magic-link-login';
import {
  getOpponentAbbr,
  getOpponentColor,
  formatShortDate,
  formatTime,
} from '../utils';

interface Props {
  pkg: PackageInfo;
  onSwitchToAvailable: () => void;
  onReservationCountChange: (count: number) => void;
}

function CheckGreen({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="#0F6E56"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MyGamesTab({ pkg, onSwitchToAvailable, onReservationCountChange }: Props) {
  const { data: session } = useSession();
  const [claims, setClaims] = useState<MyGameClaim[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${pkg.slug}/my-reservations`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims);
        onReservationCountChange(data.claims.length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [pkg.slug, onReservationCountChange]);

  useEffect(() => {
    if (session?.user) {
      fetchClaims();
    }
  }, [session, fetchClaims]);

  async function handleCancel(claimId: string) {
    setCancellingId(claimId);
    try {
      const res = await fetch(`/api/claims/${claimId}`, { method: 'DELETE' });
      if (res.ok) {
        setClaims((prev) => prev?.filter((c) => c.id !== claimId) || null);
        onReservationCountChange((claims?.length ?? 1) - 1);
      }
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  }

  // Not authenticated — show magic link login
  if (!session?.user) {
    return <MagicLinkLogin />;
  }

  // Loading
  if (loading && !claims) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center text-muted">
        Loading your reservations...
      </div>
    );
  }

  // Empty state
  if (!claims || claims.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-10 text-center">
          <div className="text-[15px] font-medium text-foreground mb-1.5">
            No games reserved yet
          </div>
          <div className="text-xs text-muted mb-4">
            Browse available games and reserve the ones you want to attend.
          </div>
          <button
            className="px-5 py-2 rounded-lg bg-navy text-white border-none text-base font-medium cursor-pointer"
            onClick={onSwitchToAvailable}
          >
            Browse games
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = claims.reduce(
    (sum, c) => sum + (c.game.pricePerTicket ?? 0) * pkg.seatCount,
    0
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Summary */}
      <div className="p-6 bg-background flex justify-between text-base text-muted border-b border-border">
        <span>
          <strong className="text-foreground font-semibold">
            {claims.length} game{claims.length !== 1 ? 's' : ''}
          </strong>{' '}
          reserved
        </span>
        <span>
          Total:{' '}
          <strong className="text-foreground font-semibold">${totalPrice}</strong>
        </span>
      </div>

      {/* Claim list */}
      {claims.map((claim) => {
        const abbr = getOpponentAbbr(claim.game.opponent);
        const color = getOpponentColor(claim.game.opponent);
        const { dow, day, month } = formatShortDate(claim.game.date);

        return (
          <div
            key={claim.id}
            className="flex items-center gap-2.5 p-6 border-b border-border last:border-b-0 transition-colors hover:bg-[rgba(0,0,0,0.01)]"
          >
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {abbr}
            </div>
            <div className="flex-1">
              <div className="text-base font-medium text-foreground">
                vs {claim.game.opponent}
              </div>
              <div className="text-[11px] text-muted mt-px">
                {dow}, {month} {day} &middot; {formatTime(claim.game.time)}
              </div>
            </div>
            <div className="text-[11px] text-green font-medium flex items-center gap-[3px] shrink-0">
              <CheckGreen size={12} />
              Reserved
            </div>
            <button
              className="px-3 py-[5px] rounded-md bg-none border border-border text-muted text-[11px] cursor-pointer font-medium transition-all hover:border-muted hover:text-foreground shrink-0 disabled:opacity-50"
              onClick={() => handleCancel(claim.id)}
              disabled={cancellingId === claim.id}
            >
              {cancellingId === claim.id ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        );
      })}

      {/* Sign out */}
      <div className="mt-4 text-center">
        <button
          onClick={() => signOut({ redirect: false }).then(() => window.location.reload())}
          className="text-xs text-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
