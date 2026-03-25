import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';
import { DESIGN_MODE, mockActivities } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (DESIGN_MODE) {
    return jsonSuccess({ activities: mockActivities, total: mockActivities.length });
  }

  const user = await requireAuth();
  if (!user) return jsonError('Unauthorized', 401);

  const { id } = await params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return jsonError('Package not found', 404);
  if (pkg.userId !== user.id) return jsonError('Forbidden', 403);

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
  const offset = parseInt(
    request.nextUrl.searchParams.get('offset') || '0',
    10
  );

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: { packageId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.activity.count({ where: { packageId: id } }),
  ]);

  return jsonSuccess({ activities, total });
}
