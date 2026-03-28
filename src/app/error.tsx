'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-6xl font-bold text-foreground/10">500</h1>
      <h2 className="text-xl font-semibold">Something Went Wrong</h2>
      <p className="max-w-sm text-sm text-foreground/60">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Try Again
        </button>
        <a
          href="/contact"
          className="rounded-lg border border-foreground/20 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
