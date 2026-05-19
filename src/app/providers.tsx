'use client';

import { SessionProvider } from 'next-auth/react';
import {
  DESIGN_MODE,
  MOCK_AS_HOLDER,
  mockHolder,
  mockClaimer,
} from '@/lib/mock-data';

const persona = MOCK_AS_HOLDER ? mockHolder : mockClaimer;

const mockSession = DESIGN_MODE
  ? {
      user: {
        id: persona.id,
        name: `${persona.firstName} ${persona.lastName}`,
        email: persona.email,
      },
      expires: '2099-12-31T23:59:59.999Z',
    }
  : undefined;

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider session={mockSession}>{children}</SessionProvider>;
}
