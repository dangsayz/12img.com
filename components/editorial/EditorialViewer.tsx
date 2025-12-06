
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { EditorialSpread } from '@/lib/editorial/types'
import { Spread } from './Spread'
import { SpreadOverview } from './SpreadOverview'
import { ArrowLeft, Grid } from 'lucide-react'
import Link from 'next/link'

interface Props {
  spreads: EditorialSpread[]
  title: string
  galleryId: string
}

export function EditorialViewer({ spreads, title, galleryId }: Props) {
  const [debug, setDebug] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const scrollToSpread = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-neutral-900 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Navigation / Controls */}
      <nav className="fixed top-0 left-0 right-0 z-40 p-6 flex justify-between items-start pointer-events-none mix-blend-difference text-white">
        <Link 
          href="/"
          className="pointer-events-auto flex items-center gap-2 group opacity-50 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium tracking-widest uppercase">Index</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="w-full">
        {spreads.map((spread) => (
          <div key={spread.id} id={spread.id}>
             <Spread spread={spread} debug={debug} />
          </div>
        ))}
      </main>

      {/* Index Sheet Footer */}
      <SpreadOverview spreads={spreads} onSpreadClick={scrollToSpread} />
    </div>
  )
}
