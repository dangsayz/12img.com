'use client'

import { GlassCard } from '../shared/GlassCard'
import { TeamBlock } from './TeamBlock'
import { ProgressBars } from './ProgressBars'
import { UpgradeCard } from './UpgradeCard'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export function StatisticPanel() {
  const tabs = ['All', 'Research', 'Design', 'Engineering']

  return (
    <GlassCard className="h-full flex flex-col gap-8 p-8 rounded-[32px]">
      {/* Header */}
      <h2 className="text-xl font-bold text-ruanta-text-primary">Statistic</h2>

      {/* Tabs */}
      <div className="flex items-center gap-5 border-b border-gray-100 pb-px overflow-x-auto no-scrollbar">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={cn(
              "text-xs font-bold pb-3 relative transition-colors whitespace-nowrap",
              i === 2 ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab}
            {i === 2 && (
              <motion.div 
                layoutId="activeStatTab"
                className="absolute bottom-0 left-0 w-full h-[2px] bg-black rounded-full" 
              />
            )}
          </button>
        ))}
      </div>

      <TeamBlock />
      <ProgressBars />
      <UpgradeCard />
    </GlassCard>
  )
}
