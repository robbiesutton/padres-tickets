import { encode } from 'next-auth/jwt';
import type { NextRequest, NextResponse } from 'next/server';

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isHolder: boolean;
  isClaimer: boolean;
}

export async function setSessionCookie(
  user: SessionUser,
  request: NextRequest,
  response: NextResponse
): Promise<void> {
  const sessionToken = await encode({
    token: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      isHolder: user.isHolder,
      isClaimer: user.isClaimer,
      sub: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60,
  });

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
}
