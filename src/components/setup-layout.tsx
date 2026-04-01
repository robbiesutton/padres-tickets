'use client';

interface StepInfo {
  label: string;
}

interface Props {
  steps?: StepInfo[];
  currentStep?: number; // 1-based
  children: React.ReactNode;
  showSidebar?: boolean;
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="#d4a017" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SetupLayout({ steps, currentStep = 1, children, showSidebar = true }: Props) {
  const totalSteps = steps?.length || 1;
  const progress = steps ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      {/* ── Sidebar (desktop only) ── */}
      {showSidebar && (
        <aside className="hidden md:flex w-[320px] shrink-0 flex-col items-center justify-center px-8 py-12 relative overflow-hidden" style={{ backgroundColor: '#2c2a2b' }}>
          {/* Subtle radial glow */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 70%, rgba(212,160,23,0.12), transparent 70%)' }} />

          {/* Logo + tagline */}
          <div className="relative z-10 flex flex-col items-center text-center mb-10">
            <div className="text-5xl mb-6">⚾</div>
            <h2 className="text-[22px] font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
              BenchBuddy
            </h2>
            <p className="text-[13px] text-white/50 leading-relaxed mt-3 max-w-[200px]">
              Share your season tickets with the people you trust.
            </p>
          </div>

          {/* Step tracker */}
          {steps && steps.length > 0 && (
            <div className="relative z-10 w-full px-4">
              {steps.map((step, i) => {
                const stepNum = i + 1;
                const isDone = stepNum < currentStep;
                const isActive = stepNum === currentStep;

                return (
                  <div key={i}>
                    <div className="flex items-center gap-3 py-2">
                      {/* Step number / check */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isDone
                            ? 'bg-[#d4a017] text-[#2c2a2b]'
                            : isActive
                              ? 'bg-white text-[#2c2a2b]'
                              : 'bg-white/[0.12] text-white/40'
                        }`}
                      >
                        {isDone ? <CheckIcon /> : stepNum}
                      </div>
                      {/* Step label */}
                      <span
                        className={`text-[13px] font-semibold ${
                          isDone
                            ? 'text-[#d4a017]'
                            : isActive
                              ? 'text-white'
                              : 'text-white/[0.35]'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {/* Connecting line */}
                    {i < steps.length - 1 && (
                      <div
                        className={`w-[2px] h-3 ml-[13px] ${
                          isDone ? 'bg-[#d4a017]' : 'bg-white/[0.1]'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Progress bar */}
        {steps && (
          <div className="h-[3px] bg-[#eceae5]">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #2c2a2b, #8B2500)',
              }}
            />
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex flex-col mx-auto w-full max-w-[600px] px-5 py-8 md:py-24">
          {children}
        </div>
      </main>
    </div>
  );
}

// ─── Reusable sub-components for wizard steps ──────────

export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <p className="text-[11px] font-bold text-[#8B2500] uppercase tracking-[1px] mb-2">
      Step {current} of {total}
    </p>
  );
}

export function StepHeadline({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[28px] font-bold leading-tight text-[#1a1a1a] tracking-tight mb-1.5" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
      {children}
    </h1>
  );
}

export function StepSubhead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-[#8e8985] leading-relaxed mb-6 md:mb-8">
      {children}
    </p>
  );
}

export function StepActions({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Spacer so content doesn't hide behind fixed button on mobile */}
      <div className="h-20 md:hidden" />
      <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-3 bg-[#faf8f5] md:static md:p-0 md:bg-transparent md:mt-8 flex items-center justify-end gap-4">
        {children}
      </div>
    </>
  );
}

export function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-11 w-full md:w-auto px-7 rounded-lg bg-[#2c2a2b] text-white text-sm font-bold cursor-pointer border-none transition-all hover:bg-[#dcd7d4] hover:text-[#2c2a2b] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-medium text-[#b0a89e] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer transition-colors"
    >
      {children}
    </button>
  );
}

export function SkipLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="ml-auto text-[13px] font-semibold text-[#b0a89e] hover:text-[#2c2a2b] bg-transparent border-none cursor-pointer transition-colors"
    >
      {children}
    </button>
  );
}

export function InlineNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3.5 py-3 bg-[#fffbeb] rounded-lg mb-4 max-w-[440px]">
      <span className="text-sm shrink-0 mt-px">💡</span>
      <p className="text-xs text-[#92400e] leading-relaxed font-medium">{children}</p>
    </div>
  );
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-[#8e8985] uppercase tracking-[0.5px] mb-2">
      {children}
    </label>
  );
}

export function FormSelect({ value, onChange, children, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-12 px-4 pr-10 bg-white border-[1.5px] border-[#eceae5] rounded-lg text-[15px] font-semibold text-[#1a1a1a] appearance-none cursor-pointer transition-all hover:border-[#b5b1ab] focus:border-[#2c2a2b] focus:outline-none focus:ring-[3px] focus:ring-[#2c2a2b]/10 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238C8984%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}
