import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { jsonError } from '@/lib/api-utils';
import { getClientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { DESIGN_MODE } from '@/lib/mock-data';
import { setSessionCookie } from '@/lib/session';
import { trackServerEvent, AnalyticsEvents } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  if (DESIGN_MODE) {
    return NextResponse.json({
      ok: true,
      data: { message: 'Check your email to verify your account' },
    });
  }
  const ip = getClientIp(request);
  const { success } = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!success) return rateLimitResponse();

  const body = await request.json();
  const {
    firstName,
    lastName,
    email,
    password,
    agreedToTerms,
    marketingOptIn,
  } = body;

  if (!agreedToTerms) {
    return jsonError(
      'You must agree to the Terms of Service and Privacy Policy',
      400
    );
  }

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
      emailVerified: new Date(),
      notificationPrefs: { marketingOptIn: !!marketingOptIn },
    },
  });

  trackServerEvent(
    AnalyticsEvents.SIGNUP_COMPLETED,
    { email: user.email, firstName: user.firstName },
    user.id
  );

  const response = NextResponse.json(
    {
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    },
    { status: 201 }
  );

  await setSessionCookie(user, request, response);

  return response;
}
