// PLACEHOLDER UI — To be replaced by designer

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-6xl font-bold text-foreground/20">404</h1>
      <h2 className="text-xl font-semibold">Page Not Found</h2>
      <p className="max-w-sm text-sm text-foreground/60">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Go Home
      </Link>
    </div>
  );
}
