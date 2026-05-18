'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { ActiveTab } from '../types';
import type { PackageInfo } from '../types';

import { getTeamColors, isColorDark } from '../team-colors';
import { getOpponentAbbr } from '../utils';
import { DESIGN_MODE, mockClaimer } from '@/lib/mock-data';

interface Props {
  holderName: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  reservedCount: number;
  pkg: PackageInfo;
}

export function ShareHeader({ holderName, activeTab, onTabChange, reservedCount, pkg }: Props) {
  const { data: session } = useSession();
  const userInitial =
    session?.user?.name?.charAt(0)?.toUpperCase() ||
    (DESIGN_MODE ? mockClaimer.firstName.charAt(0).toUpperCase() : '');
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

  const firstName = pkg.holderName?.trim().split(/\s+/)[0] || '';
  const pillLabel = firstName ? `${firstName}'s seats` : 'These seats';
  const payHeading = firstName ? `How to pay ${firstName}` : 'How to pay';
  const claimStep = firstName
    ? `Claim it, then pay ${firstName} directly.`
    : 'Claim it, then pay the holder directly.';

  const hasPhoto = !!pkg.seatPhotoUrl;
  const hasPayment = !!(pkg.venmoHandle?.trim() || pkg.zelleInfo?.trim());
  const isCompletelyEmpty = !pkg.seatPhotoUrl && !pkg.description && !pkg.venmoHandle && !pkg.zelleInfo;
  const sectionDisplay = `${pkg.section} · Field Level`;

  const FTU_KEY = `bb-claimer-ftu-${pkg.slug}-seen`;
  const [hasSeenFTU, setHasSeenFTU] = useState(true);
  useEffect(() => {
    if (activeTab !== 'available') {
      setPillOpen(false);
      return;
    }
    if (!window.matchMedia('(min-width: 768px)').matches) return;
    try {
      const seen = !!window.localStorage.getItem(FTU_KEY);
      setHasSeenFTU(seen);
      if (!seen) {
        window.localStorage.setItem(FTU_KEY, '1');
        setPillOpen(true);
      }
    } catch {
      // localStorage unavailable (private browsing) — per spec rule 10, show FTU every visit
      setHasSeenFTU(false);
      setPillOpen(true);
    }
  }, [FTU_KEY, activeTab]);

  function dismissFTU() {
    try {
      window.localStorage.setItem(FTU_KEY, '1');
    } catch {}
    setHasSeenFTU(true);
    setPillOpen(false);
  }

  const isFTU = !hasSeenFTU;

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
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#1B1716]'}`}>
              {pillLabel}
            </span>
            <svg
              className={`shrink-0 transition-transform duration-200 ${pillOpen ? 'rotate-180' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
            >
              <path d="M6 9l6 6 6-6" stroke={isDark ? 'rgba(255,255,255,0.5)' : '#8e8985'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* FTU backdrop — focuses attention on the dropdown on first visit */}
          {isFTU && pillOpen && createPortal(
            <div
              className="hidden md:block fixed inset-0 bg-black/20 z-40"
              onClick={() => setPillOpen(false)}
            />,
            document.body
          )}

          {/* Pill dropdown panel — 3 states */}
          <div
            ref={pillPanelRef}
            className={`absolute left-0 top-[calc(100%+8px)] z-40 ${hasPhoto ? 'w-[880px]' : 'w-[560px]'} bg-white rounded-[14px] border border-[#E5E1DD] shadow-[0_12px_32px_-16px_rgba(28,23,22,0.14)] overflow-hidden transition-all duration-200 ${
              pillOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="relative pt-14 px-6 pb-6">
              {/* Close X — its own chrome zone above content */}
              <button
                onClick={() => setPillOpen(false)}
                title="Close"
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-transparent hover:bg-[#F5F4F2] border-none cursor-pointer flex items-center justify-center text-[#1B1716] z-10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>

              {isCompletelyEmpty ? (
                /* ── Empty fallback (rule 9) ── */
                <div className="text-center py-8 px-6">
                  <p className="text-[15px] text-[#1B1716] leading-relaxed">
                    {firstName ? `${firstName} is still setting things up.` : 'The holder is still setting things up.'} Check back soon.
                  </p>
                </div>
              ) : hasPhoto ? (
                /* ── State 1 (FTU) or State 2 (returning) — two-column with photo ── */
                <div className="grid grid-cols-[1.1fr_1fr] gap-6 items-stretch">
                  {/* Left column — photo + (FTU only) How it works */}
                  <div className="flex flex-col gap-[18px]">
                    <div className="relative h-[340px] rounded-xl overflow-hidden">
                      <Image src={pkg.seatPhotoUrl as string} alt="View from seat" fill className="object-cover" sizes="500px" unoptimized />
                      <div className="absolute bottom-3 left-3 bg-black/65 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                        View from Section {pkg.section}
                      </div>
                    </div>
                    {isFTU && (
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">How it works</p>
                        <div className="bg-[#F5F4F2] rounded-[10px] px-4 py-3.5 flex flex-col gap-2.5">
                          {[
                            'Pick a game from the schedule.',
                            claimStep,
                            'Tickets arrive before game day.',
                          ].map((step, i) => (
                            <div key={i} className="flex gap-3 items-start text-[13px] leading-[1.4] text-[#1B1716]">
                              <div className="w-5 h-5 rounded-full bg-[#810100] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                                {i + 1}
                              </div>
                              <div>{step}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right column — content + (FTU only) Got it */}
                  <div className="flex flex-col gap-[18px]">
                    {pkg.description && (
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">Description</p>
                        <p className="text-[13px] leading-[1.5] text-[#1B1716]">{pkg.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">Your seats</p>
                      <div className="flex flex-col text-[13px]">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[#8e8985]">Section</span>
                          <span className="font-bold text-[#1B1716]">{sectionDisplay}</span>
                        </div>
                        {pkg.row && (
                          <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                            <span className="text-[#8e8985]">Row</span>
                            <span className="font-bold text-[#1B1716]">Row {pkg.row}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                          <span className="text-[#8e8985]">Seats</span>
                          <span className="font-bold text-[#1B1716]">Seats {pkg.seats}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                          <span className="text-[#8e8985]">Ticket delivery</span>
                          <span className="font-bold text-[#1B1716]">MLB Ballpark App</span>
                        </div>
                      </div>
                    </div>
                    {hasPayment && (
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">{payHeading}</p>
                        <div className="flex flex-col text-[13px]">
                          {pkg.venmoHandle?.trim() && (
                            <div className="flex items-center justify-between py-2">
                              <span className="text-[#8e8985]">Venmo</span>
                              <span className="font-bold text-[#1B1716]">{pkg.venmoHandle}</span>
                            </div>
                          )}
                          {pkg.zelleInfo?.trim() && (
                            <div className={`flex items-center justify-between py-2 ${pkg.venmoHandle?.trim() ? 'border-t border-[#E5E1DD]' : ''}`}>
                              <span className="text-[#8e8985]">Zelle</span>
                              <span className="font-bold text-[#1B1716]">{pkg.zelleInfo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {isFTU && (
                      <button
                        onClick={dismissFTU}
                        className="self-end mt-auto bg-[#1B1716] text-white border-none rounded-[10px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Got it, view games
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ── State 3 (no photo) or State 1 FTU no-photo — single column ── */
                <div className="flex flex-col gap-[18px]">
                  {pkg.description && (
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">Description</p>
                      <p className="text-[13px] leading-[1.5] text-[#1B1716]">{pkg.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">Your seats</p>
                    <div className="flex flex-col text-[13px]">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[#8e8985]">Section</span>
                        <span className="font-bold text-[#1B1716]">{sectionDisplay}</span>
                      </div>
                      {pkg.row && (
                        <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                          <span className="text-[#8e8985]">Row</span>
                          <span className="font-bold text-[#1B1716]">Row {pkg.row}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                        <span className="text-[#8e8985]">Seats</span>
                        <span className="font-bold text-[#1B1716]">Seats {pkg.seats}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                        <span className="text-[#8e8985]">Ticket delivery</span>
                        <span className="font-bold text-[#1B1716]">MLB Ballpark App</span>
                      </div>
                    </div>
                  </div>
                  {hasPayment && (
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">{payHeading}</p>
                      <div className="flex flex-col text-[13px]">
                        {pkg.venmoHandle?.trim() && (
                          <div className="flex items-center justify-between py-2">
                            <span className="text-[#8e8985]">Venmo</span>
                            <span className="font-bold text-[#1B1716]">{pkg.venmoHandle}</span>
                          </div>
                        )}
                        {pkg.zelleInfo?.trim() && (
                          <div className={`flex items-center justify-between py-2 ${pkg.venmoHandle?.trim() ? 'border-t border-[#E5E1DD]' : ''}`}>
                            <span className="text-[#8e8985]">Zelle</span>
                            <span className="font-bold text-[#1B1716]">{pkg.zelleInfo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {isFTU && (
                    <>
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">How it works</p>
                        <div className="bg-[#F5F4F2] rounded-[10px] px-4 py-3.5 flex flex-col gap-2.5">
                          {[
                            'Pick a game from the schedule.',
                            claimStep,
                            'Tickets arrive before game day.',
                          ].map((step, i) => (
                            <div key={i} className="flex gap-3 items-start text-[13px] leading-[1.4] text-[#1B1716]">
                              <div className="w-5 h-5 rounded-full bg-[#810100] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                                {i + 1}
                              </div>
                              <div>{step}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={dismissFTU}
                        className="w-full bg-[#1B1716] text-white border-none rounded-[10px] py-3 text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Got it, view games
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:block">
          <button
            className={`h-10 px-4 rounded-lg text-base font-medium border-none cursor-pointer transition-all flex items-center gap-2 ${
              isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#f5f4f2] text-black hover:bg-[#eceae5]'
            }`}
            onClick={() => onTabChange('my-games')}
          >
            My games
            {reservedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#0F6F57] text-white text-xs font-semibold flex items-center justify-center">
                {reservedCount}
              </span>
            )}
          </button>
        </div>
        {/* Account avatar */}
        <a
          href={`/dashboard/profile?from=share&slug=${pkg.slug}`}
          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all text-sm font-semibold"
          style={{ backgroundColor: teamAccent, color: navColor }}
        >
          {userInitial}
        </a>
      </div>
    </header>
  );
}
