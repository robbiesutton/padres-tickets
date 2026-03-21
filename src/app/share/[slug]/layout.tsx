import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    include: {
      user: { select: { firstName: true, lastName: true } },
      _count: { select: { games: { where: { status: 'AVAILABLE' } } } },
    },
  });

  if (!pkg) {
    return {
      title: 'BenchBuddy — Link Not Found',
    };
  }

  const holderName = `${pkg.user.firstName} ${pkg.user.lastName}`;
  const availableCount = pkg._count.games;

  return {
    title: `${holderName}'s ${pkg.team} Tickets — BenchBuddy`,
    description: `${availableCount} games available this ${pkg.season} season. Claim your tickets!`,
    openGraph: {
      title: `${holderName}'s ${pkg.team} Tickets on BenchBuddy`,
      description: `${availableCount} games available this season`,
      type: 'website',
      siteName: 'BenchBuddy',
    },
  };
}

export default function ShareLayout({ children }: Props) {
  return <>{children}</>;
}
