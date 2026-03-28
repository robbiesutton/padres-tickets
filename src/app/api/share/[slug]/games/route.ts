import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { Prisma } from '@/generated/prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    select: { id: true, status: true },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    return jsonError('Share link not found or deactivated', 404);
  }

  // Parse filters
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month'); // e.g. "4" for April
  const opponent = searchParams.get('opponent'); // partial match
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const showAll = searchParams.get('showAll') === 'true';

  // Build where clause
  const where: Prisma.GameWhereInput = {
    packageId: pkg.id,
  };

  // By default only show AVAILABLE games; showAll includes all statuses
  if (!showAll) {
    where.status = 'AVAILABLE';
  }

  if (opponent) {
    where.opponent = { contains: opponent, mode: 'insensitive' };
  }

  if (minPrice || maxPrice) {
    where.pricePerTicket = {};
    if (minPrice) {
      where.pricePerTicket.gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      where.pricePerTicket.lte = parseFloat(maxPrice);
    }
  }

  // Fetch games
  let games = await prisma.game.findMany({
    where,
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      time: true,
      opponent: true,
      opponentLogo: true,
      status: true,
      pricePerTicket: true,
      notes: true,
      ...(showAll ? {
        claim: {
          select: { id: true, claimerUserId: true, status: true },
        },
      } : {}),
    },
  });

  // Filter by month in JS (date is stored as DateTime, month extraction
  // varies by DB so doing it client-side is more portable)
  if (month) {
    const monthNum = parseInt(month, 10);
    games = games.filter((g) => new Date(g.date).getMonth() + 1 === monthNum);
  }

  // Serialize consistently with SSR data (date as ISO string, price as number)
  const serialized = games.map((g) => ({
    ...g,
    date: g.date instanceof Date ? g.date.toISOString() : g.date,
    pricePerTicket: g.pricePerTicket ? Number(g.pricePerTicket) : null,
  }));

  return jsonSuccess({
    games: serialized,
    total: serialized.length,
  });
}
