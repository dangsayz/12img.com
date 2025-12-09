/**
 * ============================================================================
 * VOTE BUTTON - Mobile-Optimized
 * ============================================================================
 * 
 * A large, thumb-friendly vote button with optimistic updates.
 * 
 * MOBILE UX:
 * - 48x48px minimum touch target
 * - Haptic feedback (if supported)
 * - Optimistic UI update
 * - Clear visual feedback
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { castVote, removeVote } from '@/server/actions/contest.actions'

interface VoteButtonProps {
  entryId: string
  initialVoteCount: number
  hasVoted: boolean
  canVote: boolean
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onVoteChange?: (hasVoted: boolean, newCount: number) => void
}

export function VoteButton({
  entryId,
  initialVoteCount,
  hasVoted: initialHasVoted,
  canVote,
  showCount = false,
  size = 'md',
  className,
  onVoteChange,
}: VoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [isPending, startTransition] = useTransition()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isPending) return
    
    // Haptic feedback on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    // Optimistic update
    const newHasVoted = !hasVoted
    const newCount = newHasVoted ? voteCount + 1 : voteCount - 1
    
    setHasVoted(newHasVoted)
    setVoteCount(newCount)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    
    // Server action
    startTransition(async () => {
      const result = newHasVoted 
        ? await castVote(entryId)
        : await removeVote(entryId)
      
      if (!result.success) {
        // Revert on error
        setHasVoted(!newHasVoted)
        setVoteCount(voteCount)
        
        // Show error toast (could be enhanced)
        console.error('[Vote]', result.error)
      } else {
        // Update with server values
        if (result.newVoteCount !== undefined) {
          setVoteCount(result.newVoteCount)
        }
        onVoteChange?.(newHasVoted, result.newVoteCount || newCount)
      }
    })
  }

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const isDisabled = !canVote && !hasVoted

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled || isPending}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-all duration-200',
        sizeClasses[size],
        hasVoted
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
          : 'bg-white/90 backdrop-blur-sm text-stone-600 shadow-md hover:bg-white',
        isAnimating && 'scale-110',
        isDisabled && 'opacity-50 cursor-not-allowed',
        isPending && 'opacity-70',
        className
      )}
      aria-label={hasVoted ? 'Remove vote' : 'Vote for this photo'}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-transform duration-200',
          hasVoted && 'fill-current',
          isAnimating && 'scale-125'
        )}
      />
      
      {/* Vote count badge */}
      {showCount && voteCount > 0 && (
        <span className={cn(
          'absolute -bottom-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center',
          'text-[10px] font-medium rounded-full px-1',
          hasVoted
            ? 'bg-white text-rose-500'
            : 'bg-stone-900 text-white'
        )}>
          {voteCount}
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VOTE BUTTON WITH LABEL (for larger displays)
// ─────────────────────────────────────────────────────────────────────────────
export function VoteButtonWithLabel({
  entryId,
  initialVoteCount,
  hasVoted: initialHasVoted,
  canVote,
  className,
  onVoteChange,
}: Omit<VoteButtonProps, 'size' | 'showCount'>) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [isPending, startTransition] = useTransition()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isPending) return
    
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    const newHasVoted = !hasVoted
    const newCount = newHasVoted ? voteCount + 1 : voteCount - 1
    
    setHasVoted(newHasVoted)
    setVoteCount(newCount)
    
    startTransition(async () => {
      const result = newHasVoted 
        ? await castVote(entryId)
        : await removeVote(entryId)
      
      if (!result.success) {
        setHasVoted(!newHasVoted)
        setVoteCount(voteCount)
      } else {
        if (result.newVoteCount !== undefined) {
          setVoteCount(result.newVoteCount)
        }
        onVoteChange?.(newHasVoted, result.newVoteCount || newCount)
      }
    })
  }

  const isDisabled = !canVote && !hasVoted

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled || isPending}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 min-h-[44px]',
        hasVoted
          ? 'bg-rose-500 text-white'
          : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300',
        isDisabled && 'opacity-50 cursor-not-allowed',
        isPending && 'opacity-70',
        className
      )}
    >
      <Heart
        className={cn(
          'w-4 h-4 transition-transform',
          hasVoted && 'fill-current'
        )}
      />
      <span className="text-sm font-medium">
        {hasVoted ? 'Voted' : 'Vote'}
      </span>
      {voteCount > 0 && (
        <span className={cn(
          'text-sm',
          hasVoted ? 'text-white/80' : 'text-stone-400'
        )}>
          {voteCount}
        </span>
      )}
    </button>
  )
}

export default VoteButton
