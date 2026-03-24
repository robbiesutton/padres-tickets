'use client';

import { SessionProvider } from 'next-auth/react';

const mockSession =
  process.env.NEXT_PUBLIC_DESIGN_MODE === 'true'
    ? {
        user: {
          id: 'design-user-holder-001',
          name: 'Robbie Sutton',
          email: 'robbie@benchbuddy.app',
          role: 'HOLDER',
        },
        expires: '2099-12-31T23:59:59.999Z',
      }
    : undefined;

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider session={mockSession}>{children}</SessionProvider>;
}
