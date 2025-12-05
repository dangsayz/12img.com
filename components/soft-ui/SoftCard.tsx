'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface SoftCardProps {
  title: string
  subtitle?: string
  tag?: string
  tagColor?: 'lime' | 'purple' | 'blue' | 'orange'
  image?: string
  className?: string
  children?: React.ReactNode
  delay?: number
}

export function SoftCard({ 
  title, 
  subtitle, 
  tag, 
  tagColor = 'blue', 
  image,
  className,
  children,
  delay = 0
}: SoftCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{
        y: -6,
        scale: 1.01,
        boxShadow: "0 32px 64px -12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)"
      }}
      className={cn(
        "group relative flex flex-col",
        "bg-white rounded-[24px]",
        "shadow-neumorphic-md",
        "border border-white/60",
        "p-5",
        "cursor-pointer transition-colors",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {tag && (
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              tagColor === 'lime' && "bg-soft-lime/20 text-olive-700",
              tagColor === 'purple' && "bg-purple-100 text-purple-700",
              tagColor === 'blue' && "bg-blue-100 text-blue-700",
              tagColor === 'orange' && "bg-orange-100 text-orange-700",
            )}>
              {tag}
            </span>
          )}
        </div>
        <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all">
          •••
        </button>
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {subtitle}
        </p>
      )}

      {/* Media Preview (if exists) */}
      {image && (
        <div className="relative w-full aspect-[4/3] rounded-[16px] overflow-hidden mb-4 shadow-inner-light ring-1 ring-black/5 group-hover:ring-black/10 transition-all">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          {/* Glass Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}

      {/* Footer / Children */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        {children}
      </div>
    </motion.div>
  )
}
