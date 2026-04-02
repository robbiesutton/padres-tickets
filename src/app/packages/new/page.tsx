'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import {
  SetupLayout,

  StepHeadline,
  StepSubhead,
  StepActions,
  PrimaryButton,
  GhostButton,
  SkipLink,
  InlineNote,
  FormLabel,
  FormSelect,
} from '@/components/setup-layout';
import { getOpponentColor, getOpponentAbbr } from '@/lib/game-utils';
import { getTeamColors } from '@/lib/team-colors';

// ─── Types ──────────────────────────────────────────────

interface MlbTeam {
  id: number;
  name: string;
  abbreviation: string;
  venue: string;
}

interface StadiumSection {
  id: string;
  name: string;
  level: string;
  tags: string[];
  rowCount: number;
}

interface SeasonPackage {
  id: string;
  name: string;
  tier?: string;
  gameCount: number;
  description: string;
  gameFilter?: {
    all?: boolean;
    weekendsOnly?: boolean;
    fridays?: boolean;
    saturdays?: boolean;
    sundays?: boolean;
    dayOfWeek?: number[];
  };
  gameDates?: string[];
}

interface ScheduleGame {
  date: string;
  time: string;
  gameDate: string;
  opponent: string;
}

type Step = 1 | 2 | 3;

// ─── Constants ──────────────────────────────────────────

