import { prisma } from '@/lib/db';

export async function generateUniqueSlug(
  firstName: string,
  teamAbbreviation: string
): Promise<string> {
  const base = `${firstName}-${teamAbbreviation}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  // Check if base slug is available
  const existing = await prisma.package.findUnique({
    where: { shareLinkSlug: base },
  });

  if (!existing) return base;

  // Append incrementing number
  for (let i = 2; i <= 100; i++) {
    const candidate = `${base}-${i}`;
    const taken = await prisma.package.findUnique({
      where: { shareLinkSlug: candidate },
    });
    if (!taken) return candidate;
  }

  // Fallback: append random suffix
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}
