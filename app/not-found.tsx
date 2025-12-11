'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (countdown <= 0) {
      router.push('/')
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4 text-center">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-gradient-to-br from-rose-500/20 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-tl from-violet-500/15 via-transparent to-transparent blur-3xl" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Main content */}
      <div className="relative z-10">
        {/* UH-OH with staggered reveal effect */}
        <div className="mb-6 select-none">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-[120px] font-black leading-none tracking-tighter text-white sm:text-[180px]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              UH
            </span>
            <span className="relative text-[120px] font-black leading-none tracking-tighter sm:text-[180px]">
              <span className="bg-gradient-to-b from-white via-white/80 to-white/40 bg-clip-text text-transparent">-</span>
            </span>
            <span className="text-[120px] font-black leading-none tracking-tighter text-white sm:text-[180px]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              OH
            </span>
          </div>
        </div>

        {/* Message */}
        <p className="mb-8 max-w-md text-lg text-white/50">
          This page doesn&apos;t exist. But don&apos;t worry, we&apos;ll get you back on track.
        </p>

        {/* Countdown */}
        <div className="mb-8">
          <p className="mb-3 text-sm text-white/40">Redirecting in</p>
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            {/* Progress ring */}
            <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${(countdown / 10) * 283} 283`}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-3xl font-bold tabular-nums text-white">{countdown}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/">
            <Button 
              size="lg" 
              className="min-w-[160px] bg-white text-black hover:bg-white/90"
            >
              Go Home Now
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline"
            className="min-w-[160px] border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => setCountdown(0)}
          >
            Skip Countdown
          </Button>
        </div>
      </div>

      {/* Bottom decorative text */}
      <div className="absolute bottom-8 text-xs tracking-widest text-white/20">
        12IMG • PAGE NOT FOUND
      </div>
    </div>
  )
}
