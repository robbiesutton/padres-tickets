import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { DESIGN_MODE } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  if (DESIGN_MODE) {
    return jsonSuccess({ exists: true, hasPassword: true });
  }
  const ip = getClientIp(request);
  const { success } = rateLimit(`check-email:${ip}`, 10, 60_000);
  if (!success) return rateLimitResponse();

  const { email } = await request.json();

  if (!email) {
    return jsonError('Email is required', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return jsonSuccess({ exists: false, hasPassword: false });
  }

  return jsonSuccess({
    exists: true,
    hasPassword: !!user.passwordHash,
  });
}
