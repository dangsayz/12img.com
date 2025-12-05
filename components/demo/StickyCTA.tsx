'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero (roughly 500px)
      if (window.scrollY > 500 && !isDismissed) {
        setIsVisible(true)
      } else if (window.scrollY <= 500) {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDismissed])

  if (isDismissed) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Desktop: Bottom sticky bar */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden lg:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-4 px-6 py-3 bg-[#1C1917] rounded-full shadow-2xl shadow-black/20 border border-white/10"
          >
            <span className="text-white/80 text-sm">
              Ready to try 12img for your next wedding?
            </span>
            <Link href="/sign-up">
              <Button size="sm" className="bg-white text-[#1C1917] hover:bg-white/90 group">
                Start free demo
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <button
              onClick={() => setIsDismissed(true)}
              className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </motion.div>

          {/* Mobile: Bottom floating button */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white border-t border-[#E8E4DC] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          >
            <div className="max-w-lg mx-auto flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1C1917] truncate">
                  Ready to try 12img?
                </p>
                <p className="text-xs text-[#78716C] truncate">
                  Free tier available
                </p>
              </div>
              <Link href="/sign-up">
                <Button className="flex-shrink-0 group">
                  Start free
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
