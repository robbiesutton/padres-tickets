'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Game, PackageInfo, ReserveFlowStep } from '../types';
import {
  getOpponentAbbr,
  getOpponentColor,
  formatGameDate,
  formatTime,
  MONTH_NAMES,
} from '../utils';

interface Props {
  game: Game;
  pkg: PackageInfo;
  isReservedByMe: boolean;
  onClose: () => void;
  onReserved: (gameId: string) => void;
  onCancelled: (gameId: string) => void;
}

function CheckGreen({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="#0F6E56"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GameExpansionPanel({
  game,
  pkg,
  isReservedByMe,
  onClose,
  onReserved,
  onCancelled,
}: Props) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const [step, setStep] = useState<ReserveFlowStep>(
    isReservedByMe ? { step: 'confirmed' } : { step: 'details' }
  );
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const abbr = getOpponentAbbr(game.opponent);
  const color = getOpponentColor(game.opponent);
  const totalPrice = (game.pricePerTicket ?? 0) * pkg.seatCount;
  const d = new Date(game.date);
  const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = MONTH_NAMES[d.getMonth()];

  // If authenticated, claim directly via the existing claim endpoint
  async function handleDirectClaim() {
    setLoading(true);
    setStep({ step: 'sending' });

    try {
      const res = await fetch(`/api/share/${pkg.slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      });

      const data = await res.json();

      if (res.ok) {
        onReserved(game.id);
        setEmail(session?.user?.email || '');
        setStep({ step: 'confirmed' });
      } else {
        setStep({
          step: 'error',
          message: data.error || 'Something went wrong',
        });
      }
    } catch {
      setStep({ step: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  // If not authenticated, go through magic link flow
  async function handleReserve() {
    if (!email || !email.includes('@')) return;

    setLoading(true);
    setStep({ step: 'sending' });

    try {
      const body: Record<string, string> = { gameId: game.id, email };
      if (firstName) body.firstName = firstName;
      if (lastName) body.lastName = lastName;

      const res = await fetch(`/api/share/${pkg.slug}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('bb_claimer_email', email);
        if (firstName) localStorage.setItem('bb_claimer_firstName', firstName);
        if (lastName) localStorage.setItem('bb_claimer_lastName', lastName);
        // Cookie is set server-side by the API route
        onReserved(game.id);
        setStep({ step: 'confirmed' });
      } else {
        setStep({
          step: 'error',
          message: data.error || 'Something went wrong',
        });
      }
    } catch {
      setStep({ step: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!game.claim?.id) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/claims/${game.claim.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onCancelled(game.id);
      }
    } catch {
      // ignore
    } finally {
      setCancelLoading(false);
    }
  }

  // Initialize email from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bb_claimer_email');
    if (saved) setEmail(saved);
    const savedFirst = localStorage.getItem('bb_claimer_firstName');
    if (savedFirst) setFirstName(savedFirst);
    const savedLast = localStorage.getItem('bb_claimer_lastName');
    if (savedLast) setLastName(savedLast);
  }, []);

  return (
    <div className="bg-card border border-border rounded-[10px] overflow-hidden mt-2">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {abbr}
        </div>
        <div>
          <div className="text-base font-semibold text-foreground">
            {pkg.team} vs {game.opponent}
          </div>
          <div className="text-sm text-muted mt-px">
            Section {pkg.section}
            {pkg.row ? ` · Row ${pkg.row}` : ''}, Seats {pkg.seats}
          </div>
        </div>
        <button
          className="ml-auto bg-none border-none cursor-pointer text-muted text-[17px] px-2 py-1 hover:text-foreground"
          onClick={onClose}
        >
          &times;
        </button>
      </div>

      {/* Body */}
      {step.step === 'confirmed' ? (
        /* Confirmed state */
        <>
          <div className="grid grid-cols-2 border-t border-border">
            <div className="p-6 flex items-center gap-2.5">
              <div className="w-[30px] h-[30px] rounded-full bg-green-light border-[1.5px] border-green flex items-center justify-center shrink-0">
                <CheckGreen size={15} />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">
                  Reservation confirmed
                </div>
                <div className="text-sm text-muted mt-px">
                  Confirmation sent to {email || 'your email'}
                </div>
              </div>
            </div>
            <div className="p-6 border-l border-border flex items-center justify-end gap-2">
              <div className="text-base font-semibold text-foreground">
                ${totalPrice}{' '}
                <span className="text-sm font-normal text-muted">total</span>
              </div>
              <button
                className="px-3 py-[5px] rounded-md bg-none border border-border text-muted text-base cursor-pointer font-medium transition-all hover:border-muted hover:text-foreground disabled:opacity-50"
                onClick={handleCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
          <div className="p-6 bg-background text-sm text-muted flex items-center gap-[5px]">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 4l6 4.5L14 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Seller will contact you about payment details
          </div>
        </>
      ) : step.step === 'error' ? (
        /* Error state */
        <div className="p-8 text-center">
          <div className="text-base font-medium text-foreground mb-2">
            Unable to reserve
          </div>
          <div className="text-sm text-error mb-4">{step.message}</div>
          <button
            className="px-4 py-2 rounded-lg border border-border text-sm text-foreground cursor-pointer hover:bg-background"
            onClick={() => setStep({ step: 'details' })}
          >
            Try again
          </button>
        </div>
      ) : (
        /* Details / Email step */
        <div className="grid grid-cols-2">
          <div className="p-6">
            <div className="mb-2.5">
              <div className="text-sm text-muted uppercase tracking-wider mb-[3px]">
                Date &amp; time
              </div>
              <div className="text-base text-foreground font-medium">
                {dow}, {monthName} {d.getDate()}, {d.getFullYear()} &middot;{' '}
                {formatTime(game.time)}
              </div>
            </div>
            <div className="mb-2.5">
              <div className="text-sm text-muted uppercase tracking-wider mb-[3px]">
                Location
              </div>
              <div className="text-base text-foreground font-medium">
                Petco Park, San Diego
              </div>
            </div>
            <div>
              <div className="text-sm text-muted uppercase tracking-wider mb-[3px]">
                Delivery
              </div>
              <div className="text-base text-foreground font-medium">
                Mobile transfer via MLB Ballpark app
              </div>
            </div>
          </div>
          <div className="p-6 border-l border-border">
            {step.step === 'email' || step.step === 'sending' ? (
              <>
                <div className="text-sm text-muted uppercase tracking-wider mb-[3px]">
                  Your info
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-[7px] border border-border text-sm outline-none focus:border-navy"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-[7px] border border-border text-sm outline-none focus:border-navy"
                  />
                </div>
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-[7px] border border-border text-sm mb-2.5 outline-none focus:border-navy"
                  onKeyDown={(e) => e.key === 'Enter' && handleReserve()}
                />
                <button
                  className="w-full mt-1 py-2.5 rounded-lg bg-navy text-white border-none text-base font-medium cursor-pointer transition-opacity hover:opacity-[0.88] disabled:opacity-50"
                  onClick={handleReserve}
                  disabled={loading || !email.includes('@')}
                >
                  {loading ? 'Reserving...' : 'Confirm reservation'}
                </button>
                <div className="text-center text-sm text-muted mt-[5px]">
                  You won&apos;t be charged yet
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted uppercase tracking-wider mb-[3px]">
                  Pricing
                </div>
                <div className="flex justify-between text-base text-foreground py-[3px]">
                  <span>Price per ticket</span>
                  <span>${game.pricePerTicket ?? 0}</span>
                </div>
                <div className="flex justify-between text-base text-foreground py-[3px]">
                  <span>{pkg.seatCount} tickets</span>
                  <span>${totalPrice}</span>
                </div>
                <div className="flex justify-between text-base text-foreground py-[3px] border-t border-border mt-1.5 pt-2 font-semibold">
                  <span>Total</span>
                  <span>${totalPrice}</span>
                </div>
                <button
                  className="w-full mt-3 py-2.5 rounded-lg bg-navy text-white border-none text-base font-medium cursor-pointer transition-opacity hover:opacity-[0.88] disabled:opacity-50"
                  onClick={isAuthenticated ? handleDirectClaim : () => setStep({ step: 'email' })}
                  disabled={loading}
                >
                  {loading ? 'Reserving...' : 'Reserve seats'}
                </button>
                <div className="text-center text-sm text-muted mt-[5px]">
                  You won&apos;t be charged yet
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
