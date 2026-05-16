import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'BenchBuddy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#2C2A2B',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-3px',
          lineHeight: 1,
        }}
      >
        BenchBuddy
      </div>
      <div
        style={{
          width: '80px',
          height: '4px',
          background: '#E5AB00',
          borderRadius: '2px',
        }}
      />
      <div style={{ fontSize: 28, color: '#8E8985' }}>
        Your seats. Your friends. Your price.
      </div>
    </div>,
    { ...size }
  );
}
