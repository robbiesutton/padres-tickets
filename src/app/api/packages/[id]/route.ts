import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { DESIGN_MODE, mockPackage, mockGamesWithClaims } from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (DESIGN_MODE) {
    return jsonSuccess({
      package: {
        ...mockPackage,
        games: mockGamesWithClaims,
        _count: { invitations: 3 },
      },
    });
  }

  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id } = await params;

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      games: {
        orderBy: { date: 'asc' },
        include: {
          claim: {
            include: {
              claimer: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      _count: { select: { invitations: true } },
    },
  });

  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  return jsonSuccess({ package: pkg });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id } = await params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  const body = await request.json();
  const {
    section,
    row,
    seats,
    seatCount,
    season,
    defaultPricePerTicket,
    shareLinkSlug,
    status,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (section !== undefined) updateData.section = section;
  if (row !== undefined) updateData.row = row || null;
  if (seats !== undefined) updateData.seats = seats;
  if (seatCount !== undefined) updateData.seatCount = parseInt(seatCount, 10);
  if (season !== undefined) updateData.season = season;
  if (defaultPricePerTicket !== undefined) {
    updateData.defaultPricePerTicket = defaultPricePerTicket
      ? parseFloat(defaultPricePerTicket)
      : null;
  }
  if (status !== undefined) updateData.status = status;

  // Validate slug uniqueness if changing
  if (shareLinkSlug !== undefined && shareLinkSlug !== pkg.shareLinkSlug) {
    const slugTaken = await prisma.package.findUnique({
      where: { shareLinkSlug },
    });
    if (slugTaken) {
      return jsonError('Share link slug is already taken', 409);
    }
    updateData.shareLinkSlug = shareLinkSlug;
  }

  const updated = await prisma.package.update({
    where: { id },
    data: updateData,
  });

  return jsonSuccess({ package: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id } = await params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  // Cascade deletes games and claims via Prisma schema
  await prisma.package.delete({ where: { id } });

  return jsonSuccess({ message: 'Package deleted' });
}
