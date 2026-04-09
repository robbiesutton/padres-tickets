import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { getTeamByName } from '@/lib/data/mlb-teams';

export async function POST() {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  // Only allow holders to run this
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.isHolder) return jsonError('Forbidden', 403);

  // Get all packages with their games
  const packages = await prisma.package.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      team: true,
      games: {
        select: { id: true, date: true, time: true },
      },
    },
  });

  let updated = 0;

  for (const pkg of packages) {
    const team = getTeamByName(pkg.team);
    if (!team) continue;

    for (const game of pkg.games) {
      const correctedTime = game.date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: team.timezone,
      });

      if (correctedTime !== game.time) {
        await prisma.game.update({
          where: { id: game.id },
          data: { time: correctedTime },
        });
        updated++;
      }
    }
  }

  return jsonSuccess({ updated, packages: packages.length });
}
