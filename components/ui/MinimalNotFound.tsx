'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface MinimalNotFoundProps {
  title?: string
  message?: string
  redirectTo?: string
  redirectLabel?: string
  countdown?: number
}

export function MinimalNotFound({
  title = '404',
  message = "This page doesn't exist",
  redirectTo = '/',
  redirectLabel = 'Go now',
  countdown: initialCountdown = 5,
}: MinimalNotFoundProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(initialCountdown)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (countdown <= 0) {
      setVisible(false)
      setTimeout(() => router.push(redirectTo), 300)
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router, redirectTo])

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div 
        className={`text-center transition-all duration-500 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Title */}
        <div className="mb-8">
          <span className="text-[120px] sm:text-[180px] font-extralight tracking-[-0.05em] text-stone-200 leading-none select-none">
            {title}
          </span>
        </div>

        {/* Message */}
        <p className="text-stone-400 text-sm tracking-wide mb-12">
          {message}
        </p>

        {/* Minimal progress bar */}
        <div className="w-32 mx-auto">
          <div className="h-px bg-stone-100 relative overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-stone-300 transition-all duration-1000 ease-linear"
              style={{ width: `${((initialCountdown - countdown) / initialCountdown) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-stone-300 mt-3 tracking-[0.2em] uppercase">
            Redirecting
          </p>
        </div>

        {/* Skip link */}
        <button
          onClick={() => router.push(redirectTo)}
          className="mt-12 text-[10px] text-stone-300 hover:text-stone-500 tracking-[0.15em] uppercase transition-colors"
        >
          {redirectLabel} →
        </button>
      </div>
    </div>
  )
}
