import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    select: { status: true },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({ valid: true });
}
