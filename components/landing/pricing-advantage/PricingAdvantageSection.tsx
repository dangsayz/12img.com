'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { BackgroundGrid3D } from './BackgroundGrid3D'
import { PricingBars3D } from './PricingBars3D'

export function PricingAdvantageSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Opacity: Stay visible the whole time, only fade out at very end
  const opacity = useTransform(smoothProgress, [0.8, 1], [1, 0])
  
  return (
    <section ref={containerRef} className="relative h-[300vh] bg-white z-10">
      <div className="sticky top-0 h-screen overflow-hidden perspective-1000 flex items-start justify-center pt-32 md:pt-40">
        <motion.div 
          style={{ opacity }}
          className="relative w-full max-w-7xl px-4"
        >
          {/* Header Content */}
          <div className="relative z-20 mb-12 text-center">
            <span className="inline-block rounded-full bg-pastel-pink/30 px-4 py-1.5 text-sm font-semibold text-gray-900 mb-4 backdrop-blur-sm">
              Cost Comparison
            </span>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
              Premium galleries. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                Fractional pricing.
              </span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Stop paying a "legacy tax" for outdated software. We stripped away the bloat to give you pure performance at a fair price.
            </p>
          </div>

          {/* 3D Scene */}
          <div className="relative h-[600px] w-full transform-style-3d">
            <BackgroundGrid3D progress={smoothProgress} />
            <PricingBars3D progress={smoothProgress} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
