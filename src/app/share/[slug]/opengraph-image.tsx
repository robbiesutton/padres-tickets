import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'BenchBuddy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.getbenchbuddy.com';

  return new ImageResponse(
    <div
      style={{
        background: '#2C2A2B',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${baseUrl}/benchbuddy-lockup-white.svg`}
        width={400}
        height={68}
        alt="BenchBuddy"
      />
    </div>,
    { ...size }
  );
}
