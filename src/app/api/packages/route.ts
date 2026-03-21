import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { generateUniqueSlug } from '@/lib/services/slug';
import { getTeamById } from '@/lib/data/mlb-teams';
import { getHomeSchedule } from '@/lib/services/schedule';

export async function GET() {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const packages = await prisma.package.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: {
          games: true,
          invitations: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return jsonSuccess({ packages });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  // Ensure user is a holder
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || (dbUser.role !== 'HOLDER' && dbUser.role !== 'BOTH')) {
    // Upgrade role to BOTH if they're a claimer creating a package
    if (dbUser?.role === 'CLAIMER') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'BOTH' },
      });
    } else {
      return jsonError('Only holders can create packages', 403);
    }
  }

  const body = await request.json();
  const {
    teamId,
    section,
    row,
    seats,
    seatCount,
    season,
    defaultPricePerTicket,
    autoLoadSchedule,
  } = body;

  if (!teamId || !section || !seats || !seatCount || !season) {
    return jsonError(
      'teamId, section, seats, seatCount, and season are required',
      400
    );
  }

  const team = getTeamById(teamId);
  if (!team) {
    return jsonError('Invalid team ID', 400);
  }

  // Generate unique slug
  const slug = await generateUniqueSlug(
    dbUser?.firstName ?? user.name.split(' ')[0],
    team.abbreviation
  );

  // Create the package
  const pkg = await prisma.package.create({
    data: {
      userId: user.id,
      sport: 'MLB',
      team: team.name,
      section,
      row: row || null,
      seats,
      seatCount: parseInt(seatCount, 10),
      season,
      shareLinkSlug: slug,
      defaultPricePerTicket: defaultPricePerTicket
        ? parseFloat(defaultPricePerTicket)
        : null,
    },
  });

  // Auto-load schedule if requested
  let gamesCreated = 0;
  if (autoLoadSchedule !== false) {
    try {
      const schedule = await getHomeSchedule(teamId, season);
      const gameData = schedule.map((g) => ({
        packageId: pkg.id,
        date: new Date(g.gameDate),
        time: g.time,
        opponent: g.opponent,
        opponentLogo: null as string | null,
        pricePerTicket: defaultPricePerTicket
          ? parseFloat(defaultPricePerTicket)
          : null,
        status: 'AVAILABLE' as const,
      }));

      if (gameData.length > 0) {
        await prisma.game.createMany({ data: gameData });
        gamesCreated = gameData.length;
      }
    } catch (error) {
      // Schedule load is best-effort — don't fail package creation
      console.error('Failed to auto-load schedule:', error);
    }
  }

  return jsonSuccess(
    {
      package: pkg,
      gamesCreated,
      shareLink: `/share/${slug}`,
    },
    201
  );
}
