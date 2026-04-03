import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // In design mode, skip auth entirely
  if (process.env.NEXT_PUBLIC_DESIGN_MODE === 'true') {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const pathname = request.nextUrl.pathname;

    // Share pages → redirect to claimer signup with slug
    if (pathname.startsWith('/share/')) {
      const slug = pathname.split('/share/')[1]?.split('/')[0] || '';
      const joinUrl = new URL('/join', request.url);
      if (slug) joinUrl.searchParams.set('from', slug);
      return NextResponse.redirect(joinUrl);
    }

    // Dashboard → redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/share/:path*'],
};
