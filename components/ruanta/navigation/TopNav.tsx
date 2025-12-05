'use client'

import { Search, Bell, Menu } from 'lucide-react'
import { motion } from 'framer-motion'

export function TopNav() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="
        relative z-40 w-full
        bg-ruanta-surface-primary backdrop-blur-[18px]
        rounded-ruanta-lg
        border border-ruanta-border
        shadow-ruanta-md
        px-6 py-3
        flex items-center justify-between
        mb-8
      "
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-ruanta-accent-green flex items-center justify-center text-ruanta-accent-charcoal font-bold shadow-inner">
          <span className="text-xl">+</span>
        </div>
        <span className="text-xl font-bold text-ruanta-text-primary tracking-tight">Ruanta</span>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center flex-1 max-w-2xl mx-auto">
        <div className="
          relative w-full group
          bg-ruanta-surface-secondary/50 hover:bg-ruanta-surface-secondary
          rounded-ruanta-md
          transition-all duration-300
          h-12 flex items-center px-4
        ">
          <Search className="w-4 h-4 text-ruanta-text-secondary/60 mr-3" />
          <input 
            type="text" 
            placeholder="Search" 
            className="
              w-full bg-transparent border-none outline-none
              text-sm font-medium text-ruanta-text-primary placeholder:text-ruanta-text-secondary/60
            "
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-2 h-2 bg-red-500 rounded-full absolute top-0 right-0 border-2 border-white"></div>
          <Bell className="w-5 h-5 text-ruanta-text-secondary" />
        </div>
        
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
        
        <button className="md:hidden p-2 text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden md:block w-6 h-0.5 bg-gray-300 rounded-full" />
      </div>
    </motion.header>
  )
}
