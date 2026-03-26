'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import type { Game, PackageInfo, ViewMode, ActiveTab } from './types';
import {
  isGameAvailable,
  MONTH_NAMES,
  getGameMonthYear,
} from './utils';
import { ShareHeader } from './components/share-header';
import { SeatInfoBar } from './components/seat-info-bar';
import { Toolbar } from './components/toolbar';
import { ListView } from './components/list-view';
import { CalendarView } from './components/calendar-view';
import { MyGamesTab } from './components/my-games-tab';
import { ShareFooter } from './components/share-footer';
import { EmptyState } from './components/empty-state';
import { AlsoPlaysIn } from './components/also-plays-in';

interface Props {
  packageInfo: PackageInfo;
  games: Game[];
  opponents: string[];
}

function SharePageInner({ packageInfo, games, opponents }: Props) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('available');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [monthFilter, setMonthFilter] = useState('');
  const [opponentFilter, setOpponentFilter] = useState('');
  const [calendarStartIndex, setCalendarStartIndex] = useState(0);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [reservedGames, setReservedGames] = useState<Map<string, string>>(new Map()); // gameId -> claimId
  const [cancelledGameIds, setCancelledGameIds] = useState<Set<string>>(new Set());
  const [apiClaimCount, setApiClaimCount] = useState(0);
  const currentUserId = session?.user?.id || null;

  // Handle ?reserved= URL param from magic link redirect
  useEffect(() => {
    const reservedId = searchParams.get('reserved');
    if (reservedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReservedGames((prev) => new Map([...prev, [reservedId, '']]));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedGameId(reservedId);
      window.history.replaceState(null, '', window.location.pathname);
    }
    const reserveError = searchParams.get('reserveError');
    if (reserveError) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams]);

  // Fetch initial claim count
  useEffect(() => {
    fetch(`/api/share/${packageInfo.slug}/my-reservations`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.claims) setApiClaimCount(data.claims.length);
      })
      .catch(() => {});
  }, [packageInfo.slug]);

  // Count reserved games: API count + session claims - session cancellations
  const reservedCount = apiClaimCount + reservedGames.size - cancelledGameIds.size;

  // Derived set for components that only need game IDs
  const reservedGameIds = useMemo(() => new Set(reservedGames.keys()), [reservedGames]);

  // Filter games
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (monthFilter) {
        const monthIndex = parseInt(monthFilter) - 1;
        const { month } = getGameMonthYear(g);
        if (month !== monthIndex) return false;
      }
      if (opponentFilter && g.opponent !== opponentFilter) return false;
      return true;
    });
  }, [games, monthFilter, opponentFilter]);

  // Month options for filter
  const monthOptions = useMemo(() => {
    const monthSet = new Set<number>();
    games.forEach((g) => {
      const { month } = getGameMonthYear(g);
      monthSet.add(month);
    });
    return [...monthSet]
      .sort((a, b) => a - b)
      .map((m) => ({
        value: String(m + 1),
        label: MONTH_NAMES[m],
      }));
  }, [games]);

  function handleSelectGame(id: string) {
    setExpandedGameId(expandedGameId === id ? null : id);
  }

  function handleCalendarNav(direction: 'prev' | 'next') {
    setCalendarStartIndex((i) =>
      direction === 'prev' ? Math.max(0, i - 1) : i + 1
    );
    setExpandedGameId(null);
  }

  function handleJumpToMonth(monthIndex: number) {
    const allMonthSet = new Set<string>();
    const monthList: { month: number; year: number }[] = [];
    games.forEach((g) => {
      const { month, year } = getGameMonthYear(g);
      const key = `${year}-${month}`;
      if (!allMonthSet.has(key)) {
        allMonthSet.add(key);
        monthList.push({ month, year });
      }
    });
    monthList.sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));

    if (monthList.length > 0) {
      const filled: { month: number; year: number }[] = [];
      const start = monthList[0];
      const end = monthList[monthList.length - 1];
      const cur = { ...start };
      while (cur.year * 12 + cur.month <= end.year * 12 + end.month) {
        filled.push({ ...cur });
        cur.month++;
        if (cur.month > 11) {
          cur.month = 0;
          cur.year++;
        }
      }
      const idx = filled.findIndex((m) => m.month === monthIndex);
      if (idx >= 0) {
        setCalendarStartIndex(Math.min(idx, filled.length - 2));
      }
    }

    setExpandedGameId(null);
    setMonthFilter(String(monthIndex + 1));
  }

  function handleClearFilters() {
    setMonthFilter('');
    setOpponentFilter('');
    setCalendarStartIndex(0);
    setExpandedGameId(null);
  }

  function handleMonthFilterChange(value: string) {
    setMonthFilter(value);
    setExpandedGameId(null);
    if (value) {
      handleJumpToMonth(parseInt(value) - 1);
    }
  }

  function handleReserved(gameId: string, claimId: string) {
    setReservedGames((prev) => new Map([...prev, [gameId, claimId]]));
    setCancelledGameIds((prev) => {
      const next = new Set(prev);
      next.delete(gameId);
      return next;
    });
  }

  function handleCancelled(gameId: string) {
    setReservedGames((prev) => {
      const next = new Map(prev);
      next.delete(gameId);
      return next;
    });
    setCancelledGameIds((prev) => new Set([...prev, gameId]));
    setExpandedGameId(null);
  }

  const handleReservationCountChange = useCallback((count: number) => {
    setApiClaimCount(count);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#fefefe]">
      <ShareHeader
        holderName={packageInfo.holderName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reservedCount={reservedCount}
        pkg={packageInfo}
      />

      <div className="max-w-[880px] mx-auto w-full px-4 pt-4 pb-12 md:px-5 md:pt-6 md:pb-16 overflow-x-hidden flex-1">
        {activeTab === 'available' ? (
          <>
            <SeatInfoBar pkg={packageInfo} />
            <Toolbar
              viewMode={viewMode}
              onViewChange={(mode) => {
                setViewMode(mode);
                setExpandedGameId(null);
              }}
              opponents={opponents}
              opponentFilter={opponentFilter}
              onOpponentFilterChange={(v) => {
                setOpponentFilter(v);
                setExpandedGameId(null);
              }}
              monthFilter={monthFilter}
              onMonthFilterChange={handleMonthFilterChange}
              months={monthOptions}
            />

            <AlsoPlaysIn
              games={games}
              opponentFilter={opponentFilter}
              monthFilter={monthFilter}
              onJumpToMonth={handleJumpToMonth}
            />

            {viewMode === 'calendar' ? (
              <CalendarView
                games={filteredGames}
                allGames={games}
                pkg={packageInfo}
                calendarStartIndex={calendarStartIndex}
                onCalendarNav={handleCalendarNav}
                onJumpToMonth={handleJumpToMonth}
                expandedGameId={expandedGameId}
                onSelectGame={handleSelectGame}
                onCloseExpansion={() => setExpandedGameId(null)}
                reservedGameIds={reservedGameIds}
                currentUserId={currentUserId}
                onReserved={(gameId: string) => handleReserved(gameId, '')}
                onCancelled={handleCancelled}
                opponentFilter={opponentFilter}
                monthFilter={monthFilter}
                onClearFilters={handleClearFilters}
              />
            ) : (
              <>
                {filteredGames.length === 0 &&
                (opponentFilter || monthFilter) ? (
                  <EmptyState
                    games={games}
                    opponentFilter={opponentFilter}
                    monthFilter={monthFilter}
                    onJumpToMonth={handleJumpToMonth}
                    onClearFilters={handleClearFilters}
                  />
                ) : (
                  <div>
                    <ListView
                      games={filteredGames}
                      pkg={packageInfo}
                      reservedGames={reservedGames}
                      cancelledGameIds={cancelledGameIds}
                      currentUserId={currentUserId}
                      onReserved={handleReserved}
                      onCancelled={handleCancelled}
                    />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="pt-8 md:pt-18">
            <MyGamesTab
              pkg={packageInfo}
              claimerName={session?.user?.name?.split(' ')[0] || ''}
              onSwitchToAvailable={() => setActiveTab('available')}
              onReservationCountChange={handleReservationCountChange}
            />
          </div>
        )}
      </div>

      <ShareFooter team={packageInfo.team} />
    </div>
  );
}

export function SharePageClient(props: Props) {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted">Loading...</div>}>
      <SharePageInner {...props} />
    </Suspense>
  );
}
