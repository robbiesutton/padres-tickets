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

interface Props {
  game: Game;
  pkg: PackageInfo;
  isReservedByMe: boolean;
  anchorRect: DOMRect | null;
  containerRect: DOMRect | null;
  onClose: () => void;
  onClaim: () => void;
  onRelease: () => void;
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
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [justConfirmed, setJustConfirmed] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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

  if (!anchorRect || !containerRect) return null;

  const { dow, day, month } = formatShortDate(game.date);
  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);
  const totalPrice =
    game.pricePerTicket !== null ? game.pricePerTicket * pkg.seatCount : null;

  // Position: try to place to the right of the cell, fall back to left
  const popoverWidth = 300;
  const cellCenterY = anchorRect.top - containerRect.top + anchorRect.height / 2;
  const cellRight = anchorRect.right - containerRect.left;
  const cellLeft = anchorRect.left - containerRect.left;
  const containerWidth = containerRect.width;

  const placeRight = cellRight + popoverWidth + 12 < containerWidth;
  const left = placeRight ? cellRight + 8 : cellLeft - popoverWidth - 8;
  const top = cellCenterY;

  const reserved = isReservedByMe || justConfirmed;

  function handleClaimClick() {
    onClaim();
    setJustConfirmed(true);
  }

  const popoverContent = (
    <div className="p-5">
      {/* Header with close */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {reserved ? (
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
              vs {game.opponent}
            </div>
            <div className="text-sm font-medium text-[#8e8985]">
              {dow}, {month} {day}
            </div>
          </div>
        </div>
        <button
          className="bg-transparent border-none cursor-pointer text-[#8e8985] text-lg px-1 hover:text-[#2c2a2b]"
          onClick={onClose}
        >
          &times;
        </button>
      </div>

      {reserved ? (
        <>
          {/* Confirmed state */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-5 h-5 rounded-full bg-[#0f6f57] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 16 16" width={12} height={12} fill="none">
                <path
                  d="M3.5 8.5L6.5 11.5L12.5 4.5"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#0f6f57]">Reserved</span>
          </div>

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

          <button
            className="w-full h-10 rounded-lg bg-transparent text-black text-base font-medium border-[1.5px] border-solid border-black cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
            onClick={onRelease}
          >
            Release
          </button>
        </>
      ) : (
        <>
          {/* Default state */}
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

          <button
            className="w-full h-10 rounded-lg bg-transparent text-black text-base font-medium border-[1.5px] border-solid border-black cursor-pointer flex items-center justify-center hover:bg-[#f5f4f2] transition-colors"
            onClick={handleClaimClick}
          >
            Claim
          </button>
        </>
      )}
    </div>
  );

  const mobileSheet = createPortal(
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={popoverRef}
        className={`absolute bottom-0 left-0 right-0 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up ${
          reserved ? 'bg-[#ECF3F2] border-t border-[#0f6f57]' : 'bg-white border-t border-[#e5e3df]'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#dcd7d4]" />
        </div>
        {popoverContent}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {/* Desktop popover */}
      <div
        className={`hidden md:block absolute z-50 w-[300px] rounded-xl border shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${
          reserved ? 'bg-[#ECF3F2] border-[#0f6f57]' : 'bg-white border-[#e5e3df]'
        }`}
        style={{
          left: `${left}px`,
          top: `${top}px`,
          transform: 'translateY(-50%)',
        }}
      >
        {popoverContent}
      </div>

      {/* Mobile bottom sheet */}
      {mobileSheet}
    </>
  );
}
