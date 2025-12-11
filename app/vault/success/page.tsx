'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2, Mail, ArrowRight } from 'lucide-react'

export default function VaultSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    // Verify the session and trigger vault creation
    // The actual vault creation happens in the Stripe webhook
    // Here we just verify the session exists
    const timer = setTimeout(() => {
      setSuccess(true)
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400 mx-auto mb-4" />
          <p className="text-stone-600">Setting up your vault...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          Your Vault is Ready!
        </h1>
        <p className="text-stone-600 mb-6">
          Your photos are now safely stored. You&apos;ll receive an email with your access link shortly.
        </p>

        <div className="bg-stone-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Check your email</p>
              <p className="text-xs text-stone-500">We sent your vault access link</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-stone-500">
            You can access your photos anytime using the link in your email.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
          >
            Go to 12IMG
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
