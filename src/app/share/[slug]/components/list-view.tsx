'use client';

import type { Game, PackageInfo } from '../types';
import { groupGamesByMonth, isGameAvailable, isGameClaimed } from '../utils';
import { GameCard } from './game-card';
import { GameExpansionPanel } from './game-expansion-panel';

interface Props {
  games: Game[];
  pkg: PackageInfo;
  expandedGameId: string | null;
  reservedGameIds: Set<string>;
  currentUserId: string | null;
  onSelectGame: (id: string) => void;
  onCloseExpansion: () => void;
  onReserved: (gameId: string) => void;
  onCancelled: (gameId: string) => void;
}

export function ListView({
  games,
  pkg,
  expandedGameId,
  reservedGameIds,
  currentUserId,
  onSelectGame,
  onCloseExpansion,
  onReserved,
  onCancelled,
}: Props) {
  const grouped = groupGamesByMonth(games);

  return (
    <div>
      {Array.from(grouped.entries()).map(([monthLabel, monthGames]) => (
        <div key={monthLabel} className="mb-[22px]">
          {/* Month header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[3px] h-4 bg-accent rounded-sm" />
            <span className="text-base font-semibold text-foreground">
              {monthLabel}
            </span>
            <span className="text-sm text-muted">
              {monthGames.length} game{monthGames.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Game cards */}
          <div className="flex flex-col gap-1.5">
            {monthGames.map((game) => {
              const isReservedByMe =
                reservedGameIds.has(game.id) ||
                (game.claim?.claimerUserId === currentUserId &&
                  game.claim?.status !== 'RELEASED');
              const isTakenByOthers =
                !isReservedByMe &&
                (isGameClaimed(game) ||
                  game.status === 'GOING_MYSELF' ||
                  game.status === 'SOLD_ELSEWHERE' ||
                  game.status === 'UNAVAILABLE');
              const isSelected = expandedGameId === game.id;

              return (
                <div key={game.id}>
                  <GameCard
                    game={game}
                    isSelected={isSelected}
                    isReservedByMe={isReservedByMe}
                    isTakenByOthers={isTakenByOthers}
                    seatCount={pkg.seatCount}
                    onClick={() =>
                      onSelectGame(isSelected ? '' : game.id)
                    }
                  />
                  {/* Expansion panel */}
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isSelected ? '500px' : '0',
                      opacity: isSelected ? 1 : 0,
                    }}
                  >
                    {isSelected && (
                      <GameExpansionPanel
                        game={game}
                        pkg={pkg}
                        isReservedByMe={isReservedByMe}
                        onClose={onCloseExpansion}
                        onReserved={onReserved}
                        onCancelled={onCancelled}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
