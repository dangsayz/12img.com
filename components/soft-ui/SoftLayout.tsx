'use client'

import { motion } from 'framer-motion'

export function SoftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-soft-bg p-4 md:p-8 font-sans text-gray-900 overflow-hidden relative">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/40 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-soft-lime/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
        {children}
      </div>
    </div>
  )
}
