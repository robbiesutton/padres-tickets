import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonError } from '@/lib/api-utils';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { createClaim } from '@/lib/services/claim';
import { setSessionCookie } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`reserve:${ip}`, 5, 60_000);
  if (!success) return rateLimitResponse();
  const { slug } = await params;

  const { gameId, email, firstName, lastName } = await request.json();

  if (!gameId || !email) {
    return jsonError('gameId and email are required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return jsonError('Invalid email address', 400);
  }

  // Verify package exists and is active
  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    select: { id: true, status: true, team: true },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    return jsonError('Share link not found or deactivated', 404);
  }

  // Verify game belongs to this package and is available
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { packageId: true, status: true, opponent: true, date: true, time: true },
  });

  if (!game || game.packageId !== pkg.id) {
    return jsonError('Game not found in this package', 404);
  }

  if (game.status !== 'AVAILABLE') {
    return jsonError('Game is no longer available', 409);
  }

  // Find or create light user by email
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    if (!firstName || !lastName) {
      return jsonError(
        'First name and last name are required for new accounts',
        400
      );
    }

    user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        emailVerified: new Date(),
      },
    });
  }

  // Create the claim immediately
  const result = await createClaim(gameId, user.id);
  if (!result.success) {
    return jsonError(result.error || 'Failed to reserve', 409);
  }

  const response = NextResponse.json(
    { ok: true, data: { status: 'reserved' } },
    { status: 200 }
  );

  await setSessionCookie(user, request, response);

  return response;
}
