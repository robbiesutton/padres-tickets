import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/tokens';
import { createClaim } from '@/lib/services/claim';
import { jsonError } from '@/lib/api-utils';
import { setSessionCookie } from '@/lib/session';

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

  await setSessionCookie(user, request, response);

  return response;
}
