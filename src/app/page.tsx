// PLACEHOLDER UI — To be replaced by designer

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <main className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          BenchBuddy
        </h1>
        <p className="text-lg text-foreground/70">
          Share your season tickets effortlessly with friends and family.
        </p>
        <div className="flex gap-4">
          <a
            href="/signup"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            I Have Season Tickets
          </a>
          <a
            href="/login"
            className="rounded-lg border border-foreground/20 px-6 py-3 text-sm font-medium text-foreground hover:bg-foreground/5"
          >
            I Was Shared a Link
          </a>
        </div>
      </main>
    </div>
  );
}
