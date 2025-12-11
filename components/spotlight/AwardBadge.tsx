'use client'

/**
 * ============================================================================
 * AWARD BADGE COMPONENT
 * ============================================================================
 * 
 * Displays award badges for Spotlight entries (SOTD, Featured, etc.)
 * Uses Lucide icons and light theme styling.
 * ============================================================================
 */

import { cn } from '@/lib/utils/cn'
import { Sparkles, Trophy, Star, Crown, Gem } from 'lucide-react'
import {
  AwardType,
  SpotlightAward,
  AWARD_BADGES,
} from '@/lib/spotlight/evaluation-types'

const ICONS = {
  Sparkles,
  Trophy,
  Star,
  Crown,
  Gem,
}

interface AwardBadgeProps {
  award: AwardType | SpotlightAward
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function AwardBadge({
  award,
  size = 'md',
  showLabel = true,
  className,
}: AwardBadgeProps) {
  const awardType = typeof award === 'string' ? award : award.awardType
  const badge = AWARD_BADGES[awardType]
  
  if (!badge) return null
  
  const Icon = ICONS[badge.iconName]
  
  const sizeClasses = {
    sm: { container: 'text-xs px-2.5 py-1 gap-1.5', icon: 'w-3 h-3' },
    md: { container: 'text-sm px-3 py-1.5 gap-2', icon: 'w-4 h-4' },
    lg: { container: 'text-base px-4 py-2 gap-2', icon: 'w-5 h-5' },
  }
  
  const s = sizeClasses[size]
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        badge.bgColor,
        badge.borderColor,
        s.container,
        className
      )}
      style={{ color: badge.color }}
    >
      <Icon className={s.icon} />
      {showLabel && <span>{badge.label}</span>}
    </div>
  )
}

// Multiple awards display
interface AwardStackProps {
  awards: SpotlightAward[]
  maxShow?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AwardStack({
  awards,
  maxShow = 3,
  size = 'sm',
  className,
}: AwardStackProps) {
  if (!awards || awards.length === 0) return null
  
  // Sort by importance (SOTY > SOTM > SOTD > Featured)
  const order: AwardType[] = ['shot_of_the_year', 'shot_of_the_month', 'photographer_of_week', 'shot_of_the_day', 'featured']
  const sorted = [...awards].sort((a, b) => 
    order.indexOf(a.awardType) - order.indexOf(b.awardType)
  )
  
  const visible = sorted.slice(0, maxShow)
  const remaining = sorted.length - maxShow
  
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((award) => (
        <AwardBadge
          key={award.id}
          award={award}
          size={size}
          showLabel={size !== 'sm'}
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-stone-400 px-2 py-0.5">
          +{remaining} more
        </span>
      )}
    </div>
  )
}

// Mini award indicator (icon only)
interface AwardIndicatorProps {
  awards: SpotlightAward[]
  className?: string
}

export function AwardIndicator({ awards, className }: AwardIndicatorProps) {
  if (!awards || awards.length === 0) return null
  
  // Get the highest tier award
  const order: AwardType[] = ['shot_of_the_year', 'shot_of_the_month', 'photographer_of_week', 'shot_of_the_day', 'featured']
  const sorted = [...awards].sort((a, b) => 
    order.indexOf(a.awardType) - order.indexOf(b.awardType)
  )
  
  const topAward = sorted[0]
  const badge = AWARD_BADGES[topAward.awardType]
  const Icon = ICONS[badge.iconName]
  
  return (
    <div
      className={cn(
        'absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm',
        badge.bgColor,
        badge.borderColor,
        className
      )}
      title={badge.label}
    >
      <Icon className="w-4 h-4" style={{ color: badge.color }} />
    </div>
  )
}

// Award card for award listings
interface AwardCardProps {
  award: SpotlightAward
  showDate?: boolean
  className?: string
}

export function AwardCard({ award, showDate = true, className }: AwardCardProps) {
  const badge = AWARD_BADGES[award.awardType]
  const Icon = ICONS[badge.iconName]
  
  return (
    <div
      className={cn(
        'p-4 rounded-xl border bg-white',
        badge.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center border',
            badge.bgColor,
            badge.borderColor
          )}
        >
          <Icon className="w-6 h-6" style={{ color: badge.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-stone-900">{badge.label}</h3>
          {award.citation && (
            <p className="text-sm text-stone-500 mt-1">{award.citation}</p>
          )}
          {showDate && (
            <p className="text-xs text-stone-400 mt-2">
              {new Date(award.awardedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        {award.finalScore && (
          <div className="text-right">
            <p className="text-2xl font-bold text-stone-900">{award.finalScore.toFixed(2)}</p>
            <p className="text-xs text-stone-400">/ 10</p>
          </div>
        )}
      </div>
    </div>
  )
}
