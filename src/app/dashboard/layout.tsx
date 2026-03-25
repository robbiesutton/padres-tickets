'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/my-games', label: 'My Games' },
  { href: '/dashboard/packages/new', label: 'New Package' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <nav className="bg-white h-[60px] md:h-[77px] flex items-center justify-between px-3 md:px-[31px] sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <img src="/benchbuddy-logo.svg" alt="BenchBuddy" width={24} height={24} />
          <span
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            className="hidden sm:inline text-lg font-bold text-[#1a1a1a]"
          >
            BenchBuddy
          </span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-9 md:h-10 px-2.5 md:px-4 rounded-lg text-sm md:text-base font-medium border-none cursor-pointer transition-all flex items-center ${
                  isActive
                    ? 'bg-[#eceae5] text-black'
                    : 'bg-[#f5f4f2] text-black hover:bg-[#eceae5]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
