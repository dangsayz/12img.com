'use client'

import { motion, MotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface PricingBars3DProps {
  progress: MotionValue<number>
}

export function PricingBars3D({ progress }: PricingBars3DProps) {
  // Bar Growth Animation - Individual heights for realistic comparison
  // Scale: $60 = 100% height
  // $29 = ~48%
  // $45 = ~75%
  // $59 = ~98%
  // $15 = ~25%

  const basicHeight = useTransform(progress, [0.1, 0.4], ["0%", "48%"])
  const standardHeight = useTransform(progress, [0.15, 0.45], ["0%", "75%"])
  const premiumHeight = useTransform(progress, [0.2, 0.5], ["0%", "98%"])
  
  // 12img Bar Specific Animation
  const ourBarHeight = useTransform(progress, [0.3, 0.6], ["0%", "25%"]) 
  const highlightOpacity = useTransform(progress, [0.6, 0.7], [0, 1])

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-4 md:gap-12 perspective-1000 transform-style-3d pb-20">
      {/* Competitor 1: Basic */}
      <PricingBar 
        label="Basic"
        price="$29/mo"
        height={basicHeight}
        color="bg-gray-200/80"
        delay={0}
      />

      {/* Competitor 2: Standard */}
      <PricingBar 
        label="Standard"
        price="$45/mo"
        height={standardHeight}
        color="bg-gray-300/80"
        delay={0.1}
      />

      {/* Competitor 3: Premium */}
      <PricingBar 
        label="Premium"
        price="$59/mo"
        height={premiumHeight}
        color="bg-gray-400/80"
        delay={0.2}
      />

      {/* 12img Bar - The Hero */}
      <div className="relative group px-2 md:px-4">
        {/* Callout Label */}
        <motion.div 
          style={{ opacity: highlightOpacity, y: useTransform(progress, [0.6, 0.8], [20, 0]) }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-48 text-center z-20"
        >
          <div className="relative bg-gray-900 text-white text-sm font-semibold py-2 px-4 rounded-full shadow-lg mb-2">
            Save up to 75%
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </div>
        </motion.div>

        <div className="w-20 md:w-28 h-[400px] relative transform-style-3d group-hover:scale-105 transition-transform duration-500 flex flex-col justify-end">
          {/* Price Tag */}
          <motion.div 
            style={{ opacity: highlightOpacity, bottom: ourBarHeight }}
            className="absolute left-0 right-0 mb-4 text-center z-10"
          >
            <span className="text-2xl font-bold text-gray-900">$15/mo</span>
          </motion.div>

          <motion.div
            style={{ height: ourBarHeight }}
            className="absolute bottom-0 w-full rounded-t-xl bg-gradient-to-t from-orange-100 to-pink-100 border-x border-t border-white/60 shadow-[0_0_30px_rgba(255,200,200,0.4)] backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-t-xl" />
          </motion.div>
          
          <div className="absolute -bottom-12 w-full text-center">
            <span className="text-sm font-bold text-gray-900">12img Pro</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PricingBar({ label, price, height, color, delay }: { label: string, price: string, height: MotionValue<string>, color: string, delay: number }) {
  return (
    <div className="w-20 md:w-28 h-[400px] relative transform-style-3d flex flex-col justify-end">
      {/* Price Tag - Animate with the bar */}
      <motion.div 
        style={{ bottom: height }}
        className="absolute left-0 right-0 mb-4 text-center z-10"
      >
        <span className="text-lg font-bold text-gray-400">{price}</span>
      </motion.div>

      <motion.div
        style={{ height }}
        transition={{ delay }}
        className={cn(
          "absolute bottom-0 w-full rounded-t-xl border-x border-t border-white/40 backdrop-blur-sm transition-colors duration-500",
          color
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
      </motion.div>
      
      <div className="absolute -bottom-12 w-full text-center">
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
    </div>
  )
}
