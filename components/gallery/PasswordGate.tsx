'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateGalleryPassword } from '@/server/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, ShieldX, AlertTriangle } from 'lucide-react'

interface PasswordGateProps {
  galleryId: string
  gallerySlug: string
}

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 60 // seconds

export function PasswordGate({ galleryId, gallerySlug }: PasswordGateProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [lockoutTimer, setLockoutTimer] = useState(0)
  const [shake, setShake] = useState(false)

  // Lockout timer countdown
  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((t) => {
          if (t <= 1) {
            setIsLockedOut(false)
            setAttempts(0)
            return 0
          }
          return t - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [lockoutTimer])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (isLockedOut) return

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    startTransition(async () => {
      const result = await validateGalleryPassword(galleryId, password)

      if (result.success) {
        router.push(`/view-reel/${galleryId}`)
        router.refresh()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setShake(true)
        setTimeout(() => setShake(false), 500)
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLockedOut(true)
          setLockoutTimer(LOCKOUT_DURATION)
          setError(null)
        } else {
          setError(result.error || 'Oops! That password didn\'t work')
        }
      }
    })
  }

  // Locked out state
  if (isLockedOut) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Too Many Attempts</h3>
          <p className="text-sm text-gray-500">
            For security, please wait before trying again.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">
            Try again in {lockoutTimer}s
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Contact the photographer if you need help accessing this gallery.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Lock icon */}
      <div className="flex justify-center mb-2">
        <div className={`w-12 h-12 rounded-full bg-[#1C1917] flex items-center justify-center transition-transform ${shake ? 'animate-shake' : ''}`}>
          <Lock className="w-5 h-5 text-white" />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <Input
          type="password"
          id="password"
          name="password"
          placeholder="Enter password"
          autoComplete="off"
          autoFocus
          disabled={isPending}
          className={`h-12 px-4 rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all duration-200 font-medium text-center tracking-widest placeholder:tracking-normal ${error ? 'border-red-300 focus:ring-red-100 bg-red-50/50' : 'focus:ring-gray-100'}`}
        />
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-600">{error}</span>
        </div>
      )}

      {attempts >= 2 && attempts < MAX_ATTEMPTS && (
        <p className="text-xs text-amber-600 text-center bg-amber-50 rounded-lg p-2">
          {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts > 1 ? 's' : ''} remaining
        </p>
      )}

      <Button 
        type="submit" 
        disabled={isPending} 
        className="w-full h-12 rounded-xl text-base font-medium bg-[#1C1917] hover:bg-[#292524] transition-all"
      >
        {isPending ? 'Checking...' : 'View Gallery'}
      </Button>

      {attempts >= 1 && (
        <p className="text-xs text-gray-400 text-center">
          Don't have the password? Ask the photographer who shared this gallery.
        </p>
      )}
    </form>
  )
}
