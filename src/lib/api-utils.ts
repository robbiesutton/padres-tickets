import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  // In design mode, return a mock user so API routes work without a real session
  if (process.env.NEXT_PUBLIC_DESIGN_MODE === 'true') {
    return {
      id: 'design-user-holder-001',
      name: 'Robbie Sutton',
      email: 'robbie@benchbuddy.app',
      role: 'HOLDER',
    };
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}
