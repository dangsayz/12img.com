'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Search } from 'lucide-react'

export function ProgressBars() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ruanta-text-primary">Progress</h3>
        <Search className="w-4 h-4 text-gray-400" />
      </div>

      <div className="grid grid-cols-3 gap-2 h-32">
        <Bar color="bg-ruanta-accent-green" percent={42} active />
        <Bar color="bg-yellow-200" percent={14} />
        <Bar color="bg-ruanta-accent-lavender" percent={28} />
        <Bar color="bg-ruanta-accent-charcoal" percent={36} />
      </div>
      
      <div className="flex justify-between pt-2">
        <Stat label="42%" icon="☘️" />
        <Stat label="4%" icon="⏱" />
        <Stat label="18%" icon="🔗" />
        <Stat label="36%" icon="✓" />
      </div>
    </div>
  )
}

function Bar({ color, percent, active }: { color: string, percent: number, active?: boolean }) {
  return (
    <div className="bg-ruanta-bg rounded-[12px] w-full h-full relative overflow-hidden flex items-end">
       <motion.div 
         initial={{ height: 0 }}
         whileInView={{ height: `${percent + 20}%` }}
         transition={{ duration: 1, ease: "easeOut" }}
         className={cn("w-full rounded-t-[8px]", color)}
       />
    </div>
  )
}

function Stat({ label, icon }: { label: string, icon: string }) {
  return (
    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
      <span>{icon}</span> {label}
    </div>
  )
}
