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
          className={error ? 'border-red-500' : ''}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {attempts >= 3 && (
        <p className="text-sm text-gray-500">
          Hint: Contact the photographer if you&apos;ve forgotten the password.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Checking...' : 'View Gallery'}
      </Button>
    </form>
  )
}
