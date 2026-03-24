import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { createToken } from '@/lib/services/tokens';
import { sendEmail } from '@/lib/services/email';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';

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
        role: 'CLAIMER',
        emailVerified: new Date(),
      },
    });
  }

  // Create magic link token with callback URL containing reservation info
  const tokenRecord = await createToken(user.id, 'MAGIC_LINK');
  const callbackParams = new URLSearchParams({
    token: tokenRecord.token,
    pendingSlug: slug,
    pendingGameId: gameId,
  });
  const magicUrl = `${process.env.NEXTAUTH_URL}/api/auth/magic-link/verify?${callbackParams.toString()}`;

  const gameDate = new Date(game.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  await sendEmail({
    to: user.email,
    subject: `Confirm your reservation — ${pkg.team} vs ${game.opponent}`,
    html: `
      <p>Hi ${user.firstName},</p>
      <p>Click the link below to confirm your reservation for:</p>
      <p><strong>${pkg.team} vs ${game.opponent}</strong><br>${gameDate}${game.time ? ` at ${game.time}` : ''}</p>
      <p><a href="${magicUrl}" style="display:inline-block;padding:12px 24px;background:#1B2A4A;color:#fff;text-decoration:none;border-radius:8px;font-weight:500">Confirm Reservation</a></p>
      <p style="color:#8C8984;font-size:14px">This link expires in 15 minutes.</p>
    `,
  });

  return jsonSuccess({
    status: 'magic_link_sent',
    message: 'Check your email to confirm your reservation.',
  });
}
