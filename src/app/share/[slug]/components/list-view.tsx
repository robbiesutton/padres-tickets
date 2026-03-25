'use client';

import type { Game, PackageInfo } from '../types';
import { groupGamesByMonth, isGameAvailable } from '../utils';
import { GameCard } from './game-card';

interface Props {
  games: Game[];
  pkg: PackageInfo;
  reservedGames: Map<string, string>; // gameId -> claimId
  cancelledGameIds: Set<string>;
  currentUserId: string | null;
  onReserved: (gameId: string, claimId: string) => void;
  onCancelled: (gameId: string) => void;
}

export function ListView({
  games,
  pkg,
  reservedGames,
  cancelledGameIds,
  currentUserId,
  onReserved,
  onCancelled,
}: Props) {
  const availableGames = games.filter(isGameAvailable);
  const grouped = groupGamesByMonth(availableGames);

  async function handleReserve(gameId: string) {
    try {
      const res = await fetch(`/api/share/${pkg.slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });
      if (res.ok) {
        const data = await res.json();
        onReserved(gameId, data.claim?.id || '');
      }
    } catch {
      // ignore
    }
  }

  async function handleRelease(gameId: string) {
    // Find the claim ID from the reservedGames map or the original game data
    const game = games.find((g) => g.id === gameId);
    const claimId = reservedGames.get(gameId) || game?.claim?.id;

    // Optimistically update the UI immediately
    onCancelled(gameId);

    // Then try the API call
    if (claimId) {
      try {
        await fetch(`/api/claims/${claimId}`, { method: 'DELETE' });
      } catch {
        // ignore — UI already updated
      }
    }
  }

  return (
    <div>
      {Array.from(grouped.entries()).map(([monthLabel, monthGames]) => (
        <div key={monthLabel} className="mb-[22px]">
          {/* Month header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-[3px] h-4 bg-accent rounded-sm" />
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
              const isCancelled = cancelledGameIds.has(game.id);
              const isReservedByMe = !isCancelled && (
                reservedGames.has(game.id) ||
                (game.claim?.claimerUserId === currentUserId && game.claim?.status !== 'RELEASED')
              );
              const isTakenByOthers = !isReservedByMe && !isCancelled && !!game.claim;

              return (
                <GameCard
                  key={game.id}
                  game={game}
                  isReservedByMe={!!isReservedByMe}
                  isTakenByOthers={isTakenByOthers}
                  seatCount={pkg.seatCount}
                  onReserve={() => handleReserve(game.id)}
                  onRelease={() => handleRelease(game.id)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
