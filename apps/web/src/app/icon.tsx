import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
          <path
            d="M16 8 L16 62 Q16 92 50 92 Q84 92 84 62 L84 8 L64 8 L64 62 Q64 75 50 75 Q36 75 36 62 L36 8 Z"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size },
  )
}
