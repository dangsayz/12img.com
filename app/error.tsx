'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Something went wrong!</h2>
      <p className="mb-8 text-gray-500 max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button
        onClick={() => reset()}
        variant="default"
      >
        Try again
      </Button>
    </div>
  )
}
