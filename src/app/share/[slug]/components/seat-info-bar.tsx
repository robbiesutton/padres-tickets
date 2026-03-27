'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { PackageInfo } from '../types';
import { getOpponentAbbr } from '../utils';

function PerkIcon({ perk }: { perk: string }) {
  const lower = perk.toLowerCase();
  const cls = "w-4 h-4 shrink-0";

  if (lower.includes('shade') || lower.includes('sun') || lower.includes('cover')) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        <circle cx="12" cy="12" r="5" />
      </svg>
    );
  }
  if (lower.includes('beer') || lower.includes('drink') || lower.includes('cocktail') || lower.includes('bar') || lower.includes('craft')) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2h8l-1 10H9L8 2z" />
        <path d="M12 12v6" />
        <path d="M8 18h8" />
        <path d="M10 2l-1 4h6l-1-4" />
      </svg>
    );
  }
  if (lower.includes('food') || lower.includes('burger') || lower.includes('eat') || lower.includes('restaurant')) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11h18M5 11V8a7 7 0 0114 0v3M5 11v2a2 2 0 002 2h10a2 2 0 002-2v-2M7 15v2M17 15v2M6 17h12" />
      </svg>
    );
  }
  if (lower.includes('parking') || lower.includes('access') || lower.includes('easy')) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 17V7h4a3 3 0 010 6H9" />
      </svg>
    );
  }
  if (lower.includes('premium') || lower.includes('vip') || lower.includes('club')) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  // Default icon
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

interface Props {
  pkg: PackageInfo;
}

export function SeatInfoBar({ pkg }: Props) {
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const teamAbbr = getOpponentAbbr(pkg.team);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        barRef.current &&
        !barRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    }
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  return (
    <div className="relative mb-4">
      {/* Trigger bar */}
      <div
        ref={barRef}
        className={`flex items-center h-12 px-4 md:px-6 py-3 rounded-xl border border-solid cursor-pointer transition-colors ${
          expanded ? 'border-[#FFC425] bg-[#FFC425]/10' : 'border-[#FFC425] bg-[#FFC425]/10 hover:bg-[#FFC425]/15'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="w-[30px] h-[30px] rounded-full bg-[#2F241D] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {teamAbbr}
          </div>
          <div className="text-base font-semibold text-[#2c2a2b] whitespace-nowrap">
            <span className="hidden md:inline">{pkg.team} &bull; </span>Section {pkg.section} &bull; Row {pkg.row} &bull; Seats {pkg.seats}
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

      {/* Desktop floating dropdown */}
      <div
        ref={panelRef}
        className={`hidden md:block absolute right-0 top-[calc(100%+8px)] z-40 w-[840px] max-w-full bg-white rounded-lg border border-[#eceae5] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-200 ${
          expanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="p-4 flex gap-4">
          {/* Image */}
          <div className="flex-1 relative overflow-hidden rounded-lg self-stretch min-h-[200px]">
            {pkg.seatPhotoUrl ? (
              <Image
                src={pkg.seatPhotoUrl}
                alt="View from seat"
                fill
                className="object-cover"
                sizes="358px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full relative" style={{ backgroundImage: 'linear-gradient(143deg, rgb(74,122,58) 0%, rgb(122,170,90) 50%, rgb(74,122,58) 100%)' }}>
                <div className="absolute bottom-0 left-0 right-0 h-[85px]" style={{ backgroundImage: 'linear-gradient(167deg, rgb(196,149,90) 0%, rgb(212,165,106) 100%)' }} />
                <div className="absolute bottom-[85px] left-[15%] w-[70%] h-[2px] bg-[#e8d8b8] rounded" />
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-[#2c2a2b]/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
              View from Section {pkg.section}
            </div>
          </div>

          {/* Content */}
          <div className="w-[400px] shrink-0 flex flex-col pt-2">
            {pkg.description && (
              <p className="text-base font-normal text-black leading-[22.75px] pb-4 border-b border-[#f5f4f2]">
                {pkg.description}
              </p>
            )}
            <div className="flex flex-col gap-2 text-sm leading-5 py-4 border-b border-[#f5f4f2]">
              <div className="flex items-center justify-between">
                <span className="font-normal text-black">Seats</span>
                <span className="font-bold text-black">Seats {pkg.seats}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-normal text-black">Level</span>
                <span className="font-bold text-black">Field Level</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-normal text-black">Ticket delivery</span>
                <span className="font-bold text-black">MLB Ballpark App</span>
              </div>
            </div>
            {pkg.perks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {pkg.perks.map((perk) => (
                  <span
                    key={perk}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#8e8985] h-8 px-3 border border-[#8e8985]/75 rounded-full whitespace-nowrap"
                  >
                    <PerkIcon perk={perk} />
                    {perk}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {expanded && createPortal(
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setExpanded(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="relative">
              <button
                className="absolute top-3 right-2 w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
                onClick={() => setExpanded(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
              <div className="px-4 pt-5 pb-6 flex flex-col gap-4">
                {/* Seat photo */}
                <div className="w-full h-[180px] relative overflow-hidden rounded-lg">
                  {pkg.seatPhotoUrl ? (
                    <Image
                      src={pkg.seatPhotoUrl}
                      alt="View from seat"
                      fill
                      className="object-cover"
                      sizes="100vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full relative" style={{ backgroundImage: 'linear-gradient(143deg, rgb(74,122,58) 0%, rgb(122,170,90) 50%, rgb(74,122,58) 100%)' }}>
                      <div className="absolute bottom-0 left-0 right-0 h-[35%]" style={{ backgroundImage: 'linear-gradient(167deg, rgb(196,149,90) 0%, rgb(212,165,106) 100%)' }} />
                      <div className="absolute bottom-[35%] left-[15%] w-[70%] h-[2px] bg-[#e8d8b8] rounded" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-[#2c2a2b]/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                    View from Section {pkg.section}
                  </div>
                </div>

                {/* Description */}
                {pkg.description && (
                  <p className="text-base font-normal text-black leading-relaxed pb-4 border-b border-[#f5f4f2]">
                    {pkg.description}
                  </p>
                )}

                {/* Details table */}
                <div className="flex flex-col gap-3 text-sm leading-6 pb-4 border-b border-[#f5f4f2]">
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-black">Seats</span>
                    <span className="font-bold text-black">Seats {pkg.seats}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-black">Level</span>
                    <span className="font-bold text-black">Field Level</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-black">Ticket delivery</span>
                    <span className="font-bold text-black">MLB Ballpark App</span>
                  </div>
                </div>

                {/* Perks badges */}
                {pkg.perks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pkg.perks.map((perk) => (
                      <span
                        key={perk}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#8e8985] h-8 px-3 border border-[#8e8985]/75 rounded-full whitespace-nowrap"
                      >
                        <PerkIcon perk={perk} />
                        {perk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
