import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/tokens';
import { createClaim } from '@/lib/services/claim';
import { jsonError } from '@/lib/api-utils';
import { encode } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const pendingSlug = request.nextUrl.searchParams.get('pendingSlug');
  const pendingGameId = request.nextUrl.searchParams.get('pendingGameId');

  if (!token) {
    return jsonError('Token is required', 400);
  }

  const user = await verifyToken(token, 'MAGIC_LINK');

  if (!user) {
    return jsonError('Invalid or expired magic link', 400);
  }

  // Create a NextAuth JWT session token
  const sessionToken = await encode({
    token: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      sub: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // If this magic link was triggered by a reservation, auto-create the claim
  let redirectUrl = `${process.env.NEXTAUTH_URL}/dashboard/my-games`;

  if (pendingSlug && pendingGameId) {
    const result = await createClaim(pendingGameId, user.id);
    if (result.success) {
      redirectUrl = `${process.env.NEXTAUTH_URL}/share/${pendingSlug}?reserved=${pendingGameId}`;
    } else {
      // Claim failed (e.g., already taken) — redirect with error
      redirectUrl = `${process.env.NEXTAUTH_URL}/share/${pendingSlug}?reserveError=${encodeURIComponent(result.error || 'Failed to reserve')}`;
    }
  }

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set('next-auth.session-token', sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
