'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PackageInfo, MyGameClaim, Game } from '../types';
import { getTeamColors } from '../team-colors';
import { groupGamesByMonth, getOpponentAbbr, getOpponentColor, formatTime, formatShortDate } from '../utils';
import { GameCard } from './game-card';
import { CalendarPopover } from './calendar-popover';

interface Props {
  pkg: PackageInfo;
  claimerName: string;
  onSwitchToAvailable: () => void;
  onReservationCountChange: (count: number) => void;
}

export function MyGamesTab({ pkg, claimerName, onSwitchToAvailable, onReservationCountChange }: Props) {
  const [claims, setClaims] = useState<MyGameClaim[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { primary: teamPrimary, accent: teamAccent } = getTeamColors(pkg.team);

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
        setSelectedGameId(null);
      }
    } catch {
      // ignore
    }
  }

  function handleCopyLink() {
    const link = `benchbuddy.app/s/${pkg.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <p className="text-base font-normal text-[#2c2a2b] text-center">
            Browse available games and reserve the ones you want to attend.
          </p>
        </div>
        <button
          className="h-11 px-4 rounded-lg text-white border-none text-base font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
          style={{ backgroundColor: teamPrimary }}
          onClick={onSwitchToAvailable}
        >
          Browse games
        </button>
      </div>
    );
  }

  // Convert claims to Game objects
  const claimGames = claims.map((claim) => ({
    claim,
    game: {
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
    } as Game,
  }));

  // Next game
  const now = new Date();
  const nextGame = claimGames
    .filter((c) => new Date(c.game.date) > now)
    .sort((a, b) => new Date(a.game.date).getTime() - new Date(b.game.date).getTime())[0];

  const daysAway = nextGame
    ? Math.ceil((new Date(nextGame.game.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const nextGameDate = nextGame
    ? formatShortDate(nextGame.game.date)
    : null;

  const nextGameAbbr = nextGame ? getOpponentAbbr(nextGame.game.opponent) : '';
  const nextGameColor = nextGame ? getOpponentColor(nextGame.game.opponent) : '';

  // Group by month
  const grouped = groupGamesByMonth(claimGames.map((c) => c.game));

  // Selected game for drawer
  const selectedGame = selectedGameId ? claimGames.find((c) => c.game.id === selectedGameId) : null;

  // Holder initials
  const holderInitials = pkg.holderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-2 md:gap-6">
      {/* Welcome — desktop only */}
      <p className="hidden md:block text-2xl text-[#2c2a2b] mb-0 font-bold" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
        {claimerName || 'Margo'}, here are your games.
      </p>


      {/* Section 4: Game cards grouped by month */}
      {Array.from(grouped.entries()).map(([monthLabel, monthGames]) => (
        <div key={monthLabel}>
          {/* Month header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-[3px] h-4 rounded-sm" style={{ backgroundColor: teamAccent }} />
              <span className="text-xl font-semibold text-black">
                {monthLabel}
              </span>
            </div>
            <span className="text-sm font-medium text-[#8e8985] leading-5">
              &bull; {monthGames.length} game{monthGames.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Game cards */}
          <div className="flex flex-col gap-2">
            {monthGames.map((game) => {
              const claimData = claimGames.find((c) => c.game.id === game.id);
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  isReservedByMe={true}
                  isTakenByOthers={false}
                  seatCount={pkg.seatCount}
                  teamColor={teamPrimary}
                  holderLabel={`${pkg.holderName}'s Season Tickets`}
                  onReserve={() => {}}
                  onRelease={() => claimData && handleRelease(claimData.claim.id)}
                  onMobileTap={() => setSelectedGameId(game.id)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Browse other games — desktop */}
      <div className="hidden md:flex justify-end">
        <button
          className="h-11 px-6 rounded-lg text-white text-base font-medium border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity"
          style={{ backgroundColor: teamPrimary }}
          onClick={onSwitchToAvailable}
        >
          Browse other games
        </button>
      </div>

      {/* Browse other games — mobile sticky */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pt-3 pb-10 bg-[#fefefe] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          className="w-full h-12 rounded-lg text-white text-base font-semibold border-none cursor-pointer flex items-center justify-center active:opacity-90 transition-opacity"
          style={{ backgroundColor: teamPrimary }}
          onClick={onSwitchToAvailable}
        >
          Browse other games
        </button>
      </div>
      {/* Spacer for sticky button + footer coverage */}
      <div className="md:hidden h-32" />


      {/* Mobile/Desktop game detail drawer */}
      {selectedGame && (
        <CalendarPopover
          game={selectedGame.game}
          pkg={pkg}
          isReservedByMe={true}
          anchorRect={null}
          containerRect={null}
          onClose={() => setSelectedGameId(null)}
          onClaim={() => {}}
          onRelease={() => handleRelease(selectedGame.claim.id)}
        />
      )}
    </div>
  );
}
