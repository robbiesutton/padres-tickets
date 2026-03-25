import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { SharePageClient } from './share-page-client';
import {
  DESIGN_MODE,
  mockPackageInfo,
  mockGames,
  mockOpponents,
} from '@/lib/mock-data';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SharePage({ params }: Props) {
  const { slug } = await params;

  // Design mode: return mock data without querying database
  if (DESIGN_MODE) {
    return (
      <SharePageClient
        packageInfo={mockPackageInfo}
        games={mockGames}
        opponents={mockOpponents}
      />
    );
  }

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
          claim: {
            select: {
              id: true,
              claimerUserId: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    notFound();
  }

  const games = pkg.games.map((g) => ({
    ...g,
    date: g.date.toISOString(),
    pricePerTicket: g.pricePerTicket ? Number(g.pricePerTicket) : null,
  }));

  const opponents = [...new Set(pkg.games.map((g) => g.opponent))].sort();

  return (
    <SharePageClient
      packageInfo={{
        slug,
        holderName: `${pkg.user.firstName} ${pkg.user.lastName}`,
        team: pkg.team,
        section: pkg.section,
        row: pkg.row,
        seats: pkg.seats,
        seatCount: pkg.seatCount,
        season: pkg.season,
        defaultPricePerTicket: pkg.defaultPricePerTicket
          ? Number(pkg.defaultPricePerTicket)
          : null,
        description: pkg.description,
        seatPhotoUrl: pkg.seatPhotoUrl,
        perks: pkg.perks ?? [],
      }}
      games={games}
      opponents={opponents}
    />
  );
}
