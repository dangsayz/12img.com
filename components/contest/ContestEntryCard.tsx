/**
 * ============================================================================
 * CONTEST ENTRY CARD - Mobile-First
 * ============================================================================
 * 
 * Displays a single contest entry with photo, photographer info, and vote button.
 * 
 * MOBILE UX:
 * - Vote button in thumb zone (bottom-right)
 * - Large touch targets (48px+)
 * - Tap to view fullscreen
 * - Smooth animations
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { VoteButton } from './VoteButton'
import type { ContestEntryWithVoteStatus } from '@/lib/contest/types'

interface ContestEntryCardProps {
  entry: ContestEntryWithVoteStatus
  canVote: boolean
  showVoteCount?: boolean
  onClick?: () => void
  priority?: boolean
}

export function ContestEntryCard({
  entry,
  canVote,
  showVoteCount = false,
  onClick,
  priority = false,
}: ContestEntryCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        {/* Skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
        )}
        
        {/* Photo */}
        <Image
          src={entry.image.thumbnailUrl}
          alt={`Contest entry by ${entry.photographer.displayName}`}
          fill
          className={`object-cover transition-all duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-[1.02]`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onLoad={() => setIsLoaded(true)}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* Vote Button - Bottom Right (thumb zone) */}
        <div 
          className="absolute bottom-3 right-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <VoteButton
            entryId={entry.id}
            initialVoteCount={entry.voteCount}
            hasVoted={entry.hasVoted}
            canVote={canVote}
            showCount={showVoteCount}
            size="md"
          />
        </div>
        
        {/* Photographer info - Bottom Left */}
        <div className="absolute bottom-0 left-0 right-16 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {entry.photographer.slug ? (
            <Link
              href={`/profile/${entry.photographer.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-white text-sm font-light hover:underline"
            >
              {entry.photographer.displayName}
            </Link>
          ) : (
            <span className="text-white text-sm font-light">
              {entry.photographer.displayName}
            </span>
          )}
        </div>
      </div>
      
      {/* Caption (if exists) */}
      {entry.caption && (
        <p className="mt-2 text-xs text-stone-500 line-clamp-2 px-1">
          {entry.caption}
        </p>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT VARIANT (for smaller grids)
// ─────────────────────────────────────────────────────────────────────────────
export function ContestEntryCardCompact({
  entry,
  canVote,
  onClick,
}: Omit<ContestEntryCardProps, 'showVoteCount' | 'priority'>) {
  return (
    <div
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <Image
          src={entry.image.thumbnailUrl}
          alt={`Entry by ${entry.photographer.displayName}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 33vw, 20vw"
        />
        
        {/* Vote indicator */}
        <div 
          className="absolute bottom-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <VoteButton
            entryId={entry.id}
            initialVoteCount={entry.voteCount}
            hasVoted={entry.hasVoted}
            canVote={canVote}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}

export default ContestEntryCard
