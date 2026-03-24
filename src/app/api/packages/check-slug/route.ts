import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug || slug.length < 2) {
    return jsonError('Slug must be at least 2 characters', 400);
  }

  const sanitized = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  const existing = await prisma.package.findUnique({
    where: { shareLinkSlug: sanitized },
  });

  return jsonSuccess({ available: !existing, slug: sanitized });
}
