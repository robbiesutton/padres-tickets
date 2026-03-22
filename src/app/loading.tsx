// PLACEHOLDER UI — To be replaced by designer

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-foreground/10 border-t-brand-600" />
        <p className="text-sm text-foreground/50">Loading...</p>
      </div>
    </div>
  );
}
