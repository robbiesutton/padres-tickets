'use client';

import { useState, useEffect } from 'react';

const EMAILS = [
  { id: '1', label: '#1 Holder welcome', file: '/emails/email-1-holder-welcome.html' },
  { id: '2', label: '#2 Claimer welcome', file: '/emails/email-2-claimer-welcome.html' },
  { id: '3', label: '#3 Holder: game claimed', file: '/emails/email-3-holder-game-claimed.html' },
  { id: '4', label: '#4 Claimer: claim confirmation', file: '/emails/email-4-claimer-claim-confirmation.html' },
  { id: '5', label: '#5 Claimer: game day', file: '/emails/email-5-claimer-game-day.html' },
  { id: '6a', label: '#6a Holder: game day (claimed)', file: '/emails/email-6a-holder-gameday-claimed.html' },
  { id: '6b', label: '#6b Holder: game day (available)', file: '/emails/email-6b-holder-gameday-available.html' },
  { id: '6c', label: '#6c Holder: game day (going)', file: '/emails/email-6c-holder-gameday-going.html' },
  { id: '7', label: '#7 Claimer: game unclaimed', file: '/emails/email-7-claimer-game-unclaimed.html' },
];

export default function EmailPreviewPage() {
  const [selected, setSelected] = useState(EMAILS[0].id);
  const [width, setWidth] = useState<'mobile' | 'desktop'>('desktop');
  const [html, setHtml] = useState('');
  const email = EMAILS.find((e) => e.id === selected)!;

  useEffect(() => {
    fetch(email.file)
      .then((r) => r.text())
      .then((text) => {
        // Extract just the body content
        const match = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setHtml(match ? match[1] : text);
      })
      .catch(() => setHtml('<p style="color:#999;text-align:center;padding:40px;">Failed to load email template</p>'));
  }, [email.file]);

  return (
    <div className="min-h-screen bg-[#1B1716] flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-[#2C2A2B] border-b border-white/10 px-4 py-3 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>Email preview</span>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-9 px-3 pr-8 rounded-lg bg-white/10 border border-white/20 text-sm text-white appearance-none cursor-pointer"
        >
          {EMAILS.map((e) => (
            <option key={e.id} value={e.id} className="text-black">{e.label}</option>
          ))}
        </select>

        <div className="flex rounded-lg overflow-hidden border border-white/20">
          <button
            onClick={() => setWidth('mobile')}
            className={`px-3 py-1.5 text-xs font-medium border-none cursor-pointer ${width === 'mobile' ? 'bg-white text-[#2C2A2B]' : 'bg-transparent text-white/60'}`}
          >
            Mobile (320px)
          </button>
          <button
            onClick={() => setWidth('desktop')}
            className={`px-3 py-1.5 text-xs font-medium border-none cursor-pointer ${width === 'desktop' ? 'bg-white text-[#2C2A2B]' : 'bg-transparent text-white/60'}`}
          >
            Desktop (600px)
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex justify-center py-8 px-4">
        <div
          style={{ width: width === 'mobile' ? 320 : 600 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
