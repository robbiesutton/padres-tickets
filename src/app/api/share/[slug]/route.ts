import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    return jsonError('Share link not found or deactivated', 404);
  }

  const gameCounts = await prisma.game.groupBy({
    by: ['status'],
    where: { packageId: pkg.id },
    _count: true,
  });

  const availableCount =
    gameCounts.find((g) => g.status === 'AVAILABLE')?._count ?? 0;
  const totalGames = gameCounts.reduce((sum, g) => sum + g._count, 0);

  return jsonSuccess({
    package: {
      id: pkg.id,
      sport: pkg.sport,
      team: pkg.team,
      section: pkg.section,
      row: pkg.row,
      seats: pkg.seats,
      seatCount: pkg.seatCount,
      season: pkg.season,
      shareLinkSlug: pkg.shareLinkSlug,
    },
    holder: {
      firstName: pkg.user.firstName,
      lastName: pkg.user.lastName,
    },
    stats: {
      totalGames,
      availableGames: availableCount,
    },
  });
}
