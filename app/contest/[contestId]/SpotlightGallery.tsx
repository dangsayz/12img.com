/**
 * ============================================================================
 * SPOTLIGHT GALLERY - Awwwards-Style Entry Grid
 * ============================================================================
 * 
 * Displays contest entries in an Awwwards-inspired grid layout.
 * Each card shows the photo, photographer info, and vote count.
 * 
 * ============================================================================
 */

'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { VoteButton } from '@/components/contest/VoteButton'
import type { ContestEntryWithVoteStatus } from '@/lib/contest/types'

interface SpotlightGalleryProps {
  entries: ContestEntryWithVoteStatus[]
  canVote: boolean
  showVoteCounts: boolean
}

export function SpotlightGallery({
  entries,
  canVote,
  showVoteCounts,
}: SpotlightGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  
  const openViewer = useCallback((index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }, [])
  
  const closeViewer = useCallback(() => {
    setViewerOpen(false)
  }, [])
  
  const navigateViewer = useCallback((direction: 'prev' | 'next') => {
    setViewerIndex(prev => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : entries.length - 1
      }
      return prev < entries.length - 1 ? prev + 1 : 0
    })
  }, [entries.length])

  return (
    <>
      {/* Large 2-Column Grid for Proper Critique */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {entries.map((entry, index) => (
          <SpotlightCard
            key={entry.id}
            entry={entry}
            index={index}
            canVote={canVote}
            showVoteCount={showVoteCounts}
            onClick={() => openViewer(index)}
            priority={index < 4}
          />
        ))}
      </div>
      
      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {viewerOpen && entries[viewerIndex] && (
          <FullscreenViewer
            entries={entries}
            currentIndex={viewerIndex}
            onClose={closeViewer}
            onNavigate={navigateViewer}
            canVote={canVote}
            showVoteCounts={showVoteCounts}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SPOTLIGHT CARD - Individual Entry
// ─────────────────────────────────────────────────────────────────────────────
function SpotlightCard({
  entry,
  index,
  canVote,
  showVoteCount,
  onClick,
  priority,
}: {
  entry: ContestEntryWithVoteStatus
  index: number
  canVote: boolean
  showVoteCount: boolean
  onClick: () => void
  priority: boolean
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      {/* Tall Vogue-Style Image Container */}
      <div 
        className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-100 cursor-pointer mb-4"
        onClick={onClick}
      >
        {/* Skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-100 animate-pulse" />
        )}
        
        {/* Photo */}
        <Image
          src={entry.image.thumbnailUrl}
          alt={`Shot by ${entry.photographer.displayName}`}
          fill
          className={`object-cover transition-all duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-[1.02]`}
          sizes="(max-width: 768px) 100vw, 50vw"
          onLoad={() => setIsLoaded(true)}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
        />
        
        {/* Rank Badge */}
        {index < 3 && (
          <div className="absolute top-4 left-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
              ${index === 0 ? 'bg-amber-400 text-amber-900' : 'bg-white/90 text-stone-700'}`}>
              #{index + 1}
            </div>
          </div>
        )}
        
        {/* Vote Button - Always Visible */}
        <div 
          className="absolute bottom-4 right-4 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <VoteButton
            entryId={entry.id}
            initialVoteCount={entry.voteCount}
            hasVoted={entry.hasVoted}
            canVote={canVote}
            showCount={showVoteCount}
            size="lg"
          />
        </div>
      </div>
      
      {/* Entry Info */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 min-w-0">
          {/* Photographer Avatar */}
          {entry.photographer.avatarUrl ? (
            <Image
              src={entry.photographer.avatarUrl}
              alt={entry.photographer.displayName}
              width={40}
              height={40}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
              <span className="text-stone-600 font-medium">
                {entry.photographer.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Name & Caption */}
          <div className="min-w-0">
            {entry.photographer.slug ? (
              <Link
                href={`/profile/${entry.photographer.slug}`}
                className="text-stone-900 font-medium hover:text-stone-600 transition-colors truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {entry.photographer.displayName}
              </Link>
            ) : (
              <span className="text-stone-900 font-medium truncate block">
                {entry.photographer.displayName}
              </span>
            )}
            {entry.caption && (
              <p className="text-stone-500 text-sm truncate">{entry.caption}</p>
            )}
          </div>
        </div>
        
        {/* Vote Count Display */}
        {showVoteCount && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full flex-shrink-0">
            <Heart className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium text-stone-700">{entry.voteCount}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FULLSCREEN VIEWER
// ─────────────────────────────────────────────────────────────────────────────
function FullscreenViewer({
  entries,
  currentIndex,
  onClose,
  onNavigate,
  canVote,
  showVoteCounts,
}: {
  entries: ContestEntryWithVoteStatus[]
  currentIndex: number
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  canVote: boolean
  showVoteCounts: boolean
}) {
  const entry = entries[currentIndex]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
        {/* Photographer info */}
        <div className="flex items-center gap-3">
          {entry.photographer.avatarUrl ? (
            <Image
              src={entry.photographer.avatarUrl}
              alt={entry.photographer.displayName}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white/60 text-sm font-medium">
                {entry.photographer.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-white font-medium">{entry.photographer.displayName}</p>
            {entry.caption && (
              <p className="text-white/50 text-sm">{entry.caption}</p>
            )}
          </div>
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      
      {/* Image */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-6 pt-24 pb-32"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={entry.id}
          src={entry.image.previewUrl}
          alt={`Shot by ${entry.photographer.displayName}`}
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
      </div>
      
      {/* Navigation arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate('prev') }}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate('next') }}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
      
      {/* Bottom bar */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-50 p-6 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Counter */}
        <p className="text-white/60 text-sm">
          {currentIndex + 1} / {entries.length}
        </p>
        
        {/* Vote button */}
        <VoteButton
          entryId={entry.id}
          initialVoteCount={entry.voteCount}
          hasVoted={entry.hasVoted}
          canVote={canVote}
          showCount={showVoteCounts}
          size="lg"
        />
      </div>
    </motion.div>
  )
}

export default SpotlightGallery
