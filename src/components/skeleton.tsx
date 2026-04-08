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
