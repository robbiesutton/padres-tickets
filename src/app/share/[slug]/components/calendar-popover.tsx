'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Game, PackageInfo } from '../types';
import {
  getOpponentAbbr,
  getOpponentColor,
  formatShortDate,
  formatTime,
} from '../utils';
import { getTeamColors } from '../team-colors';

interface Props {
  game: Game;
  pkg: PackageInfo;
  isReservedByMe: boolean;
  anchorRect: DOMRect | null;
  containerRect: DOMRect | null;
  onClose: () => void;
  onClaim: () => void;
  onRelease: () => void;
  onSwitchToMyGames?: () => void;
}

export function CalendarPopover({
  game,
  pkg,
  isReservedByMe,
  anchorRect,
  containerRect,
  onClose,
  onClaim,
  onRelease,
  onSwitchToMyGames,
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [justConfirmed, setJustConfirmed] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideMobile = popoverRef.current?.contains(target);
      const insideDesktop = desktopRef.current?.contains(target);
      if (!insideMobile && !insideDesktop) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Reset confirmed state when game changes
  useEffect(() => {
    setJustConfirmed(false);
  }, [game.id]);

  const { dow, day, month } = formatShortDate(game.date);
  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);
  const { primary: teamPrimary } = getTeamColors(pkg.team);
  const totalPrice =
    game.pricePerTicket !== null ? game.pricePerTicket * pkg.seatCount : null;

  const holderFirstName =
    pkg.holderName?.trim().split(/\s+/)[0] || 'the holder';
  const venmo = pkg.venmoHandle?.trim() || '';
  const zelle = pkg.zelleInfo?.trim() || '';
  const hasVenmo = !!venmo;
  const hasZelle = !!zelle;

  function preClaimCopy() {
    const total = totalPrice ?? 0;
    if (hasVenmo && !hasZelle) {
      return `By claiming, you'll Venmo ${holderFirstName} $${total} after. Tickets transfer before game day.`;
    }
    if (hasZelle && !hasVenmo) {
      return `By claiming, you'll Zelle ${holderFirstName} $${total} after. Tickets transfer before game day.`;
    }
    return `By claiming, you'll pay ${holderFirstName} $${total} directly after. Tickets transfer before game day.`;
  }

  function postClaimCopy() {
    const total = totalPrice ?? 0;
    if (hasVenmo && hasZelle) {
      return `Pay ${holderFirstName} $${total} via Venmo ${venmo} or Zelle ${zelle}, whichever you prefer. ${holderFirstName} will then transfer the tickets to you a few days before the game.`;
    }
    if (hasVenmo) {
      return `Pay ${holderFirstName} $${total} via Venmo ${venmo}. ${holderFirstName} will then transfer the tickets to you a few days before the game.`;
    }
    if (hasZelle) {
      return `Pay ${holderFirstName} $${total} via Zelle ${zelle}. ${holderFirstName} will then transfer the tickets to you a few days before the game.`;
    }
    return `Coordinate with ${holderFirstName} on how to pay $${total}. ${holderFirstName} will transfer the tickets to you a few days before the game.`;
  }

  const monthDay = new Date(game.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  const longDate = new Date(game.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Position for desktop popover (only when anchor rects available)
  const hasPosition = anchorRect && containerRect;
  const popoverWidth = 300;
  const cellCenterY = hasPosition ? anchorRect.top - containerRect.top + anchorRect.height / 2 : 0;
  const cellRight = hasPosition ? anchorRect.right - containerRect.left : 0;
  const cellLeft = hasPosition ? anchorRect.left - containerRect.left : 0;
  const containerWidth = hasPosition ? containerRect.width : 0;

  const placeRight = cellRight + popoverWidth + 12 < containerWidth;
  const left = placeRight ? cellRight + 8 : cellLeft - popoverWidth - 8;
  const top = cellCenterY;

  // Three-state: 'claim' (fresh), 'confirmation' (transient, just claimed),
  // 'release' (re-opening a previously claimed game). Confirmation never re-shows
  // because once dismissed the popover unmounts; re-mounting with isReservedByMe=true
  // lands directly in 'release'.
  const mode: 'claim' | 'confirmation' | 'release' = isReservedByMe
    ? 'release'
    : justConfirmed
      ? 'confirmation'
      : 'claim';

  const showGreenCheck = mode !== 'claim';

  function handleClaimClick() {
    onClaim();
    setJustConfirmed(true);
  }

  function handleViewMyGames() {
    onSwitchToMyGames?.();
    onClose();
  }

  const popoverContent = (
    <div className="p-5">
      {/* Header with close */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {showGreenCheck ? (
            <div className="w-[42px] h-[42px] rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 16 16" width={24} height={24} fill="none">
                <path
                  d="M3.5 8.5L6.5 11.5L12.5 4.5"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {abbr}
            </div>
          )}
          <div>
            <div className="text-base font-bold text-[#2c2a2b]">
              {mode === 'confirmation' ? `You're in for ${monthDay}` : `vs ${game.opponent}`}
            </div>
            <div className="text-sm font-medium text-[#8e8985]">
              {mode === 'confirmation' ? `vs ${game.opponent}` : longDate}
            </div>
          </div>
        </div>
        <button
          className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          onClick={onClose}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body context rows — same shape in all three modes */}
      <div className="flex flex-col gap-2 mb-5 text-sm text-[#8e8985]">
        <div>{formatTime(game.time)} &bull; Petco Park</div>
        <div>
          Section {pkg.section}
          {pkg.row ? ` · Row ${pkg.row}` : ''} · Seats {pkg.seats}
        </div>
        {totalPrice !== null && (
          <div className="text-[#2c2a2b] font-medium">
            {pkg.seatCount} ticket{pkg.seatCount !== 1 ? 's' : ''} · ${totalPrice} total
          </div>
        )}
      </div>

      {/* Pre-claim "what happens next" callout */}
      {mode === 'claim' && (
        <div className="bg-[#F5F4F2] rounded-[10px] px-4 py-3.5 mb-5 text-[14px] leading-[1.4] text-[#1B1716]">
          {preClaimCopy()}
        </div>
      )}

      {/* Post-claim payment callout */}
      {mode === 'confirmation' && (
        <div className="bg-[#F5F4F2] rounded-[10px] px-4 py-3.5 mb-5 text-[14px] leading-[1.4] text-[#1B1716]">
          {postClaimCopy()}
        </div>
      )}

      {/* CTA(s) */}
      {mode === 'claim' && (
        <button
          className="w-full h-12 md:h-10 rounded-lg text-white text-base font-medium border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity"
          style={{ backgroundColor: teamPrimary }}
          onClick={handleClaimClick}
        >
          Claim
        </button>
      )}

      {mode === 'confirmation' && (
        <div className="flex flex-col gap-3">
          <button
            className="w-full h-12 md:h-10 rounded-lg bg-transparent text-black text-base font-medium border-[1.5px] border-solid border-black cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
            onClick={handleViewMyGames}
          >
            View my games
          </button>
          <button
            className="w-full h-12 md:h-10 rounded-lg bg-[#2C2A2B] text-white text-base font-medium border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      )}

      {mode === 'release' && (
        <button
          className="w-full h-12 md:h-10 rounded-lg bg-transparent text-black text-base font-medium border-[1.5px] border-solid border-black cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
          onClick={onRelease}
        >
          Release
        </button>
      )}
    </div>
  );

  const mobileSheet = createPortal(
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={popoverRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.08)] animate-slide-up max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Chrome strip — close X only */}
        <div className="relative h-14 shrink-0">
          <button
            className="absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
            onClick={onClose}
            title="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="#1B1716" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M6 6l12 12" stroke="#1B1716" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pb-5 flex flex-col gap-5">
            {/* Header: 56px badge + title + subtitle */}
            <div className="flex items-center gap-3">
              {showGreenCheck ? (
                <div className="w-14 h-14 rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 16 16" width={28} height={28} fill="none">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {abbr}
                </div>
              )}
              <div>
                <div className="text-[18px] font-bold text-[#1B1716] leading-tight">
                  {mode === 'confirmation' ? `You're in for ${monthDay}` : `vs ${game.opponent}`}
                </div>
                <div className="text-sm font-normal text-[#8E8985] mt-1">
                  {mode === 'confirmation' ? `vs ${game.opponent}` : longDate}
                </div>
              </div>
            </div>

            {/* Body context rows */}
            <div className="flex flex-col gap-3">
              <div className="text-[15px] text-[#8E8985]">{formatTime(game.time)} · Petco Park</div>
              <div className="text-[15px] text-[#8E8985]">
                Section {pkg.section}{pkg.row ? ` · Row ${pkg.row}` : ''} · Seats {pkg.seats}
              </div>
              {totalPrice !== null && (
                <div className="text-[15px] text-[#1B1716]">
                  {pkg.seatCount} ticket{pkg.seatCount !== 1 ? 's' : ''} · ${totalPrice} total
                </div>
              )}
            </div>

            {/* Pre-claim "what happens next" callout */}
            {mode === 'claim' && (
              <div className="bg-[#F5F4F2] rounded-[10px] px-4 py-3.5 text-[14px] leading-[1.4] text-[#1B1716]">
                {preClaimCopy()}
              </div>
            )}

            {/* Post-claim payment callout */}
            {mode === 'confirmation' && (
              <div className="bg-[#F5F4F2] rounded-[10px] px-4 py-3.5 text-[14px] leading-[1.4] text-[#1B1716]">
                {postClaimCopy()}
              </div>
            )}
          </div>
        </div>

        {/* Sticky CTA footer */}
        <div className="shrink-0 px-6 pb-5 bg-white">
          {mode === 'claim' && (
            <button
              className="w-full h-[52px] rounded-[10px] bg-[#2C2A2B] text-white text-base font-semibold border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity"
              onClick={handleClaimClick}
            >
              Claim
            </button>
          )}

          {mode === 'confirmation' && (
            <div className="flex flex-col gap-3">
              <button
                className="w-full h-[52px] rounded-[10px] bg-transparent text-[#1B1716] text-base font-semibold border-[1.5px] border-solid border-[#1B1716] cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
                onClick={handleViewMyGames}
              >
                View my games
              </button>
              <button
                className="w-full h-[52px] rounded-[10px] bg-[#2C2A2B] text-white text-base font-semibold border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          )}

          {mode === 'release' && (
            <button
              className="w-full h-[52px] rounded-[10px] bg-transparent text-[#1B1716] text-base font-semibold border-[1.5px] border-solid border-[#1B1716] cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
              onClick={onRelease}
            >
              Release
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );

  const modalContent = (
    <div className="p-7 pb-6">
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {showGreenCheck ? (
            <div className="w-14 h-14 rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 16 16" width={28} height={28} fill="none">
                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
              style={{ backgroundColor: teamPrimary }}
            >
              {abbr}
            </div>
          )}
          <div>
            <div className="text-xl font-bold text-[#1B1716] leading-tight">
              {mode === 'confirmation' ? `You're in for ${monthDay}` : `vs ${game.opponent}`}
            </div>
            <div className="text-sm font-normal text-[#8E8985] mt-1">
              {mode === 'confirmation' ? `vs ${game.opponent}` : longDate}
            </div>
          </div>
        </div>
        <button
          className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          onClick={onClose}
          title="Close"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="#1B1716" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 6l12 12" stroke="#1B1716" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Detail rows */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="text-sm text-[#8E8985]">{formatTime(game.time)} &bull; Petco Park</div>
        <div className="text-sm text-[#8E8985]">
          Section {pkg.section}{pkg.row ? ` · Row ${pkg.row}` : ''} · Seats {pkg.seats}
        </div>
        {totalPrice !== null && (
          <div className="text-sm text-[#1B1716] font-medium">
            {pkg.seatCount} ticket{pkg.seatCount !== 1 ? 's' : ''} · ${totalPrice} total
          </div>
        )}
      </div>

      {/* Pre-claim "what happens next" callout */}
      {mode === 'claim' && (
        <div className="bg-[#F9F6F0] rounded-lg p-3.5 mb-5 text-[14px] leading-[1.5] text-[#1B1716]">
          {preClaimCopy()}
        </div>
      )}

      {/* Post-claim payment callout */}
      {mode === 'confirmation' && (
        <div className="bg-[#F9F6F0] rounded-lg p-3.5 mb-5 text-[14px] leading-[1.5] text-[#1B1716]">
          {postClaimCopy()}
        </div>
      )}

      {/* CTAs */}
      {mode === 'claim' && (
        <button
          className="w-full py-3.5 rounded-[10px] bg-[#2C2A2B] text-white text-base font-semibold border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity"
          onClick={handleClaimClick}
        >
          Claim
        </button>
      )}

      {mode === 'confirmation' && (
        <div className="flex flex-col gap-3">
          <button
            className="w-full py-3.5 rounded-[10px] bg-transparent text-[#1B1716] text-base font-semibold border-[1.5px] border-solid border-[#1B1716] cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
            onClick={handleViewMyGames}
          >
            View my games
          </button>
          <button
            className="w-full py-3.5 rounded-[10px] bg-[#2C2A2B] text-white text-base font-semibold border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      )}

      {mode === 'release' && (
        <button
          className="w-full py-3.5 rounded-[10px] bg-transparent text-[#1B1716] text-base font-semibold border-[1.5px] border-solid border-[#1B1716] cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
          onClick={onRelease}
        >
          Release
        </button>
      )}
    </div>
  );

  const desktopModal = !hasPosition
    ? createPortal(
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center">
          <div className="absolute inset-0 bg-[#1B1716]/50" onClick={onClose} />
          <div
            ref={desktopRef}
            className="relative w-[480px] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          >
            {modalContent}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Desktop popover — only when positioned from calendar */}
      {hasPosition && (
        <div
          ref={desktopRef}
          className={`hidden md:block absolute z-50 min-w-[280px] max-w-[380px] w-max rounded-xl border shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${
            showGreenCheck ? 'bg-white border-[#0f6f57]' : 'bg-white border-[#e5e3df]'
          }`}
          style={{
            left: `${left}px`,
            top: `${top}px`,
            transform: 'translateY(-50%)',
          }}
        >
          {popoverContent}
        </div>
      )}

      {/* Desktop centered modal — when opened without an anchor (e.g. from list view Claim) */}
      {desktopModal}

      {/* Mobile bottom sheet */}
      {mobileSheet}
    </>
  );
}
