import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — BenchBuddy',
  description: 'BenchBuddy helps season ticket holders share games with friends and family. Built by a ticket holder, for ticket holders.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
        >
          &larr; Back to BenchBuddy
        </Link>

        <h1 className="text-2xl font-bold mb-6">About BenchBuddy</h1>

        <div className="space-y-6 text-sm text-foreground/70 leading-relaxed">
          <p>
            BenchBuddy was born out of a simple frustration: managing season
            tickets with friends shouldn&apos;t require a spreadsheet, a group
            chat, and a prayer.
          </p>

          <p>
            As a season ticket holder, you know the drill. You&apos;ve got 81
            home games, a handful of friends who want to go, and no clean way to
            figure out who&apos;s going to which game, who owes what, and when
            tickets need to be transferred. Every season, it&apos;s the same
            chaos — texts flying, Venmo requests piling up, and that one friend
            who always forgets to accept the transfer.
          </p>

          <p>
            BenchBuddy fixes that. It&apos;s the coordination layer between
            you and your people. Share a link with your circle, let them browse
            and claim games, and BenchBuddy handles the rest — reminders,
            cost tracking, transfer instructions, everything.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-8">
            What BenchBuddy Is Not
          </h2>

          <p>
            BenchBuddy is not a ticket marketplace. We don&apos;t sell tickets,
            process payments, or facilitate transactions with strangers. We&apos;re
            a tool for friends sharing with friends — the way season tickets were
            meant to work.
          </p>

          <p>
            All ticket transfers happen through your team&apos;s official app
            (like the MLB Ballpark App). All payments happen directly between
            you and your friends via Venmo, Zelle, or however you prefer.
            BenchBuddy just makes sure everyone knows who&apos;s going where.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-8">
            Built in San Diego
          </h2>

          <p>
            BenchBuddy is built and operated independently. We&apos;re not
            affiliated with any sports team, league, or ticketing platform.
            We&apos;re just fans who wanted a better way to share the seats we
            love.
          </p>
        </div>
      </div>
    </div>
  );
}
