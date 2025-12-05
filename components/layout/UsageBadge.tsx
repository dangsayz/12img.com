'use client'

import Link from 'next/link'
import { getPlan, type PlanId } from '@/lib/config/pricing'
import { cn } from '@/lib/utils/cn'

interface UsageBadgeProps {
  plan: PlanId
  galleryCount: number
  imageCount: number
}

export function UsageBadge({ plan, galleryCount, imageCount }: UsageBadgeProps) {
  const planData = getPlan(plan)
  
  if (!planData) return null
  
  const galleryLimit = planData.limits.galleries
  
  // Calculate usage percentages
  const galleryPercent = galleryLimit === 'unlimited' 
    ? 0 
    : Math.min((galleryCount / galleryLimit) * 100, 100)
  
  const isNearLimit = galleryPercent >= 80
  const isAtLimit = galleryPercent >= 100
  
  // Format the display
  const galleryDisplay = galleryLimit === 'unlimited' 
    ? `${galleryCount}` 
    : `${galleryCount}/${galleryLimit}`

  return (
    <Link 
      href="/settings" 
      className="hidden md:flex items-center gap-4 group"
    >
      {/* Container with subtle glass effect */}
      <div className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-gray-200/80 transition-all duration-300">
        {/* Plan Pill */}
        <span className={cn(
          "text-[11px] font-medium tracking-wide px-3 py-1.5 rounded-full transition-colors",
          plan === 'free' && "bg-gray-100/80 text-gray-500",
          plan === 'basic' && "bg-amber-50 text-amber-600",
          plan === 'pro' && "bg-emerald-50 text-emerald-600",
          plan === 'studio' && "bg-violet-50 text-violet-600",
        )}>
          {planData.name}
        </span>
        
        {/* Progress Bar - refined */}
        <div className="flex items-center gap-2.5">
          <div className="w-16 h-[5px] bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                isAtLimit && "bg-gradient-to-r from-rose-400 to-rose-500",
                isNearLimit && !isAtLimit && "bg-gradient-to-r from-amber-400 to-amber-500",
                !isNearLimit && !isAtLimit && "bg-gradient-to-r from-emerald-400 to-emerald-500"
              )}
              style={{ width: `${Math.max(galleryPercent, 8)}%` }}
            />
          </div>
          
          {/* Counter */}
          <span className={cn(
            "text-[12px] font-semibold tabular-nums tracking-tight transition-colors",
            isAtLimit && "text-rose-500",
            isNearLimit && !isAtLimit && "text-amber-500",
            !isNearLimit && !isAtLimit && "text-gray-400"
          )}>
            {galleryDisplay}
          </span>
        </div>
        
        {/* Upgrade Link */}
        {plan !== 'studio' && (
          <span className="text-[11px] font-medium text-gray-300 group-hover:text-gray-500 transition-colors duration-200 ml-0.5">
            Upgrade
          </span>
        )}
      </div>
    </Link>
  )
}
