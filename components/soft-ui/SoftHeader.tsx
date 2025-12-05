'use client'

import { Search, Bell, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export function SoftHeader() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="
        relative z-40 w-full
        bg-white/80 backdrop-blur-[12px]
        rounded-[24px]
        border border-white/40
        shadow-neumorphic-sm
        px-6 py-4
        flex items-center justify-between
        mb-8
      "
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-soft-lime flex items-center justify-center text-soft-accent font-bold shadow-inner-light">
          12
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">12img</span>
      </div>

      {/* Search Pill */}
      <div className="hidden md:flex items-center flex-1 max-w-lg mx-12">
        <div className="
          relative w-full group
          bg-soft-bg/50 hover:bg-soft-bg/80
          rounded-[16px]
          transition-all duration-300
          shadow-inner
        ">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search galleries..." 
            className="
              w-full bg-transparent border-none outline-none
              py-3 pl-12 pr-4
              text-sm font-medium text-gray-700 placeholder:text-gray-400
            "
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="
          p-2.5 rounded-full 
          bg-white border border-white 
          shadow-neumorphic-sm hover:shadow-neumorphic-md hover:-translate-y-0.5
          transition-all duration-300
          text-gray-500 hover:text-gray-900
        ">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
        
        <button className="md:hidden p-2 text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </motion.header>
  )
}
