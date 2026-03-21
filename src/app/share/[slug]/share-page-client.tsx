// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';

interface Game {
  id: string;
  date: string;
  time: string | null;
  opponent: string;
  opponentLogo: string | null;
  status: string;
  pricePerTicket: number | null;
  notes: string | null;
}

interface Props {
  slug: string;
  holderName: string;
  team: string;
  section: string;
  row: string | null;
  seats: string;
  seatCount: number;
  season: string;
  games: Game[];
  opponents: string[];
}

export function SharePageClient({
  slug,
  holderName,
  team,
  section,
  row,
  seatCount,
  season,
  games,
  opponents,
}: Props) {
  const { data: session } = useSession();
  const [monthFilter, setMonthFilter] = useState('');
  const [opponentFilter, setOpponentFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [claimingGameId, setClaimingGameId] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<{
    gameId: string;
    success: boolean;
    message: string;
  } | null>(null);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (availableOnly && g.status !== 'AVAILABLE') return false;
      if (monthFilter) {
        const gameMonth = new Date(g.date).getMonth() + 1;
        if (gameMonth !== parseInt(monthFilter)) return false;
      }
      if (opponentFilter && g.opponent !== opponentFilter) return false;
      return true;
    });
  }, [games, monthFilter, opponentFilter, availableOnly]);

  // Get unique months from games
  const months = useMemo(() => {
    const monthSet = new Set<number>();
    games.forEach((g) => monthSet.add(new Date(g.date).getMonth() + 1));
    return [...monthSet].sort((a, b) => a - b);
  }, [games]);

  async function handleClaim(gameId: string) {
    if (!session) {
      // Redirect to login with return URL
      window.location.href = `/login?callbackUrl=/share/${slug}`;
      return;
    }

    setClaimingGameId(gameId);
    setClaimResult(null);

    try {
      const res = await fetch(`/api/share/${slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });

      const data = await res.json();

      if (res.ok) {
        setClaimResult({
          gameId,
          success: true,
          message: 'Tickets claimed! Check your email for next steps.',
        });
      } else {
        setClaimResult({
          gameId,
          success: false,
          message: data.error || 'Failed to claim tickets',
        });
      }
    } catch {
      setClaimResult({
        gameId,
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setClaimingGameId(null);
    }
  }

  const monthNames = [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {holderName}&apos;s {team} Tickets
          </h1>
          <p className="text-sm text-foreground/60">
            {season} &middot; Section {section}
            {row ? `, Row ${row}` : ''} &middot; {seatCount} seats
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm"
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthNames[m]}
              </option>
            ))}
          </select>

          <select
            value={opponentFilter}
            onChange={(e) => setOpponentFilter(e.target.value)}
            className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm"
          >
            <option value="">All opponents</option>
            {opponents.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            Available only
          </label>

          <span className="text-sm text-foreground/50">
            {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Game list */}
        <div className="space-y-3">
          {filteredGames.map((game) => {
            const d = new Date(game.date);
            const isAvailable = game.status === 'AVAILABLE';
            const isClaiming = claimingGameId === game.id;
            const result = claimResult?.gameId === game.id ? claimResult : null;

            return (
              <div
                key={game.id}
                className="flex items-center justify-between rounded-lg border border-foreground/10 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{game.opponent}</p>
                  <p className="text-sm text-foreground/60">
                    {d.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {game.time ? ` at ${game.time}` : ''}
                  </p>
                  {result && (
                    <p
                      className={`mt-1 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {result.message}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {game.pricePerTicket !== null && game.pricePerTicket > 0 ? (
                    <span className="text-sm text-foreground/60">
                      ${game.pricePerTicket}/ticket
                    </span>
                  ) : game.pricePerTicket === 0 ? (
                    <span className="text-sm text-green-600">Free</span>
                  ) : null}

                  {isAvailable && !result?.success ? (
                    <button
                      onClick={() => handleClaim(game.id)}
                      disabled={isClaiming}
                      className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {isClaiming
                        ? 'Claiming...'
                        : session
                          ? 'Claim'
                          : 'Sign in to Claim'}
                    </button>
                  ) : (
                    <span className="rounded-full bg-foreground/10 px-4 py-1.5 text-sm text-foreground/50">
                      {result?.success
                        ? 'Claimed!'
                        : game.status.replace('_', ' ').toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredGames.length === 0 && (
            <p className="py-12 text-center text-foreground/50">
              No games match your filters. Try adjusting them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
