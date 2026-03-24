import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // In design mode, skip auth entirely
  if (process.env.NEXT_PUBLIC_DESIGN_MODE === 'true') {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
