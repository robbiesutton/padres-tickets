'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { PackageInfo } from '../types';
import { getOpponentAbbr } from '../utils';

interface Props {
  pkg: PackageInfo;
}

export function SeatInfoBar({ pkg }: Props) {
  const [expanded, setExpanded] = useState(false);
  const teamAbbr = getOpponentAbbr(pkg.team);
  const priceDisplay = pkg.defaultPricePerTicket
    ? `$${pkg.defaultPricePerTicket}`
    : null;

  return (
    <div className="mb-8 bg-card rounded-xl border border-border overflow-hidden">
      <div
        className="flex items-center gap-3.5 p-6 cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.01)]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-full bg-[rgba(212,168,67,0.1)] flex items-center justify-center text-xs font-bold text-accent shrink-0">
          {teamAbbr}
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-foreground">
            {pkg.team} &middot; Section {pkg.section}
          </div>
          <div className="text-sm text-muted mt-0.5">
            {pkg.row ? `Row ${pkg.row}, ` : ''}Seats {pkg.seats} &middot;{' '}
            {pkg.seatCount} seat{pkg.seatCount !== 1 ? 's' : ''}
          </div>
        </div>
        {priceDisplay && (
          <div className="px-3.5 py-1.5 bg-background rounded-lg text-base font-semibold text-foreground shrink-0">
            {priceDisplay}
            <span className="text-sm font-normal text-muted">/seat</span>
          </div>
        )}
        <svg
          className={`shrink-0 transition-transform duration-200 text-muted ${expanded ? 'rotate-180' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? '400px' : '0' }}
      >
        <div className="px-6 pb-6">
          <div className="flex items-start gap-4 pt-2">
            {pkg.seatPhotoUrl ? (
              <div className="w-[120px] h-[80px] rounded-lg overflow-hidden shrink-0 relative">
                <Image
                  src={pkg.seatPhotoUrl}
                  alt="Seat view"
                  fill
                  className="object-cover"
                  sizes="120px"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-[120px] h-[80px] rounded-lg overflow-hidden shrink-0">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4a7a3a] via-[#7aaa5a] to-[#4a7a3a] relative">
                  <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-br from-[#c4955a] to-[#d4a56a]" />
                  <div className="absolute bottom-[35%] left-[15%] w-[70%] h-[2px] bg-[#e8d8b8] rounded-sm" />
                </div>
              </div>
            )}
            {pkg.description && (
              <p className="text-base text-muted leading-relaxed">
                {pkg.description}
              </p>
            )}
          </div>
          {pkg.perks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {pkg.perks.map((perk) => (
                <div
                  key={perk}
                  className="flex items-center gap-[5px] text-sm text-muted px-3.5 py-1.5 border border-border rounded-full whitespace-nowrap"
                >
                  {perk}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
