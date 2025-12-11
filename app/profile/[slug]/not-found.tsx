'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ProfileNotFound() {
  return <ProfileUnavailable reason="not_found" />
}

interface ProfileUnavailableProps {
  reason?: 'not_found' | 'private' | 'locked'
  photographerName?: string
}

export function ProfileUnavailable({ reason = 'not_found', photographerName }: ProfileUnavailableProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [visible, setVisible] = useState(false)

  const config = {
    not_found: {
      title: '404',
      message: "This profile doesn't exist",
    },
    private: {
      title: 'Private',
      message: photographerName 
        ? `${photographerName} keeps their portfolio private`
        : "This photographer keeps their portfolio private",
    },
    locked: {
      title: 'Locked',
      message: "PIN required to view this portfolio",
    },
  }

  const { title, message } = config[reason]
  const shouldRedirect = reason === 'not_found'

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (!shouldRedirect) return
    if (countdown <= 0) {
      setVisible(false)
      setTimeout(() => router.push('/'), 300)
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router, shouldRedirect])

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div 
        className={`text-center transition-all duration-500 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Title */}
        <div className="mb-8">
          <span className="text-[100px] sm:text-[140px] font-extralight tracking-[-0.05em] text-stone-200 leading-none select-none">
            {title}
          </span>
        </div>

        {/* Message */}
        <p className="text-stone-400 text-sm tracking-wide mb-12">
          {message}
        </p>

        {/* Progress bar for redirects, or action for private/locked */}
        {shouldRedirect ? (
          <div className="w-32 mx-auto">
            <div className="h-px bg-stone-100 relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-stone-300 transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-300 mt-3 tracking-[0.2em] uppercase">
              Redirecting
            </p>
          </div>
        ) : (
          <Link
            href="/"
            className="text-[10px] text-stone-300 hover:text-stone-500 tracking-[0.15em] uppercase transition-colors"
          >
            Go home →
          </Link>
        )}

        {/* Skip link for redirects */}
        {shouldRedirect && (
          <button
            onClick={() => router.push('/')}
            className="mt-12 text-[10px] text-stone-300 hover:text-stone-500 tracking-[0.15em] uppercase transition-colors"
          >
            Go now →
          </button>
        )}
      </div>
    </div>
  )
}
