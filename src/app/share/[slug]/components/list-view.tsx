'use client';

import { useState } from 'react';
import type { Game, PackageInfo } from '../types';
import { groupGamesByMonth, isGameAvailable } from '../utils';
import { getTeamColors } from '../team-colors';
import { GameCard } from './game-card';
import { CalendarPopover } from './calendar-popover';

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
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const availableGames = games.filter(isGameAvailable);
  const grouped = groupGamesByMonth(availableGames);
  const { primary: teamPrimary } = getTeamColors(pkg.team);
  const selectedGame = selectedGameId ? availableGames.find(g => g.id === selectedGameId) : null;

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
        <div key={monthLabel} className="mb-6">
          {/* Month header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-[3px] h-4 rounded-sm" style={{ backgroundColor: getTeamColors(pkg.team).accent }} />
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
                  teamColor={teamPrimary}
                  onReserve={() => handleReserve(game.id)}
                  onRelease={() => handleRelease(game.id)}
                  onMobileTap={() => setSelectedGameId(game.id)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Mobile game detail drawer */}
      {selectedGame && (
        <CalendarPopover
          game={selectedGame}
          pkg={pkg}
          isReservedByMe={
            !cancelledGameIds.has(selectedGame.id) && (
              reservedGames.has(selectedGame.id) ||
              (selectedGame.claim?.claimerUserId === currentUserId && selectedGame.claim?.status !== 'RELEASED')
            )
          }
          anchorRect={null}
          containerRect={null}
          onClose={() => setSelectedGameId(null)}
          onClaim={async () => {
            await handleReserve(selectedGame.id);
            setSelectedGameId(null);
          }}
          onRelease={async () => {
            await handleRelease(selectedGame.id);
            setSelectedGameId(null);
          }}
        />
      )}
    </div>
  );
}
