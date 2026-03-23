import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import Providers from './providers';
import { ScoreTicker } from '@/components/score-ticker';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'BenchBuddy — Share Your Season Tickets',
  description:
    'The easiest way for season ticket holders to share games with friends and family.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="flex-1 flex flex-col">{children}</div>
          <ScoreTicker />
        </Providers>
      </body>
    </html>
  );
}
