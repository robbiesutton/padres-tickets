import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { DESIGN_MODE, mockPackage, mockHolder } from '@/lib/mock-data';

export async function GET() {
  if (DESIGN_MODE) {
    const padresShared = {
      id: mockPackage.id,
      shareLinkSlug: mockPackage.shareLinkSlug,
      team: mockPackage.team,
      section: mockPackage.section,
      row: mockPackage.row,
      seats: mockPackage.seats,
      seatCount: mockPackage.seatCount,
      season: mockPackage.season,
      seatPhotoUrl: mockPackage.seatPhotoUrl,
      description: mockPackage.description,
      defaultPricePerTicket: mockPackage.defaultPricePerTicket,
      perks: mockPackage.perks,
      _count: mockPackage._count,
      holderName: `${mockHolder.firstName} ${mockHolder.lastName}`,
      invitedAt: new Date('2026-04-01').toISOString(),
    };
    const dodgersShared = {
      id: 'design-pkg-002',
      shareLinkSlug: 'dodgers-loge-141',
      team: 'Los Angeles Dodgers',
      section: '141',
      row: 'C',
      seats: '7-8',
      seatCount: 2,
      season: '2026',
      seatPhotoUrl: null,
      description: null,
      defaultPricePerTicket: 65,
      perks: [],
      _count: { games: 18, invitations: 4 },
      holderName: 'Jamie Chen',
      invitedAt: new Date('2026-03-12').toISOString(),
    };
    return jsonSuccess({ packages: [padresShared, dodgersShared], total: 2 });
  }

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
          defaultPricePerTicket: true,
          perks: true,
          user: {
            select: { firstName: true, lastName: true },
          },
          _count: {
            select: {
              games: true,
              invitations: true,
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
      defaultPricePerTicket: inv.package.defaultPricePerTicket,
      perks: inv.package.perks,
      _count: inv.package._count,
      holderName: `${inv.package.user.firstName} ${inv.package.user.lastName}`,
      invitedAt: inv.invitedAt.toISOString(),
    }));

  return jsonSuccess({ packages, total: packages.length });
}
