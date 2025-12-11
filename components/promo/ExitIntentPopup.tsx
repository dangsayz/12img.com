'use client'

/**
 * Exit Intent Popup - Shows discount offer when user is about to leave
 * 
 * Triggers when:
 * - Mouse moves toward browser chrome (desktop)
 * - After X seconds of inactivity
 * - Only shows once per session
 */

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Copy, Check, ArrowRight } from 'lucide-react'

interface ExitIntentPopupProps {
  /** Discount code to display */
  discountCode?: string
  /** Discount description (e.g., "15% off", "First month free") */
  discountText?: string
  /** Headline text */
  headline?: string
  /** Subheadline text */
  subheadline?: string
  /** Delay before popup can show (ms) */
  delayMs?: number
  /** Only show on specific pages (path patterns) */
  showOnPaths?: string[]
  /** Don't show to logged-in users with active subscription */
  hideForSubscribers?: boolean
}

const STORAGE_KEY = 'exit_intent_shown'
const DEFAULT_CODE = 'TRY15'
const DEFAULT_DISCOUNT = '15% off your first month'

export function ExitIntentPopup({
  discountCode = DEFAULT_CODE,
  discountText = DEFAULT_DISCOUNT,
  headline = "Wait! Don't leave empty-handed",
  subheadline = "Here's a special offer just for you",
  delayMs = 5000,
  showOnPaths = ['/pricing', '/'],
  hideForSubscribers = true,
}: ExitIntentPopupProps) {
  const { isSignedIn, user } = useUser()
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canShow, setCanShow] = useState(false)

  // Check if we should show the popup
  const shouldShow = useCallback(() => {
    // Already shown this session
    if (sessionStorage.getItem(STORAGE_KEY)) return false
    
    // Check path
    if (showOnPaths.length > 0) {
      const currentPath = window.location.pathname
      const matchesPath = showOnPaths.some(path => 
        currentPath === path || currentPath.startsWith(path)
      )
      if (!matchesPath) return false
    }
    
    // Hide for subscribers (check user metadata if available)
    if (hideForSubscribers && isSignedIn) {
      const plan = user?.publicMetadata?.plan as string | undefined
      if (plan && plan !== 'free') return false
    }
    
    return true
  }, [showOnPaths, hideForSubscribers, isSignedIn, user])

  // Delay before popup can activate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShow()) {
        setCanShow(true)
      }
    }, delayMs)
    
    return () => clearTimeout(timer)
  }, [delayMs, shouldShow])

  // Exit intent detection (desktop)
  useEffect(() => {
    if (!canShow) return

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves toward top of viewport (browser chrome)
      if (e.clientY <= 5 && !isVisible) {
        setIsVisible(true)
        sessionStorage.setItem(STORAGE_KEY, 'true')
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [canShow, isVisible])

  // Inactivity detection (mobile fallback)
  useEffect(() => {
    if (!canShow || isVisible) return

    let inactivityTimer: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        if (shouldShow()) {
          setIsVisible(true)
          sessionStorage.setItem(STORAGE_KEY, 'true')
        }
      }, 30000) // 30 seconds of inactivity
    }

    // Reset on any interaction
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      clearTimeout(inactivityTimer)
      events.forEach(event => document.removeEventListener(event, resetTimer))
    }
  }, [canShow, isVisible, shouldShow])

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClaimOffer = () => {
    // Store the code and redirect to pricing
    sessionStorage.setItem('promo_code_hint', discountCode)
    window.location.href = `/pricing?promo=${discountCode}`
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Popup */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header with gift icon */}
              <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-8 pt-10 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-serif text-white mb-2">
                  {headline}
                </h2>
                <p className="text-stone-300 text-sm">
                  {subheadline}
                </p>
              </div>

              {/* Content */}
              <div className="px-8 py-8">
                {/* Discount highlight */}
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-3">
                    {discountText}
                  </div>
                  
                  {/* Code box */}
                  <div className="flex items-center justify-center gap-2 p-4 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
                    <code className="text-2xl font-mono font-bold text-stone-900 tracking-wider">
                      {discountCode}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 text-stone-400 hover:text-stone-600 hover:bg-white rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CTA button */}
                <button
                  onClick={handleClaimOffer}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-stone-900 text-white font-medium rounded-xl hover:bg-black transition-colors"
                >
                  Claim Your Discount
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* No thanks link */}
                <button
                  onClick={handleClose}
                  className="w-full mt-3 text-sm text-stone-400 hover:text-stone-600 transition-colors"
                >
                  No thanks, I'll pay full price
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
