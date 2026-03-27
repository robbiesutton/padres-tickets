'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

// ─── Status System ─────────────────────────────────────

const STATUS_CHIPS: { value: string; label: string; dot: string; bg: string; text: string }[] = [
  { value: 'GOING_MYSELF',   label: 'Going Myself',   dot: '#2c2a2b', bg: '#e8e5e0', text: '#2c2a2b' },
  { value: 'AVAILABLE',      label: 'Available',       dot: '#d4a017', bg: '#fdf6e3', text: '#2c2a2b' },
  { value: 'CLAIMED',        label: 'Claimed',         dot: '#2d6a4f', bg: '#e8f5e4', text: '#2d6a4f' },
  { value: 'TRANSFERRED',    label: 'Transferred',     dot: '#2c2a2b', bg: '#e8e5e0', text: '#2c2a2b' },
  { value: 'UNAVAILABLE',    label: 'Unavailable',     dot: '#dc2626', bg: '#fce4ec', text: '#dc2626' },
];

const EDITABLE_STATUSES = STATUS_CHIPS.filter((s) => s.value !== 'CLAIMED' && s.value !== 'TRANSFERRED');

function getStatusChip(status: string) {
  return STATUS_CHIPS.find((s) => s.value === status) || STATUS_CHIPS[0];
}

function isEditable(status: string) {
  return status !== 'CLAIMED' && status !== 'TRANSFERRED';
}

const SHORT_NAMES: Record<string, string> = {
  'Los Angeles Dodgers': 'LA Dodgers', 'Los Angeles Angels': 'LA Angels',
  'San Francisco Giants': 'SF Giants', 'San Diego Padres': 'SD Padres',
  'New York Mets': 'NY Mets', 'New York Yankees': 'NY Yankees',
  'Tampa Bay Rays': 'TB Rays', 'St. Louis Cardinals': 'STL Cardinals',
  'Kansas City Royals': 'KC Royals', 'Chicago White Sox': 'Chi White Sox',
  'Chicago Cubs': 'Chi Cubs',
};

function getShortName(opponent: string): string {
  return SHORT_NAMES[opponent] || opponent.split(' ').pop() || opponent;
}

// ─── Status Picker (shared for single + batch) ────────

