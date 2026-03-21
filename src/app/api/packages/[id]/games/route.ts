import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id } = await params;
  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const opponent = searchParams.get('opponent');

  const where: Record<string, unknown> = { packageId: id };
  if (status) where.status = status;
  if (opponent) where.opponent = { contains: opponent, mode: 'insensitive' };

  const games = await prisma.game.findMany({
    where,
    orderBy: { date: 'asc' },
    include: {
      claim: {
        include: {
          claimer: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  return jsonSuccess({ games, total: games.length });
}

export async function POST(
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
  const { date, time, opponent, pricePerTicket, status, notes } = body;

  if (!date || !opponent) {
    return jsonError('date and opponent are required', 400);
  }

  const game = await prisma.game.create({
    data: {
      packageId: id,
      date: new Date(date),
      time: time || null,
      opponent,
      pricePerTicket: pricePerTicket ? parseFloat(pricePerTicket) : null,
      status: status || 'AVAILABLE',
      notes: notes || null,
    },
  });

  return jsonSuccess({ game }, 201);
}
