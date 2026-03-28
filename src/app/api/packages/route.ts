import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { generateUniqueSlug } from '@/lib/services/slug';
import { getTeamById } from '@/lib/data/mlb-teams';
import { getHomeSchedule } from '@/lib/services/schedule';
import { DESIGN_MODE, mockPackage } from '@/lib/mock-data';

export async function GET() {
  if (DESIGN_MODE) {
    return jsonSuccess({ packages: [mockPackage] });
  }

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
  if (DESIGN_MODE) {
    const body = await request.json();
    return jsonSuccess({
      package: { ...mockPackage, ...body },
      shareLink: body.shareLinkSlug || 'margo-padres',
      gamesCreated: 20,
    });
  }

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
    seatPhotoUrl,
    perks,
    description,
    // New fields for 9-step wizard
    gameOverrides,
    excludedDates,
    venmoHandle,
    zelleInfo,
    shareLinkSlug,
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

  // Use custom slug if provided and available, otherwise auto-generate
  let slug: string;
  if (shareLinkSlug) {
    const sanitized = shareLinkSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    const existing = await prisma.package.findUnique({
      where: { shareLinkSlug: sanitized },
    });
    slug = existing
      ? await generateUniqueSlug(
          dbUser?.firstName ?? user.name.split(' ')[0],
          team.abbreviation
        )
      : sanitized;
  } else {
    slug = await generateUniqueSlug(
      dbUser?.firstName ?? user.name.split(' ')[0],
      team.abbreviation
    );
  }

  // Save payment method to user if provided
  if (venmoHandle || zelleInfo) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(venmoHandle ? { venmoHandle } : {}),
        ...(zelleInfo ? { zelleInfo } : {}),
      },
    });
  }

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
      seatPhotoUrl: seatPhotoUrl || null,
      perks: Array.isArray(perks) ? perks : [],
      description: description || null,
    },
  });

  // Auto-load schedule if requested
  let gamesCreated = 0;
  if (autoLoadSchedule !== false) {
    try {
      const schedule = await getHomeSchedule(teamId, season);
      const excludedSet = new Set(excludedDates || []);

      const gameData = schedule
        .filter((g) => !excludedSet.has(g.gameDate))
        .map((g) => {
          const override = gameOverrides?.[g.gameDate];
          return {
            packageId: pkg.id,
            date: new Date(g.gameDate),
            time: g.time,
            opponent: g.opponent,
            opponentLogo: null as string | null,
            pricePerTicket: override?.pricePerTicket ?? (defaultPricePerTicket
              ? parseFloat(defaultPricePerTicket)
              : null),
            status: (override?.status || 'AVAILABLE') as 'AVAILABLE' | 'GOING_MYSELF',
          };
        });

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
