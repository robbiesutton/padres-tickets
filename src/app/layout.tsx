import type { Metadata } from 'next';
import { DM_Sans, Inter, Syne } from 'next/font/google';
import Script from 'next/script';
import Providers from './providers';
import { ConditionalTicker } from '@/components/conditional-ticker';
import { ConditionalAnalytics } from '@/components/conditional-analytics';
import { CookieConsent } from '@/components/cookie-consent';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['700'],
});

export const metadata: Metadata = {
  title: 'BenchBuddy — Share Your Season Tickets',
  description:
    'The easiest way for season ticket holders to share games with friends and family.',
  openGraph: {
    title: 'BenchBuddy — Share Your Season Tickets',
    description:
      'The easiest way for season ticket holders to share games with friends and family.',
    type: 'website',
    siteName: 'BenchBuddy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BenchBuddy — Share Your Season Tickets',
    description:
      'The easiest way for season ticket holders to share games with friends and family.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${inter.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script src="https://mcp.figma.com/mcp/html-to-design/capture.js" strategy="afterInteractive" />
        <Providers>
          <div className="flex-1 flex flex-col">{children}</div>
          <ConditionalTicker />
          <SiteFooter />
          <ConditionalAnalytics />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