function StatusPicker({
  title,
  currentStatus,
  onSelect,
  onClose,
}: {
  title: string;
  currentStatus?: string;
  onSelect: (status: string) => void;
  onClose: () => void;
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const content = (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-[#2c2a2b]">{title}</p>
        <button className="w-11 h-11 -mr-2 flex items-center justify-center bg-transparent border-none cursor-pointer" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="rounded-xl overflow-hidden shadow-[0_0_0_1px_#eceae5]">
        {EDITABLE_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => onSelect(s.value)}
            className={`w-full flex items-center gap-2.5 px-4 py-3.5 border-none cursor-pointer text-left transition-colors text-sm font-medium hover:bg-[#f5f4f2] ${
              currentStatus === s.value ? 'font-semibold bg-[#f5f4f2]' : 'bg-white'
            }`}
            style={{ color: s.text }}
          >
            <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
            {s.label}
            {currentStatus === s.value && (
              <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={s.dot} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up">
          <div className="px-4 pt-5 pb-8">{content}</div>
        </div>
      </div>,
      document.body
    );
  }

  return content;
}

// ─── Read-Only Info Sheet ──────────────────────────────

function ProtectedStatusSheet({
  game,
  onStatusChange,
  onClose,
}: {
  game: GameWithClaim;
  onStatusChange: (gameId: string, status: string) => void;
  onClose: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const chip = getStatusChip(game.status);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  function handleSelect(status: string) {
    onStatusChange(game.id, status);
    onClose();
  }

  const content = (
    <div className="flex flex-col">
      {/* Lock icon + close */}
      <div className="flex items-center justify-between">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <button className="w-11 h-11 -mr-2 flex items-center justify-center bg-transparent border-none cursor-pointer" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Warning text */}
      <p className="text-sm text-[#2c2a2b] leading-relaxed mt-1">
        {game.status === 'CLAIMED'
          ? `This game was claimed${game.claim ? ` by ${game.claim.claimer.firstName} ${game.claim.claimer.lastName}` : ''}. Changing the status will release their claim.`
          : 'This game was transferred through official channels. Changing the status may cause issues.'}
      </p>

      <div className="mt-5">
        {showPicker ? (
          <StatusPicker
            title="Change Status"
            currentStatus={game.status}
            onSelect={handleSelect}
            onClose={() => setShowPicker(false)}
          />
        ) : (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-[#eceae5] bg-white text-sm font-medium text-[#2c2a2b] hover:bg-[#f5f4f2] transition-colors cursor-pointer">
              Keep Status
            </button>
            <button onClick={() => setShowPicker(true)} className="flex-1 h-11 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors cursor-pointer">
              Change Anyway
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up">
          <div className="px-4 pt-5 pb-8">{content}</div>
        </div>
      </div>,
      document.body
    );
  }

  return content;
}

// ─── Seller Game Card ──────────────────────────────────

function SellerGameCard({
  game,
  team,
  onStatusChange,
  onTap,
  selected,
  onToggleSelect,
}: {
  game: GameWithClaim;
  team: string;
  onStatusChange: (gameId: string, status: string) => void;
  onTap: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [flashStatus, setFlashStatus] = useState<string | null>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { dow, day, month } = formatShortDate(game.date);
  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);
  const hasClaim = game.claim && game.claim.status !== 'RELEASED';
  const isClaimed = game.status === 'CLAIMED' || game.status === 'TRANSFERRED';
  const editable = isEditable(game.status);

  let borderColor = '#dcd7d4';
  if (selected) borderColor = '#2c2a2b';
  else if (isClaimed) borderColor = '#0f6f57';
  else if (game.status === 'UNAVAILABLE') borderColor = '#DC2626';

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        pillRef.current && !pillRef.current.contains(e.target as Node)
      ) { setPopoverOpen(false); }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  function handleStatusSelect(newStatus: string) {
    onStatusChange(game.id, newStatus);
    setPopoverOpen(false);
    setFlashStatus(newStatus);
    setTimeout(() => setFlashStatus(null), 1500);
  }

  const chip = getStatusChip(game.status);

  function handleCardClick() {
    if (window.innerWidth < 768) onTap();
  }

  function handlePillClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (editable) {
      setPopoverOpen(!popoverOpen);
    } else {
      setInfoOpen(true);
    }
  }

  return (
    <div
      className={`rounded-lg px-4 md:px-6 py-4 border border-solid flex items-center gap-2 md:gap-4 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] md:shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all md:cursor-default cursor-pointer ${selected ? 'bg-[#f5f4f2]' : ''} ${flashStatus ? 'ring-2 ring-[#2d6a4f]/30' : ''}`}
      style={{ borderColor }}
      onClick={handleCardClick}
    >
      {/* Checkbox — always visible */}
      <div
        className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
          selected ? 'bg-[#2c2a2b] border-[#2c2a2b]' : 'bg-white border-[#dcd7d4] hover:border-[#8e8985]'
        }`}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
      >
        {selected && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="text-center w-[30px] flex flex-col items-center gap-px">
            <div className="text-sm font-medium text-[#8e8985] uppercase">{dow}</div>
            <div className="text-base font-extrabold text-[#2c2a2b] leading-tight">{day}</div>
            <div className="text-sm font-medium text-[#8e8985]">{month}</div>
          </div>
          <div className="w-px h-[57px] bg-[#dcd7d4]" />
          {isClaimed ? (
            <div className="w-[32px] h-[32px] md:w-[42px] md:h-[42px] rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 16 16" width={24} height={24} fill="none">
                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div className="w-[32px] h-[32px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center text-[9px] md:text-[13px] font-bold text-white shrink-0" style={{ backgroundColor: color }}>
              {abbr}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-base font-bold text-[#2c2a2b]">
            <span className="md:hidden">vs {getShortName(game.opponent)}</span>
            <span className="hidden md:inline">vs {game.opponent}</span>
          </div>
          <div className="text-base md:text-sm font-medium text-[#8e8985]">
            {formatTime(game.time)}
            {hasClaim && game.claim && <span> &bull; {game.claim.claimer.firstName} {game.claim.claimer.lastName}</span>}
            {game.pricePerTicket && <span className="hidden md:inline"> &bull; ${Number(game.pricePerTicket)}/ticket</span>}
          </div>
        </div>
      </div>

      {/* Status pill */}
      <div className="relative shrink-0">
        <button
          ref={pillRef}
          onClick={handlePillClick}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-full text-sm font-medium transition-all cursor-pointer hover:shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
          style={{
            backgroundColor: chip.bg,
            color: chip.text,
            border: popoverOpen ? `2px solid ${chip.dot}` : '2px solid transparent',
          }}
        >
          <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: chip.dot }} />
          {chip.label}
          {editable ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="ml-0.5 opacity-50">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 opacity-40">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          )}
        </button>

        {/* Single-edit popover (desktop) */}
        {popoverOpen && (
          <div ref={popoverRef} className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white rounded-xl shadow-[0_0_0_1px_#eceae5,0_8px_24px_rgba(0,0,0,0.12)] w-[220px] p-3">
            <StatusPicker
              title="Set Status"
              currentStatus={game.status}
              onSelect={handleStatusSelect}
              onClose={() => setPopoverOpen(false)}
            />
          </div>
        )}

        {/* Read-only info (desktop) */}
        {infoOpen && (
          <div ref={popoverRef} className="hidden md:block absolute right-0 top-[calc(100%+6px)] z-50 bg-white rounded-xl shadow-[0_0_0_1px_#eceae5,0_8px_24px_rgba(0,0,0,0.12)] w-[340px] p-5">
            <ProtectedStatusSheet game={game} onStatusChange={onStatusChange} onClose={() => setInfoOpen(false)} />
          </div>
        )}
      </div>

      {/* Protected status (mobile) */}
      {infoOpen && typeof window !== 'undefined' && window.innerWidth < 768 && (
        <ProtectedStatusSheet game={game} onStatusChange={onStatusChange} onClose={() => setInfoOpen(false)} />
      )}

      {/* Single-edit picker (mobile) */}
      {popoverOpen && typeof window !== 'undefined' && window.innerWidth < 768 && (
        <StatusPicker
          title="Set Status"
          currentStatus={game.status}
          onSelect={handleStatusSelect}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Seller List View ──────────────────────────────────

function SellerListView({
  games,
  team,
  onStatusChange,
  onSelectGame,
  selectedIds,
  onToggleSelect,
}: {
  games: GameWithClaim[];
  team: string;
  onStatusChange: (gameId: string, status: string) => void;
  onSelectGame: (game: GameWithClaim) => void;
  selectedIds: Set<string>;
  onToggleSelect: (gameId: string) => void;
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
                selected={selectedIds.has(game.id)}
                onToggleSelect={() => onToggleSelect(game.id)}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="md:hidden flex justify-center py-6">
        <button className="flex items-center gap-1.5 text-sm font-medium text-[#8e8985] bg-transparent border-none cursor-pointer active:text-[#2c2a2b] transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
          Back to top
        </button>
      </div>
    </div>
  );
}

// ─── Batch Action Bar ──────────────────────────────────

function BatchActionBar({
  selectedCount,
  editableCount,
  onSelectAll,
  onCancel,
  onSetStatus,
}: {
  selectedCount: number;
  editableCount: number;
  onSelectAll: () => void;
  onCancel: () => void;
  onSetStatus: () => void;
}) {
  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#2c2a2b] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] animate-slide-up">
      <div className="max-w-[1024px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium text-white">
            {selectedCount === 0 ? 'No games selected' : `${selectedCount} game${selectedCount !== 1 ? 's' : ''} selected`}
          </span>
          {selectedCount < editableCount && (
            <button onClick={onSelectAll} className="text-sm font-medium text-white/60 hover:text-white bg-transparent border-none cursor-pointer transition-colors whitespace-nowrap">
              Select all ({editableCount})
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-sm font-medium text-white/60 hover:text-white bg-transparent border-none cursor-pointer transition-colors">
            {selectedCount > 0 ? 'Clear' : 'Cancel'}
          </button>
          {selectedCount > 0 && (
            <button onClick={onSetStatus} className="h-9 px-4 rounded-lg bg-white text-sm font-semibold text-[#2c2a2b] hover:bg-[#f5f4f2] transition-colors cursor-pointer border-none">
              Set Status &rarr;
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
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
            <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: chip.dot }} />
            {chip.label}
            <span className="text-xs font-semibold opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Toolbar ───────────────────────────────────────────

function SellerToolbar({
  opponents, opponentFilter, onOpponentFilterChange,
  monthFilter, onMonthFilterChange, months,
  claimers, claimerFilter, onClaimerFilterChange,
  allSelected, someSelected, onSelectAllToggle,
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
  allSelected: boolean;
  someSelected: boolean;
  onSelectAllToggle: () => void;
}) {
  const selectClass =
    "flex-1 md:flex-none min-w-0 h-11 px-4 pr-9 md:px-5 md:pr-10 rounded-lg border border-[#eceae5] bg-white hover:bg-[#f5f4f2] transition-colors text-sm md:text-base font-medium text-[#2c2a2b] cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%238e8985%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_6px_center] md:bg-[right_8px_center]";

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 mb-4 flex-wrap">
      <div className="flex gap-2 md:gap-4 w-full md:w-auto min-w-0 flex-wrap flex-1">
        <select className={selectClass} value={opponentFilter} onChange={(e) => onOpponentFilterChange(e.target.value)}>
          <option value="">All opponents</option>
          {opponents.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className={selectClass} value={monthFilter} onChange={(e) => onMonthFilterChange(e.target.value)}>
          <option value="">All months</option>
          {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className={selectClass} value={claimerFilter} onChange={(e) => onClaimerFilterChange(e.target.value)}>
          <option value="">All claimers</option>
          {claimers.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {/* Master checkbox */}
      <div
        onClick={onSelectAllToggle}
        className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
          allSelected ? 'bg-[#2c2a2b] border-[#2c2a2b]' : someSelected ? 'bg-[#2c2a2b] border-[#2c2a2b]' : 'bg-white border-[#dcd7d4] hover:border-[#8e8985]'
        }`}
      >
        {allSelected ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : someSelected ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────

export default function DashboardPage() {
  const { packages, selectedPkg, selectedPkgId, loading } = useDashboardContext();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [games, setGames] = useState<GameWithClaim[]>([]);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [opponentFilter, setOpponentFilter] = useState('');
  const [claimerFilter, setClaimerFilter] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [batchConfirm, setBatchConfirm] = useState<string | null>(null);

  const [selectedMobileGame, setSelectedMobileGame] = useState<GameWithClaim | null>(null);
  const [copied, setCopied] = useState(false);

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

  const opponents = useMemo(() => [...new Set(games.map((g) => g.opponent))].sort(), [games]);

  const monthOptions = useMemo(() => {
    const s = new Set<number>();
    games.forEach((g) => s.add(getGameMonthYear(g).month));
    return [...s].sort((a, b) => a - b).map((m) => ({ value: String(m + 1), label: MONTH_NAMES[m] }));
  }, [games]);

  const claimerOptions = useMemo(() => {
    const m = new Map<string, string>();
    games.forEach((g) => { if (g.claim && g.claim.status !== 'RELEASED') { const n = `${g.claim.claimer.firstName} ${g.claim.claimer.lastName}`; m.set(n, n); } });
    return [...m.values()].sort().map((n) => ({ value: n, label: n }));
  }, [games]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    games.forEach((g) => { c[g.status] = (c[g.status] || 0) + 1; });
    return c;
  }, [games]);

  const hasActiveFilters = !!(statusFilter || monthFilter || opponentFilter || claimerFilter);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (statusFilter && g.status !== statusFilter) return false;
      if (monthFilter) { const mi = parseInt(monthFilter) - 1; if (getGameMonthYear(g).month !== mi) return false; }
      if (opponentFilter && g.opponent !== opponentFilter) return false;
      if (claimerFilter) { if (!g.claim || g.claim.status === 'RELEASED') return false; const n = `${g.claim.claimer.firstName} ${g.claim.claimer.lastName}`; if (n !== claimerFilter) return false; }
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
      setGames((prev) => prev.map((g) => {
        if (g.id !== gameId) return g;
        const updated = { ...g, status: newStatus };
        if (newStatus !== 'CLAIMED' && newStatus !== 'TRANSFERRED') updated.claim = null;
        return updated;
      }));
    }
  }

  async function handleBatchStatusChange(newStatus: string) {
    const ids = [...selectedIds];
    setBatchPickerOpen(false);

    // Fire all updates
    await Promise.all(ids.map((id) =>
      fetch(`/api/packages/${selectedPkgId}/games/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    ));

    setGames((prev) => prev.map((g) => {
      if (!ids.includes(g.id)) return g;
      const updated = { ...g, status: newStatus };
      if (newStatus !== 'CLAIMED' && newStatus !== 'TRANSFERRED') updated.claim = null;
      return updated;
    }));

    const chipLabel = getStatusChip(newStatus).label;
    setBatchConfirm(`${ids.length} game${ids.length !== 1 ? 's' : ''} updated to ${chipLabel}`);
    setTimeout(() => setBatchConfirm(null), 3000);
    setSelectedIds(new Set());
  }

  function handleToggleSelect(gameId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId); else next.add(gameId);
      return next;
    });
  }

  function handleSelectAllToggle() {
    if (selectedIds.size === filteredGames.length && filteredGames.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGames.map((g) => g.id)));
    }
  }

  function handleCopyShareLink() {
    if (!selectedPkg?.shareLinkSlug) return;
    navigator.clipboard.writeText(`${window.location.origin}/share/${selectedPkg.shareLinkSlug}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  function clearFilters() { setStatusFilter(''); setMonthFilter(''); setOpponentFilter(''); setClaimerFilter(''); }

  if (loading) return <div className="flex flex-1 items-center justify-center"><p className="text-[#8e8985]">Loading dashboard...</p></div>;

  if (packages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>Welcome to BenchBuddy</h1>
        <p className="text-[#8e8985]">Set up your first season ticket package to get started.</p>
        <a href="/dashboard/packages/new" className="rounded-lg bg-[#2c2a2b] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b]">Create Package</a>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#fefefe]">
      <div className={`max-w-[1024px] mx-auto w-full px-4 pt-4 md:px-10 md:pt-8 overflow-x-hidden flex-1 ${selectedIds.size > 0 ? 'pb-20' : 'pb-6 md:pb-10'}`}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 md:mb-4">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>Dashboard</h1>
          <button onClick={handleCopyShareLink} className="flex items-center gap-1.5 text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] transition-colors bg-transparent border-none cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            {copied ? 'Copied!' : 'Share your link'}
          </button>
        </div>

        {/* Stats bar */}
        {summary && selectedPkg && (() => {
          const { primary, accent } = getTeamColors(selectedPkg.team);
          const stats = [
            { label: 'Total Games', value: summary.totalGames, highlight: false },
            { label: 'Claimed', value: summary.gamesClaimed, highlight: false },
            { label: 'Available', value: summary.gamesAvailable, highlight: true },
            { label: 'Revenue', value: `$${summary.revenueCollected.toFixed(0)}`, highlight: true },
          ];
          return (
            <div className="rounded-xl p-4 md:p-5 mb-6 md:mb-8 shadow-[0_4px_12px_rgba(0,0,0,0.15)]" style={{ backgroundColor: primary }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="border rounded-[10px] px-4 py-3 md:py-4 text-center"
                    style={stat.highlight ? { backgroundColor: `${accent}18`, borderColor: `${accent}30` } : { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <p className="text-[26px] md:text-[30px] font-extrabold leading-none mb-1" style={{ color: stat.highlight ? accent : '#ffffff' }}>{stat.value}</p>
                    <p className="text-[12px] font-semibold text-white/50 uppercase tracking-[1.2px]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Status chips */}
        <StatusChipBar statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} gameCounts={statusCounts} />

        {/* Filter dropdowns + select toggle */}
        <div className="mt-4">
          <SellerToolbar
            opponents={opponents} opponentFilter={opponentFilter} onOpponentFilterChange={setOpponentFilter}
            monthFilter={monthFilter} onMonthFilterChange={setMonthFilter} months={monthOptions}
            claimers={claimerOptions} claimerFilter={claimerFilter} onClaimerFilterChange={setClaimerFilter}
            allSelected={filteredGames.length > 0 && selectedIds.size === filteredGames.length}
            someSelected={selectedIds.size > 0 && selectedIds.size < filteredGames.length}
            onSelectAllToggle={handleSelectAllToggle}
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="mb-4 -mt-2">
            <button className="text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer transition-colors" onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        )}

        {/* Batch confirm toast */}
        {batchConfirm && (
          <div className="mb-4 rounded-lg bg-[#E1F5EE] text-[#0F6E56] px-4 py-3 text-sm font-medium animate-fade-in">
            {batchConfirm}
          </div>
        )}

        {/* Game list */}
        {filteredGames.length === 0 && hasActiveFilters ? (
          <div className="rounded-xl border border-[#eceae5] bg-white py-16 text-center">
            <p className="text-lg text-[#8e8985]">No games match your filters</p>
            <button className="mt-4 text-sm font-medium text-[#2c2a2b] underline bg-transparent border-none cursor-pointer" onClick={clearFilters}>Clear all filters</button>
          </div>
        ) : (
          <SellerListView
            games={filteredGames}
            team={selectedPkg?.team || ''}
            onStatusChange={updateGameStatus}
            onSelectGame={(game) => setSelectedMobileGame(game)}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        )}

        {/* Mobile game detail */}
        {selectedMobileGame && (
          createPortal(
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedMobileGame(null)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up">
                <div className="px-4 pt-5 pb-6">
                  <StatusPicker
                    title={`vs ${selectedMobileGame.opponent}`}
                    currentStatus={selectedMobileGame.status}
                    onSelect={(s) => { updateGameStatus(selectedMobileGame.id, s); setSelectedMobileGame(null); }}
                    onClose={() => setSelectedMobileGame(null)}
                  />
                </div>
              </div>
            </div>,
            document.body
          )
        )}
      </div>

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <BatchActionBar
          selectedCount={selectedIds.size}
          editableCount={filteredGames.length}
          onSelectAll={handleSelectAllToggle}
          onCancel={() => setSelectedIds(new Set())}
          onSetStatus={() => setBatchPickerOpen(true)}
        />
      )}

      {/* Batch status picker */}
      {batchPickerOpen && (
        <StatusPicker
          title={`Set Status for ${selectedIds.size} Game${selectedIds.size !== 1 ? 's' : ''}`}
          onSelect={handleBatchStatusChange}
          onClose={() => setBatchPickerOpen(false)}
        />
      )}
    </div>
  );
}
