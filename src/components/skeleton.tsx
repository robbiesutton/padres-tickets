'use client';

const boneStyle = {
  background: 'linear-gradient(90deg, #e8e4df 25%, #f5f2ef 50%, #e8e4df 75%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
};

export function Bone({
  w,
  h,
  r = 4,
  delay = 0,
  className = '',
}: {
  w: string;
  h: string;
  r?: number | string;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        ...boneStyle,
        width: w,
        height: h,
        borderRadius: typeof r === 'number' ? `${r}px` : r,
        animationDelay: `${delay}s`,
        flexShrink: 0,
      }}
    />
  );
}

// Skeleton matching auth pages (login, signup, join, reset-password)
export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col mx-auto w-full max-w-[600px] px-5 py-8 md:py-24">
          <div className="flex flex-col flex-1 justify-center max-w-[380px] mx-auto w-full">
            <div className="text-center mb-6 md:mb-8 flex flex-col items-center gap-2">
              <Bone w="180px" h="32px" delay={0} />
              <Bone w="240px" h="14px" delay={0.1} />
            </div>
            <div className="flex flex-col gap-4">
              {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                  <Bone w="60px" h="12px" delay={i * 0.1} className="mb-2" />
                  <Bone w="100%" h="48px" r={8} delay={i * 0.1 + 0.05} />
                </div>
              ))}
              <div className="mt-4">
                <Bone w="100%" h="48px" r={8} delay={fields * 0.1 + 0.1} />
              </div>
            </div>
            <div className="flex flex-col gap-2 items-center text-center mt-8">
              <Bone w="120px" h="14px" delay={fields * 0.1 + 0.2} />
              <Bone w="180px" h="14px" delay={fields * 0.1 + 0.3} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
