/**
 * ============================================================================
 * ADMIN: Contest Entries Content (Client Component)
 * ============================================================================
 * 
 * Interactive grid for managing contest entries.
 * 
 * Design Decisions:
 * - Tab-based filtering (All, Pending, Approved, Rejected)
 * - Large image previews for easy review
 * - Quick action buttons on hover
 * - Optimistic updates for instant feedback
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_IMPLEMENTATION.md
 * ============================================================================
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Check, 
  X, 
  Trophy, 
  Clock, 
  ThumbsUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { approveEntry, selectWinner } from '@/server/actions/contest.actions'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Entry {
  id: string
  imageId: string
  userId: string
  approved: boolean
  rejected: boolean
  rejectionReason: string | null
  voteCount: number
  caption: string | null
  createdAt: string
  image: {
    thumbnailUrl: string
    previewUrl: string
    width: number
    height: number
  }
  photographer: {
    displayName: string
    email: string
  }
}

interface ContestEntriesContentProps {
  contestId: string
  entries: Entry[]
  winnerEntryId: string | null
  contestStatus: string
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ContestEntriesContent({
  contestId,
  entries: initialEntries,
  winnerEntryId,
  contestStatus,
}: ContestEntriesContentProps) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // Filter entries based on active tab
  const filteredEntries = entries.filter(entry => {
    if (activeTab === 'pending') return !entry.approved && !entry.rejected
    if (activeTab === 'approved') return entry.approved
    if (activeTab === 'rejected') return entry.rejected
    return true
  })

  // Count by status
  const counts = {
    all: entries.length,
    pending: entries.filter(e => !e.approved && !e.rejected).length,
    approved: entries.filter(e => e.approved).length,
    rejected: entries.filter(e => e.rejected).length,
  }

  // Handle approve/reject
  async function handleApprove(entryId: string, approve: boolean) {
    setIsLoading(entryId)
    const success = await approveEntry({ entryId, approved: approve })
    if (success) {
      setEntries(prev => prev.map(e => 
        e.id === entryId 
          ? { ...e, approved: approve, rejected: !approve }
          : e
      ))
    }
    setIsLoading(null)
    router.refresh()
  }

  // Handle winner selection
  async function handleSelectWinner(entryId: string) {
    if (!confirm('Select this entry as the winner?')) return
    setIsLoading(entryId)
    const success = await selectWinner(contestId, entryId)
    if (success) {
      router.refresh()
    }
    setIsLoading(null)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E5E5]">
        {(['all', 'pending', 'approved', 'rejected'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab 
                ? "text-[#141414]" 
                : "text-[#525252] hover:text-[#141414]"
            )}
          >
            <span className="capitalize">{tab}</span>
            <span className={cn(
              "ml-1.5 text-xs",
              activeTab === tab ? "text-[#141414]" : "text-[#525252]"
            )}>
              ({counts[tab]})
            </span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />
            )}
          </button>
        ))}
      </div>

      {/* Entries Grid */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-[#E5E5E5] p-8 text-center">
          <p className="text-[#525252]">No {activeTab !== 'all' ? activeTab : ''} entries</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredEntries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              isWinner={entry.id === winnerEntryId}
              canSelectWinner={contestStatus === 'voting' && entry.approved}
              isLoading={isLoading === entry.id}
              onApprove={() => handleApprove(entry.id, true)}
              onReject={() => handleApprove(entry.id, false)}
              onSelectWinner={() => handleSelectWinner(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY CARD
// ─────────────────────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  isWinner,
  canSelectWinner,
  isLoading,
  onApprove,
  onReject,
  onSelectWinner,
}: {
  entry: Entry
  isWinner: boolean
  canSelectWinner: boolean
  isLoading: boolean
  onApprove: () => void
  onReject: () => void
  onSelectWinner: () => void
}) {
  const isPending = !entry.approved && !entry.rejected

  return (
    <div className={cn(
      "group relative bg-white border transition-all",
      isWinner 
        ? "border-amber-400 ring-2 ring-amber-100" 
        : "border-[#E5E5E5] hover:border-[#141414]"
    )}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {entry.image.thumbnailUrl ? (
          <Image
            src={entry.image.thumbnailUrl}
            alt={`Entry by ${entry.photographer.displayName}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400">
            No image
          </div>
        )}

        {/* Status Overlay */}
        {isPending && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </div>
        )}
        
        {entry.rejected && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium">
            <X className="w-3 h-3" />
            Rejected
          </div>
        )}

        {isWinner && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-400 text-white text-xs font-medium">
            <Trophy className="w-3 h-3" />
            Winner
          </div>
        )}

        {/* Vote Count */}
        {entry.approved && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs">
            <ThumbsUp className="w-3 h-3" />
            {entry.voteCount}
          </div>
        )}

        {/* Hover Actions */}
        <div className={cn(
          "absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity",
          isLoading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {isPending && (
                <>
                  <button
                    onClick={onApprove}
                    className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    title="Approve"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onReject}
                    className="p-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Reject"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {entry.approved && !isWinner && canSelectWinner && (
                <button
                  onClick={onSelectWinner}
                  className="p-2 bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  title="Select as Winner"
                >
                  <Trophy className="w-5 h-5" />
                </button>
              )}

              {entry.rejected && (
                <button
                  onClick={onApprove}
                  className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  title="Approve"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-[#141414] truncate">
          {entry.photographer.displayName}
        </p>
        <p className="text-xs text-[#525252] truncate">
          {entry.photographer.email}
        </p>
        {entry.caption && (
          <p className="text-xs text-[#525252] mt-1 line-clamp-2">
            "{entry.caption}"
          </p>
        )}
      </div>
    </div>
  )
}
