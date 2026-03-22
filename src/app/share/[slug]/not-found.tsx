// PLACEHOLDER UI — To be replaced by designer

import Link from 'next/link';

export default function ShareNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold text-foreground/20">Link Not Found</h1>
      <p className="max-w-sm text-sm text-foreground/60">
        This share link doesn&apos;t exist or has been deactivated by the ticket
        holder.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Go to BenchBuddy
      </Link>
    </div>
  );
}
