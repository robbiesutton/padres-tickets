import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/services/tokens';
import { jsonError } from '@/lib/api-utils';

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

  // Redirect to login with success message
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?verified=true`);
}
