'use client'

import { cn } from '@/lib/utils/cn'

interface PillTagProps {
  label: string
  variant?: 'default' | 'ui' | 'ux' | 'testing'
  className?: string
}

export function PillTag({ label, variant = 'default', className }: PillTagProps) {
  const variants = {
    default: "bg-gray-100 text-gray-600",
    ui: "bg-ruanta-accent-lavender/30 text-indigo-600",
    ux: "bg-pink-100 text-pink-600",
    testing: "bg-gray-100 text-gray-600",
  }

  return (
    <span className={cn(
      "px-3 py-1 rounded-ruanta-pill text-[11px] font-bold tracking-wide uppercase",
      variants[variant],
      className
    )}>
      {label}
    </span>
  )
}
