// PLACEHOLDER UI — To be replaced by designer
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex flex-1 flex-col p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-foreground/60">
            Signed in as {session.user.email}
          </p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-6">
          <p className="text-foreground/60">
            Dashboard content will be built in Phase 3.
          </p>
        </div>
      </div>
    </div>
  );
}
