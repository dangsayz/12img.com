'use client'

import Link from 'next/link'
import { getPlan, normalizePlanId, getStorageLimitBytes, type LegacyPlanId } from '@/lib/config/pricing'
import { cn } from '@/lib/utils/cn'
import { Crown, Sparkles, Star, Zap, User } from 'lucide-react'

interface UsageBadgeProps {
  plan: LegacyPlanId | string
  galleryCount: number
  imageCount: number
  storageUsed?: number // bytes
}

// Plan badge icons
const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <User className="w-3 h-3" />,
  essential: <Zap className="w-3 h-3" />,
  pro: <Star className="w-3 h-3" />,
  studio: <Sparkles className="w-3 h-3" />,
  elite: <Crown className="w-3 h-3" />,
}

// Plan badge colors
const PLAN_STYLES: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600 border-gray-200',
  essential: 'bg-amber-50 text-amber-700 border-amber-200',
  pro: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  studio: 'bg-violet-50 text-violet-700 border-violet-200',
  elite: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300',
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`
}

function formatStorageLimit(gb: number | 'unlimited'): string {
  if (gb === 'unlimited') return '∞'
  if (gb >= 1000) return `${gb / 1000}TB`
  return `${gb}GB`
}

export function UsageBadge({ plan, galleryCount, imageCount, storageUsed = 0 }: UsageBadgeProps) {
  const normalizedPlan = normalizePlanId(plan)
  const planData = getPlan(normalizedPlan)
  
  if (!planData) return null
  
  const storageLimit = planData.limits.storage_gb
  const storageLimitBytes = getStorageLimitBytes(normalizedPlan)
  
  // Calculate storage percentage
  const storagePercent = storageLimitBytes === Infinity 
    ? 0 
    : Math.min((storageUsed / storageLimitBytes) * 100, 100)
  
  const isNearStorageLimit = storagePercent >= 80
  const isAtStorageLimit = storagePercent >= 100

  // Format storage display
  const storageDisplay = storageLimit === 'unlimited'
    ? formatBytes(storageUsed)
    : `${formatBytes(storageUsed)} / ${formatStorageLimit(storageLimit)}`

  return (
    <Link 
      href="/settings" 
      className="hidden md:flex items-center gap-2 group"
    >
      {/* Plan Badge */}
      <span className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all",
        PLAN_STYLES[normalizedPlan]
      )}>
        {PLAN_ICONS[normalizedPlan]}
        {planData.name}
      </span>
      
      {/* Storage Progress */}
      <div className="flex items-center gap-2">
        <div className="w-14 h-[5px] bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isAtStorageLimit && "bg-gradient-to-r from-rose-400 to-rose-500",
              isNearStorageLimit && !isAtStorageLimit && "bg-gradient-to-r from-amber-400 to-amber-500",
              !isNearStorageLimit && !isAtStorageLimit && "bg-gradient-to-r from-emerald-400 to-emerald-500"
            )}
            style={{ width: `${Math.max(storagePercent, 5)}%` }}
          />
        </div>
        
        {/* Storage Counter */}
        <span className={cn(
          "text-[10px] font-medium tabular-nums whitespace-nowrap transition-colors",
          isAtStorageLimit && "text-rose-500",
          isNearStorageLimit && !isAtStorageLimit && "text-amber-600",
          !isNearStorageLimit && !isAtStorageLimit && "text-gray-400"
        )}>
          {storageDisplay}
        </span>
      </div>
      
      {/* Upgrade hint for non-elite */}
      {normalizedPlan !== 'elite' && (
        <span className="text-[10px] font-medium text-gray-300 group-hover:text-emerald-500 transition-colors">
          Upgrade
        </span>
      )}
    </Link>
  )
}
