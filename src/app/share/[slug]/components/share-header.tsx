'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { ActiveTab } from '../types';
import type { PackageInfo } from '../types';

interface Props {
  holderName: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  reservedCount: number;
  pkg: PackageInfo;
}

export function ShareHeader({ holderName, activeTab, onTabChange, reservedCount, pkg }: Props) {
  const [seatInfoOpen, setSeatInfoOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    }
    if (seatInfoOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [seatInfoOpen]);

  const priceDisplay = pkg.defaultPricePerTicket
    ? `$${pkg.defaultPricePerTicket}`
    : null;

  return (
    <header className="bg-white h-[60px] md:h-[77px] flex items-center justify-between px-4 md:px-[31px] sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div
        className="flex items-center gap-1.5 cursor-pointer"
        onClick={() => onTabChange('available')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/benchbuddy-logo.svg"
          alt="BenchBuddy"
          width={24}
          height={24}
        />
        <span style={{ fontFamily: 'var(--font-syne), sans-serif' }} className="hidden sm:inline text-lg font-bold text-[#1a1a1a]">
          BenchBuddy
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            ref={buttonRef}
            className={`h-11 md:h-10 px-2.5 md:px-4 py-2.5 rounded-lg text-sm md:text-base font-medium border-none cursor-pointer transition-all flex items-center gap-2 ${
              seatInfoOpen ? 'bg-[#eceae5] text-black' : 'bg-[#f5f4f2] text-black hover:bg-[#eceae5]'
            }`}
            onClick={() => setSeatInfoOpen(!seatInfoOpen)}
          >
            Seat Info
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className={`hidden md:block transition-transform duration-200 ${seatInfoOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" stroke="#2c2a2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Seat info panel content */}
          {(() => {
            const seatPhoto = (
              <div className="w-full h-[160px] relative overflow-hidden rounded-lg">
                {pkg.seatPhotoUrl ? (
                  <Image
                    src={pkg.seatPhotoUrl}
                    alt="View from seat"
                    fill
                    className="object-cover"
                    sizes="366px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full relative" style={{ backgroundImage: 'linear-gradient(156deg, rgb(74,122,58) 0%, rgb(122,170,90) 50%, rgb(74,122,58) 100%)' }}>
                    <div className="absolute bottom-0 left-0 right-0 h-[35%]" style={{ backgroundImage: 'linear-gradient(171deg, rgb(196,149,90) 0%, rgb(212,165,106) 100%)' }} />
                    <div className="absolute bottom-[35%] left-[15%] w-[70%] h-[2px] bg-[#e8d8b8] rounded" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-[#2c2a2b]/80 text-white text-xs font-medium leading-4 px-2.5 py-1 rounded-md">
                  View from Section {pkg.section}
                </div>
              </div>
            );

            const titleBlock = (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-px">
                  <h3 className="text-xl font-bold text-[#2c2a2b] leading-7">
                    Section {pkg.section} &middot; Row {pkg.row}
                  </h3>
                  <p className="text-sm font-normal text-[#8e8985] leading-5">
                    Petco Park &middot; San Diego, CA
                  </p>
                </div>
                {pkg.description && (
                  <p className="text-sm font-normal text-black leading-[22.75px]">
                    {pkg.description}
                  </p>
                )}
              </div>
            );

            const detailsTable = (
              <div className="flex flex-col gap-2 text-xs leading-5">
                <div className="flex items-center justify-between">
                  <span className="font-normal text-black">Seats</span>
                  <span className="font-bold text-black">Seats {pkg.seats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-normal text-black">Level</span>
                  <span className="font-bold text-black">Field Level</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-normal text-black">Price per seat</span>
                  <span className="font-bold text-black">{priceDisplay ?? 'Price varies'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-normal text-black">Ticket delivery</span>
                  <span className="font-bold text-black">MLB Ballpark App</span>
                </div>
              </div>
            );

            const perksBadges = pkg.perks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pkg.perks.map((perk) => (
                  <span
                    key={perk}
                    className="inline-flex items-center justify-center text-xs font-medium text-[#8e8985] h-8 px-3 border border-[#8e8985]/75 rounded-full whitespace-nowrap"
                  >
                    {perk}
                  </span>
                ))}
              </div>
            ) : null;

            {/* Desktop: original layout */}
            const desktopContent = (
              <div className="p-4 flex flex-col gap-4">
                {seatPhoto}
                <div className="flex flex-col gap-4 pb-4 border-b border-[#f5f4f2]">
                  {titleBlock}
                  {detailsTable}
                </div>
                {perksBadges}
              </div>
            );

            {/* Mobile: updated layout with spacing standards */}
            const mobileContent = (
              <div className="px-4 pt-5 pb-6 flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 pb-4 border-b border-[#f5f4f2]">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-bold text-[#2c2a2b] leading-7">
                        Section {pkg.section} &middot; Row {pkg.row}
                      </h3>
                      <p className="text-sm font-normal text-[#8e8985] leading-5">
                        Petco Park &middot; San Diego, CA
                      </p>
                    </div>
                    {pkg.description && (
                      <p className="text-base font-normal text-black leading-relaxed">
                        {pkg.description}
                      </p>
                    )}
                  </div>
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
                      <span className="font-normal text-black">Price per seat</span>
                      <span className="font-bold text-black">{priceDisplay ?? 'Price varies'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-normal text-black">Ticket delivery</span>
                      <span className="font-bold text-black">MLB Ballpark App</span>
                    </div>
                  </div>
                </div>
                {seatPhoto}
                {perksBadges && (
                  <div className="flex flex-wrap gap-2">
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
            );

            return (
              <>
                {/* Desktop dropdown */}
                <div
                  ref={panelRef}
                  className={`hidden md:block absolute right-0 top-[calc(100%+8px)] w-[366px] bg-white rounded-lg border border-[#eceae5] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-200 ${
                    seatInfoOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                >
                  {desktopContent}
                </div>

                {/* Mobile drawer */}
                {seatInfoOpen && createPortal(
                  <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setSeatInfoOpen(false)} />
                    <div
                      ref={panelRef}
                      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up max-h-[85vh] overflow-y-auto"
                    >
                      <div className="relative">
                        <button
                          className="absolute top-3 right-2 w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
                          onClick={() => setSeatInfoOpen(false)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        </button>
                        {mobileContent}
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </>
            );
          })()}
        </div>
        <button
          className="h-11 md:h-10 px-2.5 md:px-4 rounded-lg text-sm md:text-base font-medium border-none cursor-pointer transition-all bg-[#f5f4f2] text-black hover:bg-[#eceae5] flex items-center gap-2"
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
