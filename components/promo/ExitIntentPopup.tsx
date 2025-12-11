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
import { X, Copy, Check } from 'lucide-react'

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
  headline = "Before you go",
  subheadline = "We'd love for you to experience what premium gallery delivery feels like.",
  delayMs = 5000,
  showOnPaths = ['/pricing', '/'],
  hideForSubscribers = true,
}: ExitIntentPopupProps) {
  const { isSignedIn, user } = useUser()
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canShow, setCanShow] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

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
    // Go directly to checkout with promo - no intermediate pages
    window.location.href = `/checkout?plan=pro&promo=${discountCode}`
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Popup - Editorial Magazine Style */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 200, delay: 0.1 }}
              className="relative w-full max-w-3xl bg-stone-950 overflow-hidden pointer-events-auto"
              style={{ aspectRatio: '16/10' }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 p-2 text-white/40 hover:text-white transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Split layout */}
              <div className="absolute inset-0 flex">
                {/* Left side - Image */}
                <div className="w-1/2 relative overflow-hidden">
                  <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    <img
                      src="/images/showcase/promo-hero.jpg"
                      alt=""
                      className="w-full h-full object-cover"
                      onLoad={() => setImageLoaded(true)}
                      onError={(e) => {
                        // Fallback to a gradient if image doesn't exist
                        e.currentTarget.style.display = 'none'
                        setImageLoaded(true)
                      }}
                    />
                    {/* Gradient overlay for image */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-stone-950" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
                  </motion.div>
                  
                  {/* Fallback gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 -z-10" />
                </div>

                {/* Right side - Content */}
                <div className="w-1/2 flex flex-col justify-center px-10 py-8 relative">
                  {/* Decorative line */}
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent origin-center"
                  />

                  {/* Small label */}
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4"
                  >
                    A gift for you
                  </motion.p>

                  {/* Headline */}
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-serif text-3xl md:text-4xl text-white leading-[1.1] mb-4"
                  >
                    {headline}
                  </motion.h2>

                  {/* Subheadline */}
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/50 text-sm leading-relaxed mb-8 max-w-[280px]"
                  >
                    {subheadline}
                  </motion.p>

                  {/* Offer */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-8"
                  >
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
                      {discountText}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl text-white tracking-widest">
                        {discountCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-1.5 text-white/30 hover:text-white/60 transition-colors"
                        title="Copy code"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <button
                      onClick={handleClaimOffer}
                      className="group flex items-center gap-3 text-white text-sm font-medium"
                    >
                      <span className="relative">
                        Start your free month
                        <span className="absolute left-0 -bottom-0.5 w-full h-px bg-white/30 group-hover:bg-white transition-colors" />
                      </span>
                      <svg 
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>

                    <button
                      onClick={handleClose}
                      className="text-xs text-white/20 hover:text-white/40 transition-colors"
                    >
                      Maybe later
                    </button>
                  </motion.div>
                </div>
              </div>

              {/* Bottom bar - subtle branding */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-4 left-6 flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-sm bg-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white/60">12</span>
                </div>
                <span className="text-[10px] text-white/20 tracking-wider">12IMG.COM</span>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
