import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { createToken } from '@/lib/services/tokens';
import { sendEmail } from '@/lib/services/email';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!success) return rateLimitResponse();

  const body = await request.json();
  const { firstName, lastName, email, password, role } = body;

  if (!firstName || !lastName || !email || !password) {
    return jsonError(
      'First name, last name, email, and password are required',
      400
    );
  }

  if (password.length < 8) {
    return jsonError('Password must be at least 8 characters', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return jsonError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === 'HOLDER' ? 'HOLDER' : 'CLAIMER',
    },
  });

  // Send verification email
  const tokenRecord = await createToken(user.id, 'EMAIL_VERIFY');
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${tokenRecord.token}`;

  await sendEmail({
    to: user.email,
    subject: 'Verify your BenchBuddy email',
    html: `<p>Hi ${user.firstName},</p><p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
  });

  return jsonSuccess(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    201
  );
}
