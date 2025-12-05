'use client'

import { motion } from 'framer-motion'
import { PillTag } from '../shared/PillTag'

export function FeaturedFloatingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotateZ: -6,
        y: -20,
        x: 20
      }}
      transition={{ 
        duration: 0.8, 
        ease: [0.23, 0.62, 0.35, 1],
        rotateZ: { duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
      }}
      className="
        absolute top-32 left-10 z-30
        w-[240px]
        bg-white rounded-[28px] p-4
        shadow-ruanta-lg
        border border-white/80
      "
    >
      {/* Image Preview */}
      <div className="relative h-32 rounded-[20px] overflow-hidden mb-4 bg-gradient-to-br from-lime-100 to-green-200">
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-16 h-16 bg-ruanta-accent-green/40 rounded-full blur-xl" />
        </div>
        {/* Fake Waveform */}
        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-green-800/20 to-transparent" />
      </div>

      <h4 className="text-sm font-bold text-gray-900 mb-3">
        Animation scene for showreel
      </h4>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <PillTag label="UI" variant="ui" />
          <span className="text-[10px] font-bold text-gray-400 flex items-center">💬 4</span>
        </div>
        <div className="w-6 h-6 rounded-full overflow-hidden border border-white shadow-sm">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Assignee" />
        </div>
      </div>
    </motion.div>
  )
}
