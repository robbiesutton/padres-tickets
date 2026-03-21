import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/services/tokens';
import { jsonError } from '@/lib/api-utils';
import { encode } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

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

  // Set the session cookie and redirect to dashboard
  const response = Response.redirect(
    `${process.env.NEXTAUTH_URL}/dashboard/my-games`
  );

  response.headers.set(
    'Set-Cookie',
    `next-auth.session-token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );

  return response;
}
