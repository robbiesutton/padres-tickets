'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PackageInfo, MyGameClaim, Game } from '../types';
import { GameCard } from './game-card';

interface Props {
  pkg: PackageInfo;
  onSwitchToAvailable: () => void;
  onReservationCountChange: (count: number) => void;
}

export function MyGamesTab({ pkg, onSwitchToAvailable, onReservationCountChange }: Props) {
  const [claims, setClaims] = useState<MyGameClaim[] | null>(null);
  const [loading, setLoading] = useState(false);

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
    fetchClaims();
  }, [fetchClaims]);

  async function handleRelease(claimId: string) {
    try {
      const res = await fetch(`/api/claims/${claimId}`, { method: 'DELETE' });
      if (res.ok) {
        setClaims((prev) => prev?.filter((c) => c.id !== claimId) || null);
        onReservationCountChange((claims?.length ?? 1) - 1);
      }
    } catch {
      // ignore
    }
  }

  // Loading
  if (loading && !claims) {
    return (
      <div className="py-12 text-center text-muted">
        Loading your reservations...
      </div>
    );
  }

  // Empty state
  if (!claims || claims.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 md:gap-8 md:py-16">
        <div className="flex flex-col items-center gap-2">
          <p className="text-base font-medium text-black text-center">
            No games reserved yet
          </p>
          <p className="text-sm font-normal text-[#2c2a2b] text-center">
            Browse available games and reserve the ones you want to attend.
          </p>
        </div>
        <button
          className="h-10 px-4 rounded-lg bg-[#2c2a2b] text-white border-none text-base font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
          onClick={onSwitchToAvailable}
        >
          Browse games
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {claims.map((claim) => {
        // Convert claim to Game shape for GameCard
        const game: Game = {
          id: claim.gameId,
          date: claim.game.date,
          time: claim.game.time,
          opponent: claim.game.opponent,
          opponentLogo: null,
          status: 'CLAIMED',
          pricePerTicket: claim.game.pricePerTicket,
          notes: null,
          claim: {
            id: claim.id,
            claimerUserId: '',
            status: claim.status,
          },
        };

        return (
          <GameCard
            key={claim.id}
            game={game}
            isReservedByMe={true}
            isTakenByOthers={false}
            seatCount={pkg.seatCount}
            onReserve={() => {}}
            onRelease={() => handleRelease(claim.id)}
          />
        );
      })}
    </div>
  );
}
