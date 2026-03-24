import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createToken } from '@/lib/services/tokens';
import { sendEmail } from '@/lib/services/email';
import { jsonSuccess } from '@/lib/api-utils';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`forgot-pw:${ip}`, 3, 60_000);
  if (!success) return rateLimitResponse();

  const { email } = await request.json();
  const normalizedEmail = email?.toLowerCase().trim();

  // Always return success to prevent email enumeration
  const successResponse = jsonSuccess({
    message: 'If an account exists, a password reset link has been sent.',
  });

  if (!normalizedEmail) {
    return successResponse;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.passwordHash) {
    return successResponse;
  }

  const tokenRecord = await createToken(user.id, 'PASSWORD_RESET');
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${tokenRecord.token}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your BenchBuddy password',
    html: `<p>Hi ${user.firstName},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });

  return successResponse;
}
