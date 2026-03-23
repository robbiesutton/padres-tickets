'use client';

import type { Game, PackageInfo } from '../types';
import { useCalendar } from '../hooks/use-calendar';
import { CalendarGrid } from './calendar-grid';
import { CalendarLegend } from './calendar-legend';
import { GameExpansionPanel } from './game-expansion-panel';
import { AlsoPlaysInBar } from './also-plays-in-bar';
import { SoldOutBar } from './sold-out-bar';
import { EmptyState } from './empty-state';
import { isGameAvailable } from '../utils';

interface Props {
  games: Game[]; // filtered games
  allGames: Game[]; // all games (for also-plays-in)
  pkg: PackageInfo;
  calendarStartIndex: number;
  onCalendarNav: (direction: 'prev' | 'next') => void;
  onJumpToMonth: (monthIndex: number) => void;
  expandedGameId: string | null;
  onSelectGame: (id: string) => void;
  onCloseExpansion: () => void;
  reservedGameIds: Set<string>;
  currentUserId: string | null;
  onReserved: (gameId: string) => void;
  onCancelled: (gameId: string) => void;
  opponentFilter: string;
  monthFilter: string;
  onClearFilters: () => void;
}

export function CalendarView({
  games,
  allGames,
  pkg,
  calendarStartIndex,
  onCalendarNav,
  onJumpToMonth,
  expandedGameId,
  onSelectGame,
  onCloseExpansion,
  reservedGameIds,
  currentUserId,
  onReserved,
  onCancelled,
  opponentFilter,
  monthFilter,
  onClearFilters,
}: Props) {
  const { grids, canGoBack, canGoForward, displayMonths } = useCalendar(
    allGames,
    calendarStartIndex
  );

  const filteredIds = new Set(games.map((g) => g.id));

  // Check if all visible+filtered games are taken
  const visibleFilteredGames = allGames.filter((g) => {
    const d = new Date(g.date);
    return (
      filteredIds.has(g.id) &&
      displayMonths.some((dm) => dm.month === d.getMonth() && dm.year === d.getFullYear())
    );
  });
  const allTaken =
    visibleFilteredGames.length > 0 &&
    visibleFilteredGames.every(
      (g) => !isGameAvailable(g) && !reservedGameIds.has(g.id)
    );

  // Empty state when filters produce zero results
  if (
    games.length === 0 &&
    (opponentFilter || monthFilter)
  ) {
    return (
      <div className="bg-card border border-border rounded-xl">
        <EmptyState
          games={allGames}
          opponentFilter={opponentFilter}
          monthFilter={monthFilter}
          onJumpToMonth={onJumpToMonth}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  const expandedGame = expandedGameId
    ? allGames.find((g) => g.id === expandedGameId)
    : null;

  const currentVisibleMonthIndices = displayMonths.map((m) => m.month);

  return (
    <div>
      {allTaken && <SoldOutBar />}

      <div className="bg-card border border-border rounded-xl p-6">
        {/* Also plays in bar */}
        <AlsoPlaysInBar
          games={allGames}
          opponentFilter={opponentFilter}
          onJumpToMonth={onJumpToMonth}
          currentVisibleMonths={currentVisibleMonthIndices}
        />

        {/* Calendar nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            className="w-7 h-7 rounded-full border border-border bg-card cursor-pointer flex items-center justify-center text-muted text-[13px] disabled:opacity-30 disabled:cursor-default"
            onClick={() => onCalendarNav('prev')}
            disabled={!canGoBack}
          >
            &lsaquo;
          </button>
          <div />
          <button
            className="w-7 h-7 rounded-full border border-border bg-card cursor-pointer flex items-center justify-center text-muted text-[13px] disabled:opacity-30 disabled:cursor-default"
            onClick={() => onCalendarNav('next')}
            disabled={!canGoForward}
          >
            &rsaquo;
          </button>
        </div>

        {/* Calendar grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {grids.map(({ month, cells }) => (
            <CalendarGrid
              key={`${month.year}-${month.month}`}
              month={month}
              cells={cells}
              filteredIds={filteredIds}
              expandedGameId={expandedGameId}
              reservedGameIds={reservedGameIds}
              currentUserId={currentUserId}
              onSelectGame={onSelectGame}
            />
          ))}
        </div>

        <CalendarLegend />
      </div>

      {/* Expansion panel below calendar */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: expandedGame ? '500px' : '0',
          opacity: expandedGame ? 1 : 0,
        }}
      >
        {expandedGame && (
          <GameExpansionPanel
            game={expandedGame}
            pkg={pkg}
            isReservedByMe={
              reservedGameIds.has(expandedGame.id) ||
              (expandedGame.claim?.claimerUserId === currentUserId &&
                expandedGame.claim?.status !== 'RELEASED')
            }
            onClose={onCloseExpansion}
            onReserved={onReserved}
            onCancelled={onCancelled}
          />
        )}
      </div>
    </div>
  );
}
