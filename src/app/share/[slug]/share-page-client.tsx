'use client';

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  Suspense,
  startTransition,
} from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
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
import { EmptyState } from './components/empty-state';
import { AlsoPlaysIn } from './components/also-plays-in';
import { ScoreTicker } from '@/components/score-ticker';
import { Bone } from '@/components/skeleton';

import { createPortal } from 'react-dom';
import Image from 'next/image';

function MobileSeatInfoPill({
  pkg,
  activeTab,
}: {
  pkg: PackageInfo;
  activeTab: ActiveTab;
}) {
  const [open, setOpen] = useState(false);
  const { primary, accent } = getTeamColors(pkg.team);
  const abbr = getOpponentAbbr(pkg.team);

  const firstName = pkg.holderName?.trim().split(/\s+/)[0] || '';
  const pillLabel = firstName ? `${firstName}'s seats` : 'These seats';
  const payHeading = firstName ? `How to pay ${firstName}` : 'How to pay';
  const claimStep = firstName
    ? `Claim it, then pay ${firstName} directly.`
    : 'Claim it, then pay the holder directly.';

  const hasPhoto = !!pkg.seatPhotoUrl;
  const hasPayment = !!(pkg.venmoHandle?.trim() || pkg.zelleInfo?.trim());
  const isCompletelyEmpty =
    !pkg.seatPhotoUrl && !pkg.description && !pkg.venmoHandle && !pkg.zelleInfo;
  const sectionDisplay = `${pkg.section} · Field Level`;

  const FTU_KEY = `bb-claimer-ftu-${pkg.slug}-seen`;
  const [hasSeenFTU, setHasSeenFTU] = useState(true);
  useEffect(() => {
    if (activeTab !== 'available') {
      startTransition(() => setOpen(false));
      return;
    }
    if (window.matchMedia('(min-width: 768px)').matches) return;
    try {
      const seen = !!window.localStorage.getItem(FTU_KEY);
      startTransition(() => {
        setHasSeenFTU(seen);
        if (!seen) {
          window.localStorage.setItem(FTU_KEY, '1');
          setOpen(true);
        }
      });
    } catch {
      startTransition(() => {
        setHasSeenFTU(false);
        setOpen(true);
      });
    }
  }, [FTU_KEY, activeTab]);

  function dismissFTU() {
    try {
      window.localStorage.setItem(FTU_KEY, '1');
    } catch {}
    setHasSeenFTU(true);
    setOpen(false);
  }

  const isFTU = !hasSeenFTU;

  return (
    <div className="md:hidden">
      {/* Pill trigger */}
      <div
        className="flex items-center gap-2.5 h-11 pl-2.5 pr-3 rounded-lg cursor-pointer active:opacity-90"
        style={{
          border: `1px solid ${primary}`,
          backgroundColor: `${primary}33`,
        }}
        onClick={() => setOpen(true)}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ backgroundColor: accent, color: primary }}
        >
          {abbr}
        </div>
        <span className="text-base font-medium text-[#1B1716] flex-1">
          {pillLabel}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="#8e8985"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Drawer */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.08)] animate-slide-up max-h-[85vh] flex flex-col overflow-hidden">
            {/* Chrome strip — close X only */}
            <div className="relative h-[63px] shrink-0">
              <button
                className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
                onClick={() => setOpen(false)}
                title="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 pb-5 flex flex-col gap-5">
                {isCompletelyEmpty ? (
                  /* Empty fallback (rule 9) */
                  <div className="text-center py-6 px-2">
                    <p className="text-[15px] text-[#1B1716] leading-relaxed">
                      {firstName ? `${firstName} is still setting things up.` : 'The holder is still setting things up.'} Check back soon.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Seat photo (only if uploaded) */}
                    {hasPhoto && (
                      <div className="w-full aspect-[3/2] relative overflow-hidden rounded-xl">
                        <Image
                          src={pkg.seatPhotoUrl as string}
                          alt="View from seat"
                          fill
                          className="object-cover"
                          sizes="100vw"
                          unoptimized
                        />
                        <div className="absolute bottom-3 left-3 bg-black/65 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                          View from Section {pkg.section}
                        </div>
                      </div>
                    )}

                    {/* How it works */}
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">How it works</p>
                      <div className="bg-[#F5F4F2] rounded-[10px] px-4 py-3.5 flex flex-col gap-2.5">
                        {[
                          'Pick a game from the schedule.',
                          claimStep,
                          'Tickets arrive before game day.',
                        ].map((step, i) => (
                          <div key={i} className="flex gap-3 items-start text-[14px] leading-[1.4] text-[#1B1716]">
                            <div className="w-5 h-5 rounded-full bg-[#810100] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                              {i + 1}
                            </div>
                            <div>{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    {pkg.description && (
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">Description</p>
                        <p className="text-[14px] leading-[1.5] text-[#1B1716]">{pkg.description}</p>
                      </div>
                    )}

                    {/* Your seats */}
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">Your seats</p>
                      <div className="flex flex-col text-[14px]">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[#8e8985]">Section</span>
                          <span className="font-bold text-[#1B1716]">{sectionDisplay}</span>
                        </div>
                        {pkg.row && (
                          <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                            <span className="text-[#8e8985]">Row</span>
                            <span className="font-bold text-[#1B1716]">Row {pkg.row}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                          <span className="text-[#8e8985]">Seats</span>
                          <span className="font-bold text-[#1B1716]">Seats {pkg.seats}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                          <span className="text-[#8e8985]">Ticket delivery</span>
                          <span className="font-bold text-[#1B1716]">MLB Ballpark App</span>
                        </div>
                      </div>
                    </div>

                    {/* How to pay */}
                    {hasPayment && (
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">{payHeading}</p>
                        <div className="flex flex-col text-[14px]">
                          {pkg.venmoHandle?.trim() && (
                            <div className="flex items-center justify-between py-2">
                              <span className="text-[#8e8985]">Venmo</span>
                              <span className="font-bold text-[#1B1716]">{pkg.venmoHandle}</span>
                            </div>
                          )}
                          {pkg.zelleInfo?.trim() && (
                            <div className={`flex items-center justify-between py-2 ${pkg.venmoHandle?.trim() ? 'border-t border-[#E5E1DD]' : ''}`}>
                              <span className="text-[#8e8985]">Zelle</span>
                              <span className="font-bold text-[#1B1716]">{pkg.zelleInfo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sticky CTA footer */}
            <div className="shrink-0 px-5 pb-5 bg-white">
              <button
                onClick={dismissFTU}
                className="w-full h-[52px] bg-[#2C2A2B] text-white border-none rounded-[10px] text-base font-semibold cursor-pointer active:opacity-90"
              >
                Got it, view games
              </button>
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

function SharePageInner({
  packageInfo,
  games: initialGames,
  opponents,
}: Props) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  // Fire share_link_opened once on mount — PostHog auto-captures UTMs and referrer
  useEffect(() => {
    ph?.capture('share_link_opened', {
      slug: packageInfo.slug,
      gameCount: initialGames.length,
      holderName: packageInfo.holderName,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    searchParams.get('tab') === 'my-games' ? 'my-games' : 'available'
  );
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [monthFilter, setMonthFilter] = useState<string[]>([]);
  const [opponentFilter, setOpponentFilter] = useState<string[]>([]);
  const [calendarStartIndex, setCalendarStartIndex] = useState(0);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [reservedGames, setReservedGames] = useState<Map<string, string>>(
    new Map()
  ); // gameId -> claimId
  const [cancelledGameIds, setCancelledGameIds] = useState<Set<string>>(
    new Set()
  );
  const [claimCount, setClaimCount] = useState(0);
  const currentUserId = session?.user?.id || null;

  // Seed reservedGames from SSR data when session resolves
  useEffect(() => {
    if (!currentUserId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReservedGames((prev) => {
      const seeded = new Map(prev);
      let changed = false;
      for (const game of games) {
        if (
          game.claim?.claimerUserId === currentUserId &&
          game.claim?.status !== 'RELEASED' &&
          !cancelledGameIds.has(game.id) &&
          !seeded.has(game.id)
        ) {
          seeded.set(game.id, game.claim.id);
          changed = true;
        }
      }
      return changed ? seeded : prev;
    });
  }, [currentUserId, games, cancelledGameIds]);

  // Refresh games from server to get fresh statuses and claim data
  const refreshGames = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/share/${packageInfo.slug}/games?showAll=true`
      );
      if (!res.ok) return;
      const data = await res.json();
      setGames(data.games);
      setCancelledGameIds(new Set()); // server is now source of truth
      if (currentUserId) {
        const fresh = new Map<string, string>();
        for (const g of data.games) {
          if (
            g.claim?.claimerUserId === currentUserId &&
            g.claim?.status !== 'RELEASED'
          ) {
            fresh.set(g.id, g.claim.id);
          }
        }
        setReservedGames(fresh);
      }
    } catch {
      /* ignore */
    }
  }, [packageInfo.slug, currentUserId]);

  // Dev affordance: ?ftu=reset clears the FTU localStorage key and reloads,
  // letting designers re-trigger the first-time experience without DevTools.
  useEffect(() => {
    if (searchParams.get('ftu') !== 'reset') return;
    try {
      window.localStorage.removeItem(`bb-claimer-ftu-${packageInfo.slug}-seen`);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.delete('ftu');
    window.history.replaceState(null, '', url.pathname + url.search);
    window.location.reload();
  }, [searchParams, packageInfo.slug]);

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

  // Register visit so claimer gets linked to this package
  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/share/${packageInfo.slug}/visit`, { method: 'POST' }).catch(
      () => {}
    );
  }, [currentUserId, packageInfo.slug]);

  // Fetch initial claim count
  useEffect(() => {
    fetch(`/api/share/${packageInfo.slug}/my-reservations`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.claims) setClaimCount(data.claims.length);
      })
      .catch(() => {});
  }, [packageInfo.slug]);

  const reservedCount = claimCount;

  // Derived set for components that only need game IDs
  const reservedGameIds = useMemo(
    () => new Set(reservedGames.keys()),
    [reservedGames]
  );

  // Filter games
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (monthFilter.length > 0) {
        const { month } = getGameMonthYear(g);
        if (!monthFilter.some((mf) => parseInt(mf) - 1 === month)) return false;
      }
      if (opponentFilter.length > 0 && !opponentFilter.includes(g.opponent))
        return false;
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
    setMonthFilter([String(monthIndex + 1)]);
  }

  function handleClearFilters() {
    setMonthFilter([]);
    setOpponentFilter([]);
    setCalendarStartIndex(0);
    setExpandedGameId(null);
  }

  function handleMonthFilterChange(value: string[]) {
    setMonthFilter(value);
    setExpandedGameId(null);
    if (value.length === 1) {
      handleJumpToMonth(parseInt(value[0]) - 1);
    }
  }

  function handleReserved(gameId: string, claimId: string) {
    setReservedGames((prev) => new Map([...prev, [gameId, claimId]]));
    setCancelledGameIds((prev) => {
      const next = new Set(prev);
      next.delete(gameId);
      return next;
    });
    setClaimCount((prev) => prev + 1);
  }

  function handleCancelled(gameId: string) {
    setReservedGames((prev) => {
      const next = new Map(prev);
      next.delete(gameId);
      return next;
    });
    setCancelledGameIds((prev) => new Set([...prev, gameId]));
    setExpandedGameId(null);
    setClaimCount((prev) => Math.max(0, prev - 1));
  }

  const handleReservationCountChange = useCallback((count: number) => {
    setClaimCount(count);
  }, []);

  const holderFirstName = packageInfo.holderName?.trim().split(/\s+/)[0] || '';

  return (
    <div className="flex flex-col min-h-screen bg-[#fefefe]">
      <ShareHeader
        holderName={packageInfo.holderName}
        activeTab={activeTab}
        onTabChange={(tab: ActiveTab) => {
          setActiveTab(tab);
          if (tab === 'available') refreshGames();
        }}
        reservedCount={reservedCount}
        pkg={packageInfo}
      />

      {/* Mobile seat info pill */}
      <div className="md:hidden px-4 pt-4 pb-0">
        <MobileSeatInfoPill pkg={packageInfo} activeTab={activeTab} />
      </div>

      <div className="max-w-[1024px] mx-auto w-full px-4 pt-4 pb-6 md:px-10 md:pt-8 md:pb-10 overflow-x-hidden flex-1">
        {activeTab === 'available' ? (
          <>
            {/* Page heading — uses Holder's first name per voice guide */}
            <div className="hidden md:block mb-8">
              <h1
                className="text-2xl font-bold leading-tight text-[#2c2a2b]"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {holderFirstName ? (
                  <>{holderFirstName}&apos;s season</>
                ) : (
                  'Your shared season'
                )}
              </h1>
              <p className="mt-2 text-base text-[#8e8985]">
                {holderFirstName
                  ? `Claim the games you want. Pay ${holderFirstName} directly after, and ${holderFirstName} sends the tickets before game day.`
                  : 'Claim the games you want.'}
              </p>
            </div>
            {holderFirstName && (
              <p className="md:hidden text-[14px] leading-[1.5] text-[#8e8985] mb-4 text-balance">
                {`Pay ${holderFirstName} directly. Tickets transfer before game day.`}
              </p>
            )}
            <Toolbar
              viewMode={viewMode}
              onViewChange={(mode) => {
                setViewMode(mode);
                setExpandedGameId(null);
              }}
              opponents={opponents}
              opponentFilter={opponentFilter}
              onOpponentFilterChange={(v: string[]) => {
                setOpponentFilter(v);
                setExpandedGameId(null);
              }}
              monthFilter={monthFilter}
              onMonthFilterChange={handleMonthFilterChange}
              months={monthOptions}
              teamPrimary={getTeamColors(packageInfo.team).primary}
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
                (opponentFilter.length > 0 || monthFilter.length > 0) ? (
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
          <div>
            <MyGamesTab
              pkg={packageInfo}
              claimerName={session?.user?.name?.split(' ')[0] || ''}
              onSwitchToAvailable={() => {
                setActiveTab('available');
                refreshGames();
              }}
              onReservationCountChange={handleReservationCountChange}
              onGameReleased={handleCancelled}
            />
          </div>
        )}
      </div>

      <div className="hidden md:block mt-8">
        <ScoreTicker />
      </div>
    </div>
  );
}

function ShareSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fefefe]">
      {/* Nav bar */}
      <div className="h-[60px] md:h-[77px] flex items-center justify-between px-4 md:px-8 bg-[#2c2a2b]">
        <div className="flex items-center gap-4">
          <Bone w="120px" h="24px" delay={0} />
          <div className="hidden md:block">
            <Bone w="240px" h="40px" r={8} delay={0.05} />
          </div>
        </div>
        <Bone w="40px" h="40px" r="50%" delay={0.1} />
      </div>

      {/* Mobile seat info pill */}
      <div className="md:hidden px-4 pt-4">
        <Bone w="100%" h="44px" r={8} delay={0.15} />
      </div>

      <div className="max-w-[1024px] mx-auto w-full px-4 pt-4 pb-6 md:px-10 md:pt-8 md:pb-10 flex-1">
        {/* Welcome text */}
        <div className="hidden md:block mb-6 md:mb-8">
          <Bone w="320px" h="32px" delay={0} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4">
          <Bone w="80px" h="40px" r={8} delay={0} />
          <Bone w="100px" h="40px" r={8} delay={0.05} />
          <Bone w="90px" h="40px" r={8} delay={0.1} />
        </div>

        {/* Month header */}
        <div className="flex items-center gap-2 mb-4">
          <Bone w="3px" h="16px" delay={0} />
          <Bone w="120px" h="22px" delay={0.05} />
          <Bone w="60px" h="14px" delay={0.1} />
        </div>

        {/* Game cards */}
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg px-4 md:px-6 py-4 border border-[#dcd7d4] bg-white flex items-center gap-2 md:gap-10"
            >
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="flex flex-col items-center gap-1 w-[30px]">
                  <Bone w="20px" h="10px" delay={i * 0.1} />
                  <Bone w="18px" h="14px" delay={i * 0.1 + 0.05} />
                  <Bone w="20px" h="10px" delay={i * 0.1 + 0.1} />
                </div>
                <div className="w-px h-[57px] bg-[#dcd7d4]" />
                <Bone w="42px" h="42px" r="50%" delay={i * 0.1 + 0.15} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Bone w="140px" h="16px" delay={i * 0.1 + 0.2} />
                <Bone w="180px" h="12px" delay={i * 0.1 + 0.25} />
              </div>
              <div className="hidden md:block">
                <Bone w="100px" h="36px" r={8} delay={i * 0.1 + 0.3} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SharePageClient(props: Props) {
  return (
    <Suspense fallback={<ShareSkeleton />}>
      <SharePageInner {...props} />
    </Suspense>
  );
}
