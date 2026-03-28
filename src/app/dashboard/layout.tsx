'use client';

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getTeamColors, isColorDark } from '@/lib/team-colors';
import { getOpponentAbbr } from '@/lib/game-utils';
import { ScoreTicker } from '@/components/score-ticker';

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
  _count: { games: number; invitations: number };
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

const AVAILABLE_PERKS = [
  'Shaded seats', 'Behind home plate', 'Premium', 'Craft beer nearby',
  'Easy parking', 'Club access', 'Great for kids', 'Aisle seats',
];

function SeatInfoPillDropdown({ pkg, isDark, navColor, teamAccent, onPkgUpdate }: {
  pkg: PackageForNav;
  isDark: boolean;
  navColor: string;
  teamAccent: string;
  onPkgUpdate: (fields: Partial<PackageForNav>) => void;
}) {
  const [pillOpen, setPillOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [descError, setDescError] = useState(false);
  const [description, setDescription] = useState(pkg.description || '');
  const [perks, setPerks] = useState<string[]>(pkg.perks || []);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmpty = !pkg.seatPhotoUrl && !pkg.description && pkg.perks.length === 0;

  useEffect(() => {
    setDescription(pkg.description || '');
    setPerks(pkg.perks || []);
  }, [pkg.description, pkg.perks]);

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

  function togglePerk(perk: string) {
    setPerks((prev) => prev.includes(perk) ? prev.filter((p) => p !== perk) : [...prev, perk]);
  }

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
      body: JSON.stringify({ description: description.trim(), perks }),
    });
    if (res.ok) {
      onPkgUpdate({ description: description.trim(), perks });
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
    <div className="hidden md:block relative">
      <div
        ref={pillRef}
        className={`flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-lg border cursor-pointer transition-colors ${
          pillOpen ? 'border-white/30 bg-white/15' : 'border-white/20 hover:bg-white/10'
        }`}
        onClick={() => setPillOpen(!pillOpen)}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
          style={{ backgroundColor: teamAccent, color: navColor }}
        >
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

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      {/* Pill dropdown panel */}
      <div
        ref={pillPanelRef}
        className={`absolute left-0 top-[calc(100%+8px)] z-40 w-[742px] bg-white rounded-lg border border-[#eceae5] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-200 ${
          pillOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="p-4 flex gap-4">
          {/* Image */}
          <div
            className="flex-1 relative overflow-hidden rounded-lg self-stretch min-h-[200px] cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {pkg.seatPhotoUrl ? (
              <>
                <Image src={pkg.seatPhotoUrl} alt="View from seat" fill className="object-cover" sizes="358px" unoptimized />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-lg">
                    Change photo
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-[#f5f4f2] border-2 border-dashed border-[#dcd7d4] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#8e8985] transition-colors">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span className="text-sm font-medium text-[#8e8985]">Add a seat photo</span>
                <span className="text-xs text-[#8e8985]/60">Claimers will see this on your share page</span>
              </div>
            )}
            {pkg.seatPhotoUrl && (
              <div className="absolute bottom-4 left-4 bg-[#2c2a2b]/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                View from Section {pkg.section}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="w-[336px] shrink-0 flex flex-col pt-2">
            {editing ? (
              /* ── Edit mode ── */
              <>
                <div className="pb-4 border-b border-[#f5f4f2]">
                  <label className="block text-xs font-medium text-[#8e8985] mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); if (descError) setDescError(false); }}
                    placeholder="Tell friends about your seats — great view, close to concessions..."
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none transition-colors ${
                      descError ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#eceae5] focus:border-[#2c2a2b]'
                    }`}
                  />
                  {descError && (
                    <p className="text-xs text-[#DC2626] mt-1">Description is required</p>
                  )}
                </div>
                <div className="py-4 border-b border-[#f5f4f2]">
                  <label className="block text-xs font-medium text-[#8e8985] mb-2">Perks</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_PERKS.map((perk) => {
                      const selected = perks.includes(perk);
                      return (
                        <button
                          key={perk}
                          type="button"
                          onClick={() => togglePerk(perk)}
                          className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#E1F5EE] border-[#0F6E56] text-[#0F6E56]'
                              : 'bg-white border-[#dcd7d4] text-[#8e8985] hover:border-[#2c2a2b] hover:text-[#2c2a2b]'
                          }`}
                        >
                          {selected && (
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 16 16" fill="none">
                              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {perk}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => { setEditing(false); setDescription(pkg.description || ''); setPerks(pkg.perks || []); }}
                    className="flex-1 h-9 rounded-lg border border-[#dcd7d4] bg-white text-sm font-medium text-[#2c2a2b] cursor-pointer hover:bg-[#f5f4f2] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 h-9 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white cursor-pointer hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            ) : isEmpty ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-[#f5f4f2] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2c2a2b]">Add your seat details</p>
                  <p className="text-xs text-[#8e8985] mt-1 max-w-[240px]">
                    Help your friends know what to expect — add a description and perks for your seats.
                  </p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-1 h-9 px-4 rounded-lg bg-[#2c2a2b] text-sm font-medium text-white cursor-pointer hover:bg-[#dcd7d4] hover:text-[#2c2a2b] transition-colors"
                >
                  Add Info
                </button>
              </div>
            ) : (
              /* ── View mode (has content) ── */
              <>
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
                  <div className="flex flex-wrap gap-2 pt-4 pb-4 border-b border-[#f5f4f2]">
                    {pkg.perks.map((perk) => (
                      <span key={perk} className="inline-flex items-center justify-center text-xs font-medium text-[#8e8985] h-8 px-3 border border-[#8e8985]/75 rounded-full whitespace-nowrap">
                        {perk}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#8e8985] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer transition-colors self-start"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Edit seat info
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSeatInfoDrawer({ pkg, navColor, teamAccent, onPkgUpdate }: {
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
  const [perks, setPerks] = useState<string[]>(pkg.perks || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmpty = !pkg.seatPhotoUrl && !pkg.description && pkg.perks.length === 0;

  useEffect(() => {
    setDescription(pkg.description || '');
    setPerks(pkg.perks || []);
  }, [pkg.description, pkg.perks]);

  function togglePerk(perk: string) {
    setPerks((prev) => prev.includes(perk) ? prev.filter((p) => p !== perk) : [...prev, perk]);
  }

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
      body: JSON.stringify({ description: description.trim(), perks }),
    });
    if (res.ok) {
      onPkgUpdate({ description: description.trim(), perks });
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
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      <div
        className="flex items-center gap-2.5 h-11 pl-2.5 pr-3 rounded-lg cursor-pointer active:opacity-90"
        style={{ border: `1px solid ${navColor}`, backgroundColor: `${navColor}33` }}
        onClick={() => setOpen(true)}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ backgroundColor: teamAccent, color: navColor }}
        >
          {getOpponentAbbr(pkg.team)}
        </div>
        <span className="text-base font-medium text-[#2c2a2b] flex-1">
          Sec {pkg.section} &middot; Row {pkg.row} &middot; Seats {pkg.seats}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M6 9l6 6 6-6" stroke="#8e8985" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setOpen(false); setEditing(false); }} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="relative">
              <button
                className="absolute top-3 right-2 w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
                onClick={() => { setOpen(false); setEditing(false); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M6 6l12 12" stroke="#8e8985" strokeWidth="2.5" strokeLinecap="round" />
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
                      <Image src={pkg.seatPhotoUrl} alt="View from seat" fill className="object-cover" sizes="100vw" unoptimized />
                      <div className="absolute bottom-3 left-3 bg-[#2c2a2b]/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                        View from Section {pkg.section}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-[#f5f4f2] border-2 border-dashed border-[#dcd7d4] rounded-lg flex flex-col items-center justify-center gap-2">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-sm font-medium text-[#8e8985]">Add a seat photo</span>
                    </div>
                  )}
                </div>

                {editing ? (
                  /* ── Edit mode ── */
                  <>
                    <div className="pb-4 border-b border-[#f5f4f2]">
                      <label className="block text-xs font-medium text-[#8e8985] mb-1.5">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => { setDescription(e.target.value); if (descError) setDescError(false); }}
                        placeholder="Tell friends about your seats..."
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none transition-colors ${
                          descError ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#eceae5] focus:border-[#2c2a2b]'
                        }`}
                      />
                      {descError && (
                        <p className="text-xs text-[#DC2626] mt-1">Description is required</p>
                      )}
                    </div>
                    <div className="pb-4 border-b border-[#f5f4f2]">
                      <label className="block text-xs font-medium text-[#8e8985] mb-2">Perks</label>
                      <div className="flex flex-wrap gap-1.5">
                        {AVAILABLE_PERKS.map((perk) => {
                          const selected = perks.includes(perk);
                          return (
                            <button
                              key={perk}
                              type="button"
                              onClick={() => togglePerk(perk)}
                              className={`inline-flex items-center h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                                selected
                                  ? 'bg-[#E1F5EE] border-[#0F6E56] text-[#0F6E56]'
                                  : 'bg-white border-[#dcd7d4] text-[#8e8985] hover:border-[#2c2a2b]'
                              }`}
                            >
                              {selected && (
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 16 16" fill="none">
                                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                              {perk}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(false); setDescription(pkg.description || ''); setPerks(pkg.perks || []); }}
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8e8985" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-[#2c2a2b]">Add your seat details</p>
                    <p className="text-xs text-[#8e8985]">Help friends know what to expect</p>
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
                      <div className="flex flex-wrap gap-2 pb-4 border-b border-[#f5f4f2]">
                        {pkg.perks.map((perk) => (
                          <span key={perk} className="inline-flex items-center justify-center text-xs font-medium text-[#8e8985] h-8 px-3 border border-[#8e8985]/75 rounded-full whitespace-nowrap">
                            {perk}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#8e8985] bg-transparent border-none cursor-pointer self-start"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Edit seat info
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
  const isProfile = pathname === '/dashboard/profile';
  const isDashboard = pathname === '/dashboard';
  const [packages, setPackages] = useState<PackageForNav[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/packages')
      .then((r) => (r.ok ? r.json() : { packages: [] }))
      .then((data) => {
        if (cancelled) return;
        setPackages(data.packages);
        if (data.packages.length > 0) {
          setSelectedPkgId(data.packages[0].id);
        }
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || null;
  const { primary: navColor, accent: teamAccent } = selectedPkg
    ? getTeamColors(selectedPkg.team)
    : { primary: '#2c2a2b', accent: '#D4A843' };

  function handlePkgUpdate(fields: Partial<PackageForNav>) {
    if (!selectedPkgId) return;
    setPackages((prev) =>
      prev.map((p) => p.id === selectedPkgId ? { ...p, ...fields } : p)
    );
  }
  const isDark = isColorDark(navColor);

  return (
    <DashboardContext.Provider value={{ packages, selectedPkg, selectedPkgId, setSelectedPkgId, loading }}>
      <div className="flex flex-1 flex-col">
        <header
          className="h-[60px] md:h-[77px] flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          style={{ backgroundColor: navColor }}
        >
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isDark ? '/benchbuddy-mark-white.svg' : '/benchbuddy-logo.svg'}
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
                onPkgUpdate={handlePkgUpdate}
              />
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Package switcher (if multiple) */}
            {packages.length > 1 && (
              <select
                value={selectedPkgId || ''}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                className={`h-9 md:h-10 px-3 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    : 'bg-[#f5f4f2] text-black border-[#eceae5] hover:bg-[#eceae5]'
                }`}
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id} className="text-black bg-white">
                    {p.team} — {p.section}
                  </option>
                ))}
              </select>
            )}

            {/* Dashboard button */}
            <Link
              href="/dashboard"
              className="h-10 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all flex items-center text-white"
              style={{ backgroundColor: isDashboard ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
            >
              Dashboard
            </Link>

            {/* Account icon */}
            <Link
              href="/dashboard/profile"
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all text-white"
              style={{ backgroundColor: isProfile ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
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
