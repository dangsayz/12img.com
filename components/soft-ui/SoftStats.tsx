'use client'

import { motion } from 'framer-motion'
import { MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function SoftStats() {
  return (
    <div className="
      w-full h-full
      bg-white rounded-[32px]
      shadow-neumorphic-lg
      p-8
      flex flex-col gap-8
    ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Statistic</h2>
        <button className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100 pb-px">
        {['All', 'Research', 'Design', 'Engineering'].map((tab, i) => (
          <button
            key={tab}
            className={cn(
              "text-sm font-medium pb-3 relative transition-colors",
              i === 2 ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab}
            {i === 2 && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 w-full h-[2px] bg-black rounded-full" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Team Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Team</h3>
          <button className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        <div className="bg-soft-surface rounded-[20px] p-4 flex items-center justify-between">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-200">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="Member" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
              +7
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-soft-lime/20 text-olive-700 text-xs font-bold">
            ↗ 87%
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Storage</h3>
          <span className="text-xs text-gray-400 font-medium">GB used</span>
        </div>

        <div className="grid grid-cols-4 gap-3 h-32">
          <ProgressBar color="bg-soft-lime" percent={42} label="Photos" />
          <ProgressBar color="bg-yellow-200" percent={12} label="Videos" />
          <ProgressBar color="bg-purple-200" percent={28} label="Raw" />
          <ProgressBar color="bg-gray-800" percent={65} label="Other" dark />
        </div>
      </div>

      {/* Upgrade Card */}
      <div className="mt-auto relative overflow-hidden rounded-[24px] bg-soft-surface p-6">
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Upgrade to <span className="text-orange-500">Pro</span>
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Get 1 month free and unlock all Pro features to manage your team more efficient.
          </p>
          <button className="
            w-full py-3 rounded-xl 
            bg-gray-900 text-white font-medium text-sm
            shadow-lg hover:shadow-xl hover:scale-[1.02]
            transition-all duration-300
          ">
            Upgrade now!
          </button>
        </div>
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  )
}

function ProgressBar({ color, percent, label, dark }: { color: string, percent: number, label: string, dark?: boolean }) {
  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex-1 bg-gray-100 rounded-[12px] overflow-hidden relative flex items-end">
        <motion.div 
          initial={{ height: 0 }}
          whileInView={{ height: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("w-full rounded-t-[8px]", color)}
        />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold text-gray-400 mb-0.5">● {percent}%</p>
      </div>
    </div>
  )
}
