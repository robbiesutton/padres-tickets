'use client';

import type { Game, PackageInfo } from '../types';
import { groupGamesByMonth, isGameAvailable } from '../utils';
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
  const availableGames = games.filter(isGameAvailable);
  const grouped = groupGamesByMonth(availableGames);

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
              const isSelected = expandedGameId === game.id;

              return (
                <div key={game.id}>
                  <GameCard
                    game={game}
                    isSelected={isSelected}
                    isReservedByMe={false}
                    isTakenByOthers={false}
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
                        isReservedByMe={false}
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
