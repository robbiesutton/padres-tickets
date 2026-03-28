'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  SetupLayout,
  StepIndicator,
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
}

interface ScheduleGame {
  date: string;
  time: string;
  gameDate: string;
  opponent: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

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
  { label: 'Your Games' },
  { label: 'Pricing' },
  { label: 'Get Paid' },
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
  MOCK_SCHEDULE.forEach((_, i) => { avail[i] = i === 0 || i === 9 ? 'keeping' : 'available'; });
  return avail;
}

function initPrices() {
  const pr: Record<number, number> = {};
  MOCK_SCHEDULE.forEach((_, i) => { pr[i] = i === 0 || i === 9 ? 0 : 45; });
  return pr;
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

  // Step 5: Payment
  const [venmoHandle, setVenmoHandle] = useState(DESIGN ? '@robbie-sutton' : '');
  const [zelleInfo, setZelleInfo] = useState(DESIGN ? 'robbie@benchbuddy.app' : '');

  // Celebration
  const [linkSlug, setLinkSlug] = useState(DESIGN ? 'padres-section203' : '');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(DESIGN ? true : null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ shareLink: string; gamesCreated: number } | null>(null);
  const [subscribed, setSubscribed] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  // ─── Data Loading ──────────────────────────────────────

  useEffect(() => {
    if (DESIGN) return;
    fetch('/api/users/me').then((r) => (r.ok ? r.json() : null)).then((data) => {
      if (!data) return;
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
        if (selectedPackage?.gameFilter) {
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
      <div className="min-h-screen bg-[#faf8f5]">
        {/* Gold accent bar */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #2c2a2b, #d4a017)' }} />

        <div className="flex items-center justify-center min-h-[calc(100vh-3px)]">
          <div className="text-center max-w-[480px] px-6 py-12">
            <div className="text-6xl mb-5">⚾</div>
            <h2 className="text-[30px] font-bold text-[#1a1a1a] tracking-tight mb-2" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
              You&apos;re all set{selectedTeam ? `, ${selectedTeam.name} fan` : ''}!
            </h2>
            <p className="text-sm text-[#8e8985] leading-relaxed mb-8">
              Your season is loaded and ready to share. Here&apos;s what we set up:
            </p>

            {/* Stats */}
            <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-[#f5f4f2] rounded-xl p-5 text-center">
                <p className="text-[32px] font-bold text-[#2c2a2b] tracking-tight">{availableCount}</p>
                <p className="text-xs text-[#8e8985] mt-1">Games available</p>
              </div>
              <div className="flex-1 bg-[#f5f4f2] rounded-xl p-5 text-center">
                <p className="text-[32px] font-bold text-[#2c2a2b] tracking-tight">{selectedSeats.size}</p>
                <p className="text-xs text-[#8e8985] mt-1">Seats per game</p>
              </div>
              <div className="flex-1 bg-[#f5f4f2] rounded-xl p-5 text-center">
                <p className="text-[32px] font-bold text-[#2c2a2b] tracking-tight">${bulkPrice || '0'}</p>
                <p className="text-xs text-[#8e8985] mt-1">Default price</p>
              </div>
            </div>

            {/* Share link */}
            <div className="rounded-lg border border-[#eceae5] bg-white px-4 py-3 mb-4 flex items-center gap-2">
              <span className="text-sm text-[#8e8985] flex-1 text-left truncate">benchbuddy.com/share/{result.shareLink || linkSlug}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${result.shareLink || linkSlug}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-sm font-semibold text-[#d4a017] bg-transparent border-none cursor-pointer"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Subscription upsell */}
            {!subscribed && (
              <div className="rounded-xl border border-[#eceae5] bg-[#f5f4f2] p-5 mb-6 text-left">
                <p className="text-sm font-semibold text-[#2c2a2b] mb-1">Subscribe to share your tickets</p>
                <p className="text-xs text-[#8e8985] mb-3">$39.99/year · First month free</p>
                <button onClick={handleSubscribe} disabled={subLoading} className="w-full h-10 rounded-lg bg-[#d4a017] text-white text-sm font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-50">
                  {subLoading ? 'Loading...' : 'Subscribe Now'}
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/dashboard')} className="h-11 px-7 rounded-lg bg-[#2c2a2b] text-white text-base font-semibold border-none cursor-pointer hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors">
                Go to My Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Wizard Steps ──────────────────────────────────────

  const totalSteps = 5;

  return (
    <SetupLayout steps={STEPS} currentStep={step}>
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
          <StepIndicator current={1} total={totalSteps} />
          <StepHeadline>Let&apos;s get your tickets set up</StepHeadline>
          <StepSubhead>Three quick ones and we&apos;ll get to the fun stuff.</StepSubhead>

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
          <StepIndicator current={2} total={totalSteps} />
          <StepHeadline>Where do you sit?</StepHeadline>
          <StepSubhead>We&apos;ll use this to set up your share page for friends.</StepSubhead>

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
            <div className="grid grid-cols-6 gap-2 max-w-[340px]">
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

          {selectedSeats.size > 0 && (
            <InlineNote>{selectedSeats.size} seat{selectedSeats.size !== 1 ? 's' : ''} selected. Friends will be able to claim any combination of these.</InlineNote>
          )}

          {/* Seat photo */}
          <div className="mb-4">
            <FormLabel>Seat Photo (optional)</FormLabel>
            <div
              className="relative w-full h-[120px] rounded-lg border border-dashed border-[#eceae5] overflow-hidden cursor-pointer hover:border-[#8e8985] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {seatPhotoUrl ? (
                <Image src={seatPhotoUrl} alt="Seat view" fill className="object-cover" sizes="100vw" unoptimized />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-[#8e8985]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                  <span className="text-xs font-medium">Add a photo of your view</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          {/* Description */}
          <div className="mb-4">
            <FormLabel>Description (optional)</FormLabel>
            <textarea
              value={seatDescription}
              onChange={(e) => setSeatDescription(e.target.value)}
              placeholder="Great view behind home plate, shaded after 4th inning..."
              rows={2}
              className="w-full px-4 py-3 bg-white border-[1.5px] border-[#eceae5] rounded-lg text-sm outline-none focus:border-[#2c2a2b] focus:ring-[3px] focus:ring-[#2c2a2b]/10 resize-none"
            />
          </div>

          {/* Perks */}
          <div className="mb-4">
            <FormLabel>Perks (optional)</FormLabel>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PERKS.map((perk) => {
                const selected = seatPerks.includes(perk);
                return (
                  <button key={perk} onClick={() => togglePerk(perk)}
                    className={`inline-flex items-center h-8 px-3 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                      selected ? 'bg-[#E1F5EE] border-[#0F6E56] text-[#0F6E56]' : 'bg-white border-[#eceae5] text-[#8e8985] hover:border-[#2c2a2b]'
                    }`}
                  >
                    {selected && <svg className="w-3 h-3 mr-1" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    {perk}
                  </button>
                );
              })}
            </div>
          </div>

          <StepActions>
            <PrimaryButton onClick={() => goToStep(3)} disabled={!selectedSection || !row || selectedSeats.size === 0}>
              Continue →
            </PrimaryButton>
            <GhostButton onClick={() => goToStep(1)}>← Back</GhostButton>
          </StepActions>
        </div>
      )}

      {/* ── Step 3: Your Games ── */}
      {step === 3 && (
        <div className="flex flex-col flex-1">
          <StepIndicator current={3} total={totalSteps} />
          <StepHeadline>Here are your games</StepHeadline>
          <StepSubhead>Everything defaults to Available — toggle any you&apos;re keeping.</StepSubhead>

          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d4a017] bg-[#d4a017]/10 px-3 py-1 rounded-full">
              🏟️ {schedule.length} games loaded
            </span>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#f5f4f2] rounded-lg mb-4">
            <span className="text-xs font-semibold text-[#8e8985]">Quick set:</span>
            <button onClick={() => setAllAvailability('available')} className="text-[11px] font-bold px-3 py-1 rounded-full border-[1.5px] cursor-pointer transition-colors bg-[#d1fae5] border-[#2d6a4f] text-[#2d6a4f]">All available</button>
            <button onClick={() => setAllAvailability('keeping')} className="text-[11px] font-bold px-3 py-1 rounded-full border-[1.5px] cursor-pointer transition-colors bg-white border-[#eceae5] text-[#6b7280]">All keeping</button>
          </div>

          {/* Game list */}
          <div className="max-h-[350px] overflow-y-auto -mx-2 px-2 mb-2">
            {Object.entries(gamesByMonth).map(([month, games]) => (
              <div key={month}>
                <p className="text-xs font-bold text-[#8e8985] uppercase tracking-wider mb-2 mt-4">{month}</p>
                {games.map(({ game, index }) => {
                  const d = new Date(game.date);
                  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
                  const included = selectedGames.has(index);
                  const isAvail = availability[index] === 'available';
                  return (
                    <div key={index} className={`flex items-center gap-3 py-3 border-b border-[#f0ede8] ${!included ? 'opacity-30' : ''}`}>
                      <input type="checkbox" checked={included} onChange={() => toggleGame(index)} className="w-4 h-4 accent-[#2c2a2b]" />
                      <div className="w-[3px] h-8 rounded-sm shrink-0" style={{ backgroundColor: getOpponentColor(game.opponent) }} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1a1a1a]">vs {game.opponent.split(' ').pop()}</p>
                        <p className="text-xs text-[#8e8985]">{dayName}, {MONTH_NAMES[d.getMonth()].slice(0, 3)} {d.getDate()} · {game.time}</p>
                      </div>
                      {included && (
                        <button
                          onClick={() => toggleAvailability(index)}
                          className={`text-[11px] font-bold uppercase tracking-[0.5px] px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                            isAvail ? 'bg-[#d1fae5] text-[#2d6a4f]' : 'bg-[#f3f4f6] text-[#6b7280]'
                          }`}
                        >
                          {isAvail ? 'Available' : 'Keeping'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] font-semibold text-[#d4a017] mb-2">↓ Scroll for more games</p>

          <StepActions>
            <PrimaryButton onClick={() => goToStep(4)}>
              Continue with {availableCount} available →
            </PrimaryButton>
            <GhostButton onClick={() => goToStep(2)}>← Back</GhostButton>
          </StepActions>
        </div>
      )}

      {/* ── Step 4: Pricing ── */}
      {step === 4 && (
        <div className="flex flex-col flex-1">
          <StepIndicator current={4} total={totalSteps} />
          <StepHeadline>Set your price</StepHeadline>
          <StepSubhead>This applies to all {availableCount} available games. You can always change individual prices later from your dashboard.</StepSubhead>

          {/* Big price input */}
          <div className="flex items-center gap-5 mb-6">
            <input
              type="text"
              value={bulkPrice ? `$${bulkPrice}` : ''}
              onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setBulkPrice(v); }}
              onBlur={applyBulkPrice}
              placeholder="$0"
              className="w-[180px] h-16 px-5 border-2 border-[#eceae5] rounded-xl text-[28px] font-bold text-[#1a1a1a] text-center bg-white outline-none focus:border-[#2c2a2b]"
            />
            <div>
              <p className="text-sm text-[#8e8985]">Per ticket across all games</p>
              <p className="text-sm text-[#8e8985]">{selectedSeats.size} seats × {availableCount} games = <span className="font-bold text-[#2d6a4f]">${(parseInt(bulkPrice) || 0) * selectedSeats.size * availableCount} potential</span></p>
              <button onClick={() => setShowPerGame(!showPerGame)} className="text-[13px] font-semibold text-[#d4a017] bg-transparent border-none cursor-pointer mt-1">
                {showPerGame ? 'Hide per-game pricing ↑' : 'Customize per game ↓'}
              </button>
            </div>
          </div>

          <InlineNote>Most holders charge the same for all games. You can bump up rivalry matchups from your dashboard anytime.</InlineNote>

          {/* Per-game pricing */}
          {showPerGame && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 max-h-[280px] overflow-y-auto mb-4">
              {Object.entries(gamesByMonth).map(([month, games]) =>
                games.filter(({ index }) => selectedGames.has(index) && availability[index] === 'available').map(({ game, index }) => {
                  const d = new Date(game.date);
                  const isDefault = prices[index] === (parseInt(bulkPrice) || 0);
                  return (
                    <div key={index} className="flex items-center gap-3 py-2.5 border-b border-[#f0ede8]">
                      <div className="w-[3px] h-7 rounded-sm shrink-0" style={{ backgroundColor: getOpponentColor(game.opponent) }} />
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-[#1a1a1a]">vs {game.opponent.split(' ').pop()}</p>
                        <p className="text-[11px] text-[#8e8985]">{MONTH_NAMES[d.getMonth()].slice(0, 3)} {d.getDate()}</p>
                      </div>
                      <input
                        type="text"
                        value={`$${prices[index] || 0}`}
                        onChange={(e) => { const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; setPrices((prev) => ({ ...prev, [index]: v })); }}
                        className={`w-[72px] h-9 px-2.5 border-[1.5px] border-[#eceae5] rounded-lg text-sm font-bold text-right bg-white outline-none focus:border-[#2c2a2b] ${isDefault ? 'text-[#ccc]' : 'text-[#1a1a1a]'}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}

          <StepActions>
            <PrimaryButton onClick={() => { applyBulkPrice(); goToStep(5); }}>Continue →</PrimaryButton>
            <GhostButton onClick={() => goToStep(3)}>← Back</GhostButton>
            <SkipLink onClick={() => goToStep(5)}>I&apos;ll set prices later →</SkipLink>
          </StepActions>
        </div>
      )}

      {/* ── Step 5: Get Paid ── */}
      {step === 5 && (
        <div className="flex flex-col flex-1">
          <StepIndicator current={5} total={totalSteps} />
          <StepHeadline>How should friends pay you?</StepHeadline>
          <StepSubhead>We&apos;ll show this on your share page so friends know where to send payment.</StepSubhead>

          <div className="flex flex-col gap-3 mb-6">
            {/* Venmo */}
            <div className={`rounded-xl border-[1.5px] p-5 cursor-pointer transition-all ${venmoHandle ? 'border-[#2d6a4f] bg-[#f0fdf4]' : 'border-[#eceae5] bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-lg bg-[#e0f2fe] flex items-center justify-center text-lg font-bold text-[#0369a1]">V</div>
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-[#1a1a1a]">Venmo</p>
                  <input
                    value={venmoHandle}
                    onChange={(e) => setVenmoHandle(e.target.value)}
                    placeholder="@your-handle"
                    className="mt-1 w-full text-sm bg-transparent border-none outline-none text-[#1a1a1a] placeholder:text-[#ccc]"
                  />
                </div>
              </div>
            </div>

            {/* Zelle */}
            <div className={`rounded-xl border-[1.5px] p-5 cursor-pointer transition-all ${zelleInfo ? 'border-[#2d6a4f] bg-[#f0fdf4]' : 'border-[#eceae5] bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-lg bg-[#f3e8ff] flex items-center justify-center text-lg font-bold text-[#7c3aed]">Z</div>
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-[#1a1a1a]">Zelle</p>
                  <input
                    value={zelleInfo}
                    onChange={(e) => setZelleInfo(e.target.value)}
                    placeholder="Phone or email"
                    className="mt-1 w-full text-sm bg-transparent border-none outline-none text-[#1a1a1a] placeholder:text-[#ccc]"
                  />
                </div>
              </div>
            </div>

            {/* Cash */}
            <div className="rounded-xl border-[1.5px] border-[#eceae5] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-lg bg-[#f3f4f6] flex items-center justify-center text-lg font-bold text-[#6b7280]">$</div>
                <div>
                  <p className="text-[15px] font-bold text-[#1a1a1a]">Cash / Other</p>
                  <p className="text-xs text-[#8e8985] mt-0.5">Handle payments yourself</p>
                </div>
              </div>
            </div>
          </div>

          <StepActions>
            <PrimaryButton onClick={createPackage} disabled={loading}>
              {loading ? 'Creating...' : 'Finish Setup →'}
            </PrimaryButton>
            <GhostButton onClick={() => goToStep(4)}>← Back</GhostButton>
            <SkipLink onClick={createPackage}>I&apos;ll add this later →</SkipLink>
          </StepActions>
        </div>
      )}
    </SetupLayout>
  );
}
