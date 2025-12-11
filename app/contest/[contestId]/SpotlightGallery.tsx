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
      {/* Awwwards-style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry, index) => (
          <SpotlightCard
            key={entry.id}
            entry={entry}
            canVote={canVote}
            showVoteCount={showVoteCounts}
            onClick={() => openViewer(index)}
            priority={index < 6}
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
  canVote,
  showVoteCount,
  onClick,
  priority,
}: {
  entry: ContestEntryWithVoteStatus
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
      {/* Image Container */}
      <div 
        className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100 cursor-pointer mb-4"
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
          } group-hover:scale-105`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setIsLoaded(true)}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Vote Button - Bottom Right */}
        <div 
          className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
        
        {/* Award Badge (if top voted) */}
        {entry.voteCount >= 5 && (
          <div className="absolute top-4 left-4 px-2 py-1 bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider rounded">
            Top Rated
          </div>
        )}
      </div>
      
      {/* Entry Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {/* Photographer Avatar */}
          {entry.photographer.avatarUrl ? (
            <Image
              src={entry.photographer.avatarUrl}
              alt={entry.photographer.displayName}
              width={32}
              height={32}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
              <span className="text-stone-500 text-xs font-medium">
                {entry.photographer.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Name & Link */}
          <div className="min-w-0">
            {entry.photographer.slug ? (
              <Link
                href={`/profile/${entry.photographer.slug}`}
                className="text-stone-900 text-sm font-medium hover:text-stone-600 transition-colors truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {entry.photographer.displayName}
              </Link>
            ) : (
              <span className="text-stone-900 text-sm font-medium truncate block">
                {entry.photographer.displayName}
              </span>
            )}
            {entry.caption && (
              <p className="text-stone-400 text-xs truncate">{entry.caption}</p>
            )}
          </div>
        </div>
        
        {/* Vote Count */}
        {showVoteCount && (
          <div className="flex items-center gap-1.5 text-stone-400 flex-shrink-0">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-sm">{entry.voteCount}</span>
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
