'use client'

/**
 * ============================================================================
 * SCORE DISPLAY COMPONENT
 * ============================================================================
 * 
 * Awwwards-style score visualization for photography entries.
 * Shows overall score with animated breakdown by criteria.
 * ============================================================================
 */

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  EntryScores,
  CRITERIA_COLORS,
  formatScore,
  getScoreColor,
  getScoreLabel,
} from '@/lib/spotlight/evaluation-types'

interface ScoreDisplayProps {
  scores: EntryScores | null
  showBreakdown?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

export function ScoreDisplay({
  scores,
  showBreakdown = true,
  size = 'md',
  animated = true,
  className,
}: ScoreDisplayProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setMounted(true), 100)
      return () => clearTimeout(timer)
    } else {
      setMounted(true)
    }
  }, [animated])
  
  if (!scores) {
    return (
      <div className={cn('text-center', className)}>
        <p className="text-stone-400 text-sm">Not yet evaluated</p>
      </div>
    )
  }
  
  const overallScore = scores.overallScore
  const juryScore = scores.juryScore
  
  const breakdown = [
    { name: 'Composition', slug: 'composition', score: scores.compositionScore, weight: 25 },
    { name: 'Lighting', slug: 'lighting', score: scores.lightingScore, weight: 25 },
    { name: 'Technical', slug: 'technical', score: scores.technicalScore, weight: 20 },
    { name: 'Creativity', slug: 'creativity', score: scores.creativityScore, weight: 15 },
    { name: 'Impact', slug: 'impact', score: scores.impactScore, weight: 15 },
  ].filter(b => b.score !== null)
  
  const sizeClasses = {
    sm: {
      score: 'text-3xl',
      label: 'text-xs',
      bar: 'h-1',
    },
    md: {
      score: 'text-5xl',
      label: 'text-sm',
      bar: 'h-1.5',
    },
    lg: {
      score: 'text-7xl',
      label: 'text-base',
      bar: 'h-2',
    },
  }
  
  const s = sizeClasses[size]
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Score */}
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-stone-300 text-2xl">→</span>
          <span className={cn(s.score, 'font-bold text-stone-900 tabular-nums', getScoreColor(overallScore))}>
            {formatScore(overallScore)}
          </span>
          <span className="text-stone-400 text-lg">/ 10</span>
        </div>
        <p className={cn(s.label, 'text-stone-500 mt-1')}>
          {getScoreLabel(overallScore)}
        </p>
      </div>
      
      {/* Score Type Indicator */}
      {juryScore !== null && (
        <div className="flex justify-center gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Jury: {formatScore(juryScore)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Community: {formatScore(scores.communityScore)}</span>
          </div>
        </div>
      )}
      
      {/* Breakdown */}
      {showBreakdown && breakdown.length > 0 && (
        <div className="space-y-3">
          {breakdown.map((criteria, index) => (
            <div key={criteria.slug} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">{criteria.name}</span>
                <span className={cn('font-medium', getScoreColor(criteria.score))}>
                  {formatScore(criteria.score)}
                </span>
              </div>
              <div className={cn('w-full bg-stone-100 rounded-full overflow-hidden', s.bar)}>
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000 ease-out',
                    mounted ? '' : 'w-0'
                  )}
                  style={{
                    width: mounted ? `${((criteria.score || 0) / 10) * 100}%` : '0%',
                    backgroundColor: CRITERIA_COLORS[criteria.slug],
                    transitionDelay: animated ? `${index * 150}ms` : '0ms',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Jury Stats */}
      {scores.juryCount > 0 && (
        <div className="pt-3 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-400">
            Evaluated by {scores.juryCount} jury {scores.juryCount === 1 ? 'member' : 'members'}
            {scores.scoresExcluded > 0 && (
              <span className="text-stone-300">
                {' '}({scores.scoresExcluded} outliers excluded)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

// Compact inline score display
interface InlineScoreProps {
  score: number | null
  label?: string
  className?: string
}

export function InlineScore({ score, label, className }: InlineScoreProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className={cn('font-bold tabular-nums', getScoreColor(score))}>
        {formatScore(score)}
      </span>
      {label && <span className="text-stone-400 text-xs">/ 10</span>}
    </div>
  )
}

// Score badge for cards
interface ScoreBadgeProps {
  score: number | null
  className?: string
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  if (score === null) return null
  
  let bgColor = 'bg-stone-100'
  let textColor = 'text-stone-500'
  
  if (score >= 8) {
    bgColor = 'bg-emerald-50'
    textColor = 'text-emerald-600'
  } else if (score >= 7) {
    bgColor = 'bg-green-50'
    textColor = 'text-green-600'
  } else if (score >= 6) {
    bgColor = 'bg-amber-50'
    textColor = 'text-amber-600'
  } else if (score >= 5) {
    bgColor = 'bg-orange-50'
    textColor = 'text-orange-600'
  }
  
  return (
    <div className={cn(
      'px-2 py-1 rounded-md text-xs font-bold tabular-nums',
      bgColor,
      textColor,
      className
    )}>
      {formatScore(score)}
    </div>
  )
}
