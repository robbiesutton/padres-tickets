'use client';

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  startTransition,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getTeamColors, isColorDark } from '@/lib/team-colors';
import { TeamBadge } from '@/components/team-badge';
import { ScoreTicker } from '@/components/score-ticker';
import { DESIGN_MODE, mockHolder } from '@/lib/mock-data';
import { SHOW_PACKAGE_SWITCHER } from '@/lib/feature-flags';

interface PackageForNav {
  id: string;
  team: string;
  section: string;
  row: string | null;
  seats: string;
  seatCount: number;
  season: string;
  seatPhotoUrl: string | null;
  description: string | null;
  defaultPricePerTicket: number | null;
  perks: string[];
  shareLinkSlug: string;
  _count: { games: number; members: number };
  role: 'OWNER' | 'CO_OWNER' | 'CLAIMER';
  holderName?: string;
  venmoHandle: string | null;
  zelleInfo: string | null;
}

// Context so children (dashboard page) can access the selected package
interface DashboardContextType {
  packages: PackageForNav[];
  selectedPkg: PackageForNav | null;
  selectedPkgId: string | null;
  setSelectedPkgId: (id: string) => void;
  loading: boolean;
}

const DashboardContext = createContext<DashboardContextType>({
  packages: [],
  selectedPkg: null,
  selectedPkgId: null,
  setSelectedPkgId: () => {},
  loading: true,
});

export function useDashboardContext() {
  return useContext(DashboardContext);
}

