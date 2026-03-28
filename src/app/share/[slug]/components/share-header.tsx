'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { ActiveTab } from '../types';
import type { PackageInfo } from '../types';

import { getTeamColors, isColorDark } from '../team-colors';
import { getOpponentAbbr } from '../utils';

interface Props {
  holderName: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  reservedCount: number;
  pkg: PackageInfo;
}

export function ShareHeader({ holderName, activeTab, onTabChange, reservedCount, pkg }: Props) {
  const [seatInfoOpen, setSeatInfoOpen] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setSeatInfoOpen(false);
      }
      if (
        pillPanelRef.current &&
        !pillPanelRef.current.contains(e.target as Node) &&
        pillRef.current &&
        !pillRef.current.contains(e.target as Node)
      ) {
        setPillOpen(false);
      }
    }
    if (seatInfoOpen || pillOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [seatInfoOpen, pillOpen]);


  const { primary: navColor, accent: teamAccent } = getTeamColors(pkg.team);
  const isDark = isColorDark(navColor);

  return (
    <header
      className="h-[60px] md:h-[77px] flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      style={{ backgroundColor: navColor }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 cursor-pointer shrink-0" onClick={() => onTabChange('available')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isDark ? '/benchbuddy-mark-white.svg' : '/benchbuddy-logo.svg'}
            alt="BenchBuddy"
            width={24}
            height={24}
          />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif' }} className={`hidden sm:inline text-lg font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
            BenchBuddy
          </span>
        </div>

        {/* Seat info pill — compact, in header */}
        <div className="hidden md:block relative">
          <div
            ref={pillRef}
            className={`flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-lg border cursor-pointer transition-colors ${
              pillOpen ? 'border-white/30 bg-white/15' : 'border-white/20 hover:bg-white/10'
            }`}
            onClick={() => { setPillOpen(!pillOpen); setSeatInfoOpen(false); }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: teamAccent, color: navColor }}>
              {getOpponentAbbr(pkg.team)}
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#2c2a2b]'}`}>
              Sec {pkg.section} &middot; Row {pkg.row} &middot; Seats {pkg.seats}
            </span>
            <svg
              className={`shrink-0 transition-transform duration-200 ${pillOpen ? 'rotate-180' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
            >
              <path d="M6 9l6 6 6-6" stroke={isDark ? 'rgba(255,255,255,0.5)' : '#8e8985'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Pill dropdown panel */}
          <div
            ref={pillPanelRef}
            className={`absolute left-0 top-[calc(100%+8px)] z-40 w-[742px] bg-white rounded-lg border border-[#eceae5] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-200 ${
              pillOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
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
              <div className="w-[336px] shrink-0 flex flex-col pt-2">
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
                        className="inline-flex items-center justify-center text-xs font-medium text-[#8e8985] h-8 px-3 border border-[#8e8985]/75 rounded-full whitespace-nowrap"
                      >
                        {perk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Seat Info button + dropdown removed — preserved in git history as "seat info button dropdown" */}
        <button
          className={`h-11 md:h-10 px-2.5 md:px-4 rounded-lg text-sm md:text-base font-medium border-none cursor-pointer transition-all flex items-center gap-2 ${
            isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#f5f4f2] text-black hover:bg-[#eceae5]'
          }`}
          onClick={() => onTabChange('my-games')}
        >
          My Games
          {reservedCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#0F6F57] text-white text-xs font-semibold flex items-center justify-center">
              {reservedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
