import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, jsonError, jsonSuccess } from '@/lib/api-utils';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const user = await requireAuth();
  if (!user) {
    return jsonError('Unauthorized', 401);
  }

  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    select: { id: true, status: true, userId: true },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    return jsonError('Package not found', 404);
  }

  // Don't create an invitation for the package owner
  if (pkg.userId === user.id) {
    return jsonSuccess({ ok: true });
  }

  await prisma.invitation.upsert({
    where: {
      packageId_claimerUserId: {
        packageId: pkg.id,
        claimerUserId: user.id,
      },
    },
    update: {},
    create: {
      packageId: pkg.id,
      claimerUserId: user.id,
    },
  });

  return jsonSuccess({ ok: true });
}
