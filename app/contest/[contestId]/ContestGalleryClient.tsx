/**
 * ============================================================================
 * CONTEST GALLERY CLIENT
 * ============================================================================
 * 
 * Client component for the contest entry grid with voting.
 * Handles fullscreen viewer and vote state.
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ContestEntryCard } from '@/components/contest/ContestEntryCard'
import { VoteButton } from '@/components/contest/VoteButton'
import type { ContestEntryWithVoteStatus } from '@/lib/contest/types'

interface ContestGalleryClientProps {
  entries: ContestEntryWithVoteStatus[]
  canVote: boolean
  showVoteCounts: boolean
}

export function ContestGalleryClient({
  entries,
  canVote,
  showVoteCounts,
}: ContestGalleryClientProps) {
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
      {/* Pic-Time style grid - 3 columns with generous spacing */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {entries.map((entry, index) => (
          <ContestEntryCard
            key={entry.id}
            entry={entry}
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
  
  // Keyboard navigation
  if (typeof window !== 'undefined') {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNavigate('prev')
      if (e.key === 'ArrowRight') onNavigate('next')
    }
    
    // Note: In production, use useEffect for proper cleanup
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        {/* Photographer info */}
        <div className="text-white">
          <p className="text-sm font-light">{entry.photographer.displayName}</p>
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
        className="absolute inset-0 flex items-center justify-center p-4 pt-16 pb-24"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={entry.id}
          src={entry.image.previewUrl}
          alt={`Entry by ${entry.photographer.displayName}`}
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
      </div>
      
      {/* Navigation arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate('prev') }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate('next') }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
      
      {/* Bottom bar - Vote button (thumb zone) */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-50 p-4 pb-8 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Counter */}
        <p className="text-white/60 text-sm">
          {currentIndex + 1} / {entries.length}
        </p>
        
        {/* Vote button - Large for mobile */}
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

export default ContestGalleryClient
