import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ — BenchBuddy',
  description: 'Frequently asked questions about BenchBuddy — how it works, ticket transfers, payments, and more.',
};

const faqs = [
  {
    q: 'What is BenchBuddy?',
    a: 'BenchBuddy is a coordination tool that helps season ticket holders share their tickets with friends and family. It tracks who wants to go to which game, handles cost-sharing calculations, and provides transfer instructions — but it does not sell, transfer, or broker tickets.',
  },
  {
    q: 'Does BenchBuddy transfer my tickets?',
    a: 'No. BenchBuddy helps you coordinate who gets which games, but the actual ticket transfer must be done through your team\'s official app (e.g., the MLB Ballpark App, Ticketmaster). BenchBuddy provides step-by-step instructions for your specific team\'s transfer process.',
  },
  {
    q: 'Does money flow through BenchBuddy?',
    a: 'No. BenchBuddy calculates cost-sharing amounts based on face value, but all payments happen directly between you and your friends using whatever method you prefer — Venmo, Zelle, PayPal, cash, etc. BenchBuddy never touches the money.',
  },
  {
    q: 'Is this allowed by my team?',
    a: 'BenchBuddy facilitates sharing among friends and family at face value — which is generally permitted by most season ticket agreements. However, every team\'s policies are different. We encourage you to review your specific season ticket holder agreement. BenchBuddy is not a resale platform and does not facilitate commercial ticket distribution.',
  },
  {
    q: 'How do I get reimbursed?',
    a: 'When someone claims a game, BenchBuddy shows both parties the cost-sharing amount. The claimer pays the holder directly using the payment method the holder specifies (e.g., Venmo handle). BenchBuddy tracks payment status so everyone knows where things stand.',
  },
  {
    q: 'How does the share link work?',
    a: 'When you create a ticket package, BenchBuddy generates a unique share link. Send this link to your friends and family via text, email, or any messaging app. They can browse available games, see seat details, and claim the games they want — no account required to browse.',
  },
  {
    q: 'Do my friends need an account?',
    a: 'They can browse available games without an account. To claim a game, they just need to provide their email — we\'ll send them a confirmation link. No password required for claimers.',
  },
  {
    q: 'Which teams are supported?',
    a: 'All 30 MLB teams are supported. When you create a package, your team\'s full home schedule loads automatically. We include section-specific seating data and transfer instructions for every team.',
  },
  {
    q: 'Can I share tickets for multiple seat locations?',
    a: 'Yes. You can create multiple packages — one for each set of seats. Each package gets its own share link and game schedule.',
  },
  {
    q: 'What if someone claims a game and then can\'t go?',
    a: 'Claimers can release their claim at any time from the share page. This makes the game available again for others in your circle. The holder gets notified when a game is released.',
  },
  {
    q: 'Is BenchBuddy free?',
    a: 'BenchBuddy offers a free tier during early access. Check our pricing page for current plan details.',
  },
  {
    q: 'Is BenchBuddy affiliated with any sports team or league?',
    a: 'No. BenchBuddy is an independent platform. We are not affiliated with, endorsed by, or connected to MLB, any sports team, Ticketmaster, or any ticketing platform. Team names and logos are used solely for identification.',
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
        >
          &larr; Back to BenchBuddy
        </Link>

        <h1 className="text-2xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-foreground/60 mb-8">
          Everything you need to know about BenchBuddy.
        </p>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h2 className="font-semibold mb-1">{faq.q}</h2>
              <p className="text-sm text-foreground/70">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-foreground/10 p-6 text-center">
          <p className="font-medium mb-1">Still have questions?</p>
          <p className="text-sm text-foreground/60 mb-3">
            We&apos;re here to help.
          </p>
          <a
            href="mailto:support@benchbuddy.com"
            className="inline-block rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Contact Support
          </a>
        </div>
      </div>

      {/* FAQ Structured Data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
