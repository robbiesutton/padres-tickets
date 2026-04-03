import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/services/tokens';
import { jsonError } from '@/lib/api-utils';
import { encode } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return jsonError('Token is required', 400);
  }

  const user = await verifyToken(token, 'EMAIL_VERIFY');

  if (!user) {
    return jsonError('Invalid or expired verification link', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  // Auto-sign in the user by creating a JWT session token
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

  const response = NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/dashboard`
  );

  const isSecure = request.headers.get('x-forwarded-proto') === 'https' ||
                   process.env.NEXTAUTH_URL?.startsWith('https');
  const cookieName = isSecure
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  response.cookies.set(cookieName, sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !!isSecure,
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
