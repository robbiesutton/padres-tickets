import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { DESIGN_MODE, mockMyClaims } from '@/lib/mock-data';

export async function GET() {
  if (DESIGN_MODE) {
    return jsonSuccess({ claims: mockMyClaims, total: mockMyClaims.length });
  }

  const user = await requireAuth();
  if (!user) {
    return jsonError('Unauthorized', 401);
  }

  const claims = await prisma.claim.findMany({
    where: {
      claimerUserId: user.id,
      status: { not: 'RELEASED' },
    },
    include: {
      game: {
        include: {
          package: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { game: { date: 'asc' } },
  });

  const result = claims.map((claim) => ({
    id: claim.id,
    status: claim.status,
    claimedAt: claim.claimedAt,
    paymentStatus: claim.paymentStatus,
    transferStatus: claim.transferStatus,
    game: {
      id: claim.game.id,
      date: claim.game.date,
      time: claim.game.time,
      opponent: claim.game.opponent,
      pricePerTicket: claim.game.pricePerTicket,
      notes: claim.game.notes,
    },
    package: {
      team: claim.game.package.team,
      section: claim.game.package.section,
      row: claim.game.package.row,
      seats: claim.game.package.seats,
      seatCount: claim.game.package.seatCount,
      season: claim.game.package.season,
    },
    holder: {
      firstName: claim.game.package.user.firstName,
      lastName: claim.game.package.user.lastName,
    },
  }));

  return jsonSuccess({ claims: result, total: result.length });
}
