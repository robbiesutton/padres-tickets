// PLACEHOLDER UI — To be replaced by designer
// Full frontend built in P1-E-03

import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

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
        where: { status: 'AVAILABLE' },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!pkg || pkg.status !== 'ACTIVE') {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {pkg.user.firstName}&apos;s {pkg.team} Tickets
          </h1>
          <p className="text-sm text-foreground/60">
            {pkg.season} &middot; Section {pkg.section}
            {pkg.row ? `, Row ${pkg.row}` : ''} &middot; {pkg.seatCount} seats
          </p>
        </div>

        <p className="text-foreground/70">{pkg.games.length} games available</p>

        <div className="space-y-3">
          {pkg.games.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between rounded-lg border border-foreground/10 p-4"
            >
              <div>
                <p className="font-medium">{game.opponent}</p>
                <p className="text-sm text-foreground/60">
                  {new Date(game.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {game.time ? ` at ${game.time}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {game.pricePerTicket !== null && (
                  <span className="text-sm text-foreground/60">
                    ${Number(game.pricePerTicket)}/ticket
                  </span>
                )}
                <span className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white">
                  Claim
                </span>
              </div>
            </div>
          ))}

          {pkg.games.length === 0 && (
            <p className="py-8 text-center text-foreground/50">
              No games available right now. Check back later!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
