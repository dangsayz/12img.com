'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  noPadding?: boolean
}

export function GlassCard({ 
  children, 
  className, 
  hoverEffect = false,
  noPadding = false,
  ...props 
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "bg-ruanta-surface-primary backdrop-blur-[18px]",
        "rounded-ruanta-lg border border-ruanta-border",
        "shadow-ruanta-md",
        noPadding ? "p-0" : "p-7", // 28px internal padding
        className
      )}
      whileHover={hoverEffect ? { y: -4, scale: 1.015, boxShadow: "0px 10px 36px rgba(0,0,0,0.09)" } : undefined}
      transition={{ duration: 0.3, ease: [0.23, 0.62, 0.35, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
