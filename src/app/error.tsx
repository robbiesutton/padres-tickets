// PLACEHOLDER UI — To be replaced by designer
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
      <h1 className="text-6xl font-bold text-foreground/20">500</h1>
      <h2 className="text-xl font-semibold">Something Went Wrong</h2>
      <p className="max-w-sm text-sm text-foreground/60">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Try Again
      </button>
    </div>
  );
}
