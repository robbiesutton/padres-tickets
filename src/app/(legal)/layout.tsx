import Link from 'next/link';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
        >
          &larr; Back to BenchBuddy
        </Link>
        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-p:text-foreground/70 prose-li:text-foreground/70 prose-strong:text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
