// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState, useMemo } from 'react';
import { useSession, signIn } from 'next-auth/react';

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

type ModalState =
  | { type: 'none' }
  | { type: 'signup'; game: Game }
  | { type: 'confirm'; game: Game }
  | { type: 'success'; game: Game }
  | { type: 'error'; game: Game; message: string };

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
  const { data: session, update: updateSession } = useSession();
  const [monthFilter, setMonthFilter] = useState('');
  const [opponentFilter, setOpponentFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [loading, setLoading] = useState(false);
  const [claimedGameIds, setClaimedGameIds] = useState<Set<string>>(new Set());

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (
        availableOnly &&
        g.status !== 'AVAILABLE' &&
        !claimedGameIds.has(g.id)
      )
        return false;
      if (monthFilter) {
        const gameMonth = new Date(g.date).getMonth() + 1;
        if (gameMonth !== parseInt(monthFilter)) return false;
      }
      if (opponentFilter && g.opponent !== opponentFilter) return false;
      return true;
    });
  }, [games, monthFilter, opponentFilter, availableOnly, claimedGameIds]);

  const months = useMemo(() => {
    const monthSet = new Set<number>();
    games.forEach((g) => monthSet.add(new Date(g.date).getMonth() + 1));
    return [...monthSet].sort((a, b) => a - b);
  }, [games]);

  function handleClaimClick(game: Game) {
    if (!session) {
      setModal({ type: 'signup', game });
    } else {
      setModal({ type: 'confirm', game });
    }
  }

  async function handleSignupAndClaim(game: Game) {
    setLoading(true);
    try {
      // Create light account via magic link endpoint
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });

      if (!res.ok) {
        const data = await res.json();
        setModal({ type: 'error', game, message: data.error });
        return;
      }

      // Sign in with credentials if they set a password, or just proceed
      // For light accounts, sign in directly via the signup endpoint
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signupForm,
          password: crypto.randomUUID(), // Temporary password for light account
          role: 'CLAIMER',
        }),
      });

      if (signupRes.status === 409) {
        // Account already exists — prompt login
        setModal({
          type: 'error',
          game,
          message:
            'An account with this email already exists. Please sign in first.',
        });
        return;
      }

      if (!signupRes.ok) {
        const data = await signupRes.json();
        setModal({ type: 'error', game, message: data.error });
        return;
      }

      // Sign in with the new account
      const signInResult = await signIn('credentials', {
        email: signupForm.email,
        password: crypto.randomUUID(), // Won't work — need magic link flow
        redirect: false,
      });

      // If credentials sign-in fails (expected for light accounts), use magic link
      if (!signInResult?.ok) {
        // For now, redirect to check email for magic link
        setModal({
          type: 'error',
          game,
          message:
            'Account created! Check your email for a sign-in link, then come back to claim.',
        });
        return;
      }

      await updateSession();
      // Proceed to claim
      await executeClaim(game);
    } finally {
      setLoading(false);
    }
  }

  async function executeClaim(game: Game) {
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setClaimedGameIds((prev) => new Set([...prev, game.id]));
        setModal({ type: 'success', game });
      } else {
        setModal({
          type: 'error',
          game,
          message: data.error || 'Failed to claim tickets',
        });
      }
    } catch {
      setModal({
        type: 'error',
        game,
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatPrice(game: Game) {
    if (game.pricePerTicket === null) return '';
    if (game.pricePerTicket === 0) return 'Free';
    return `$${game.pricePerTicket}/ticket ($${game.pricePerTicket * seatCount} total)`;
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
            const isAvailable =
              game.status === 'AVAILABLE' && !claimedGameIds.has(game.id);

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
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {game.pricePerTicket !== null && game.pricePerTicket > 0 ? (
                    <span className="text-sm text-foreground/60">
                      ${game.pricePerTicket}/ticket
                    </span>
                  ) : game.pricePerTicket === 0 ? (
                    <span className="text-sm text-green-600">Free</span>
                  ) : null}

                  {isAvailable ? (
                    <button
                      onClick={() => handleClaimClick(game)}
                      className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="rounded-full bg-foreground/10 px-4 py-1.5 text-sm text-foreground/50">
                      {claimedGameIds.has(game.id)
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

      {/* Modal overlay */}
      {modal.type !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            {/* Signup modal */}
            {modal.type === 'signup' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">
                  Create Account &amp; Claim
                </h2>
                <p className="text-sm text-foreground/60">
                  {team} vs {modal.game.opponent} &middot;{' '}
                  {formatDate(modal.game.date)}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSignupAndClaim(modal.game);
                  }}
                  className="space-y-3"
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      placeholder="First name"
                      value={signupForm.firstName}
                      onChange={(e) =>
                        setSignupForm((f) => ({
                          ...f,
                          firstName: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Last name"
                      value={signupForm.lastName}
                      onChange={(e) =>
                        setSignupForm((f) => ({
                          ...f,
                          lastName: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Account & Claim'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'none' })}
                      className="rounded-lg border border-foreground/20 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                <p className="text-center text-xs text-foreground/40">
                  Already have an account?{' '}
                  <a href="/login" className="text-brand-600 hover:underline">
                    Sign in
                  </a>
                </p>
              </div>
            )}

            {/* Confirmation modal */}
            {modal.type === 'confirm' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Confirm Claim</h2>
                <div className="rounded-lg bg-foreground/5 p-4 text-sm">
                  <p className="font-medium">
                    {team} vs {modal.game.opponent}
                  </p>
                  <p className="text-foreground/60">
                    {formatDate(modal.game.date)}
                    {modal.game.time ? ` at ${modal.game.time}` : ''}
                  </p>
                  <p className="text-foreground/60">
                    Section {section}
                    {row ? `, Row ${row}` : ''} &middot; {seatCount} seats
                  </p>
                  {modal.game.pricePerTicket !== null && (
                    <p className="mt-2 font-medium">
                      {formatPrice(modal.game)}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => executeClaim(modal.game)}
                    disabled={loading}
                    className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {loading ? 'Claiming...' : 'Confirm Claim'}
                  </button>
                  <button
                    onClick={() => setModal({ type: 'none' })}
                    className="rounded-lg border border-foreground/20 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Success modal */}
            {modal.type === 'success' && (
              <div className="space-y-4">
                <div className="text-center text-4xl">&#10003;</div>
                <h2 className="text-center text-lg font-bold">
                  Tickets Claimed!
                </h2>
                <div className="rounded-lg bg-foreground/5 p-4 text-sm">
                  <p className="font-medium">
                    {team} vs {modal.game.opponent}
                  </p>
                  <p className="text-foreground/60">
                    {formatDate(modal.game.date)}
                  </p>
                  <p className="text-foreground/60">
                    Section {section}
                    {row ? `, Row ${row}` : ''} &middot; {seatCount} seats
                  </p>
                  {modal.game.pricePerTicket !== null &&
                    modal.game.pricePerTicket > 0 && (
                      <p className="mt-2 font-medium">
                        {formatPrice(modal.game)}
                      </p>
                    )}
                  {modal.game.pricePerTicket === 0 && (
                    <p className="mt-2 font-medium text-green-600">
                      Free &mdash; no payment needed
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-foreground/10 p-4 text-sm">
                  <p className="mb-2 font-medium">Next steps:</p>
                  <ol className="list-inside list-decimal space-y-1 text-foreground/70">
                    {modal.game.pricePerTicket !== null &&
                      modal.game.pricePerTicket > 0 && (
                        <li>{holderName} will send payment details</li>
                      )}
                    <li>{holderName} will transfer your tickets</li>
                    <li>Accept the ticket transfer in your ticketing app</li>
                  </ol>
                </div>
                <div className="flex gap-3">
                  <a
                    href="/dashboard/my-games"
                    className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
                  >
                    View My Games
                  </a>
                  <button
                    onClick={() => setModal({ type: 'none' })}
                    className="rounded-lg border border-foreground/20 px-4 py-2 text-sm"
                  >
                    Browse More
                  </button>
                </div>
              </div>
            )}

            {/* Error modal */}
            {modal.type === 'error' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Unable to Claim</h2>
                <p className="text-sm text-red-600">{modal.message}</p>
                <button
                  onClick={() => setModal({ type: 'none' })}
                  className="w-full rounded-lg border border-foreground/20 px-4 py-2 text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
