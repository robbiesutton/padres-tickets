// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface SeatViewPhoto {
  imageUrl: string;
  section: string;
  row: string;
  rating: number;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function NewPackagePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Team
  const [teams, setTeams] = useState<MlbTeam[]>([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<MlbTeam | null>(null);
  const [season] = useState(new Date().getFullYear().toString());

  // Step 2: Seats
  const [sections, setSections] = useState<StadiumSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<StadiumSection | null>(null);
  const [rows, setRows] = useState<string[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [sectionTags, setSectionTags] = useState<string[]>([]);
  const [row, setRow] = useState('');
  const [seats, setSeats] = useState('');
  const [seatCount, setSeatCount] = useState('2');
  const [seatViewPhoto, setSeatViewPhoto] = useState<string | null>(null);
  const [seatViewLoading, setSeatViewLoading] = useState(false);

  // Step 3: Package selection
  const [packages, setPackages] = useState<SeasonPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SeasonPackage | null>(null);

  // Step 4: Schedule
  const [schedule, setSchedule] = useState<ScheduleGame[]>([]);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Step 5: Defaults
  const [defaultPrice, setDefaultPrice] = useState('');

  // Step 6: Result
  const [result, setResult] = useState<{
    shareLink: string;
    gamesCreated: number;
  } | null>(null);

  // Load teams on mount
  useEffect(() => {
    async function load() {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams);
        setTeamsLoaded(true);
      }
    }
    load();
  }, []);

  // Load sections when team changes
  useEffect(() => {
    if (!selectedTeam) return;
    setSectionsLoading(true);
    setSections([]);
    setSelectedSection(null);
    setRows([]);
    setRow('');
    setSeatViewPhoto(null);

    fetch(`/api/stadiums/${selectedTeam.abbreviation}/sections`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSections(data.sections);
      })
      .finally(() => setSectionsLoading(false));

    // Also load packages
    fetch(`/api/stadiums/${selectedTeam.abbreviation}/packages`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPackages(data.packages);
      });
  }, [selectedTeam]);

  // Load rows when section changes
  useEffect(() => {
    if (!selectedTeam || !selectedSection) return;
    setRowsLoading(true);
    setRow('');

    fetch(
      `/api/stadiums/${selectedTeam.abbreviation}/sections/${selectedSection.id}/rows`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setRows(data.rows);
          setSectionTags(data.tags || []);
        }
      })
      .finally(() => setRowsLoading(false));

    // Fetch seat view photo
    setSeatViewLoading(true);
    setSeatViewPhoto(null);
    fetch(
      `/api/stadiums/${selectedTeam.abbreviation}/seat-view?section=${selectedSection.id}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.photos?.length > 0) {
          setSeatViewPhoto(data.photos[0].imageUrl);
        }
      })
      .finally(() => setSeatViewLoading(false));
  }, [selectedTeam, selectedSection]);

  async function loadSchedule() {
    if (!selectedTeam) return;
    setScheduleLoading(true);
    try {
      const res = await fetch(
        `/api/schedule/${selectedTeam.id}?season=${season}`
      );
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.games);

        // Auto-select games based on package filter
        if (selectedPackage?.gameFilter) {
          const filter = selectedPackage.gameFilter;
          const selected = new Set<number>();

          data.games.forEach((game: ScheduleGame, i: number) => {
            if (filter.all) {
              selected.add(i);
              return;
            }
            const d = new Date(game.date);
            const dow = d.getDay(); // 0=Sun, 6=Sat

            if (filter.dayOfWeek && filter.dayOfWeek.includes(dow)) {
              selected.add(i);
            } else if (filter.fridays && dow === 5) {
              selected.add(i);
            } else if (filter.saturdays && dow === 6) {
              selected.add(i);
            } else if (filter.sundays && dow === 0) {
              selected.add(i);
            } else if (filter.weekendsOnly && (dow === 0 || dow === 5 || dow === 6)) {
              selected.add(i);
            }
          });

          // If no filter matched or it's a curated plan, select all
          if (selected.size === 0) {
            data.games.forEach((_: unknown, i: number) => selected.add(i));
          }

          setSelectedGames(selected);
        } else {
          // Select all by default
          setSelectedGames(
            new Set(data.games.map((_: unknown, i: number) => i))
          );
        }
      }
    } finally {
      setScheduleLoading(false);
    }
  }

  async function createPackage() {
    if (!selectedTeam) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          section: selectedSection?.id || '',
          row: row || undefined,
          seats,
          seatCount,
          season,
          defaultPricePerTicket: defaultPrice || undefined,
          autoLoadSchedule: true,
          seatPhotoUrl: seatViewPhoto || undefined,
          perks: sectionTags.length > 0 ? sectionTags : undefined,
          description: selectedSection
            ? `${selectedSection.level} seats at ${selectedTeam.venue}`
            : undefined,
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
      setStep(6);
    } finally {
      setLoading(false);
    }
  }

  function toggleGame(index: number) {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const totalSteps = 5;

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Set Up Your Package</h1>
          {step <= totalSteps && (
            <div className="mt-3 flex gap-1">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${
                    s <= step ? 'bg-brand-600' : 'bg-foreground/10'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Step 1: Team Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Select Your Team</h2>
            <p className="text-sm text-foreground/60">
              MLB is supported. Other leagues coming soon.
            </p>
            {teams.length === 0 ? (
              <p className="text-sm text-foreground/50">Loading teams...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'border-brand-600 bg-brand-50 text-brand-900'
                        : 'border-foreground/10 hover:border-foreground/30'
                    }`}
                  >
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-foreground/50">{team.venue}</p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => selectedTeam && setStep(2)}
              disabled={!selectedTeam}
              className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Seat Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Seat Details</h2>
            <p className="text-sm text-foreground/60">
              {selectedTeam?.name} at {selectedTeam?.venue}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Section dropdown */}
              <div>
                <label className="block text-sm font-medium">Section</label>
                {sectionsLoading ? (
                  <p className="mt-1 text-sm text-foreground/50">Loading sections...</p>
                ) : (
                  <select
                    value={selectedSection?.id || ''}
                    onChange={(e) => {
                      const s = sections.find((s) => s.id === e.target.value);
                      setSelectedSection(s || null);
                    }}
                    className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                  >
                    <option value="">Select section...</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.level}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Row dropdown */}
              <div>
                <label className="block text-sm font-medium">Row</label>
                {rowsLoading ? (
                  <p className="mt-1 text-sm text-foreground/50">Loading rows...</p>
                ) : rows.length > 0 ? (
                  <select
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                  >
                    <option value="">Select row...</option>
                    {rows.map((r) => (
                      <option key={r} value={r}>
                        Row {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    placeholder="e.g., 10"
                    className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Seats</label>
                <input
                  type="text"
                  required
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  placeholder="e.g., 3-4"
                  className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Number of Seats
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={seatCount}
                  onChange={(e) => setSeatCount(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Section tags */}
            {sectionTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sectionTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-foreground/10 px-3 py-1 text-xs text-foreground/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Seat view preview */}
            {selectedSection && (
              <div>
                {seatViewLoading ? (
                  <p className="text-sm text-foreground/50">Loading seat view...</p>
                ) : seatViewPhoto ? (
                  <div className="rounded-lg overflow-hidden border border-foreground/10">
                    <img
                      src={seatViewPhoto}
                      alt={`View from Section ${selectedSection.id}`}
                      className="w-full h-48 object-cover"
                    />
                    <p className="px-3 py-2 text-xs text-foreground/50">
                      View from Section {selectedSection.id} &middot; {selectedSection.level}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-foreground/10 p-4 text-center text-sm text-foreground/40">
                    No seat view photo available for this section
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-foreground/20 px-6 py-2 text-sm"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (selectedSection && seats && seatCount) setStep(3);
                }}
                disabled={!selectedSection || !seats || !seatCount}
                className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Package Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Select Your Package</h2>
            <p className="text-sm text-foreground/60">
              Which season ticket package do you have? This helps us pre-select the right games.
            </p>

            <div className="space-y-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedPackage?.id === pkg.id
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-foreground/10 hover:border-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-foreground/60">{pkg.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-foreground/5 px-3 py-1 text-sm font-medium">
                      {pkg.gameCount} games
                    </span>
                  </div>
                </button>
              ))}

              {/* Custom option */}
              <button
                onClick={() =>
                  setSelectedPackage({
                    id: 'custom',
                    name: 'Custom',
                    gameCount: 0,
                    description: 'I\'ll select my games manually',
                  })
                }
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selectedPackage?.id === 'custom'
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-foreground/10 hover:border-foreground/30'
                }`}
              >
                <p className="font-medium">Custom</p>
                <p className="text-sm text-foreground/60">
                  I&apos;ll select my games manually
                </p>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-foreground/20 px-6 py-2 text-sm"
              >
                Back
              </button>
              <button
                onClick={() => {
                  loadSchedule();
                  setStep(4);
                }}
                disabled={!selectedPackage}
                className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Schedule Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Review Schedule</h2>
            <p className="text-sm text-foreground/60">
              {selectedPackage?.name !== 'Custom' && selectedPackage ? (
                <>
                  Games pre-selected for your <strong>{selectedPackage.name}</strong> package.{' '}
                  You can adjust if needed.
                </>
              ) : (
                <>
                  {schedule.length} home games loaded for {season}. Select the games
                  in your package.
                </>
              )}
            </p>
            {scheduleLoading ? (
              <p className="py-8 text-center text-foreground/50">
                Loading schedule...
              </p>
            ) : (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {schedule.map((game, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 rounded-lg p-2 text-sm hover:bg-foreground/5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGames.has(i)}
                      onChange={() => toggleGame(i)}
                    />
                    <span className="w-24 text-foreground/60">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </span>
                    <span>{game.opponent}</span>
                    <span className="text-foreground/40">{game.time}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-foreground/40">
              {selectedGames.size} of {schedule.length} games selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="rounded-lg border border-foreground/20 px-6 py-2 text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={selectedGames.size === 0}
                className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Defaults */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Set Defaults</h2>
            <div>
              <label className="block text-sm font-medium">
                Default Price Per Ticket
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-foreground/60">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder="0 = free"
                  className="block w-40 rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-foreground/40">
                Leave blank or set to 0 for free tickets.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="rounded-lg border border-foreground/20 px-6 py-2 text-sm"
              >
                Back
              </button>
              <button
                onClick={createPackage}
                disabled={loading}
                className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Package'}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Done */}
        {step === 6 && result && (
          <div className="space-y-4">
            <div className="text-center text-4xl">&#10003;</div>
            <h2 className="text-center text-lg font-bold">Package Created!</h2>
            <div className="rounded-lg bg-foreground/5 p-4 text-sm">
              <p>
                <strong>{selectedTeam?.name}</strong> &middot; Section{' '}
                {selectedSection?.id || ''}
                {row ? `, Row ${row}` : ''} &middot; {seatCount} seats
              </p>
              <p className="text-foreground/60">
                {result.gamesCreated} games loaded for {season}
              </p>
              {selectedPackage && selectedPackage.id !== 'custom' && (
                <p className="text-foreground/60">
                  Package: {selectedPackage.name}
                </p>
              )}
            </div>
            {seatViewPhoto && (
              <div className="rounded-lg overflow-hidden border border-foreground/10">
                <img
                  src={seatViewPhoto}
                  alt="Seat view"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
            <div className="rounded-lg border border-foreground/10 p-4">
              <p className="text-sm font-medium">Your share link:</p>
              <p className="mt-1 font-mono text-brand-600">
                {window.location.origin}
                {result.shareLink}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}${result.shareLink}`
                  );
                }}
                className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Copy Link
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-lg border border-foreground/20 px-6 py-2 text-sm"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
