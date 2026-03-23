import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const user = await requireAuth();
  if (!user) {
    return jsonError('Authentication required', 401);
  }

  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    select: { id: true },
  });

  if (!pkg) {
    return jsonError('Package not found', 404);
  }

  const claims = await prisma.claim.findMany({
    where: {
      claimerUserId: user.id,
      game: { packageId: pkg.id },
      status: { not: 'RELEASED' },
    },
    include: {
      game: {
        select: {
          id: true,
          opponent: true,
          date: true,
          time: true,
          pricePerTicket: true,
        },
      },
    },
    orderBy: { game: { date: 'asc' } },
  });

  const serialized = claims.map((c) => ({
    id: c.id,
    gameId: c.gameId,
    status: c.status,
    paymentStatus: c.paymentStatus,
    transferStatus: c.transferStatus,
    claimedAt: c.claimedAt.toISOString(),
    game: {
      opponent: c.game.opponent,
      date: c.game.date.toISOString(),
      time: c.game.time,
      pricePerTicket: c.game.pricePerTicket ? Number(c.game.pricePerTicket) : null,
    },
  }));

  return jsonSuccess({ claims: serialized });
}
