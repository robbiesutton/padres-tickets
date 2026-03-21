// PLACEHOLDER UI — To be replaced by designer

import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { SharePageClient } from './share-page-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SharePage({ params }: Props) {
  const { slug } = await params;

  const pkg = await prisma.package.findUnique({
    where: { shareLinkSlug: slug },
    include: {
      user: { select: { firstName: true, lastName: true } },
      games: {
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          time: true,
          opponent: true,
          opponentLogo: true,
          status: true,
          pricePerTicket: true,
          notes: true,
        },
      },
    },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    notFound();
  }

  // Serialize dates for client component
  const games = pkg.games.map((g) => ({
    ...g,
    date: g.date.toISOString(),
    pricePerTicket: g.pricePerTicket ? Number(g.pricePerTicket) : null,
  }));

  const opponents = [...new Set(pkg.games.map((g) => g.opponent))].sort();

  return (
    <SharePageClient
      slug={slug}
      holderName={`${pkg.user.firstName} ${pkg.user.lastName}`}
      team={pkg.team}
      section={pkg.section}
      row={pkg.row}
      seats={pkg.seats}
      seatCount={pkg.seatCount}
      season={pkg.season}
      games={games}
      opponents={opponents}
    />
  );
}
