'use client'

/**
 * Direct Checkout Page
 * 
 * Streamlined conversion flow:
 * 1. User lands here with ?plan=X&promo=Y
 * 2. If not logged in → auth modal appears immediately
 * 3. Once authenticated → auto-triggers Stripe checkout
 * 4. User goes directly to Stripe payment
 * 
 * No intermediate pages, no confusion.
 */

import { useEffect, useState, useRef, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAuthModal } from '@/components/auth/AuthModal'
import { storePromo } from '@/lib/promo/persistence'

function CheckoutContent() {
  const { isSignedIn, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const { openAuthModal } = useAuthModal()
  
  const [status, setStatus] = useState<'loading' | 'authenticating' | 'redirecting' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const checkoutTriggered = useRef(false)
  
  const plan = searchParams.get('plan') || 'pro'
  const promo = searchParams.get('promo')
  
  // Store promo code if provided
  useEffect(() => {
    if (promo) {
      storePromo({
        code: promo,
        campaignSlug: 'exit-intent',
        source: 'checkout_page',
      })
    }
  }, [promo])
  
  // Handle the checkout flow
  useEffect(() => {
    if (!isLoaded) return
    
    if (!isSignedIn) {
      // Show auth modal - after sign in, Clerk will reload and we'll be signed in
      setStatus('authenticating')
      // Use current URL as redirect so user comes back here after auth
      openAuthModal('sign-up', `/checkout?plan=${plan}${promo ? `&promo=${promo}` : ''}`)
      return
    }
    
    // User is signed in - trigger checkout
    if (!checkoutTriggered.current) {
      checkoutTriggered.current = true
      triggerCheckout()
    }
  }, [isLoaded, isSignedIn, plan, promo, openAuthModal])
  
  const triggerCheckout = async () => {
    setStatus('redirecting')
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: plan, 
          promoCode: promo 
        }),
      })
      
      const data = await response.json()
      
      if (data.url) {
        // Success - redirect to Stripe
        window.location.href = data.url
      } else {
        setStatus('error')
        setError(data.error || 'Failed to create checkout session')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setStatus('error')
      setError('Something went wrong. Please try again.')
    }
  }
  
  const handleRetry = () => {
    checkoutTriggered.current = false
    setError(null)
    setStatus('loading')
    triggerCheckout()
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-6"
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 rounded-full mb-4">
            <span className="text-white font-bold text-lg">12</span>
          </div>
        </div>
        
        {status === 'loading' && (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto mb-4" />
            <p className="text-stone-500 text-sm">Preparing your checkout...</p>
          </>
        )}
        
        {status === 'authenticating' && (
          <>
            <p className="text-stone-900 text-lg font-medium mb-2">One moment</p>
            <p className="text-stone-500 text-sm">Sign in to continue to checkout</p>
          </>
        )}
        
        {status === 'redirecting' && (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto mb-4" />
            <p className="text-stone-900 text-lg font-medium mb-2">Taking you to checkout</p>
            <p className="text-stone-500 text-sm">
              {promo && (
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium mr-2">
                  {promo}
                </span>
              )}
              Redirecting to secure payment...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <p className="text-stone-900 text-lg font-medium mb-2">Something went wrong</p>
            <p className="text-stone-500 text-sm mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-800 transition-colors"
            >
              Try again
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 rounded-full mb-4">
          <span className="text-white font-bold text-lg">12</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto mb-4" />
        <p className="text-stone-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  )
}