const LEAGUES = [
  { value: 'MLB', label: 'MLB', available: true },
  { value: 'NBA', label: 'NBA', available: false },
  { value: 'NFL', label: 'NFL', available: false },
  { value: 'NHL', label: 'NHL', available: false },
  { value: 'MLS', label: 'MLS', available: false },
  { value: 'WNBA', label: 'WNBA', available: false },
  { value: 'NWSL', label: 'NWSL', available: false },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STEPS = [
  { label: 'Your Tickets' },
  { label: 'Your Seats' },
  { label: 'Confirmation' },
];

const AVAILABLE_PERKS = [
  'Shaded seats', 'Behind home plate', 'Premium', 'Craft beer nearby',
  'Easy parking', 'Club access', 'Great for kids', 'Aisle seats',
];

// ─── Design Mode Mock Data ──────────────────────────────

const DESIGN = process.env.NEXT_PUBLIC_DESIGN_MODE === 'true';

const MOCK_TEAMS: MlbTeam[] = [
  { id: 135, name: 'San Diego Padres', abbreviation: 'SD', venue: 'Petco Park' },
  { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD', venue: 'Dodger Stadium' },
  { id: 137, name: 'San Francisco Giants', abbreviation: 'SF', venue: 'Oracle Park' },
  { id: 109, name: 'Arizona Diamondbacks', abbreviation: 'AZ', venue: 'Chase Field' },
  { id: 115, name: 'Colorado Rockies', abbreviation: 'COL', venue: 'Coors Field' },
];

const MOCK_PACKAGES: SeasonPackage[] = [
  { id: 'full', name: 'Full Season', gameCount: 81, description: 'All 81 home games', gameFilter: { all: true } },
  { id: 'half', name: 'Half Season', gameCount: 41, description: '41 selected home games' },
  { id: 'weekend', name: 'Weekend Plan', tier: 'Popular', gameCount: 28, description: 'Friday, Saturday & Sunday games', gameFilter: { weekendsOnly: true } },
  { id: 'friday', name: 'Friday Night Plan', gameCount: 12, description: 'All Friday night home games', gameFilter: { fridays: true } },
];

const MOCK_SECTIONS: StadiumSection[] = [
  { id: 'sec-101', name: '101', level: 'Field Level', tags: ['Behind home plate', 'Premium'], rowCount: 20 },
  { id: 'sec-203', name: '203', level: 'Field Level', tags: ['Shaded seats', 'Craft beer'], rowCount: 30 },
  { id: 'sec-305', name: '305', level: 'Upper Level', tags: ['Great view', 'Easy access'], rowCount: 25 },
  { id: 'sec-120', name: '120', level: 'Club Level', tags: ['Club access', 'Padded seats'], rowCount: 15 },
];

const MOCK_SCHEDULE: ScheduleGame[] = [
  { date: '2026-04-02T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-04-01', opponent: 'Los Angeles Dodgers' },
  { date: '2026-04-04T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-04-03', opponent: 'Los Angeles Dodgers' },
  { date: '2026-04-05T00:40:00.000Z', time: '5:40 PM', gameDate: '2026-04-04', opponent: 'Los Angeles Dodgers' },
  { date: '2026-04-08T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-04-07', opponent: 'Colorado Rockies' },
  { date: '2026-04-09T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-04-08', opponent: 'Colorado Rockies' },
  { date: '2026-04-12T00:40:00.000Z', time: '5:40 PM', gameDate: '2026-04-11', opponent: 'San Francisco Giants' },
  { date: '2026-04-15T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-04-14', opponent: 'Arizona Diamondbacks' },
  { date: '2026-04-19T00:40:00.000Z', time: '5:40 PM', gameDate: '2026-04-18', opponent: 'Chicago Cubs' },
  { date: '2026-04-22T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-04-21', opponent: 'Pittsburgh Pirates' },
  { date: '2026-04-26T00:10:00.000Z', time: '5:10 PM', gameDate: '2026-04-25', opponent: 'Atlanta Braves' },
  { date: '2026-05-01T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-04-30', opponent: 'New York Mets' },
  { date: '2026-05-05T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-05-04', opponent: 'Philadelphia Phillies' },
  { date: '2026-05-09T00:40:00.000Z', time: '5:40 PM', gameDate: '2026-05-08', opponent: 'San Francisco Giants' },
  { date: '2026-05-13T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-05-12', opponent: 'Milwaukee Brewers' },
  { date: '2026-05-17T00:10:00.000Z', time: '5:10 PM', gameDate: '2026-05-16', opponent: 'Los Angeles Dodgers' },
  { date: '2026-05-22T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-05-21', opponent: 'Cincinnati Reds' },
  { date: '2026-06-02T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-06-01', opponent: 'Arizona Diamondbacks' },
  { date: '2026-06-06T00:40:00.000Z', time: '5:40 PM', gameDate: '2026-06-05', opponent: 'Texas Rangers' },
  { date: '2026-06-13T00:10:00.000Z', time: '5:10 PM', gameDate: '2026-06-12', opponent: 'St. Louis Cardinals' },
  { date: '2026-06-20T02:10:00.000Z', time: '7:10 PM', gameDate: '2026-06-19', opponent: 'Los Angeles Dodgers' },
];

function initAvailability() {
  const avail: Record<number, 'available' | 'keeping'> = {};
  MOCK_SCHEDULE.forEach((_, i) => { avail[i] = 'available'; });
  return avail;
}

function initPrices() {
  const pr: Record<number, number> = {};
  MOCK_SCHEDULE.forEach((_, i) => { pr[i] = 45; });
  return pr;
}

// ─── Wizard Game Card ──────────────────────────────────

function WizardGameCard({
  game,
  index,
  isAvail,
  price,
  onToggleAvailability,
  onPriceChange,
  onRemove,
}: {
  game: ScheduleGame;
  index: number;
  isAvail: boolean;
  price: number;
  onToggleAvailability: () => void;
  onPriceChange: (price: number) => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(String(price));
  const [priceSaved, setPriceSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const d = new Date(game.date);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  const day = d.getDate();
  const mon = MONTH_NAMES[d.getMonth()].slice(0, 3);
  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setMenuOpen(false); setConfirmRemove(false); }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  function handlePriceSave() {
    const v = parseInt(priceValue) || 0;
    onPriceChange(v);
    setEditingPrice(false);
    setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 1500);
  }

  return (
    <div
      className={`rounded-[10px] px-4 md:px-5 py-4 border border-solid flex items-center gap-2 md:gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all ${priceSaved ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-white'} ${editingPrice ? 'border-[#2c2a2b] border-2' : ''}`}
      style={{ borderColor: editingPrice ? '#2c2a2b' : priceSaved ? '#bbf7d0' : '#dcd7d4' }}
    >
      <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="text-center w-[30px] flex flex-col items-center gap-px">
            <div className="text-sm font-medium text-[#8e8985] uppercase">{dow}</div>
            <div className="text-base font-extrabold text-[#2c2a2b] leading-tight">{day}</div>
            <div className="text-sm font-medium text-[#8e8985]">{mon}</div>
          </div>
          <div className="w-px h-[57px] bg-[#dcd7d4]" />
          <div className="w-[32px] h-[32px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center text-[9px] md:text-[13px] font-bold text-white shrink-0" style={{ backgroundColor: color }}>
            {abbr}
          </div>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-base font-bold text-[#2c2a2b]">
            <span className="md:hidden">vs {game.opponent.split(' ').pop()}</span>
            <span className="hidden md:inline">vs {game.opponent}</span>
          </div>
          <div className="text-base md:text-sm font-medium text-[#8e8985]">
            {game.time}
            <span className="hidden md:inline">
              {editingPrice ? (
                <span className="inline-flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                  <span className="inline-flex items-center h-[30px] rounded-md border-[1.5px] border-[#2c2a2b] bg-[#f5f4f2] overflow-hidden">
                    <span className="text-sm text-[#8e8985] pl-2 pr-0.5">$</span>
                    <input
                      ref={priceInputRef}
                      type="text"
                      inputMode="numeric"
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePriceSave(); if (e.key === 'Escape') { setPriceValue(String(price)); setEditingPrice(false); } }}
                      className="w-[40px] h-full bg-transparent border-none outline-none text-sm font-bold text-[#1a1a1a] text-right pr-2"
                      autoFocus
                    />
                  </span>
                  <button onClick={handlePriceSave} className="h-[30px] px-3 rounded-md bg-[#2d6a4f] text-white text-[11px] font-semibold border-none cursor-pointer hover:bg-[#245a43] transition-colors flex items-center">Save</button>
                  <button onClick={() => { setPriceValue(String(price)); setEditingPrice(false); }} className="text-[#999] text-base font-bold bg-transparent border-none cursor-pointer hover:text-[#1a1a1a] transition-colors ml-0.5">✕</button>
                </span>
              ) : (
                <span className="text-[#999]">
                  {price > 0 ? ` \u00B7 $${price}/ticket` : ''}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Status toggle pill */}
      <button
        onClick={onToggleAvailability}
        className="inline-flex items-center gap-2 h-11 px-4 rounded-full text-sm font-medium transition-all cursor-pointer shrink-0 hidden md:inline-flex"
        style={{
          backgroundColor: isAvail ? '#fdf6e3' : '#e8e5e0',
          color: '#2c2a2b',
          border: '2px solid transparent',
        }}
      >
        <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: isAvail ? '#d4a017' : '#2c2a2b' }} />
        {isAvail ? 'Available' : 'Going Myself'}
      </button>

      {/* Three-dot menu — desktop */}
      <div className="relative shrink-0 hidden md:block" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setConfirmRemove(false); }}
          className="w-7 h-7 rounded flex items-center justify-center text-[#8e8985] hover:bg-[#f3f4f6] hover:text-[#2c2a2b] transition-all cursor-pointer bg-transparent border-none text-base font-bold"
        >
          ⋯
        </button>

        {menuOpen && !confirmRemove && (
          <div className="absolute right-0 top-[calc(100%+4px)] z-50 bg-white rounded-[10px] shadow-[0_8px_28px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.05)] p-1.5 w-[160px]">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditingPrice(true); }}
              className="w-full text-left px-3.5 py-2.5 rounded-md text-[13px] font-medium text-[#1a1a1a] bg-transparent border-none cursor-pointer hover:bg-[#f7f5f2] transition-colors"
            >
              Edit Price
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmRemove(true); }}
              className="w-full text-left px-3.5 py-2.5 rounded-md text-[13px] font-medium text-[#dc2626] bg-transparent border-none cursor-pointer hover:bg-[#f7f5f2] transition-colors"
            >
              Remove Game
            </button>
          </div>
        )}

        {menuOpen && confirmRemove && (
          <div className="absolute right-0 top-[calc(100%+4px)] z-50 bg-white rounded-[10px] shadow-[0_8px_28px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.05)] p-4 w-[260px]">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Remove this game?</p>
            <p className="text-xs text-[#999] mb-4">vs {game.opponent} · {game.time}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); setMenuOpen(false); setConfirmRemove(false); }}
                className="h-9 px-4 rounded-lg bg-[#dc2626] text-white text-sm font-semibold border-none cursor-pointer hover:bg-[#b91c1c] transition-colors"
              >
                Remove
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmRemove(false); setMenuOpen(false); }}
                className="text-sm font-medium text-[#6b7280] bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Three-dot menu — mobile */}
      <div className="relative shrink-0 md:hidden">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setConfirmRemove(false); }}
          className="w-6 h-6 rounded flex items-center justify-center text-[#8e8985] hover:bg-[#f3f4f6] hover:text-[#2c2a2b] transition-all cursor-pointer bg-transparent border-none text-sm font-bold"
        >
          ⋯
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function NewPackagePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Step 1: Tickets
  const [league, setLeague] = useState(DESIGN ? 'MLB' : '');
  const [teams, setTeams] = useState<MlbTeam[]>(DESIGN ? MOCK_TEAMS : []);
  const [selectedTeam, setSelectedTeam] = useState<MlbTeam | null>(DESIGN ? MOCK_TEAMS[0] : null);
  const [season] = useState(new Date().getFullYear().toString());
  const [packages, setPackages] = useState<SeasonPackage[]>(DESIGN ? MOCK_PACKAGES : []);
  const [selectedPackage, setSelectedPackage] = useState<SeasonPackage | null>(DESIGN ? MOCK_PACKAGES[0] : null);

  // Step 2: Seats + Seat Info
  const [sections, setSections] = useState<StadiumSection[]>(DESIGN ? MOCK_SECTIONS : []);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<StadiumSection | null>(DESIGN ? MOCK_SECTIONS[1] : null);
  const [rows, setRows] = useState<string[]>(DESIGN ? ['1','2','3','4','5','6','7','8','9','10'] : []);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [sectionTags, setSectionTags] = useState<string[]>(DESIGN ? ['Shaded seats', 'Craft beer'] : []);
  const [row, setRow] = useState(DESIGN ? '5' : '');
  const [selectedSeats, setSelectedSeats] = useState<Set<number>>(DESIGN ? new Set([1, 2]) : new Set());
  const [seatPhotoUrl, setSeatPhotoUrl] = useState<string | null>(null);
  const [seatDescription, setSeatDescription] = useState('');
  const [seatPerks, setSeatPerks] = useState<string[]>(DESIGN ? ['Shaded seats', 'Craft beer'] : []);

  // Step 3: Games
  const [schedule, setSchedule] = useState<ScheduleGame[]>(DESIGN ? MOCK_SCHEDULE : []);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(DESIGN ? new Set(MOCK_SCHEDULE.map((_, i) => i)) : new Set());
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [availability, setAvailability] = useState<Record<number, 'available' | 'keeping'>>(DESIGN ? initAvailability() : {});

  // Step 4: Pricing
  const [prices, setPrices] = useState<Record<number, number>>(DESIGN ? initPrices() : {});
  const [bulkPrice, setBulkPrice] = useState(DESIGN ? '45' : '');
  const [showPerGame, setShowPerGame] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState('45');

  // Step 5: Payment
  const [venmoHandle, setVenmoHandle] = useState(DESIGN ? '@robbie-sutton' : '');
  const [zelleInfo, setZelleInfo] = useState(DESIGN ? 'robbie@benchbuddy.app' : '');

  // Celebration
  const [linkSlug, setLinkSlug] = useState(DESIGN ? 'padres-section203' : '');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(DESIGN ? true : null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ shareLink: string; gamesCreated: number } | null>(null);
  const [firstName, setFirstName] = useState(DESIGN ? 'Robbie' : '');
  const [subscribed, setSubscribed] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  // ─── Data Loading ──────────────────────────────────────

  useEffect(() => {
    if (DESIGN) return;
    fetch('/api/users/me').then((r) => (r.ok ? r.json() : null)).then((data) => {
      if (!data) return;
      if (data.firstName) setFirstName(data.firstName);
      const status = data.subscription?.status;
      setSubscribed(status === 'ACTIVE' || status === 'TRIALING');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (DESIGN) return;
    fetch('/api/teams').then((r) => (r.ok ? r.json() : null)).then((data) => { if (data) setTeams(data.teams); });
  }, []);

  useEffect(() => {
    if (DESIGN) return;
    if (!selectedTeam) return;
    setSectionsLoading(true); setSections([]); setSelectedSection(null); setRows([]); setRow(''); setSelectedSeats(new Set());
    fetch(`/api/stadiums/${selectedTeam.abbreviation}/sections`).then((r) => (r.ok ? r.json() : null)).then((data) => { if (data) setSections(data.sections); }).finally(() => setSectionsLoading(false));
    fetch(`/api/stadiums/${selectedTeam.abbreviation}/packages`).then((r) => (r.ok ? r.json() : null)).then((data) => { if (data) setPackages(data.packages); });
  }, [selectedTeam]);

  useEffect(() => {
    if (DESIGN) return;
    if (!selectedTeam || !selectedSection) return;
    setRowsLoading(true); setRow('');
    fetch(`/api/stadiums/${selectedTeam.abbreviation}/sections/${selectedSection.id}/rows`).then((r) => (r.ok ? r.json() : null)).then((data) => { if (data) { setRows(data.rows); setSectionTags(data.tags || []); } }).finally(() => setRowsLoading(false));
  }, [selectedTeam, selectedSection]);

  const loadSchedule = useCallback(async () => {
    if (DESIGN) return;
    if (!selectedTeam) return;
    setScheduleLoading(true);
    try {
      const res = await fetch(`/api/schedule/${selectedTeam.id}?season=${season}`);
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.games);
        const selected = new Set<number>();
        if (selectedPackage?.gameDates) {
          const dateSet = new Set(selectedPackage.gameDates);
          data.games.forEach((game: ScheduleGame, i: number) => {
            if (dateSet.has(game.date)) selected.add(i);
          });
          if (selected.size === 0) data.games.forEach((_: unknown, i: number) => selected.add(i));
        } else if (selectedPackage?.gameFilter) {
          const filter = selectedPackage.gameFilter;
          data.games.forEach((game: ScheduleGame, i: number) => {
            if (filter.all) { selected.add(i); return; }
            const d = new Date(game.date); const dow = d.getDay();
            if (filter.dayOfWeek?.includes(dow)) selected.add(i);
            else if (filter.fridays && dow === 5) selected.add(i);
            else if (filter.saturdays && dow === 6) selected.add(i);
            else if (filter.sundays && dow === 0) selected.add(i);
            else if (filter.weekendsOnly && (dow === 0 || dow === 5 || dow === 6)) selected.add(i);
          });
          if (selected.size === 0) data.games.forEach((_: unknown, i: number) => selected.add(i));
        } else { data.games.forEach((_: unknown, i: number) => selected.add(i)); }
        setSelectedGames(selected);
        const avail: Record<number, 'available' | 'keeping'> = {};
        const pr: Record<number, number> = {};
        data.games.forEach((_: unknown, i: number) => { avail[i] = 'available'; pr[i] = 0; });
        setAvailability(avail); setPrices(pr);
      }
    } finally { setScheduleLoading(false); }
  }, [selectedTeam, selectedPackage, season]);

  // ─── Derived Data ──────────────────────────────────────

  const gamesByMonth = useMemo(() => {
    const grouped: Record<string, { game: ScheduleGame; index: number }[]> = {};
    schedule.forEach((game, index) => {
      const d = new Date(game.date);
      const month = MONTH_NAMES[d.getMonth()];
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push({ game, index });
    });
    return grouped;
  }, [schedule]);

  const availableCount = useMemo(() => Array.from(selectedGames).filter((i) => availability[i] === 'available').length, [selectedGames, availability]);

  // ─── Actions ───────────────────────────────────────────

  function showToastMsg(message: string) { setToast(message); setTimeout(() => setToast(''), 3000); }
  function goToStep(s: Step) { setStep(s); window.scrollTo(0, 0); }

  function handleLeagueSelect(value: string) {
    const l = LEAGUES.find((l) => l.value === value);
    if (!l) return;
    if (!l.available) { showToastMsg(`Coming soon! We'll notify you when ${l.label} is available.`); setLeague(''); return; }
    setLeague(value);
  }

  function toggleGame(index: number) { setSelectedGames((prev) => { const next = new Set(prev); if (next.has(index)) next.delete(index); else next.add(index); return next; }); }
  function toggleAvailability(index: number) { setAvailability((prev) => ({ ...prev, [index]: prev[index] === 'available' ? 'keeping' : 'available' })); }
  function setAllAvailability(value: 'available' | 'keeping') { setAvailability((prev) => { const next = { ...prev }; selectedGames.forEach((i) => { next[i] = value; }); return next; }); }
  function toggleSeat(seatNum: number) { setSelectedSeats((prev) => { const next = new Set(prev); if (next.has(seatNum)) next.delete(seatNum); else next.add(seatNum); return next; }); }
  function togglePerk(perk: string) { setSeatPerks((prev) => prev.includes(perk) ? prev.filter((p) => p !== perk) : [...prev, perk]); }

  function applyBulkPrice() {
    const price = parseInt(bulkPrice) || 0;
    setPrices((prev) => { const next = { ...prev }; selectedGames.forEach((i) => { if (availability[i] === 'available') next[i] = price; }); return next; });
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setSeatPhotoUrl(reader.result as string); };
    reader.readAsDataURL(file);
  }

  // ─── Slug Checking ─────────────────────────────────────

  useEffect(() => {
    if (!linkSlug || linkSlug.length < 2) { setSlugAvailable(null); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/packages/check-slug?slug=${encodeURIComponent(linkSlug)}`);
      if (res.ok) { const data = await res.json(); setSlugAvailable(data.available); }
    }, 500);
    return () => clearTimeout(timer);
  }, [linkSlug]);

  // ─── Package Creation ──────────────────────────────────

  async function createPackage() {
    if (!selectedTeam) return;
    setLoading(true); setError('');
    try {
      const gameOverrides: Record<string, { status: string; pricePerTicket: number }> = {};
      const excludedDates: string[] = [];
      schedule.forEach((game, i) => {
        if (!selectedGames.has(i)) { excludedDates.push(game.gameDate); return; }
        gameOverrides[game.gameDate] = { status: availability[i] === 'keeping' ? 'GOING_MYSELF' : 'AVAILABLE', pricePerTicket: availability[i] === 'available' ? (prices[i] || 0) : 0 };
      });
      const seatsStr = Array.from(selectedSeats).sort((a, b) => a - b).join(', ');
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id, section: selectedSection?.id || '', row: row || undefined,
          seats: seatsStr || 'TBD', seatCount: selectedSeats.size || 2, season, autoLoadSchedule: true,
          seatPhotoUrl: seatPhotoUrl || undefined, perks: seatPerks.length > 0 ? seatPerks : sectionTags.length > 0 ? sectionTags : undefined,
          description: seatDescription || (selectedSection ? `${selectedSection.level} seats at ${selectedTeam.venue}` : undefined),
          gameOverrides, excludedDates, venmoHandle: venmoHandle || undefined, zelleInfo: zelleInfo || undefined, shareLinkSlug: linkSlug || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create package'); return; }
      setResult({ shareLink: data.shareLink, gamesCreated: data.gamesCreated });
    } finally { setLoading(false); }
  }

  async function handleSubscribe() {
    setSubLoading(true);
    try { const res = await fetch('/api/stripe/checkout', { method: 'POST' }); const data = await res.json(); if (data.url) window.location.href = data.url; else { setError(data.error || 'Failed'); setSubLoading(false); } }
    catch { setError('Something went wrong'); setSubLoading(false); }
  }

  // ─── Celebration Screen ────────────────────────────────

  if (result) {
    return (
      <div className="min-h-screen bg-[#faf8f5] relative">
        {/* Close button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="hidden md:flex fixed top-6 right-6 w-11 h-11 items-center justify-center bg-transparent border-none cursor-pointer text-[#8e8985] hover:text-[#2c2a2b] transition-colors z-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-12 md:py-16">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="hidden md:block text-6xl mb-5">⚾</div>
            <h2 className="text-[28px] font-bold text-[#1a1a1a] tracking-tight mb-2" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
              You&apos;re all set{firstName ? `, ${firstName}` : ''}!
            </h2>
            <p className="text-sm text-[#8e8985] leading-relaxed md:hidden">
              Head to your dashboard to customize games and prices before sharing.
            </p>
            <p className="text-sm text-[#8e8985] leading-relaxed hidden md:block">
              Here&apos;s what your friends will see when you share your link. Head to your dashboard to customize games and prices first.
            </p>
          </div>

          {/* Preview — what friends will see */}
          <div className="mb-4">
            <p className="text-xs font-medium text-[#8e8985] uppercase tracking-[0.5px] text-center mb-4">What your friends will see</p>

            <div className="rounded-xl border border-[#dcd7d4] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] bg-[#fefefe]">
              {/* Mobile nav bar */}
              {(() => {
                const { primary: teamPrimary, accent: teamAccent } = getTeamColors(selectedTeam?.name || 'San Diego Padres');
                return (
                  <div className="h-[48px] flex items-center justify-between px-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{ backgroundColor: teamPrimary }}>
                    <div className="flex items-center gap-1.5">
                      <img src="/benchbuddy-mark-white.svg" alt="BenchBuddy" width={18} height={18} />
                      <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>BenchBuddy</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                  </div>
                );
              })()}

              {/* Mobile seat info pill */}
              {(() => {
                const { primary: teamPrimary, accent: teamAccent } = getTeamColors(selectedTeam?.name || 'San Diego Padres');
                return (
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2 h-9 pl-2 pr-2.5 rounded-lg" style={{ border: `1px solid ${teamPrimary}30`, backgroundColor: `${teamPrimary}08` }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0" style={{ backgroundColor: teamAccent, color: teamPrimary }}>
                        {selectedTeam?.abbreviation || 'SD'}
                      </div>
                      <span className="text-xs font-medium text-[#2c2a2b]">Sec {selectedSection?.name || '203'} &middot; Row {row || '5'} &middot; Seats {Array.from(selectedSeats).sort((a, b) => a - b).join('–')}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="ml-auto shrink-0"><path d="M6 9l6 6 6-6" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                );
              })()}

              {/* Game cards — mobile style */}
              <div className="px-3 pb-3">
                {/* Month header */}
                {schedule.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2.5">
                    {(() => {
                      const { accent: teamAccent } = getTeamColors(selectedTeam?.name || 'San Diego Padres');
                      return <div className="w-[3px] h-3 rounded-sm" style={{ backgroundColor: teamAccent }} />;
                    })()}
                    <span className="text-sm font-semibold text-black">
                      {(() => { const d = new Date(schedule[0].date); return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; })()}
                    </span>
                    <span className="text-[11px] font-medium text-[#8e8985]">&bull; {schedule.length} games</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {schedule.slice(0, 3).map((game, i) => {
                    const d = new Date(game.date);
                    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
                    const day = d.getDate();
                    const mon = MONTH_NAMES[d.getMonth()].slice(0, 3);
                    const color = getOpponentColor(game.opponent);
                    const abbr = getOpponentAbbr(game.opponent);
                    const shortName = game.opponent.split(' ').pop();
                    return (
                      <div key={i} className="rounded-lg px-3 py-3 border border-[#dcd7d4] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] flex items-center gap-2">
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-center w-[24px] flex flex-col items-center gap-px">
                            <div className="text-[10px] font-medium text-[#8e8985] uppercase">{dow}</div>
                            <div className="text-sm font-extrabold text-[#2c2a2b] leading-tight">{day}</div>
                            <div className="text-[10px] font-medium text-[#8e8985]">{mon}</div>
                          </div>
                          <div className="w-px h-[40px] bg-[#dcd7d4]" />
                          <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ backgroundColor: color }}>
                            {abbr}
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="text-sm font-bold text-[#2c2a2b]">vs {shortName}</div>
                          <div className="text-xs font-medium text-[#8e8985]">{game.time} &bull; Petco Park</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Share link */}
          <div className="rounded-lg border border-[#eceae5] bg-white px-4 py-3 mb-6 flex items-center gap-2">
            <span className="text-sm text-[#2c2a2b] flex-1 text-left truncate">benchbuddy.com/{result.shareLink || linkSlug}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${result.shareLink || linkSlug}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-sm font-bold text-[#2c2a2b] bg-transparent border-none cursor-pointer shrink-0"
            >
              {copied ? 'Copied!' : '🔗 Copy'}
            </button>
          </div>

          {/* Primary action — desktop inline */}
          <div className="hidden md:block">
            <button
              onClick={() => router.push('/dashboard')}
              className="h-12 w-full rounded-lg bg-[#2c2a2b] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors mb-4"
            >
              Go to My Dashboard →
            </button>
          </div>

          {/* Spacer for sticky button on mobile */}
          <div className="h-20 md:hidden" />
        </div>

        {/* Primary action — mobile sticky */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-3 bg-[#faf8f5]">
          <button
            onClick={() => router.push('/dashboard')}
            className="h-12 w-full rounded-lg bg-[#2c2a2b] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors"
          >
            Go to My Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ─── Wizard Steps ──────────────────────────────────────

  const totalSteps = 3;

  return (
    <SetupLayout steps={STEPS} currentStep={step} showSidebar={false}>
      {/* Back button */}
      <button
        onClick={() => { if (step > 1) goToStep((step - 1) as Step); else router.push('/dashboard'); }}
        className="fixed top-6 left-6 flex items-center gap-1.5 text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer transition-colors z-10"
      >
        <svg className="md:w-[18px] md:h-[18px] w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        <span className="hidden md:inline">Back</span>
      </button>

      {/* Logout button — desktop only */}
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="hidden md:flex fixed top-6 right-6 items-center gap-1.5 text-sm font-medium text-[#8e8985] hover:text-[#DC2626] bg-transparent border-none cursor-pointer transition-colors z-10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign out
      </button>

      {/* Horizontal step tracker */}
      <div className="flex items-center justify-center gap-2 mt-[12px] md:mt-0 mb-4 md:mb-14">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < step;
          const isActive = stepNum === step;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isDone ? 'bg-[#8B2500] text-white' : isActive ? 'bg-[#2c2a2b] text-white' : 'bg-[#eceae5] text-[#b0a89e]'
                }`}>
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : stepNum}
                </div>
                <span className={`text-xs font-semibold hidden sm:inline ${
                  isDone ? 'text-[#8B2500]' : isActive ? 'text-[#2c2a2b]' : 'text-[#b0a89e]'
                }`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-[2px] ${isDone ? 'bg-[#8B2500]' : 'bg-[#eceae5]'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#2c2a2b] text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg animate-slide-up">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-[#FEE2E2] text-[#DC2626] px-4 py-3 text-sm font-medium mb-4">
          {error}
        </div>
      )}

      {/* ── Step 1: Your Tickets ── */}
      {step === 1 && (
        <div className="flex flex-col flex-1">


          <StepHeadline><span className="md:hidden">Your tickets</span><span className="hidden md:inline">Which tickets do you have?</span></StepHeadline>
          <StepSubhead>We&apos;ll pull in your game schedule based on what you select here.</StepSubhead>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <FormLabel>League</FormLabel>
              <FormSelect value={league} onChange={handleLeagueSelect} placeholder="Select a league...">
                {LEAGUES.map((l) => <option key={l.value} value={l.value}>{l.label}{!l.available ? ' (Coming soon)' : ''}</option>)}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Team</FormLabel>
              <FormSelect value={selectedTeam?.id?.toString() || ''} onChange={(v) => { const t = teams.find((t) => t.id === parseInt(v)); setSelectedTeam(t || null); }} placeholder="Select a team...">
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </FormSelect>
            </div>
          </div>

          <div>
            <FormLabel>Package</FormLabel>
            <FormSelect value={selectedPackage?.id || ''} onChange={(v) => { const p = packages.find((p) => p.id === v); setSelectedPackage(p || null); }} placeholder="Select a package...">
              {packages.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.gameCount} Games</option>)}
            </FormSelect>
          </div>

          {selectedPackage && (
            <div className="rounded-lg bg-[#FEF3CD] text-[#856D10] px-4 py-3 text-sm font-medium mt-4 leading-relaxed">
              ⚠️ We&apos;ll load your games based on this selection. Make sure it matches your ticket package — you can remove games but can&apos;t add new ones.
            </div>
          )}

          <StepActions>
            <PrimaryButton onClick={() => { loadSchedule(); goToStep(2); }} disabled={!league || !selectedTeam || !selectedPackage}>
              Continue →
            </PrimaryButton>
          </StepActions>
        </div>
      )}

      {/* ── Step 2: Your Seats ── */}
      {step === 2 && (
        <div className="flex flex-col flex-1">


          <StepHeadline><span className="md:hidden">Your seats</span><span className="hidden md:inline">Where do you sit?</span></StepHeadline>
          <StepSubhead>We&apos;ll show this to friends so they know the seats they&apos;re getting.</StepSubhead>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <FormLabel>Section</FormLabel>
              <FormSelect value={selectedSection?.id || ''} onChange={(v) => { const s = sections.find((s) => s.id === v); setSelectedSection(s || null); }} placeholder="Select section...">
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.level}</option>)}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Row</FormLabel>
              <FormSelect value={row} onChange={setRow} placeholder="Select row...">
                {rows.map((r) => <option key={r} value={r}>Row {r}</option>)}
              </FormSelect>
            </div>
          </div>

          {/* Seat chips */}
          <div className="mb-5">
            <FormLabel>Which seats are yours?</FormLabel>
            <div className="grid grid-cols-5 md:grid-cols-12 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => toggleSeat(num)}
                  className={`h-11 rounded-lg text-sm font-bold border-[1.5px] cursor-pointer transition-all ${
                    selectedSeats.has(num)
                      ? 'bg-[#2c2a2b] border-[#2c2a2b] text-white'
                      : 'bg-white border-[#eceae5] text-[#1a1a1a] hover:border-[#b5b1ab]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <StepActions>
            <PrimaryButton onClick={() => goToStep(3)} disabled={!selectedSection || !row || selectedSeats.size === 0}>
              Continue →
            </PrimaryButton>
          </StepActions>
        </div>
      )}

      {/* ── Step 3: Customize ── */}
      {step === 3 && (
        <div className="flex flex-col flex-1">


          <StepHeadline>Confirm your setup</StepHeadline>
          <p className="hidden md:block text-sm text-[#8e8985] leading-relaxed mb-4">Make sure everything looks right, then set your default ticket price.</p>
          <div className="md:hidden mb-[10px]" />

          {/* Summary card */}
          <div className="rounded-xl border border-[#dcd7d4] overflow-hidden mb-6">
            {/* Team header */}
            {(() => {
              const { primary: teamPrimary, accent: teamAccent } = getTeamColors(selectedTeam?.name || 'San Diego Padres');
              return (
                <div className="px-4 py-3 flex items-center gap-2.5" style={{ backgroundColor: teamPrimary }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: teamAccent, color: teamPrimary }}>
                    {selectedTeam?.abbreviation || 'SD'}
                  </div>
                  <span className="text-sm text-white">
                    <strong>{selectedTeam?.name || 'San Diego Padres'}</strong> &middot; {season} Season
                  </span>
                </div>
              );
            })()}
            {/* Details rows */}
            <div className="bg-white divide-y divide-[#f5f4f2]">
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-[#8e8985]">Package</span>
                <span className="text-sm font-bold text-[#2c2a2b]">{selectedPackage?.name || 'Full Season'} &middot; {selectedPackage?.gameCount || 81} Games</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-[#8e8985]">Section &amp; Row</span>
                <span className="text-sm font-bold text-[#2c2a2b]">Sec {selectedSection?.name || '203'} &middot; Row {row || '5'}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-[#8e8985]">Seats</span>
                <span className="text-sm font-bold text-[#2c2a2b]">Seats {Array.from(selectedSeats).sort((a, b) => a - b).join('–')}</span>
              </div>
              {schedule.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-[#8e8985]">Schedule</span>
                  <span className="text-sm font-bold text-[#2c2a2b]">
                    {(() => {
                      const first = new Date(schedule[0].date);
                      const last = new Date(schedule[schedule.length - 1].date);
                      const fmt = (d: Date) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
                      return `${fmt(first)} – ${fmt(last)}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Default price */}
          <div className="mb-2">
            <FormLabel>Default price per ticket</FormLabel>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center h-[44px] rounded-lg border-[1.5px] border-[#eceae5] bg-white px-3 focus-within:border-[#2c2a2b] focus-within:ring-[3px] focus-within:ring-[#2c2a2b]/10 transition-all">
                <span className="text-sm font-bold text-[#1a1a1a]">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={defaultPrice}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setDefaultPrice(val);
                    const num = parseInt(val) || 0;
                    setPrices((prev) => {
                      const next = { ...prev };
                      Object.keys(next).forEach((k) => { next[Number(k)] = num; });
                      return next;
                    });
                  }}
                  onBlur={() => { if (!defaultPrice) setDefaultPrice('0'); }}
                  style={{ width: `${Math.max(2, defaultPrice.length || 1)}ch` }}
                  className="bg-transparent border-none outline-none text-sm font-bold text-[#1a1a1a] p-0 ml-0.5"
                />
              </div>
              <span className="text-sm text-[#8e8985]">/ ticket</span>
            </div>
          </div>

          {/* Info callout */}
          <div className="rounded-lg bg-[#e8f5e4] text-[#2d6a4f] px-4 py-3 text-sm font-medium leading-relaxed">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#2d6a4f" className="inline-block align-[-1px] mr-1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <strong>${defaultPrice || '0'}/ticket</strong> applied to all {selectedPackage?.gameCount || 81} games. You can adjust prices for each game from your dashboard.
          </div>

          <StepActions>
            <PrimaryButton onClick={() => { applyBulkPrice(); createPackage(); }} disabled={loading}>{loading ? 'Creating...' : 'Finish Setup →'}</PrimaryButton>
          </StepActions>
        </div>
      )}

    </SetupLayout>
  );
}
