// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MlbTeam {
  id: number;
  name: string;
  abbreviation: string;
  venue: string;
}

interface ScheduleGame {
  date: string;
  time: string;
  gameDate: string;
  opponent: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

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
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seats, setSeats] = useState('');
  const [seatCount, setSeatCount] = useState('2');

  // Step 3: Schedule
  const [schedule, setSchedule] = useState<ScheduleGame[]>([]);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Step 4: Defaults
  const [defaultPrice, setDefaultPrice] = useState('');

  // Step 5: Result
  const [result, setResult] = useState<{
    shareLink: string;
    gamesCreated: number;
  } | null>(null);

  async function loadTeams() {
    if (teamsLoaded) return;
    const res = await fetch('/api/teams');
    if (res.ok) {
      const data = await res.json();
      setTeams(data.teams);
      setTeamsLoaded(true);
    }
  }

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
        setSelectedGames(new Set(data.games.map((_: unknown, i: number) => i)));
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
          section,
          row: row || undefined,
          seats,
          seatCount,
          season,
          defaultPricePerTicket: defaultPrice || undefined,
          autoLoadSchedule: true,
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
      setStep(5);
    } finally {
      setLoading(false);
    }
  }

  function toggleGame(index: number) {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  // Load teams on mount
  if (!teamsLoaded) loadTeams();

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Set Up Your Package</h1>
          {step < 5 && (
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4].map((s) => (
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
              onClick={() => {
                if (selectedTeam) setStep(2);
              }}
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
              <div>
                <label className="block text-sm font-medium">Section</label>
                <input
                  type="text"
                  required
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., 143"
                  className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Row</label>
                <input
                  type="text"
                  value={row}
                  onChange={(e) => setRow(e.target.value)}
                  placeholder="e.g., 10"
                  className="mt-1 block w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                />
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
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-foreground/20 px-6 py-2 text-sm"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (section && seats && seatCount) {
                    loadSchedule();
                    setStep(3);
                  }
                }}
                disabled={!section || !seats || !seatCount}
                className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Review Schedule</h2>
            <p className="text-sm text-foreground/60">
              {schedule.length} home games loaded for {season}. Uncheck any
              games not in your package.
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
                onClick={() => setStep(2)}
                className="rounded-lg border border-foreground/20 px-6 py-2 text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={selectedGames.size === 0}
                className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Defaults */}
        {step === 4 && (
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
                onClick={() => setStep(3)}
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

        {/* Step 5: Done */}
        {step === 5 && result && (
          <div className="space-y-4">
            <div className="text-center text-4xl">&#10003;</div>
            <h2 className="text-center text-lg font-bold">Package Created!</h2>
            <div className="rounded-lg bg-foreground/5 p-4 text-sm">
              <p>
                <strong>{selectedTeam?.name}</strong> &middot; Section {section}
                {row ? `, Row ${row}` : ''} &middot; {seatCount} seats
              </p>
              <p className="text-foreground/60">
                {result.gamesCreated} games loaded for {season}
              </p>
            </div>
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
