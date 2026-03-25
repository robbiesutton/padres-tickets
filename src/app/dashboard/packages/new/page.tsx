'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Component ──────────────────────────────────────────

export default function NewPackagePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Step 1: League
  const [league, setLeague] = useState('');

  // Step 2: Team
  const [teams, setTeams] = useState<MlbTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<MlbTeam | null>(null);
  const [season] = useState(new Date().getFullYear().toString());

  // Step 3: Package
  const [packages, setPackages] = useState<SeasonPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SeasonPackage | null>(null);

  // Step 4: Seats
  const [sections, setSections] = useState<StadiumSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<StadiumSection | null>(null);
  const [rows, setRows] = useState<string[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [sectionTags, setSectionTags] = useState<string[]>([]);
  const [row, setRow] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());

  // Step 5: Schedule
  const [schedule, setSchedule] = useState<ScheduleGame[]>([]);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Step 6: Availability
  const [availability, setAvailability] = useState<Record<number, 'available' | 'keeping'>>({});

  // Step 7: Pricing
  const [prices, setPrices] = useState<Record<number, number>>({});
  const [bulkPrice, setBulkPrice] = useState('');

  // Step 8: Payment
  const [venmoHandle, setVenmoHandle] = useState('');
  const [zelleInfo, setZelleInfo] = useState('');
  const [venmoExpanded, setVenmoExpanded] = useState(false);
  const [zelleExpanded, setZelleExpanded] = useState(false);

  // Step 9: Share link
  const [linkSlug, setLinkSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ shareLink: string; gamesCreated: number } | null>(null);

  // Subscription status
  const [subscribed, setSubscribed] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const status = data.subscription?.status;
        setSubscribed(status === 'ACTIVE' || status === 'TRIALING');
      })
      .catch(() => {});
  }, []);

  // ─── Data loading ───────────────────────────────────

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setTeams(data.teams); });
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    setSectionsLoading(true);
    setSections([]);
    setSelectedSection(null);
    setRows([]);
    setRow('');
    setSelectedSeats(new Set());

    fetch(`/api/stadiums/${selectedTeam.abbreviation}/sections`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setSections(data.sections); })
      .finally(() => setSectionsLoading(false));

    fetch(`/api/stadiums/${selectedTeam.abbreviation}/packages`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setPackages(data.packages); });
  }, [selectedTeam]);

  useEffect(() => {
    if (!selectedTeam || !selectedSection) return;
    setRowsLoading(true);
    setRow('');

    fetch(`/api/stadiums/${selectedTeam.abbreviation}/sections/${selectedSection.id}/rows`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setRows(data.rows);
          setSectionTags(data.tags || []);
        }
      })
      .finally(() => setRowsLoading(false));
  }, [selectedTeam, selectedSection]);

  // ─── Schedule loading ─────────────────────────────────

  const loadSchedule = useCallback(async () => {
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
            const d = new Date(game.date);
            const dow = d.getDay();
            if (filter.dayOfWeek?.includes(dow)) selected.add(i);
            else if (filter.fridays && dow === 5) selected.add(i);
            else if (filter.saturdays && dow === 6) selected.add(i);
            else if (filter.sundays && dow === 0) selected.add(i);
            else if (filter.weekendsOnly && (dow === 0 || dow === 5 || dow === 6)) selected.add(i);
          });
          if (selected.size === 0) data.games.forEach((_: unknown, i: number) => selected.add(i));
        } else {
          data.games.forEach((_: unknown, i: number) => selected.add(i));
        }
        setSelectedGames(selected);

        // Initialize availability and prices for all games
        const avail: Record<number, 'available' | 'keeping'> = {};
        const pr: Record<number, number> = {};
        data.games.forEach((_: unknown, i: number) => {
          avail[i] = 'available';
          pr[i] = 0;
        });
        setAvailability(avail);
        setPrices(pr);
      }
    } finally {
      setScheduleLoading(false);
    }
  }, [selectedTeam, selectedPackage, season]);

  // ─── Derived data ─────────────────────────────────────

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

  const selectedGamesByMonth = useMemo(() => {
    const grouped: Record<string, { game: ScheduleGame; index: number }[]> = {};
    schedule.forEach((game, index) => {
      if (!selectedGames.has(index)) return;
      const d = new Date(game.date);
      const month = MONTH_NAMES[d.getMonth()];
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push({ game, index });
    });
    return grouped;
  }, [schedule, selectedGames]);

  const availableCount = useMemo(() => {
    return Array.from(selectedGames).filter((i) => availability[i] === 'available').length;
  }, [selectedGames, availability]);

  const pricedCount = useMemo(() => {
    return Array.from(selectedGames).filter(
      (i) => availability[i] === 'available'
    ).length;
  }, [selectedGames, availability]);

  // ─── Seat summary ─────────────────────────────────────

  const seatSummary = useMemo(() => {
    if (!selectedSection || !row || selectedSeats.size === 0) return '';
    const sorted = Array.from(selectedSeats).sort((a, b) => a - b);
    return `Section ${selectedSection.id}, Row ${row}, Seats ${sorted.join(' & ')}`;
  }, [selectedSection, row, selectedSeats]);

  // ─── Actions ──────────────────────────────────────────

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }

  function goToStep(s: Step) {
    setStep(s);
    window.scrollTo(0, 0);
  }

  function handleLeagueSelect(value: string) {
    const l = LEAGUES.find((l) => l.value === value);
    if (!l) return;
    if (!l.available) {
      showToast(`Coming soon! We'll notify you when ${l.label} is available.`);
      setLeague('');
      return;
    }
    setLeague(value);
  }

  function toggleGame(index: number) {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleAvailability(index: number) {
    setAvailability((prev) => ({
      ...prev,
      [index]: prev[index] === 'available' ? 'keeping' : 'available',
    }));
  }

  function setAllAvailability(value: 'available' | 'keeping') {
    setAvailability((prev) => {
      const next = { ...prev };
      selectedGames.forEach((i) => { next[i] = value; });
      return next;
    });
  }

  function applyBulkPrice() {
    const price = parseInt(bulkPrice) || 0;
    setPrices((prev) => {
      const next = { ...prev };
      selectedGames.forEach((i) => {
        if (availability[i] === 'available') next[i] = price;
      });
      return next;
    });
  }

  function makeAllFree() {
    setPrices((prev) => {
      const next = { ...prev };
      selectedGames.forEach((i) => {
        if (availability[i] === 'available') next[i] = 0;
      });
      return next;
    });
  }

  function toggleSeat(seatNum: number) {
    setSelectedSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seatNum)) next.delete(seatNum);
      else next.add(seatNum);
      return next;
    });
  }

  // ─── Slug checking ────────────────────────────────────

  useEffect(() => {
    if (!linkSlug || linkSlug.length < 2) {
      setSlugAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/packages/check-slug?slug=${encodeURIComponent(linkSlug)}`);
      if (res.ok) {
        const data = await res.json();
        setSlugAvailable(data.available);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [linkSlug]);

  // ─── Package creation ─────────────────────────────────

  async function createPackage() {
    if (!selectedTeam) return;
    setLoading(true);
    setError('');

    try {
      // Build per-game overrides
      const gameOverrides: Record<string, { status: string; pricePerTicket: number }> = {};
      const excludedDates: string[] = [];

      schedule.forEach((game, i) => {
        if (!selectedGames.has(i)) {
          excludedDates.push(game.gameDate);
          return;
        }
        gameOverrides[game.gameDate] = {
          status: availability[i] === 'keeping' ? 'GOING_MYSELF' : 'AVAILABLE',
          pricePerTicket: availability[i] === 'available' ? (prices[i] || 0) : 0,
        };
      });

      const seatsStr = Array.from(selectedSeats).sort((a, b) => a - b).join(', ');

      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          section: selectedSection?.id || '',
          row: row || undefined,
          seats: seatsStr || 'TBD',
          seatCount: selectedSeats.size || 2,
          season,
          autoLoadSchedule: true,
          seatPhotoUrl: undefined,
          perks: sectionTags.length > 0 ? sectionTags : undefined,
          description: selectedSection
            ? `${selectedSection.level} seats at ${selectedTeam.venue}`
            : undefined,
          gameOverrides,
          excludedDates,
          venmoHandle: venmoHandle || undefined,
          zelleInfo: zelleInfo || undefined,
          shareLinkSlug: linkSlug || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create package');
        return;
      }

      setResult({
        shareLink: data.shareLink,
        gamesCreated: data.gamesCreated,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    setSubLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
        setSubLoading(false);
      }
    } catch {
      setError('Something went wrong');
      setSubLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    const link = `${window.location.origin}${result.shareLink}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Game row helper ──────────────────────────────────

  function formatGameDate(game: ScheduleGame) {
    const d = new Date(game.date);
    return {
      month: MONTH_NAMES[d.getMonth()].substring(0, 3),
      date: d.getDate().toString().padStart(2, '0'),
      day: DAY_NAMES[d.getDay()],
    };
  }

  // ─── Progress ─────────────────────────────────────────

  const totalSteps = 9;
  const progressPct = result ? 100 : (step / totalSteps) * 100;

  // ─── Render ───────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 flex h-[60px] md:h-[77px] items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#1A1A1A] text-[10px] font-bold text-white">
            BB
          </div>
          <span className="text-[15px] font-semibold text-[#1A1A1A]">
            BenchBuddy / Set up your package
          </span>
        </div>
        <span className="text-[13px] font-medium text-[#8C8984]">{season} Season</span>
      </div>

      {/* Progress bar */}
      <div className="relative z-40 h-[2px] bg-[#ECEAE5]">
        <div
          className="h-full bg-[#2c2a2b] transition-all duration-400"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main container */}
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-[600px] flex-col px-5 py-10">

        {/* ─── STEP 1: SELECT LEAGUE ─── */}
        {step === 1 && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                What league are your season tickets for?
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                We support MLB today and are adding more leagues soon.
              </p>
            </div>
            <div className="rounded-xl border border-[#ECEAE5] bg-white p-5">
              <select
                value={league}
                onChange={(e) => handleLeagueSelect(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#ECEAE5] bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238C8984%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2Fpolyline%3E%3c%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat px-4 py-3 pr-10 text-base text-[#1A1A1A] transition-all hover:border-[#B5B1AB] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
              >
                <option value="">Select a league...</option>
                {LEAGUES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              {league && (
                <div className="mt-4 flex items-center justify-end">
                  <button
                    onClick={() => goToStep(2)}
                    className="rounded-lg bg-[#2c2a2b] px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#dcd7d4] hover:text-[#2c2a2b] active:translate-y-0"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 2: SELECT TEAM ─── */}
        {step === 2 && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                Which team do you have season tickets for?
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                Let&apos;s get ready for the season! We&apos;ll pull in your team&apos;s full home schedule.
              </p>
            </div>
            <div className="rounded-xl border border-[#ECEAE5] bg-white p-5">
              <select
                value={selectedTeam?.abbreviation || ''}
                onChange={(e) => {
                  const team = teams.find((t) => t.abbreviation === e.target.value);
                  setSelectedTeam(team || null);
                }}
                className="w-full appearance-none rounded-lg border border-[#ECEAE5] bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238C8984%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2Fpolyline%3E%3c%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat px-4 py-3 pr-10 text-base text-[#1A1A1A] transition-all hover:border-[#B5B1AB] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.abbreviation}>{team.name}</option>
                ))}
              </select>
              {selectedTeam && (
                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => goToStep(1)} className="text-sm text-[#2c2a2b]">
                    &larr; Back
                  </button>
                  <button
                    onClick={() => goToStep(3)}
                    className="rounded-lg bg-[#2c2a2b] px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#dcd7d4] hover:text-[#2c2a2b]"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 3: SELECT PACKAGE TYPE ─── */}
        {step === 3 && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                What kind of package do you have?
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                We&apos;ll find all the games in your plan and load them automatically.
              </p>
            </div>
            <div className="rounded-xl border border-[#ECEAE5] bg-white p-5">
              <select
                value={selectedPackage?.id || ''}
                onChange={(e) => {
                  const pkg = packages.find((p) => p.id === e.target.value);
                  if (e.target.value === 'custom') {
                    setSelectedPackage({ id: 'custom', name: 'Custom / Other', gameCount: 0, description: "I'll select my games manually" });
                  } else {
                    setSelectedPackage(pkg || null);
                  }
                }}
                className="w-full appearance-none rounded-lg border border-[#ECEAE5] bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238C8984%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2Fpolyline%3E%3c%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat px-4 py-3 pr-10 text-base text-[#1A1A1A] transition-all hover:border-[#B5B1AB] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
              >
                <option value="">Select a package...</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.gameCount} games)
                  </option>
                ))}
                <option value="custom">Custom / Other</option>
              </select>
              {selectedPackage && (
                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => goToStep(2)} className="text-sm text-[#2c2a2b]">
                    &larr; Back
                  </button>
                  <button
                    onClick={() => goToStep(4)}
                    className="rounded-lg bg-[#2c2a2b] px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#dcd7d4] hover:text-[#2c2a2b]"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 4: SEAT DETAILS ─── */}
        {step === 4 && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                Which seats do you have?
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                Your friends will see this when they browse your games.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Section */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Section</label>
                {sectionsLoading ? (
                  <p className="text-sm text-[#8C8984]">Loading sections...</p>
                ) : (
                  <select
                    value={selectedSection?.id || ''}
                    onChange={(e) => {
                      const s = sections.find((s) => s.id === e.target.value);
                      setSelectedSection(s || null);
                      setRow('');
                      setSelectedSeats(new Set());
                    }}
                    className="w-full appearance-none rounded-lg border border-[#ECEAE5] bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238C8984%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2Fpolyline%3E%3c%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat px-4 py-3 pr-10 text-base text-[#1A1A1A] transition-all hover:border-[#B5B1AB] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
                  >
                    <option value="">Select a section...</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.id} — {s.level}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Row */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Row</label>
                {rowsLoading ? (
                  <p className="text-sm text-[#8C8984]">Loading rows...</p>
                ) : (
                  <select
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    disabled={!selectedSection}
                    className="w-full appearance-none rounded-lg border border-[#ECEAE5] bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238C8984%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2Fpolyline%3E%3c%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat px-4 py-3 pr-10 text-base text-[#1A1A1A] transition-all disabled:opacity-50 hover:border-[#B5B1AB] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
                  >
                    <option value="">Select a row...</option>
                    {rows.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Seats - individual checkboxes */}
              {row && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Seats</label>
                  <div className="flex flex-col gap-1">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((seatNum) => (
                      <label
                        key={seatNum}
                        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#ECEAE5] px-2 py-2 transition-all hover:bg-[#F0EEEA]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSeats.has(seatNum)}
                          onChange={() => toggleSeat(seatNum)}
                          className="h-[18px] w-[18px] cursor-pointer accent-[#2c2a2b]"
                        />
                        <span className="text-sm">{seatNum}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Seat summary */}
              {seatSummary && (
                <div className="rounded-lg border border-[#9FE1CB] bg-[#E1F5EE] px-4 py-3 text-[15px] font-medium text-[#0F6E56]">
                  {seatSummary}
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[#ECEAE5] bg-[#F8F7F4] px-5 py-5">
              <button onClick={() => goToStep(3)} className="text-sm text-[#2c2a2b]">
                &larr; Back
              </button>
              <button
                onClick={() => {
                  loadSchedule();
                  goToStep(5);
                }}
                className="rounded-lg bg-[#2c2a2b] px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#dcd7d4] hover:text-[#2c2a2b]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 5: CONFIRM GAMES ─── */}
        {step === 5 && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                This is a big one — confirm your games
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                We pulled in the full {selectedTeam?.name} home schedule and highlighted the games in
                your package. Double-check that these are right — you can always change this later.
              </p>
            </div>

            {scheduleLoading ? (
              <p className="py-8 text-center text-[#8C8984]">Loading schedule...</p>
            ) : (
              <>
                <p className="text-sm text-[#8C8984]">
                  <span className="font-semibold text-[#1A1A1A]">{selectedGames.size} of {schedule.length}</span> games selected
                </p>

                <div className="flex flex-col gap-6">
                  {Object.entries(gamesByMonth).map(([month, games]) => (
                    <div key={month} className="flex flex-col gap-3">
                      <div className="text-sm font-semibold uppercase tracking-wider text-[#8C8984]">
                        {month} ({games.length} games)
                      </div>
                      {games.map(({ game, index }) => {
                        const { month: m, date, day } = formatGameDate(game);
                        const isSelected = selectedGames.has(index);
                        return (
                          <div
                            key={index}
                            onClick={() => toggleGame(index)}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border border-[#ECEAE5] px-4 py-3.5 transition-all hover:border-[#B5B1AB] ${
                              !isSelected ? 'bg-[#FAFAF8] opacity-50 hover:border-[#ECEAE5]' : 'bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleGame(index)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-5 w-5 shrink-0 cursor-pointer accent-[#2c2a2b]"
                            />
                            <span className="min-w-[45px] text-sm font-semibold text-[#1A1A1A]">
                              {m} {date}
                            </span>
                            <span className="min-w-[35px] text-[13px] text-[#B5B1AB]">{day}</span>
                            <span className="min-w-[55px] text-[13px] text-[#B5B1AB]">{game.time}</span>
                            <span className="flex flex-1 items-center gap-2 text-sm font-medium text-[#1A1A1A]">
                              <span className="h-2 w-2 rounded-full bg-[#2c2a2b]" />
                              vs {game.opponent}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[#ECEAE5] bg-[#F8F7F4] px-5 py-5">
              <button onClick={() => goToStep(4)} className="text-sm text-[#2c2a2b]">
                &larr; Back
              </button>
              <button
                onClick={() => goToStep(6)}
                className="rounded-lg bg-[#2c2a2b] px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#dcd7d4] hover:text-[#2c2a2b]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 6: SET AVAILABILITY ─── */}
        {step === 6 && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                Which games do you want to share?
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                Mark the games you want to make available to friends. You can keep any for yourself.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[#8C8984]">
                <span className="font-semibold text-[#1A1A1A]">{availableCount} of {selectedGames.size}</span> games available to share
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAllAvailability('available')}
                  className="rounded-md border border-[#ECEAE5] bg-white px-3 py-2 text-[13px] text-[#1A1A1A] transition-all hover:border-[#2c2a2b] hover:text-[#2c2a2b]"
                >
                  All available
                </button>
                <button
                  onClick={() => setAllAvailability('keeping')}
                  className="rounded-md border border-[#ECEAE5] bg-white px-3 py-2 text-[13px] text-[#1A1A1A] transition-all hover:border-[#2c2a2b] hover:text-[#2c2a2b]"
                >
                  All keeping
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {Object.entries(selectedGamesByMonth).map(([month, games]) => (
                <div key={month} className="flex flex-col gap-3">
                  <div className="text-sm font-semibold uppercase tracking-wider text-[#8C8984]">
                    {month} ({games.length} games)
                  </div>
                  {games.map(({ game, index }) => {
                    const { month: m, date, day } = formatGameDate(game);
                    const avail = availability[index] || 'available';
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-lg border border-[#ECEAE5] bg-white px-4 py-3.5 transition-all hover:border-[#B5B1AB]"
                      >
                        <span className="min-w-[45px] text-sm font-semibold text-[#1A1A1A]">
                          {m} {date}
                        </span>
                        <span className="min-w-[35px] text-[13px] text-[#B5B1AB]">{day}</span>
                        <span className="min-w-[55px] text-[13px] text-[#B5B1AB]">{game.time}</span>
                        <span className="flex flex-1 items-center gap-2 text-sm font-medium text-[#1A1A1A]">
                          <span className="h-2 w-2 rounded-full bg-[#2c2a2b]" />
                          vs {game.opponent}
                        </span>
                        <button
                          onClick={() => toggleAvailability(index)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                            avail === 'available'
                              ? 'bg-[#E1F5EE] text-[#0F6E56]'
                              : 'bg-[#f5f4f2] text-[#2c2a2b]'
                          }`}
                        >
                          {avail === 'available' ? 'Available' : 'Keeping'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[#ECEAE5] bg-[#F8F7F4] px-5 py-5">
              <button onClick={() => goToStep(5)} className="text-sm text-[#2c2a2b]">
                &larr; Back
              </button>
              <button
                onClick={() => goToStep(7)}
                className="rounded-lg bg-[#2c2a2b] px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#dcd7d4] hover:text-[#2c2a2b]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 7: SET PRICING ─── */}
        {step === 7 && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                How much per ticket?
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                Set a price for each game you&apos;re sharing, or make them free. You can always change these later.
              </p>
            </div>

            {/* Bulk tools */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#8C8984]">Set all to</span>
                <input
                  type="number"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="65"
                  className="w-20 rounded-lg border border-[#ECEAE5] bg-white px-3 py-2 text-[13px] text-[#1A1A1A] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
                />
                <button
                  onClick={applyBulkPrice}
                  className="rounded-md bg-[#2c2a2b] px-3 py-2 text-[13px] font-semibold text-white"
                >
                  Apply
                </button>
              </div>
              <button
                onClick={makeAllFree}
                className="rounded-md border border-[#ECEAE5] bg-white px-3 py-2 text-[13px] text-[#1A1A1A] transition-all hover:border-[#2c2a2b] hover:text-[#2c2a2b]"
              >
                Make all free
              </button>
            </div>

            <p className="text-sm text-[#8C8984]">
              <span className="font-semibold text-[#1A1A1A]">{pricedCount}</span> games priced
            </p>

            <div className="flex flex-col gap-6">
              {Object.entries(selectedGamesByMonth).map(([month, games]) => (
                <div key={month} className="flex flex-col gap-3">
                  <div className="text-sm font-semibold uppercase tracking-wider text-[#8C8984]">
                    {month} ({games.length} games)
                  </div>
                  {games.map(({ game, index }) => {
                    const { month: m, date, day } = formatGameDate(game);
                    const isKeeping = availability[index] === 'keeping';
                    return (
                      <div
                        key={index}
                        className={`flex flex-wrap items-center gap-3 rounded-lg border border-[#ECEAE5] px-4 py-3.5 transition-all ${
                          isKeeping ? 'bg-[#FAFAF8] opacity-50' : 'bg-white'
                        }`}
                      >
                        <span className="min-w-[45px] text-sm font-semibold text-[#1A1A1A]">
                          {m} {date}
                        </span>
                        <span className="min-w-[35px] text-[13px] text-[#B5B1AB]">{day}</span>
                        <span className="min-w-[55px] text-[13px] text-[#B5B1AB]">{game.time}</span>
                        <span className="flex flex-1 items-center gap-2 text-sm font-medium text-[#1A1A1A]">
                          <span className="h-2 w-2 rounded-full bg-[#2c2a2b]" />
                          vs {game.opponent}
                        </span>
                        <span
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                            isKeeping
                              ? 'bg-[#f5f4f2] text-[#2c2a2b]'
                              : 'bg-[#E1F5EE] text-[#0F6E56]'
                          }`}
                        >
                          {isKeeping ? 'Keeping' : 'Available'}
                        </span>
                        {!isKeeping && (
                          <div className="flex items-center gap-0.5 text-sm font-medium text-[#1A1A1A]">
                            $
                            <input
                              type="number"
                              value={prices[index] ?? 0}
                              onChange={(e) =>
                                setPrices((prev) => ({
                                  ...prev,
                                  [index]: parseInt(e.target.value) || 0,
                                }))
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="w-20 rounded-lg border border-[#ECEAE5] bg-white px-2 py-1.5 text-right text-sm focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
                            />
                            <span className="text-[#8C8984]">/seat</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[#ECEAE5] bg-[#F8F7F4] px-5 py-5">
              <button onClick={() => goToStep(6)} className="text-sm text-[#2c2a2b]">
                &larr; Back
              </button>
              <button
                onClick={() => goToStep(8)}
                className="rounded-lg bg-[#2c2a2b] px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#dcd7d4] hover:text-[#2c2a2b]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 8: PAYMENT METHOD ─── */}
        {step === 8 && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                How should friends pay you?
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                We don&apos;t handle any money or ticket transfers — we just help you coordinate. Let your
                friends know the best way to pay you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
              {/* Venmo */}
              <div
                onClick={() => setVenmoExpanded(true)}
                className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all ${
                  venmoExpanded
                    ? 'border-[#2c2a2b] bg-[#2c2a2b]/[0.02]'
                    : 'border-[#ECEAE5] bg-white hover:border-[#B5B1AB]'
                }`}
              >
                <div className="mb-3 text-base font-semibold text-[#1A1A1A]">Venmo</div>
                {venmoExpanded && (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={venmoHandle}
                      onChange={(e) => setVenmoHandle(e.target.value)}
                      placeholder="@username"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg border border-[#ECEAE5] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
                    />
                  </div>
                )}
              </div>

              {/* Zelle */}
              <div
                onClick={() => setZelleExpanded(true)}
                className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all ${
                  zelleExpanded
                    ? 'border-[#2c2a2b] bg-[#2c2a2b]/[0.02]'
                    : 'border-[#ECEAE5] bg-white hover:border-[#B5B1AB]'
                }`}
              >
                <div className="mb-3 text-base font-semibold text-[#1A1A1A]">Zelle</div>
                {zelleExpanded && (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={zelleInfo}
                      onChange={(e) => setZelleInfo(e.target.value)}
                      placeholder="Phone or email"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg border border-[#ECEAE5] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setVenmoHandle('');
                  setZelleInfo('');
                  goToStep(9);
                }}
                className="text-sm text-[#2c2a2b] hover:underline"
              >
                Skip — I&apos;ll handle payments on my own
              </button>
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[#ECEAE5] bg-[#F8F7F4] px-5 py-5">
              <button onClick={() => goToStep(7)} className="text-sm text-[#2c2a2b]">
                &larr; Back
              </button>
              <button
                onClick={async () => {
                  await createPackage();
                  if (!error) goToStep(9);
                }}
                disabled={loading}
                className="rounded-lg bg-[#2c2a2b] px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 9: ALL SET ─── */}
        {step === 9 && result && (
          <div className="flex animate-[fadeIn_0.4s_ease] flex-col gap-6">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight text-[#1A1A1A]">
                {subscribed ? 'You\u0027re all set!' : 'Your package is ready!'}
              </h1>
              <p className="mt-2 text-base text-[#8C8984]">
                {subscribed
                  ? 'Here\u0027s your personal sharing link. This is what your friends will see when you send it to them.'
                  : 'Subscribe to activate your package and start sharing with friends and family.'}
              </p>
            </div>

            {!subscribed && (
              <div className="flex flex-col gap-4 rounded-xl border-2 border-[#D4A843] bg-[#FFFDF7] p-6">
                <div>
                  <div className="text-lg font-semibold text-[#1A1A1A]">
                    Subscribe to BenchBuddy
                  </div>
                  <p className="mt-1 text-sm text-[#8C8984]">
                    Activate your package and share your season tickets.
                  </p>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-[#1A1A1A]">$39.99</span>
                    <span className="text-sm text-[#8C8984]"> / year</span>
                  </div>
                  <span className="text-sm font-medium text-[#0F6E56]">
                    First month free
                  </span>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="w-full rounded-lg bg-[#D4A843] px-5 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#C49A3A] disabled:opacity-50"
                >
                  {subLoading ? 'Loading...' : 'Subscribe Now'}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4 rounded-xl border border-[#ECEAE5] bg-white p-6">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Your share link
                </div>
                <p className="mt-2 text-[13px] text-[#B5B1AB]">
                  {subscribed
                    ? 'This is the link you\u0027ll text to friends and family'
                    : 'This link will be active once you subscribe'}
                </p>
              </div>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-[#ECEAE5]">
                <div className="flex items-center border-r border-[#ECEAE5] bg-[#F0EEEA] px-4 text-sm font-medium text-[#8C8984]">
                  getbenchbuddy.com/
                </div>
                <input
                  type="text"
                  value={result.shareLink.replace('/share/', '')}
                  readOnly
                  className="flex-1 border-none bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {subscribed && (
                <button
                  onClick={copyLink}
                  className={`w-full rounded-lg px-5 py-3.5 text-base font-semibold text-white transition-all ${
                    copied ? 'bg-[#0F6E56]' : 'bg-[#2c2a2b] hover:bg-[#dcd7d4] hover:text-[#2c2a2b]'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full rounded-lg border border-[#2c2a2b] bg-transparent px-5 py-3.5 text-base font-semibold text-[#2c2a2b] transition-all hover:bg-[#2c2a2b]/5"
              >
                Go to your dashboard &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && step !== 9 && (
          <div className="fixed bottom-20 left-1/2 z-[1000] max-w-[90%] -translate-x-1/2 rounded-lg bg-red-600 px-5 py-3.5 text-sm text-white">
            {error}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[1000] max-w-[90%] -translate-x-1/2 animate-[slideUp_0.3s_ease] rounded-lg bg-[#1A1A1A] px-5 py-3.5 text-sm text-white">
          {toast}
        </div>
      )}
    </>
  );
}
