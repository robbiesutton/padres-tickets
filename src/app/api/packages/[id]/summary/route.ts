import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { DESIGN_MODE, mockSummary } from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (DESIGN_MODE) {
    return jsonSuccess(mockSummary);
  }

  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id } = await params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  // Aggregate stats using database queries
  const [statusCounts, , pastAvailable] = await Promise.all([
    prisma.game.groupBy({
      by: ['status'],
      where: { packageId: id },
      _count: true,
    }),
    prisma.claim.count({
      where: {
        game: { packageId: id },
        paymentStatus: 'PAID',
      },
    }),
    // Games that are past date and still AVAILABLE (wasted)
    prisma.game.count({
      where: {
        packageId: id,
        status: 'AVAILABLE',
        date: { lt: new Date() },
      },
    }),
  ]);

  // Calculate revenue from paid claims
  const paidClaims = await prisma.claim.findMany({
    where: {
      game: { packageId: id },
      paymentStatus: 'PAID',
    },
    include: {
      game: { select: { pricePerTicket: true } },
    },
  });

  const revenueCollected = paidClaims.reduce(
    (sum, c) =>
      sum +
      (c.game.pricePerTicket
        ? Number(c.game.pricePerTicket) * (pkg.seatCount || 1)
        : 0),
    0
  );

  const counts: Record<string, number> = {};
  for (const entry of statusCounts) {
    counts[entry.status] = entry._count;
  }

  const totalGames = Object.values(counts).reduce((a, b) => a + b, 0);
  const gamesAvailable = counts['AVAILABLE'] || 0;
  const gamesClaimed = counts['CLAIMED'] || 0;
  const gamesTransferred = counts['TRANSFERRED'] || 0;
  const gamesComplete = counts['COMPLETE'] || 0;
  const gamesGoingMyself = counts['GOING_MYSELF'] || 0;

  return jsonSuccess({
    totalGames,
    gamesAvailable,
    gamesClaimed,
    gamesTransferred,
    gamesComplete,
    gamesGoingMyself,
    gamesShared:
      gamesAvailable + gamesClaimed + gamesTransferred + gamesComplete,
    gamesUnused: pastAvailable,
    revenueCollected,
    claimersCount: await prisma.invitation.count({
      where: { packageId: id },
    }),
  });
}
