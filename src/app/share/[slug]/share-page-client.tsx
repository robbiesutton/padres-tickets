'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import type { Game, PackageInfo, ViewMode, ActiveTab } from './types';
import {
  isGameAvailable,
  MONTH_NAMES,
  getGameMonthYear,
  getOpponentAbbr,
} from './utils';
import { getTeamColors } from './team-colors';
import { ShareHeader } from './components/share-header';
import { SeatInfoBar } from './components/seat-info-bar';
import { Toolbar } from './components/toolbar';
import { ListView } from './components/list-view';
import { CalendarView } from './components/calendar-view';
import { MyGamesTab } from './components/my-games-tab';
import { ShareFooter } from './components/share-footer';
import { EmptyState } from './components/empty-state';
import { AlsoPlaysIn } from './components/also-plays-in';
import { ScoreTicker } from '@/components/score-ticker';

import { createPortal } from 'react-dom';
import Image from 'next/image';

function MobileSeatInfoPill({ pkg }: { pkg: PackageInfo }) {
  const [open, setOpen] = useState(false);
  const { primary, accent } = getTeamColors(pkg.team);
  const abbr = getOpponentAbbr(pkg.team);
  const priceDisplay = pkg.defaultPricePerTicket ? `$${pkg.defaultPricePerTicket}` : null;

  return (
    <div className="md:hidden">
      {/* Pill trigger */}
      <div
        className="flex items-center gap-2.5 h-11 pl-2.5 pr-3 rounded-lg cursor-pointer active:opacity-90"
        style={{ border: `1px solid ${primary}`, backgroundColor: `${primary}33` }}
        onClick={() => setOpen(true)}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ backgroundColor: accent, color: primary }}
        >
          {abbr}
        </div>
        <span className="text-base font-medium text-[#2c2a2b] flex-1">
          Sec {pkg.section} &middot; Row {pkg.row} &middot; Seats {pkg.seats}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M6 9l6 6 6-6" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Drawer */}
      {open && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="relative">
              <button
                className="absolute top-3 right-2 w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
              <div className="px-4 pt-5 pb-6 flex flex-col gap-4">
                {/* Seat photo */}
                <div className="w-full h-[180px] relative overflow-hidden rounded-lg">
                  {pkg.seatPhotoUrl ? (
                    <Image
                      src={pkg.seatPhotoUrl}
                      alt="View from seat"
                      fill
                      className="object-cover"
                      sizes="100vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full relative" style={{ backgroundImage: 'linear-gradient(143deg, rgb(74,122,58) 0%, rgb(122,170,90) 50%, rgb(74,122,58) 100%)' }}>
                      <div className="absolute bottom-0 left-0 right-0 h-[35%]" style={{ backgroundImage: 'linear-gradient(167deg, rgb(196,149,90) 0%, rgb(212,165,106) 100%)' }} />
                      <div className="absolute bottom-[35%] left-[15%] w-[70%] h-[2px] bg-[#e8d8b8] rounded" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-[#2c2a2b]/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                    View from Section {pkg.section}
                  </div>
                </div>

                {/* Description */}
                {pkg.description && (
                  <p className="text-base font-normal text-black leading-relaxed pb-4 border-b border-[#f5f4f2]">
                    {pkg.description}
                  </p>
                )}

                {/* Details table */}
                <div className="flex flex-col gap-3 text-sm leading-6 pb-4 border-b border-[#f5f4f2]">
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-black">Seats</span>
                    <span className="font-bold text-black">Seats {pkg.seats}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-black">Level</span>
                    <span className="font-bold text-black">Field Level</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-black">Price per seat</span>
                    <span className="font-bold text-black">{priceDisplay ?? 'Price varies'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-black">Ticket delivery</span>
                    <span className="font-bold text-black">MLB Ballpark App</span>
                  </div>
                </div>

                {/* Perks */}
                {pkg.perks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pkg.perks.map((perk) => (
                      <span
                        key={perk}
                        className="inline-flex items-center justify-center text-xs font-medium text-[#8e8985] h-8 px-3 border border-[#8e8985]/75 rounded-full whitespace-nowrap"
                      >
                        {perk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

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

      {/* Mobile seat info pill */}
      <div className="md:hidden px-4 pt-4">
        <MobileSeatInfoPill pkg={packageInfo} />
      </div>

      <div className="max-w-[1024px] mx-auto w-full px-4 pt-4 pb-12 md:px-8 md:pt-14 md:pb-0 overflow-x-hidden flex-1">
        {activeTab === 'available' ? (
          <>
            {/* Welcome message */}
            <p className="hidden md:block text-2xl text-[#2c2a2b] mb-4 font-bold" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
              Welcome {session?.user?.name?.split(' ')[0] || 'Margo'}, select your games.
            </p>
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
          <div className="-mt-2 md:mt-0">
            <MyGamesTab
              pkg={packageInfo}
              claimerName={session?.user?.name?.split(' ')[0] || ''}
              onSwitchToAvailable={() => setActiveTab('available')}
              onReservationCountChange={handleReservationCountChange}
            />
          </div>
        )}
      </div>

      <div className="hidden md:block mt-12">
        <ScoreTicker />
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
