'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { validateGalleryPassword } from '@/server/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PasswordGateProps {
  galleryId: string
  gallerySlug: string
}

export function PasswordGate({ galleryId, gallerySlug }: PasswordGateProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    startTransition(async () => {
      const result = await validateGalleryPassword(galleryId, password)

      if (result.success) {
        router.push(`/g/${gallerySlug}`)
        router.refresh()
      } else {
        setError(result.error || 'Incorrect password')
        setAttempts((a) => a + 1)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className={`h-12 px-4 rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all duration-200 font-medium text-center tracking-widest placeholder:tracking-normal ${error ? 'border-red-500 focus:ring-red-200' : 'focus:ring-indigo-100'}`}
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {attempts >= 3 && (
        <p className="text-xs text-gray-400 text-center">
          Hint: Contact the photographer if you&apos;ve forgotten the password.
        </p>
      )}

      <Button 
        type="submit" 
        disabled={isPending} 
        className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-500 transition-all hover:-translate-y-0.5 active:translate-y-0"
      >
        {isPending ? 'Checking...' : 'View Gallery'}
      </Button>
    </form>
  )
}
