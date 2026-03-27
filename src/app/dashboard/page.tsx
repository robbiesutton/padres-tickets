'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  formatShortDate,
  groupGamesByMonth,
  getOpponentAbbr,
  getOpponentColor,
  getGameMonthYear,
  formatTime,
  MONTH_NAMES,
} from '@/lib/game-utils';
import { getTeamColors } from '@/lib/team-colors';
import { useDashboardContext } from './layout';

// ─── Types ──────────────────────────────────────────────

interface Summary {
  totalGames: number;
  gamesAvailable: number;
  gamesClaimed: number;
  gamesTransferred: number;
  gamesComplete: number;
  gamesGoingMyself: number;
  gamesShared: number;
  gamesUnused: number;
  revenueCollected: number;
  claimersCount: number;
}

interface GameWithClaim {
  id: string;
  date: string;
  time: string | null;
  opponent: string;
  status: string;
  pricePerTicket: string | null;
  notes: string | null;
  claim: {
    id: string;
    status: string;
    paymentStatus: string;
    transferStatus: string;
    claimer: { firstName: string; lastName: string; email: string };
  } | null;
}

const STATUS_OPTIONS = [
  'GOING_MYSELF',
  'AVAILABLE',
  'SOLD_ELSEWHERE',
  'UNAVAILABLE',
];

// Status badge system — matching Figma designs
const STATUS_CHIPS: { value: string; label: string; dot: string; bg: string; text: string }[] = [
  { value: 'GOING_MYSELF',   label: 'Going Myself',   dot: '#2c2a2b', bg: '#e8e5e0', text: '#2c2a2b' },
  { value: 'AVAILABLE',      label: 'Available',       dot: '#d4a017', bg: '#fdf6e3', text: '#2c2a2b' },
  { value: 'CLAIMED',        label: 'Claimed',         dot: '#2d6a4f', bg: '#e8f5e4', text: '#2d6a4f' },
  { value: 'TRANSFERRED',    label: 'Transferred',     dot: '#2c2a2b', bg: '#e8e5e0', text: '#2c2a2b' },
  { value: 'UNAVAILABLE',    label: 'Unavailable',     dot: '#dc2626', bg: '#fce4ec', text: '#dc2626' },
];

function getStatusChip(status: string) {
  return STATUS_CHIPS.find((s) => s.value === status) || STATUS_CHIPS[0];
}

const SHORT_NAMES: Record<string, string> = {
  'Los Angeles Dodgers': 'LA Dodgers',
  'Los Angeles Angels': 'LA Angels',
  'San Francisco Giants': 'SF Giants',
  'San Diego Padres': 'SD Padres',
  'New York Mets': 'NY Mets',
  'New York Yankees': 'NY Yankees',
  'Tampa Bay Rays': 'TB Rays',
  'St. Louis Cardinals': 'STL Cardinals',
  'Kansas City Royals': 'KC Royals',
  'Chicago White Sox': 'Chi White Sox',
  'Chicago Cubs': 'Chi Cubs',
};

function getShortName(opponent: string): string {
  return SHORT_NAMES[opponent] || opponent.split(' ').pop() || opponent;
}


// ─── Game Detail Popover (seller) ──────────────────────

