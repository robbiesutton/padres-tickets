import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us — BenchBuddy',
  description: 'Get in touch with the BenchBuddy team for support, feedback, or partnership inquiries.',
};

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
        >
          &larr; Back to BenchBuddy
        </Link>

        <h1 className="text-2xl font-bold mb-2">Contact Us</h1>
        <p className="text-foreground/60 mb-8">
          We&apos;d love to hear from you — whether you have a question, a bug
          report, a feature request, or just want to say hey.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">Get in Touch</h2>
            <div className="rounded-lg border border-foreground/10 p-4 max-w-sm">
              <p className="text-sm text-foreground/60">For anything at all</p>
              <a href="mailto:hello@getbenchbuddy.com" className="font-medium text-brand-600 hover:underline">
                hello@getbenchbuddy.com
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Response Time</h2>
            <p className="text-sm text-foreground/70">
              We aim to respond to all inquiries within 24-48 hours during
              business days. If your question is about an upcoming game, please
              reach out as early as possible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Feedback</h2>
            <p className="text-sm text-foreground/70">
              BenchBuddy is built by a season ticket holder, for season ticket
              holders. Your feedback directly shapes the product. Tell us
              what&apos;s working, what&apos;s not, and what you wish BenchBuddy
              could do.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Bug Reports</h2>
            <p className="text-sm text-foreground/70 mb-2">
              Found something broken? Let us know at{' '}
              <a href="mailto:hello@getbenchbuddy.com" className="text-brand-600 hover:underline">
                hello@getbenchbuddy.com
              </a>{' '}
              and include:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/70">
              <li>What you were trying to do</li>
              <li>What happened instead</li>
              <li>What device and browser you&apos;re using</li>
              <li>A screenshot if possible</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
