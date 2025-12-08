
'use client'

import React, { useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { EditorialSpread } from '@/lib/editorial/types'
import { Spread } from './Spread'
import { SpreadOverview } from './SpreadOverview'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface PreviewImage {
  id: string
  url: string
}

interface Props {
  spreads: EditorialSpread[]
  title: string
  galleryId: string
  imageCount?: number
  photographerName?: string
  eventDate?: string
  location?: string
  previewImages?: PreviewImage[]
}

export function EditorialViewer({ 
  spreads, 
  title, 
  galleryId,
  imageCount,
  photographerName,
  eventDate,
  location,
  previewImages = []
}: Props) {
  const [debug, setDebug] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })
  
  // Fade out scroll indicator after 5% scroll
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0])

  const scrollToSpread = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Count actual content spreads (excluding title)
  const contentSpreads = spreads.filter(s => s.pageNumber && s.pageNumber > 0)

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-neutral-900 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Navigation / Controls - Hidden on title spread to avoid text overlap */}
      <nav className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6 flex justify-between items-center pointer-events-none">
        <Link 
          href="/"
          className="pointer-events-auto flex items-center gap-2 group opacity-60 hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-stone-600 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-medium tracking-wide text-stone-600 uppercase hidden sm:inline">Back</span>
        </Link>
        
        {/* Right side - Image count */}
        <div className="pointer-events-auto flex items-center gap-2">
          {imageCount && imageCount > 0 && (
            <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm hidden sm:block">
              <span className="text-xs font-medium tracking-wide text-stone-600">
                {imageCount} <span className="text-[10px] uppercase tracking-wider opacity-70">images</span>
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full">
        {spreads.map((spread, index) => {
          // First content spread is the one right after the title (index 1)
          const isFirstContent = index === 1 && spread.pageNumber === 1
          return (
            <div key={spread.id} id={spread.id}>
              <Spread spread={spread} debug={debug} isFirstContent={isFirstContent} />
            </div>
          )
        })}
      </main>

      {/* Scroll Indicator - Fades out as user scrolls */}
      <motion.div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none"
        style={{ opacity: scrollIndicatorOpacity }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        </motion.div>
      </motion.div>

      {/* Elegant Footer before Index */}
      <div className="w-full py-24 text-center border-t border-neutral-100 bg-[#FAFAFA]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-300 mb-4">Fin.</p>
        {photographerName && (
          <p className="text-sm text-neutral-400">
            Photography by <span className="text-neutral-600">{photographerName}</span>
          </p>
        )}
        {(eventDate || location) && (
          <p className="text-xs text-neutral-300 mt-2">
            {[eventDate, location].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Index Sheet Footer */}
      <SpreadOverview spreads={spreads} onSpreadClick={scrollToSpread} />

    </div>
  )
}
