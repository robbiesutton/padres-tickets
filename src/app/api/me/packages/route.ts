import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return jsonError('Unauthorized', 401);
  }

  const invitations = await prisma.invitation.findMany({
    where: { claimerUserId: user.id },
    include: {
      package: {
        select: {
          id: true,
          shareLinkSlug: true,
          team: true,
          section: true,
          row: true,
          seats: true,
          seatCount: true,
          season: true,
          status: true,
          seatPhotoUrl: true,
          description: true,
          user: {
            select: { firstName: true, lastName: true },
          },
          _count: {
            select: {
              games: { where: { status: 'AVAILABLE' } },
            },
          },
        },
      },
    },
    orderBy: { invitedAt: 'desc' },
  });

  const packages = invitations
    .filter((inv) => inv.package.status === 'ACTIVE')
    .map((inv) => ({
      id: inv.package.id,
      shareLinkSlug: inv.package.shareLinkSlug,
      team: inv.package.team,
      section: inv.package.section,
      row: inv.package.row,
      seats: inv.package.seats,
      seatCount: inv.package.seatCount,
      season: inv.package.season,
      seatPhotoUrl: inv.package.seatPhotoUrl,
      description: inv.package.description,
      holderName: `${inv.package.user.firstName} ${inv.package.user.lastName}`,
      availableGames: inv.package._count.games,
      invitedAt: inv.invitedAt.toISOString(),
    }));

  return jsonSuccess({ packages, total: packages.length });
}
