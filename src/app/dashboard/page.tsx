// PLACEHOLDER UI — To be replaced by designer
'use client';

import { useState, useEffect } from 'react';

interface PackageListItem {
  id: string;
  team: string;
  section: string;
  season: string;
  shareLinkSlug: string;
  _count: { games: number; invitations: number };
}

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

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  'GOING_MYSELF',
  'AVAILABLE',
  'SOLD_ELSEWHERE',
  'UNAVAILABLE',
];

function statusColor(status: string) {
  const colors: Record<string, string> = {
    GOING_MYSELF: 'bg-[#f5f4f2] text-[#2c2a2b]',
    AVAILABLE: 'bg-[#E1F5EE] text-[#0F6E56]',
    CLAIMED: 'bg-[rgba(15,111,87,0.15)] text-[#0f6f57]',
    TRANSFERRED: 'bg-[#E1F5EE] text-[#0F6E56]',
    COMPLETE: 'bg-[#f5f4f2] text-[#8e8985]',
    SOLD_ELSEWHERE: 'bg-[#f5f4f2] text-[#8e8985]',
    UNAVAILABLE: 'bg-[#FEE2E2] text-[#DC2626]',
  };
  return colors[status] || 'bg-[#f5f4f2] text-[#8e8985]';
}

export default function DashboardPage() {
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [games, setGames] = useState<GameWithClaim[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load packages
  useEffect(() => {
    let cancelled = false;
    fetch('/api/packages')
      .then((r) => (r.ok ? r.json() : { packages: [] }))
      .then((data) => {
        if (cancelled) return;
        setPackages(data.packages);
        if (data.packages.length > 0) {
          setSelectedPkgId(data.packages[0].id);
        }
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load dashboard data when package changes
  useEffect(() => {
    if (!selectedPkgId) return;
    let cancelled = false;

    Promise.all([
      fetch(`/api/packages/${selectedPkgId}/summary`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/packages/${selectedPkgId}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/packages/${selectedPkgId}/activity?limit=10`).then((r) =>
        r.ok ? r.json() : null
      ),
    ]).then(([summaryData, pkgData, activityData]) => {
      if (cancelled) return;
      if (summaryData) setSummary(summaryData);
      if (pkgData) setGames(pkgData.package.games);
      if (activityData) setActivities(activityData.activities);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedPkgId]);

  async function updateGameStatus(gameId: string, newStatus: string) {
    const res = await fetch(`/api/packages/${selectedPkgId}/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, status: newStatus } : g))
      );
    }
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
        <h1 className="text-2xl font-bold">Welcome to BenchBuddy</h1>
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
    <div className="flex flex-1 flex-col p-4 sm:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header with package switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {packages.length > 1 && (
              <select
                value={selectedPkgId || ''}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                className="rounded-lg border border-[#eceae5] px-3 py-1.5 text-sm"
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.team} — {p.section}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={`/dashboard/packages/${selectedPkgId}/share`}
              className="rounded-lg bg-[#2c2a2b] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b]"
            >
              Share Link
            </a>
            <a
              href="/dashboard/packages/new"
              className="rounded-lg border-[1.5px] border-black bg-transparent hover:bg-[#f5f4f2] text-sm font-medium transition-colors px-4 py-1.5"
            >
              + New Package
            </a>
          </div>
        </div>

        {/* Stats cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Games', value: summary.totalGames },
              { label: 'Available', value: summary.gamesAvailable },
              { label: 'Claimed', value: summary.gamesClaimed },
              {
                label: 'Revenue',
                value: `$${summary.revenueCollected.toFixed(0)}`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[#eceae5] bg-white p-6"
              >
                <p className="text-sm text-[#8e8985]">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Games list */}
          <div className="space-y-3 lg:col-span-2">
            <h2 className="text-lg font-medium">Games</h2>
            <div className="space-y-2">
              {games.map((game) => {
                const d = new Date(game.date);
                const hasClaim = game.claim && game.claim.status !== 'RELEASED';

                return (
                  <div
                    key={game.id}
                    className="flex items-center gap-3 border border-[#eceae5] bg-white p-3 rounded-lg text-sm"
                  >
                    <div className="w-16 shrink-0 text-[#8e8985]">
                      {d.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{game.opponent}</p>
                      {hasClaim && (
                        <p className="text-xs text-[#8e8985]">
                          {game.claim!.claimer.firstName}{' '}
                          {game.claim!.claimer.lastName}
                        </p>
                      )}
                    </div>
                    {hasClaim ? (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(game.status)}`}
                      >
                        {game.status.replace('_', ' ')}
                      </span>
                    ) : (
                      <select
                        value={game.status}
                        onChange={(e) =>
                          updateGameStatus(game.id, e.target.value)
                        }
                        className={`shrink-0 rounded-full border-0 px-2 py-0.5 text-xs font-medium ${statusColor(game.status)}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    )}
                    {game.pricePerTicket && (
                      <span className="shrink-0 text-xs text-[#8e8985]">
                        ${Number(game.pricePerTicket)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity feed */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium">Recent Activity</h2>
            {activities.length === 0 ? (
              <p className="text-sm text-[#8e8985]">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {activities.map((a) => (
                  <div
                    key={a.id}
                    className="border border-[#eceae5] bg-white p-3 rounded-lg text-sm"
                  >
                    <p>{a.description}</p>
                    <p className="mt-1 text-xs text-[#8e8985]">
                      {new Date(a.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
