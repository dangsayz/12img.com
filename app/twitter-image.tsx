import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = '12img - The Complete Platform for Modern Photographers'
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
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Gradient orbs for depth */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Main content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 800,
                color: 'white',
                boxShadow: '0 20px 40px -10px rgba(59,130,246,0.4)',
              }}
            >
              12
            </div>
          </div>

          {/* Main headline */}
          <div
            style={{
              fontSize: '80px',
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1,
              marginBottom: '16px',
              letterSpacing: '-0.03em',
            }}
          >
            12img.com
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '28px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              marginBottom: '48px',
              maxWidth: '700px',
              lineHeight: 1.4,
            }}
          >
            The complete platform for modern photographers
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Galleries', 'Contracts', 'Client Portals', 'Email Tracking'].map((feature) => (
              <div
                key={feature}
                style={{
                  padding: '10px 20px',
                  borderRadius: '100px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '18px',
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          <span>Powered by</span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>The Vendors Connect</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