function SeatInfoPillDropdown({
  pkg,
  isDark,
  navColor,
  teamAccent,
  holderFirstName,
  onPkgUpdate,
}: {
  pkg: PackageForNav;
  isDark: boolean;
  navColor: string;
  teamAccent: string;
  holderFirstName?: string;
  onPkgUpdate: (fields: Partial<PackageForNav>) => void;
}) {
  const [pillOpen, setPillOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [wasFilled, setWasFilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(pkg.description || '');
  const [seatPhotoUrl, setSeatPhotoUrl] = useState<string | null>(
    pkg.seatPhotoUrl
  );
  const [venmoHandle, setVenmoHandle] = useState(pkg.venmoHandle || '');
  const [zelleInfo, setZelleInfo] = useState(pkg.zelleInfo || '');
  const pillRef = useRef<HTMLDivElement>(null);
  const pillPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmpty =
    !pkg.seatPhotoUrl && !pkg.description && !pkg.venmoHandle && !pkg.zelleInfo;

  useEffect(() => {
    startTransition(() => {
      setDescription(pkg.description || '');
      setSeatPhotoUrl(pkg.seatPhotoUrl);
      setVenmoHandle(pkg.venmoHandle || '');
      setZelleInfo(pkg.zelleInfo || '');
    });
  }, [pkg.description, pkg.seatPhotoUrl, pkg.venmoHandle, pkg.zelleInfo]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        pillPanelRef.current &&
        !pillPanelRef.current.contains(e.target as Node) &&
        pillRef.current &&
        !pillRef.current.contains(e.target as Node)
      ) {
        setPillOpen(false);
        setEditing(false);
      }
    }
    if (pillOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pillOpen]);

  function startEditing(filled: boolean) {
    setWasFilled(filled);
    setEditing(true);
  }

  function cancelEditing() {
    setDescription(pkg.description || '');
    setSeatPhotoUrl(pkg.seatPhotoUrl);
    setVenmoHandle(pkg.venmoHandle || '');
    setZelleInfo(pkg.zelleInfo || '');
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    const trimmedDesc = description.trim();
    const trimmedVenmo = venmoHandle.trim();
    const trimmedZelle = zelleInfo.trim();
    const [pkgRes, userRes] = await Promise.all([
      fetch(`/api/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmedDesc, seatPhotoUrl }),
      }),
      fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venmoHandle: trimmedVenmo,
          zelleInfo: trimmedZelle,
        }),
      }),
    ]);
    if (pkgRes.ok && userRes.ok) {
      onPkgUpdate({
        description: trimmedDesc || null,
        seatPhotoUrl,
        venmoHandle: trimmedVenmo || null,
        zelleInfo: trimmedZelle || null,
      });
      setEditing(false);
    }
    setSaving(false);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSeatPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const showHeader = editing ? wasFilled : !isEmpty;
  const headerTitle = editing ? 'Edit seats' : 'My seats';
  const payHeading = holderFirstName?.trim()
    ? `How to pay ${holderFirstName.trim()}`
    : 'How to pay';
  const hasPayment = !!(pkg.venmoHandle?.trim() || pkg.zelleInfo?.trim());

  // Section row value: "203 · Field Level" (level hard-coded since not yet a captured field)
  const sectionDisplay = `${pkg.section} · Field Level`;

  return (
    <div className="hidden md:block relative">
      <div
        ref={pillRef}
        className={`flex items-center justify-between w-[280px] h-12 pl-1.5 pr-3 rounded-lg border cursor-pointer transition-colors ${
          pillOpen
            ? 'border-white/30 bg-white/15'
            : 'border-white/20 hover:bg-white/10'
        }`}
        onClick={() => setPillOpen(!pillOpen)}
      >
        <div className="flex items-center gap-1.5">
          <TeamBadge
            team={pkg.team}
            className="w-[34px] h-[34px] text-[11px] font-bold"
          />
          <span
            className={`text-base font-medium ${isDark ? 'text-white' : 'text-[#1B1716]'}`}
          >
            My seats
          </span>
        </div>
        <svg
          className={`shrink-0 transition-transform duration-200 ${pillOpen ? 'rotate-180' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke={isDark ? 'rgba(255,255,255,0.5)' : '#8e8985'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Pill dropdown panel */}
      <div
        ref={pillPanelRef}
        className={`absolute left-0 top-[calc(100%+8px)] z-40 w-[880px] bg-white rounded-[14px] border border-[#E5E1DD] shadow-[0_12px_32px_-16px_rgba(28,23,22,0.14)] overflow-hidden transition-all duration-200 ${
          pillOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="p-[22px]">
          {/* Drawer header (State 3 + State 4) */}
          {showHeader && (
            <div
              className={`flex items-center mb-[18px] ${editing ? 'justify-between' : 'justify-end'}`}
            >
              {editing && (
                <div className="text-[17px] font-bold text-[#1B1716]">
                  {headerTitle}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                {!editing && (
                  <button
                    onClick={() => startEditing(true)}
                    title="Edit seats"
                    className="w-8 h-8 rounded-lg bg-[#F5F4F2] hover:bg-[#DCD7D4] border-none cursor-pointer flex items-center justify-center text-[#1B1716]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => {
                    setPillOpen(false);
                    setEditing(false);
                  }}
                  title="Close"
                  className="w-8 h-8 rounded-lg bg-transparent hover:bg-[#F5F4F2] border-none cursor-pointer flex items-center justify-center text-[#1B1716]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {editing ? (
            /* ── State 2 / State 4 — edit form ── */
            <>
              <div className="grid grid-cols-[1.1fr_1fr] gap-6 items-stretch">
                {/* Left column — photo upload */}
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-[#8e8985] mb-1.5">
                    Seat photo <span className="font-normal">(Optional)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex-1 min-h-[340px] h-[340px] rounded-xl overflow-hidden cursor-pointer group"
                  >
                    {seatPhotoUrl ? (
                      <>
                        <Image
                          src={seatPhotoUrl}
                          alt="View from seat"
                          fill
                          className="object-cover"
                          sizes="500px"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-3 py-1.5 rounded-md">
                            Change photo
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/65 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                          View from Section {pkg.section}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-[#F5F4F2] border-[1.5px] border-dashed border-[#D4CFC9] flex flex-col items-center justify-center gap-2 hover:border-[#8e8985] transition-colors">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#8e8985"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-60"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <span className="text-sm font-semibold text-[#1B1716]">
                          Add a seat photo
                        </span>
                        <span className="text-xs text-[#8e8985]">
                          Claimers will see this on your share page
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column — form fields */}
                <div className="flex flex-col gap-[18px]">
                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-[#8e8985] mb-1.5">
                      Description{' '}
                      <span className="font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell friends about your seats, like great view, close to concessions..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E5E1DD] bg-white text-[13px] text-[#1B1716] outline-none resize-y min-h-[70px] focus:border-[#1B1716] transition-colors"
                    />
                  </div>

                  {/* Your seats — read-only */}
                  <div className="opacity-50 pointer-events-none select-none">
                    <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">
                      Your seats
                    </p>
                    <div className="flex flex-col text-[13px]">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[#8e8985]">Section</span>
                        <span className="font-bold text-[#1B1716]">
                          {sectionDisplay}
                        </span>
                      </div>
                      {pkg.row && (
                        <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                          <span className="text-[#8e8985]">Row</span>
                          <span className="font-bold text-[#1B1716]">
                            Row {pkg.row}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                        <span className="text-[#8e8985]">Seats</span>
                        <span className="font-bold text-[#1B1716]">
                          Seats {pkg.seats}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                        <span className="text-[#8e8985]">Ticket delivery</span>
                        <span className="font-bold text-[#1B1716]">
                          MLB Ballpark App
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#8e8985] mt-1.5 italic">
                      Set during setup. Not editable here.
                    </p>
                  </div>

                  {/* Venmo + Zelle */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-[#8e8985] mb-1.5">
                        Venmo <span className="font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={venmoHandle}
                        onChange={(e) => setVenmoHandle(e.target.value)}
                        placeholder="@yourhandle"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#E5E1DD] bg-white text-[13px] font-semibold text-[#1B1716] outline-none focus:border-[#1B1716] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8e8985] mb-1.5">
                        Zelle <span className="font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={zelleInfo}
                        onChange={(e) => setZelleInfo(e.target.value)}
                        placeholder="(555) 555-5555"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#E5E1DD] bg-white text-[13px] font-semibold text-[#1B1716] outline-none focus:border-[#1B1716] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2.5 mt-[22px] pt-[18px] border-t border-[#E5E1DD]">
                <button
                  onClick={cancelEditing}
                  className="bg-white text-[#1B1716] border border-[#E5E1DD] rounded-lg px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer hover:bg-[#F5F4F2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#1B1716] text-white border-none rounded-lg px-5 py-[9px] text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : isEmpty ? (
            /* ── State 1 — empty ── */
            <div className="grid grid-cols-[1.3fr_1fr] gap-[22px] items-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#F5F4F2] border-[1.5px] border-dashed border-[#D4CFC9] rounded-xl py-10 px-5 text-center min-h-[220px] flex flex-col items-center justify-center cursor-pointer hover:border-[#8e8985] transition-colors"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8e8985"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-55 mb-3"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <div className="text-[15px] font-semibold text-[#1B1716] mb-1">
                  Add a seat photo
                </div>
                <div className="text-xs text-[#8e8985]">
                  Claimers will see this on your share page
                </div>
              </div>
              <div className="text-center px-[18px] py-6">
                <div className="w-11 h-11 rounded-full bg-[#F5F4F2] flex items-center justify-center mx-auto mb-3 text-[#1B1716]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div className="text-[15px] font-bold text-[#1B1716] mb-1">
                  Add your seat details
                </div>
                <div className="text-xs text-[#8e8985] leading-snug max-w-[260px] mx-auto mb-3.5">
                  Help your friends know what to expect — add a description for
                  your seats.
                </div>
                <button
                  onClick={() => startEditing(false)}
                  className="bg-[#1B1716] text-white border-none rounded-lg px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Add Info
                </button>
              </div>
            </div>
          ) : (
            /* ── State 3 — filled view ── */
            <div className="grid grid-cols-[1.1fr_1fr] gap-6 items-stretch">
              {/* Left column — photo at fixed 400px */}
              <div className="flex flex-col">
                {pkg.seatPhotoUrl ? (
                  <div className="relative h-[340px] rounded-xl overflow-hidden">
                    <Image
                      src={pkg.seatPhotoUrl}
                      alt="View from seat"
                      fill
                      className="object-cover"
                      sizes="500px"
                      unoptimized
                    />
                    <div className="absolute bottom-3 left-3 bg-black/65 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                      View from Section {pkg.section}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[340px] bg-[#F5F4F2] border-[1.5px] border-dashed border-[#D4CFC9] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#8e8985] transition-colors"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8e8985"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-60"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className="text-sm font-semibold text-[#1B1716]">
                      Add a seat photo
                    </span>
                    <span className="text-xs text-[#8e8985]">
                      Claimers will see this on your share page
                    </span>
                  </div>
                )}
              </div>

              {/* Right column — sections */}
              <div className="flex flex-col gap-[18px]">
                {pkg.description && (
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">
                      Description
                    </p>
                    <p className="text-[13px] leading-[1.5] text-[#1B1716]">
                      {pkg.description}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">
                    Your seats
                  </p>
                  <div className="flex flex-col text-[13px]">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[#8e8985]">Section</span>
                      <span className="font-bold text-[#1B1716]">
                        {sectionDisplay}
                      </span>
                    </div>
                    {pkg.row && (
                      <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                        <span className="text-[#8e8985]">Row</span>
                        <span className="font-bold text-[#1B1716]">
                          Row {pkg.row}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                      <span className="text-[#8e8985]">Seats</span>
                      <span className="font-bold text-[#1B1716]">
                        Seats {pkg.seats}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-[#E5E1DD]">
                      <span className="text-[#8e8985]">Ticket delivery</span>
                      <span className="font-bold text-[#1B1716]">
                        MLB Ballpark App
                      </span>
                    </div>
                  </div>
                </div>

                {hasPayment && (
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#1B1716] mb-2.5">
                      {payHeading}
                    </p>
                    <div className="flex flex-col text-[13px]">
                      {pkg.venmoHandle?.trim() && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[#8e8985]">Venmo</span>
                          <span className="font-bold text-[#1B1716]">
                            {pkg.venmoHandle}
                          </span>
                        </div>
                      )}
                      {pkg.zelleInfo?.trim() && (
                        <div
                          className={`flex items-center justify-between py-2 ${pkg.venmoHandle?.trim() ? 'border-t border-[#E5E1DD]' : ''}`}
                        >
                          <span className="text-[#8e8985]">Zelle</span>
                          <span className="font-bold text-[#1B1716]">
                            {pkg.zelleInfo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileSeatInfoDrawer({
  pkg,
  navColor,
  teamAccent,
  onPkgUpdate,
}: {
  pkg: PackageForNav;
  navColor: string;
  teamAccent: string;
  onPkgUpdate: (fields: Partial<PackageForNav>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [descError, setDescError] = useState(false);
  const [description, setDescription] = useState(pkg.description || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmpty = !pkg.seatPhotoUrl && !pkg.description;

  useEffect(() => {
    startTransition(() => setDescription(pkg.description || ''));
  }, [pkg.description]);

  async function handleSave() {
    if (!description.trim()) {
      setDescError(true);
      return;
    }
    setDescError(false);
    setSaving(true);
    const res = await fetch(`/api/packages/${pkg.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: description.trim() }),
    });
    if (res.ok) {
      onPkgUpdate({ description: description.trim() });
      setEditing(false);
    }
    setSaving(false);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatPhotoUrl: url }),
      });
      if (res.ok) onPkgUpdate({ seatPhotoUrl: url });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="md:hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <div
        className="flex items-center gap-2.5 h-11 pl-2.5 pr-3 rounded-lg cursor-pointer active:opacity-90"
        style={{
          border: `1px solid ${navColor}`,
          backgroundColor: `${navColor}33`,
        }}
        onClick={() => setOpen(true)}
      >
        <TeamBadge team={pkg.team} className="w-8 h-8 text-[10px] font-bold" />
        <span className="text-base font-medium text-[#2c2a2b] flex-1">
          My seats
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="#8e8985"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => {
                setOpen(false);
                setEditing(false);
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up max-h-[85vh] overflow-y-auto">
              <div className="relative">
                <button
                  className="absolute top-3 right-2 w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
                  onClick={() => {
                    setOpen(false);
                    setEditing(false);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18"
                      stroke="#8e8985"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 6l12 12"
                      stroke="#8e8985"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <div className="px-4 pt-5 pb-6 flex flex-col gap-4">
                  {/* Photo */}
                  <div
                    className="w-full h-[180px] relative overflow-hidden rounded-lg cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {pkg.seatPhotoUrl ? (
                      <>
                        <Image
                          src={pkg.seatPhotoUrl}
                          alt="View from seat"
                          fill
                          className="object-cover"
                          sizes="100vw"
                          unoptimized
                        />
                        <div className="absolute bottom-3 left-3 bg-[#2c2a2b]/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                          View from Section {pkg.section}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-[#f5f4f2] border-2 border-dashed border-[#dcd7d4] rounded-lg flex flex-col items-center justify-center gap-2">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#8e8985"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <span className="text-sm font-medium text-[#8e8985]">
                          Add a seat photo
                        </span>
                      </div>
                    )}
                  </div>

                  {editing ? (
                    /* ── Edit mode ── */
                    <>
                      <div className="pb-4 border-b border-[#f5f4f2]">
                        <label className="block text-xs font-medium text-[#8e8985] mb-1.5">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            if (descError) setDescError(false);
                          }}
                          placeholder="Tell friends about your seats..."
                          rows={3}
                          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none transition-colors ${
                            descError
                              ? 'border-[#DC2626] focus:border-[#DC2626]'
                              : 'border-[#eceae5] focus:border-[#2c2a2b]'
                          }`}
                        />
                        {descError && (
                          <p className="text-xs text-[#DC2626] mt-1">
                            Description is required
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditing(false);
                            setDescription(pkg.description || '');
                          }}
                          className="flex-1 h-11 rounded-lg border border-[#dcd7d4] bg-white text-sm font-medium text-[#2c2a2b] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 h-11 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white cursor-pointer disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </>
                  ) : isEmpty ? (
                    /* ── Empty state ── */
                    <div className="flex flex-col items-center text-center py-4 gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#f5f4f2] flex items-center justify-center">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#8e8985"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-[#2c2a2b]">
                        Add your seat details
                      </p>
                      <p className="text-xs text-[#8e8985]">
                        Help friends know what to expect
                      </p>
                      <button
                        onClick={() => setEditing(true)}
                        className="mt-1 h-10 px-5 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white cursor-pointer"
                      >
                        Add Info
                      </button>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <>
                      {pkg.description && (
                        <p className="text-base font-normal text-black leading-relaxed pb-4 border-b border-[#f5f4f2]">
                          {pkg.description}
                        </p>
                      )}
                      <div className="flex flex-col gap-3 text-sm leading-6 pb-4 border-b border-[#f5f4f2]">
                        <div className="flex items-center justify-between">
                          <span className="font-normal text-black">Seats</span>
                          <span className="font-bold text-black">
                            Seats {pkg.seats}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-normal text-black">Level</span>
                          <span className="font-bold text-black">
                            Field Level
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-normal text-black">
                            Ticket delivery
                          </span>
                          <span className="font-bold text-black">
                            MLB Ballpark App
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 text-sm font-medium text-[#8e8985] bg-transparent border-none cursor-pointer self-start"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Edit seats
                      </button>
                    </>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sessionFirstName = session?.user?.name?.trim().split(/\s+/)[0] || '';
  const holderFirstName =
    sessionFirstName || (DESIGN_MODE ? mockHolder.firstName : '');
  const userInitial = holderFirstName.charAt(0).toUpperCase() || '';
  const isProfile = pathname === '/dashboard/profile';
  const isDashboard = pathname === '/dashboard';
  const [packages, setPackages] = useState<PackageForNav[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me/packages')
      .then((r) => (r.ok ? r.json() : { packages: [] }))
      .then((data) => {
        if (cancelled) return;

        const allPackages: PackageForNav[] = data.packages || [];

        if (allPackages.length === 0) {
          // No packages at all — stay on dashboard to show "get started" state
          setLoading(false);
          return;
        }

        // If user only has claimer packages and is on the main dashboard,
        // redirect to their first claimer share page
        const ownedPkgs = allPackages.filter(
          (p) => p.role === 'OWNER' || p.role === 'CO_OWNER'
        );
        const claimerPkgs = allPackages.filter((p) => p.role === 'CLAIMER');
        if (ownedPkgs.length === 0 && claimerPkgs.length > 0 && isDashboard) {
          window.location.href = `/share/${claimerPkgs[0].shareLinkSlug}`;
          return;
        }

        setPackages(allPackages);
        // Default to first owned package, or first package overall
        const defaultPkg = ownedPkgs[0] || allPackages[0];
        setSelectedPkgId(defaultPkg.id);
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [pathname, isDashboard]);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || null;
  const {
    primary: navColor,
    accent: teamAccent,
    badgeTextColor: badgeText,
  } = getTeamColors(selectedPkg?.team ?? '');

  function handlePkgUpdate(fields: Partial<PackageForNav>) {
    if (!selectedPkgId) return;
    setPackages((prev) =>
      prev.map((p) => (p.id === selectedPkgId ? { ...p, ...fields } : p))
    );
  }
  const isDark = isColorDark(navColor);

  return (
    <DashboardContext.Provider
      value={{
        packages,
        selectedPkg,
        selectedPkgId,
        setSelectedPkgId,
        loading,
      }}
    >
      <div className="flex flex-1 flex-col">
        <header
          className="h-[60px] md:h-[77px] flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          style={{ backgroundColor: navColor }}
        >
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  isDark ? '/benchbuddy-mark-white.svg' : '/benchbuddy-logo.svg'
                }
                alt="BenchBuddy"
                width={24}
                height={24}
              />
              <span
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                className={`hidden sm:inline text-lg font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}
              >
                BenchBuddy
              </span>
            </Link>

            {/* Seat info pill — desktop */}
            {selectedPkg && (
              <SeatInfoPillDropdown
                pkg={selectedPkg}
                isDark={isDark}
                navColor={navColor}
                teamAccent={teamAccent}
                holderFirstName={holderFirstName}
                onPkgUpdate={handlePkgUpdate}
              />
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Package switcher (if multiple) */}
            {SHOW_PACKAGE_SWITCHER && packages.length > 1 && (
              <select
                value={selectedPkgId || ''}
                onChange={(e) => {
                  const pkg = packages.find((p) => p.id === e.target.value);
                  if (pkg?.role === 'CLAIMER') {
                    window.location.href = `/share/${pkg.shareLinkSlug}`;
                    return;
                  }
                  setSelectedPkgId(e.target.value);
                }}
                className={`h-9 md:h-10 px-3 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    : 'bg-[#f5f4f2] text-black border-[#eceae5] hover:bg-[#eceae5]'
                }`}
              >
                {packages.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="text-black bg-white"
                  >
                    {p.team} — {p.section}
                    {p.role === 'CLAIMER' && p.holderName
                      ? ` (via ${p.holderName})`
                      : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Account avatar */}
            <Link
              href="/dashboard/profile"
              className="w-10 h-10 md:w-[34px] md:h-[34px] rounded-full flex items-center justify-center cursor-pointer transition-all text-sm font-semibold md:text-[11px] md:font-bold"
              style={{
                backgroundColor: teamAccent,
                color: badgeText ?? navColor,
              }}
            >
              {userInitial}
            </Link>
          </div>
        </header>

        {children}

        {/* Score ticker with team primary color */}
        <div className="hidden md:block mt-auto pt-12">
          <ScoreTicker bgColor={navColor} />
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
