'use client';

import { useRef, useState, useCallback } from 'react';
import type { Game, PackageInfo } from '../types';
import { useCalendar } from '../hooks/use-calendar';
import { CalendarGrid } from './calendar-grid';
import { CalendarLegend } from './calendar-legend';
import { CalendarPopover } from './calendar-popover';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

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

  const isReservedByMe = expandedGame
    ? reservedGameIds.has(expandedGame.id) ||
      (expandedGame.claim?.claimerUserId === currentUserId &&
        expandedGame.claim?.status !== 'RELEASED')
    : false;

  function handleSelectGame(id: string, cellRect: DOMRect) {
    if (expandedGameId === id) {
      onCloseExpansion();
      setAnchorRect(null);
    } else {
      onSelectGame(id);
      setAnchorRect(cellRect);
    }
  }

  function handleClose() {
    onCloseExpansion();
    setAnchorRect(null);
  }

  async function handleClaim() {
    if (!expandedGame) return;
    // Optimistically update immediately
    onReserved(expandedGame.id);
    try {
      await fetch(`/api/share/${pkg.slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: expandedGame.id }),
      });
    } catch {
      // ignore — UI already updated
    }
  }

  async function handleRelease() {
    if (!expandedGame) return;
    onCancelled(expandedGame.id);
    handleClose();
    const claimId = expandedGame.claim?.id;
    if (claimId) {
      try {
        await fetch(`/api/claims/${claimId}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
    }
  }

  return (
    <div>
      {allTaken && <SoldOutBar />}

      <div ref={containerRef} className="bg-card md:border md:border-border md:rounded-xl px-4 py-6 md:px-10 md:py-8 relative">
        {/* Side arrows */}
        <button
          className="absolute top-2 left-0 md:top-4 md:left-4 w-11 h-11 md:w-8 md:h-8 rounded-full border border-[#8e8985] bg-white cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-default hover:bg-[#f5f4f2] transition-colors z-10"
          onClick={() => onCalendarNav('prev')}
          disabled={!canGoBack}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="absolute top-2 right-0 md:top-4 md:right-4 w-11 h-11 md:w-8 md:h-8 rounded-full border border-[#8e8985] bg-white cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-default hover:bg-[#f5f4f2] transition-colors z-10"
          onClick={() => onCalendarNav('next')}
          disabled={!canGoForward}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Calendar grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grids.map(({ month, cells }, i) => (
            <CalendarGrid
              key={`${month.year}-${month.month}`}
              month={month}
              cells={cells}
              filteredIds={filteredIds}
              expandedGameId={expandedGameId}
              reservedGameIds={reservedGameIds}
              currentUserId={currentUserId}
              onSelectGame={handleSelectGame}
              className={i > 0 ? 'hidden md:block' : ''}
            />
          ))}
        </div>

        <CalendarLegend />

        {/* Popover */}
        {expandedGame && (
          <CalendarPopover
            game={expandedGame}
            pkg={pkg}
            isReservedByMe={!!isReservedByMe}
            anchorRect={anchorRect}
            containerRect={containerRef.current?.getBoundingClientRect() ?? null}
            onClose={handleClose}
            onClaim={handleClaim}
            onRelease={handleRelease}
          />
        )}
      </div>
    </div>
  );
}
