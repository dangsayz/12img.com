import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = '12img - Minimal Photo Gallery Delivery'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 700, color: '#1a1a1a' }}>
            12
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            marginBottom: 20,
          }}
        >
          12img
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 32,
            color: '#a0a0a0',
            margin: 0,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Minimal Photo Gallery Delivery for Photographers
        </p>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
          }}
        >
          {['Simple', 'Beautiful', 'Affordable'].map((feature) => (
            <div
              key={feature}
              style={{
                padding: '12px 24px',
                borderRadius: 100,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: 20,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