function SellerGamePopover({
  game,
  team,
  anchorRect,
  containerRect,
  onClose,
  onStatusChange,
}: {
  game: GameWithClaim;
  team: string;
  anchorRect: DOMRect | null;
  containerRect: DOMRect | null;
  onClose: () => void;
  onStatusChange: (gameId: string, status: string) => void;
}) {
  const hasClaim = game.claim && game.claim.status !== 'RELEASED';
  const { dow, day, month } = formatShortDate(game.date);
  const { accent } = getTeamColors(team);

  // Desktop positioning
  const style: React.CSSProperties = {};
  if (anchorRect && containerRect) {
    const anchorCenterY = anchorRect.top + anchorRect.height / 2 - containerRect.top;
    const anchorRight = anchorRect.right - containerRect.left;
    const anchorLeft = anchorRect.left - containerRect.left;
    const containerWidth = containerRect.width;

    if (anchorRight + 290 < containerWidth) {
      style.left = anchorRight + 12;
    } else {
      style.left = Math.max(0, anchorLeft - 290 - 12);
    }
    style.top = anchorCenterY;
    style.transform = 'translateY(-50%)';
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const content = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: getOpponentColor(game.opponent) }}
          >
            {getOpponentAbbr(game.opponent)}
          </div>
          <div>
            <p className="text-base font-bold text-[#2c2a2b]">vs {game.opponent}</p>
            <p className="text-sm text-[#8e8985]">
              {dow} {month} {day} {game.time ? `• ${formatTime(game.time)}` : ''}
            </p>
          </div>
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
          onClick={onClose}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between py-2 border-t border-[#f5f4f2]">
        <span className="text-sm text-[#8e8985]">Status</span>
        {hasClaim ? (
          (() => {
            const chip = getStatusChip(game.status);
            return (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: chip.bg, color: chip.text }}>
                <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: chip.dot }} />
                {chip.label}
              </span>
            );
          })()
        ) : (
          <select
            value={game.status}
            onChange={(e) => onStatusChange(game.id, e.target.value)}
            className="rounded-full border border-[#eceae5] px-2 py-0.5 text-xs font-medium cursor-pointer bg-white"
          >
            {STATUS_OPTIONS.map((s) => {
              const chip = getStatusChip(s);
              return <option key={s} value={s}>{chip.label}</option>;
            })}
          </select>
        )}
      </div>

      {/* Claimer */}
      {hasClaim && (
        <div className="flex items-center justify-between py-2 border-t border-[#f5f4f2]">
          <span className="text-sm text-[#8e8985]">Claimed by</span>
          <span className="text-sm font-medium text-[#2c2a2b]">
            {game.claim!.claimer.firstName} {game.claim!.claimer.lastName}
          </span>
        </div>
      )}

      {/* Price */}
      {game.pricePerTicket && (
        <div className="flex items-center justify-between py-2 border-t border-[#f5f4f2]">
          <span className="text-sm text-[#8e8985]">Price</span>
          <span className="text-sm font-medium text-[#2c2a2b]">${Number(game.pricePerTicket)}/ticket</span>
        </div>
      )}

      {/* Payment & Transfer status for claimed games */}
      {hasClaim && (
        <>
          <div className="flex items-center justify-between py-2 border-t border-[#f5f4f2]">
            <span className="text-sm text-[#8e8985]">Payment</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              game.claim!.paymentStatus === 'PAID' ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#FAEEDA] text-[#2c2a2b]'
            }`}>
              {game.claim!.paymentStatus.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[#f5f4f2]">
            <span className="text-sm text-[#8e8985]">Transfer</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              game.claim!.transferStatus === 'ACCEPTED' ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#f5f4f2] text-[#8e8985]'
            }`}>
              {game.claim!.transferStatus.replace('_', ' ')}
            </span>
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up">
          <div className="px-4 pt-5 pb-6">{content}</div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div
      className="absolute z-50 bg-white rounded-lg border border-[#eceae5] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-4"
      style={{ ...style, minWidth: 280, maxWidth: 380 }}
    >
      {content}
    </div>
  );
}

// ─── Seller Game Card ──────────────────────────────────

