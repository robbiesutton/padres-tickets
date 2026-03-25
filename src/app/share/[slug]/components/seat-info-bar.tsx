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
    <div className="mb-8 overflow-hidden">
      <div
        className={`flex items-center h-12 px-6 py-3 bg-white rounded-lg border border-solid cursor-pointer transition-colors ${expanded ? 'border-[#ffad00]' : 'border-[#dcd7d4] hover:border-[#ffad00]'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded-full bg-[rgba(255,173,0,0.1)] flex items-center justify-center text-[8px] font-bold text-[#ffad00] shrink-0">
            {teamAbbr}
          </div>
          <div className="text-base font-semibold text-[#2c2a2b] whitespace-nowrap">
            Section {pkg.section} &bull; Row {pkg.row} &bull; Seats {pkg.seats}
          </div>
        </div>
        <svg
          className={`shrink-0 transition-transform duration-200 text-[#2c2a2b] ${expanded ? 'rotate-180' : ''}`}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
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
