import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PREVIEW_BOT_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  'whatsapp',
  'applebot',
  'googlebot',
  'bingbot',
  'redditbot',
  'vkshare',
];

function isLinkPreviewBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return PREVIEW_BOT_PATTERNS.some((p) => lower.includes(p));
}

export async function middleware(request: NextRequest) {
  // In design mode, skip auth entirely
  if (process.env.NEXT_PUBLIC_DESIGN_MODE === 'true') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // OG image endpoints must always be public — bots fetch the image after reading og:image
  if (pathname.endsWith('/opengraph-image')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith('/share/')) {
      // Known link-preview bots must reach the share page to read its OG metadata
      const ua = request.headers.get('user-agent') ?? '';
      if (isLinkPreviewBot(ua)) {
        return NextResponse.next();
      }
      const slug = pathname.split('/share/')[1]?.split('/')[0] ?? '';
      const joinUrl = new URL('/join', request.url);
      if (slug) joinUrl.searchParams.set('from', slug);
      return NextResponse.redirect(joinUrl);
    }

    // Dashboard → redirect to login, preserving intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/share/:path*'],
};
