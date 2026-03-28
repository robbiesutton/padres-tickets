import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createToken } from '@/lib/services/tokens';
import { sendEmail } from '@/lib/services/email';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { DESIGN_MODE } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  if (DESIGN_MODE) {
    return jsonSuccess({ message: 'Magic link sent' });
  }
  const ip = getClientIp(request);
  const { success } = rateLimit(`magic-link:${ip}`, 3, 60_000);
  if (!success) return rateLimitResponse();

  const { email, firstName, lastName } = await request.json();

  if (!email) {
    return jsonError('Email is required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find or create light account
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
        emailVerified: new Date(), // Magic link verifies email implicitly
      },
    });
  }

  const tokenRecord = await createToken(user.id, 'MAGIC_LINK');
  const magicUrl = `${process.env.NEXTAUTH_URL}/api/auth/magic-link/verify?token=${tokenRecord.token}`;

  await sendEmail({
    to: user.email,
    subject: 'Your BenchBuddy sign-in link',
    html: `<p>Hi ${user.firstName},</p><p>Click <a href="${magicUrl}">here</a> to sign in to BenchBuddy. This link expires in 15 minutes.</p>`,
  });

  return jsonSuccess({
    message: 'Magic link sent. Check your email.',
    isNewUser: !user.passwordHash,
  });
}
