// PLACEHOLDER UI — To be replaced by designer

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-foreground/10" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-foreground/5"
            />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-foreground/5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
