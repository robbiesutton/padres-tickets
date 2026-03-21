import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { getHomeSchedule } from '@/lib/services/schedule';
import { getTeamByAbbreviation, getTeamById } from '@/lib/data/mlb-teams';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id } = await params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  // Resolve team ID from package team name
  const body = await request.json().catch(() => ({}));
  const teamId = body.teamId;

  let resolvedTeamId: number | undefined;

  if (teamId) {
    resolvedTeamId = teamId;
  } else {
    // Try to find team by name from the package
    const allTeams = await import('@/lib/data/mlb-teams');
    const team = allTeams.MLB_TEAMS.find(
      (t) =>
        t.name === pkg.team ||
        getTeamByAbbreviation(pkg.team) !== undefined ||
        getTeamById(parseInt(pkg.team)) !== undefined
    );
    resolvedTeamId = team?.id;
  }

  if (!resolvedTeamId) {
    return jsonError(
      'Could not determine team. Provide teamId in the request body.',
      400
    );
  }

  const schedule = await getHomeSchedule(resolvedTeamId, pkg.season);

  // Get existing game dates to avoid duplicates
  const existingGames = await prisma.game.findMany({
    where: { packageId: id },
    select: { date: true },
  });

  const existingDates = new Set(
    existingGames.map((g) => g.date.toISOString().split('T')[0])
  );

  const newGames = schedule.filter((g) => !existingDates.has(g.date));

  if (newGames.length > 0) {
    await prisma.game.createMany({
      data: newGames.map((g) => ({
        packageId: id,
        date: new Date(g.gameDate),
        time: g.time,
        opponent: g.opponent,
        pricePerTicket: pkg.defaultPricePerTicket
          ? Number(pkg.defaultPricePerTicket)
          : null,
        status: 'AVAILABLE' as const,
      })),
    });
  }

  return jsonSuccess({
    imported: newGames.length,
    skipped: schedule.length - newGames.length,
    total: schedule.length,
  });
}