function SellerGameCard({
  game,
  team,
  onStatusChange,
  onTap,
}: {
  game: GameWithClaim;
  team: string;
  onStatusChange: (gameId: string, status: string) => void;
  onTap: () => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { dow, day, month } = formatShortDate(game.date);
  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);
  const hasClaim = game.claim && game.claim.status !== 'RELEASED';
  const isClaimed = game.status === 'CLAIMED' || game.status === 'TRANSFERRED';

  let borderColor = '#dcd7d4';
  if (isClaimed) borderColor = '#0f6f57';
  else if (game.status === 'UNAVAILABLE') borderColor = '#DC2626';

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        pillRef.current && !pillRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const chip = getStatusChip(game.status);

  return (
    <div
      className="rounded-lg px-6 py-4 border border-solid flex items-center gap-2 md:gap-10 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] md:shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:cursor-default cursor-pointer"
      style={{ borderColor }}
      onClick={() => { if (window.innerWidth < 768) onTap(); }}
    >
      <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Date column */}
          <div className="text-center w-[30px] flex flex-col items-center gap-px">
            <div className="text-sm font-medium text-[#8e8985] uppercase">{dow}</div>
            <div className="text-base font-extrabold text-[#2c2a2b] leading-tight">{day}</div>
            <div className="text-sm font-medium text-[#8e8985]">{month}</div>
          </div>

          {/* Separator */}
          <div className="w-px h-[57px] bg-[#dcd7d4]" />

          {/* Team badge / claimed check */}
          {isClaimed ? (
            <div className="w-[32px] h-[32px] md:w-[42px] md:h-[42px] rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 16 16" width={24} height={24} fill="none">
                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div
              className="w-[32px] h-[32px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center text-[9px] md:text-[13px] font-bold text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {abbr}
            </div>
          )}
        </div>

        {/* Game info */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-base font-bold text-[#2c2a2b]">
            <span className="md:hidden">vs {getShortName(game.opponent)}</span>
            <span className="hidden md:inline">vs {game.opponent}</span>
          </div>
          <div className="text-base md:text-sm font-medium text-[#8e8985]">
            {formatTime(game.time)}
            {hasClaim && game.claim && (
              <span> &bull; {game.claim.claimer.firstName} {game.claim.claimer.lastName}</span>
            )}
            {game.pricePerTicket && (
              <span className="hidden md:inline"> &bull; ${Number(game.pricePerTicket)}/ticket</span>
            )}
          </div>
        </div>
      </div>

      {/* Status pill + popover */}
      <div className="relative shrink-0">
        <button
          ref={pillRef}
          onClick={(e) => {
            e.stopPropagation();
            setPopoverOpen(!popoverOpen);
          }}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-full text-sm font-medium transition-all cursor-pointer hover:shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
          style={{
            backgroundColor: chip.bg,
            color: chip.text,
            border: popoverOpen ? `2px solid ${chip.dot}` : '2px solid transparent',
          }}
        >
          <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: chip.dot }} />
          {chip.label}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="ml-0.5 opacity-50">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Status popover */}
        {popoverOpen && (
          <div
            ref={popoverRef}
            className="absolute right-0 top-[calc(100%+6px)] z-50 rounded-xl shadow-[0_0_0_1px_#eceae5,0_8px_24px_rgba(0,0,0,0.12)] w-[180px] overflow-hidden"
          >
            {STATUS_CHIPS.map((s, i) => (
              <button
                key={s.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(game.id, s.value);
                  setPopoverOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 border-none cursor-pointer text-left transition-colors text-sm hover:bg-[#f5f4f2] ${
                  game.status === s.value ? 'font-semibold bg-[#f5f4f2]' : 'bg-white'
                }`}
                style={{ color: s.text }}
              >
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
                {s.label}
                {game.status === s.value && (
                  <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke={s.dot} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Seller List View ──────────────────────────────────

function SellerListView({
  games,
  team,
  onStatusChange,
  onSelectGame,
}: {
  games: GameWithClaim[];
  team: string;
  onStatusChange: (gameId: string, status: string) => void;
  onSelectGame: (game: GameWithClaim) => void;
}) {
  const grouped = groupGamesByMonth(games);
  const { accent } = getTeamColors(team);

  return (
    <div>
      {Array.from(grouped.entries()).map(([monthLabel, monthGames]) => (
        <div key={monthLabel} className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-[3px] h-4 rounded-sm" style={{ backgroundColor: accent }} />
              <span className="text-xl font-semibold text-black">{monthLabel}</span>
            </div>
            <span className="text-sm font-medium text-[#8e8985] leading-5">
              &bull; {monthGames.length} game{monthGames.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {monthGames.map((game) => (
              <SellerGameCard
                key={game.id}
                game={game}
                team={team}
                onStatusChange={onStatusChange}
                onTap={() => onSelectGame(game)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Scroll to top — mobile only */}
      <div className="md:hidden flex justify-center py-6">
        <button
          className="flex items-center gap-1.5 text-sm font-medium text-[#8e8985] bg-transparent border-none cursor-pointer active:text-[#2c2a2b] transition-colors"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
          Back to top
        </button>
      </div>
    </div>
  );
}

// ─── Status Chip Bar ───────────────────────────────────

function StatusChipBar({
  statusFilter,
  onStatusFilterChange,
  gameCounts,
}: {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  gameCounts: Record<string, number>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {STATUS_CHIPS.map((chip) => {
        const isActive = statusFilter === chip.value;
        const count = gameCounts[chip.value] || 0;
        return (
          <button
            key={chip.value}
            onClick={() => onStatusFilterChange(isActive ? '' : chip.value)}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-full cursor-pointer transition-all text-sm font-medium whitespace-nowrap shrink-0 text-[#2c2a2b]"
            style={{
              border: isActive ? `2px solid ${chip.dot}` : '2px solid #eceae5',
              backgroundColor: isActive ? chip.bg : '#ffffff',
            }}
            onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = chip.dot; e.currentTarget.style.backgroundColor = chip.bg; } }}
            onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = '#eceae5'; e.currentTarget.style.backgroundColor = '#ffffff'; } }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full shrink-0"
              style={{ backgroundColor: chip.dot }}
            />
            {chip.label}
            <span
              className="text-xs font-semibold opacity-60"
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Toolbar ───────────────────────────────────────────

function SellerToolbar({
  opponents,
  opponentFilter,
  onOpponentFilterChange,
  monthFilter,
  onMonthFilterChange,
  months,
  claimers,
  claimerFilter,
  onClaimerFilterChange,
}: {
  opponents: string[];
  opponentFilter: string;
  onOpponentFilterChange: (value: string) => void;
  monthFilter: string;
  onMonthFilterChange: (value: string) => void;
  months: { value: string; label: string }[];
  claimers: { value: string; label: string }[];
  claimerFilter: string;
  onClaimerFilterChange: (value: string) => void;
}) {
  const selectClass =
    "flex-1 md:flex-none min-w-0 h-11 px-4 pr-9 md:px-5 md:pr-10 rounded-lg border border-[#eceae5] bg-white hover:bg-[#f5f4f2] transition-colors text-sm md:text-base font-medium text-[#2c2a2b] cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%238e8985%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_6px_center] md:bg-[right_8px_center]";

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 mb-4 flex-wrap">
      <div className="flex gap-2 md:gap-4 w-full md:w-auto min-w-0 flex-wrap">
        <select className={selectClass} value={opponentFilter} onChange={(e) => onOpponentFilterChange(e.target.value)}>
          <option value="">All opponents</option>
          {opponents.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select className={selectClass} value={monthFilter} onChange={(e) => onMonthFilterChange(e.target.value)}>
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select className={selectClass} value={claimerFilter} onChange={(e) => onClaimerFilterChange(e.target.value)}>
          <option value="">All claimers</option>
          {claimers.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────

export default function DashboardPage() {
  const { packages, selectedPkg, selectedPkgId, loading } = useDashboardContext();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [games, setGames] = useState<GameWithClaim[]>([]);

  // View & filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [opponentFilter, setOpponentFilter] = useState('');
  const [claimerFilter, setClaimerFilter] = useState('');
  const [selectedMobileGame, setSelectedMobileGame] = useState<GameWithClaim | null>(null);
  const [copied, setCopied] = useState(false);

  // Load dashboard data when package changes
  useEffect(() => {
    if (!selectedPkgId) return;
    let cancelled = false;

    Promise.all([
      fetch(`/api/packages/${selectedPkgId}/summary`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/packages/${selectedPkgId}`).then((r) => r.ok ? r.json() : null),
    ]).then(([summaryData, pkgData]) => {
      if (cancelled) return;
      if (summaryData) setSummary(summaryData);
      if (pkgData) setGames(pkgData.package.games);
    });

    return () => { cancelled = true; };
  }, [selectedPkgId]);

  const opponents = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => set.add(g.opponent));
    return [...set].sort();
  }, [games]);

  const monthOptions = useMemo(() => {
    const monthSet = new Set<number>();
    games.forEach((g) => {
      const { month } = getGameMonthYear(g);
      monthSet.add(month);
    });
    return [...monthSet]
      .sort((a, b) => a - b)
      .map((m) => ({ value: String(m + 1), label: MONTH_NAMES[m] }));
  }, [games]);

  const claimerOptions = useMemo(() => {
    const map = new Map<string, string>();
    games.forEach((g) => {
      if (g.claim && g.claim.status !== 'RELEASED') {
        const name = `${g.claim.claimer.firstName} ${g.claim.claimer.lastName}`;
        map.set(name, name);
      }
    });
    return [...map.values()].sort().map((name) => ({ value: name, label: name }));
  }, [games]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    games.forEach((g) => {
      counts[g.status] = (counts[g.status] || 0) + 1;
    });
    return counts;
  }, [games]);

  const hasActiveFilters = !!(statusFilter || monthFilter || opponentFilter || claimerFilter);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (statusFilter && g.status !== statusFilter) return false;
      if (monthFilter) {
        const monthIndex = parseInt(monthFilter) - 1;
        const { month } = getGameMonthYear(g);
        if (month !== monthIndex) return false;
      }
      if (opponentFilter && g.opponent !== opponentFilter) return false;
      if (claimerFilter) {
        if (!g.claim || g.claim.status === 'RELEASED') return false;
        const name = `${g.claim.claimer.firstName} ${g.claim.claimer.lastName}`;
        if (name !== claimerFilter) return false;
      }
      return true;
    });
  }, [games, statusFilter, monthFilter, opponentFilter, claimerFilter]);

  async function updateGameStatus(gameId: string, newStatus: string) {
    const res = await fetch(`/api/packages/${selectedPkgId}/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setGames((prev) =>
        prev.map((g) => {
          if (g.id !== gameId) return g;
          const updated = { ...g, status: newStatus };
          if (newStatus !== 'CLAIMED' && newStatus !== 'TRANSFERRED') {
            updated.claim = null;
          }
          return updated;
        })
      );
    }
  }

  function handleCopyShareLink() {
    if (!selectedPkg?.shareLinkSlug) return;
    const url = `${window.location.origin}/share/${selectedPkg.shareLinkSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleMonthFilterChange(value: string) {
    setMonthFilter(value);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[#8e8985]">Loading dashboard...</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
          Welcome to BenchBuddy
        </h1>
        <p className="text-[#8e8985]">
          Set up your first season ticket package to get started.
        </p>
        <a
          href="/dashboard/packages/new"
          className="rounded-lg bg-[#2c2a2b] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b]"
        >
          Create Package
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#fefefe]">
      <div className="max-w-[1024px] mx-auto w-full px-4 pt-4 pb-6 md:px-10 md:pt-8 md:pb-10 overflow-x-hidden flex-1">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 md:mb-4">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
            Dashboard
          </h1>
          {/* Share link — copies to clipboard */}
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] transition-colors bg-transparent border-none cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            {copied ? 'Copied!' : 'Share your link'}
          </button>
        </div>

        {/* Stats bar — scoreboard style matching score ticker */}
        {summary && selectedPkg && (() => {
          const { primary, accent } = getTeamColors(selectedPkg.team);
          const stats = [
            { label: 'Total Games', value: summary.totalGames, highlight: false },
            { label: 'Claimed', value: summary.gamesClaimed, highlight: false },
            { label: 'Available', value: summary.gamesAvailable, highlight: true },
            { label: 'Revenue', value: `$${summary.revenueCollected.toFixed(0)}`, highlight: true },
          ];
          return (
            <div
              className="rounded-xl p-4 md:p-5 mb-6 md:mb-8 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
              style={{ backgroundColor: primary }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border rounded-[10px] px-4 py-3 md:py-4 text-center"
                    style={stat.highlight
                      ? { backgroundColor: `${accent}18`, borderColor: `${accent}30` }
                      : { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }
                    }
                  >
                    <p
                      className="text-[26px] md:text-[30px] font-extrabold leading-none mb-1"
                      style={{ color: stat.highlight ? accent : '#ffffff' }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[12px] font-semibold text-white/50 uppercase tracking-[1.2px]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Status chips */}
        <StatusChipBar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          gameCounts={statusCounts}
        />

        {/* Filter dropdowns */}
        <div className="mt-4">
          <SellerToolbar
            opponents={opponents}
            opponentFilter={opponentFilter}
            onOpponentFilterChange={setOpponentFilter}
            monthFilter={monthFilter}
            onMonthFilterChange={handleMonthFilterChange}
            months={monthOptions}
            claimers={claimerOptions}
            claimerFilter={claimerFilter}
            onClaimerFilterChange={setClaimerFilter}
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="mb-4 -mt-2">
            <button
              className="text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer transition-colors"
              onClick={() => { setStatusFilter(''); setMonthFilter(''); setOpponentFilter(''); setClaimerFilter(''); }}
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Empty state */}
        {filteredGames.length === 0 && hasActiveFilters ? (
          <div className="rounded-xl border border-[#eceae5] bg-white py-16 text-center">
            <p className="text-lg text-[#8e8985]">No games match your filters</p>
            <button
              className="mt-4 text-sm font-medium text-[#2c2a2b] underline bg-transparent border-none cursor-pointer"
              onClick={() => { setStatusFilter(''); setMonthFilter(''); setOpponentFilter(''); setClaimerFilter(''); }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <SellerListView
            games={filteredGames}
            team={selectedPkg?.team || ''}
            onStatusChange={updateGameStatus}
            onSelectGame={(game) => setSelectedMobileGame(game)}
          />
        )}

        {/* Mobile game detail drawer (list view) */}
        {selectedMobileGame && (
          <SellerGamePopover
            game={selectedMobileGame}
            team={selectedPkg?.team || ''}
            anchorRect={null}
            containerRect={null}
            onClose={() => setSelectedMobileGame(null)}
            onStatusChange={(gameId, status) => {
              updateGameStatus(gameId, status);
              setSelectedMobileGame((prev) => prev ? { ...prev, status } : null);
            }}
          />
        )}
      </div>
    </div>
  );
}
