// PLACEHOLDER UI — To be replaced by designer

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Share your season tickets effortlessly
        </h1>
        <p className="max-w-lg text-lg text-foreground/70">
          BenchBuddy makes it easy for season ticket holders to share games with
          friends and family. Set up once, share a link, let them claim.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/signup"
            className="rounded-lg bg-brand-600 px-8 py-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            I Have Season Tickets
          </a>
          <a
            href="/login"
            className="rounded-lg border border-foreground/20 px-8 py-3 text-sm font-medium text-foreground hover:bg-foreground/5"
          >
            I Was Shared a Link
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-foreground/[0.02] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold">How It Works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Set Up Your Package',
                desc: 'Select your team, enter your seat details, and your full season schedule loads automatically.',
              },
              {
                step: '2',
                title: 'Share Your Link',
                desc: 'Get a unique link for your tickets. Send it to friends and family via text, email, or any app.',
              },
              {
                step: '3',
                title: 'Friends Claim Games',
                desc: 'They browse available dates, claim the games they want, and you get notified to transfer tickets.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-foreground/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold">
            Everything You Need
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                title: 'Automatic Schedule Loading',
                desc: 'Select your MLB team and all home games load instantly. No manual entry.',
              },
              {
                title: 'Transfer Coordination',
                desc: 'Get step-by-step instructions for your ticketing platform. One-click to mark as transferred.',
              },
              {
                title: 'Payment Tracking',
                desc: 'Track who owes what. Share free or set per-ticket prices. No money flows through us.',
              },
              {
                title: 'Multi-Package Support',
                desc: 'Have seats for multiple teams or sections? Manage them all from one dashboard.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-foreground/10 p-6"
              >
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-foreground/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-foreground/[0.02] px-6 py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="mb-4 text-2xl font-bold">Simple Pricing</h2>
          <div className="rounded-xl border border-foreground/10 p-8">
            <p className="text-3xl font-bold">Free</p>
            <p className="mt-1 text-sm text-foreground/60">
              during early access
            </p>
            <ul className="mt-6 space-y-2 text-left text-sm">
              {[
                '1 ticket package',
                'Unlimited games',
                'Unlimited sharing',
                'Transfer coordination',
                'Payment tracking',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-600">&#10003;</span> {item}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="mt-6 block rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">FAQ</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Does BenchBuddy handle the actual ticket transfer?',
                a: 'No. BenchBuddy coordinates who gets which games and provides transfer instructions. You transfer tickets through your ticketing platform (Ticketmaster, AXS, etc.).',
              },
              {
                q: 'Does money flow through BenchBuddy?',
                a: 'No. Payment is handled directly between you and your friends via Venmo, Zelle, or however you prefer. BenchBuddy just tracks the status.',
              },
              {
                q: 'Which teams are supported?',
                a: 'All 30 MLB teams are supported at launch. NBA, NFL, NHL, and MLS coming soon.',
              },
              {
                q: 'Do my friends need an account?',
                a: 'They can browse available games without an account. A lightweight account (just email and name) is needed to claim.',
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-1 text-sm text-foreground/60">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">
          Ready to share your tickets?
        </h2>
        <a
          href="/signup"
          className="inline-block rounded-lg bg-brand-600 px-8 py-3 text-sm font-medium text-white hover:bg-brand-700"
        >
          Get Started Free
        </a>
      </section>
    </div>
  );
}
