/**
 * ============================================================================
 * ADMIN: Contests Page Content (Client Component)
 * ============================================================================
 * 
 * Interactive client component for contest management.
 * 
 * Design Decisions:
 * - Inline editing for quick changes (no modal for simple edits)
 * - Modal for complex operations (create, entry review)
 * - Status badges with semantic colors
 * - Optimistic updates for snappy UX
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_IMPLEMENTATION.md
 * ============================================================================
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Calendar, 
  Users, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Eye,
  Play,
  Pause,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { 
  createContest, 
  updateContest, 
  selectWinner 
} from '@/server/actions/contest.actions'
import type { ContestStatus } from '@/lib/contest/types'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ContestSummary {
  id: string
  name: string
  theme: string | null
  description: string | null
  status: ContestStatus
  submissionStartsAt: string
  submissionEndsAt: string
  votingStartsAt: string
  votingEndsAt: string
  maxEntriesPerUser: number
  maxVotesPerUser: number
  showVoteCounts: boolean
  requireApproval: boolean
  winnerEntryId: string | null
  createdAt: string
  totalEntries: number
  approvedEntries: number
  pendingEntries: number
}

interface ContestsPageContentProps {
  initialContests: ContestSummary[]
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// Semantic colors following established design system
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ContestStatus, {
  label: string
  icon: React.ElementType
  className: string
  description: string
}> = {
  draft: {
    label: 'Draft',
    icon: AlertCircle,
    className: 'bg-stone-100 text-stone-600 border-stone-200',
    description: 'Not visible to users',
  },
  submissions_open: {
    label: 'Submissions Open',
    icon: Play,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Accepting photo entries',
  },
  voting: {
    label: 'Voting',
    icon: Users,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Community voting in progress',
  },
  finished: {
    label: 'Finished',
    icon: Trophy,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Winner selected',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-50 text-red-600 border-red-200',
    description: 'Contest was cancelled',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ContestsPageContent({ initialContests }: ContestsPageContentProps) {
  const router = useRouter()
  const [contests, setContests] = useState(initialContests)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedContest, setSelectedContest] = useState<ContestSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Quick action: Change status
  async function handleStatusChange(contestId: string, newStatus: ContestStatus) {
    setIsLoading(true)
    const success = await updateContest({ id: contestId, status: newStatus })
    if (success) {
      setContests(prev => prev.map(c => 
        c.id === contestId ? { ...c, status: newStatus } : c
      ))
    }
    setIsLoading(false)
    router.refresh()
  }

  // Quick action: Select winner (auto by votes)
  async function handleSelectWinner(contestId: string) {
    if (!confirm('Select the entry with the most votes as winner?')) return
    setIsLoading(true)
    const success = await selectWinner(contestId)
    if (success) {
      setContests(prev => prev.map(c => 
        c.id === contestId ? { ...c, status: 'finished' as ContestStatus } : c
      ))
    }
    setIsLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#525252]">
          <span>{contests.length} contest{contests.length !== 1 ? 's' : ''}</span>
          {contests.some(c => c.pendingEntries > 0) && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              {contests.reduce((sum, c) => sum + c.pendingEntries, 0)} pending review
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Contest
        </button>
      </div>

      {/* Contest List */}
      {contests.length === 0 ? (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      ) : (
        <div className="space-y-4">
          {contests.map(contest => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onStatusChange={handleStatusChange}
              onSelectWinner={handleSelectWinner}
              onViewEntries={() => router.push(`/admin/contests/${contest.id}`)}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateContestModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newContest) => {
            setContests(prev => [newContest, ...prev])
            setShowCreateModal(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEST CARD
// ─────────────────────────────────────────────────────────────────────────────

function ContestCard({
  contest,
  onStatusChange,
  onSelectWinner,
  onViewEntries,
  isLoading,
}: {
  contest: ContestSummary
  onStatusChange: (id: string, status: ContestStatus) => void
  onSelectWinner: (id: string) => void
  onViewEntries: () => void
  isLoading: boolean
}) {
  const statusConfig = STATUS_CONFIG[contest.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="bg-white border border-[#E5E5E5] hover:border-[#141414] transition-colors">
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg lg:text-xl text-[#141414] truncate">
              {contest.name}
            </h3>
            {contest.theme && (
              <p className="text-sm text-[#525252] mt-0.5">
                Theme: {contest.theme}
              </p>
            )}
          </div>
          
          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border shrink-0",
            statusConfig.className
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.label}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm text-[#525252] mb-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{contest.approvedEntries} entries</span>
            {contest.pendingEntries > 0 && (
              <span className="text-amber-600">({contest.pendingEntries} pending)</span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(contest.submissionStartsAt).toLocaleDateString()} - {new Date(contest.votingEndsAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#E5E5E5]">
          {/* View Entries */}
          <button
            onClick={onViewEntries}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#525252] hover:text-[#141414] hover:bg-[#F5F5F7] transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Entries
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Status Actions - contextual based on current status */}
          {contest.status === 'draft' && (
            <button
              onClick={() => onStatusChange(contest.id, 'submissions_open')}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Open Submissions
            </button>
          )}

          {contest.status === 'submissions_open' && (
            <button
              onClick={() => onStatusChange(contest.id, 'voting')}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              Start Voting
            </button>
          )}

          {contest.status === 'voting' && (
            <button
              onClick={() => onSelectWinner(contest.id)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              Select Winner
            </button>
          )}

          {contest.status === 'finished' && contest.winnerEntryId && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              Winner Selected
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="bg-white border border-[#E5E5E5] p-8 lg:p-12 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#F5F5F7] flex items-center justify-center">
        <Trophy className="w-6 h-6 text-[#525252]" />
      </div>
      <h3 className="font-serif text-xl text-[#141414] mb-2">No contests yet</h3>
      <p className="text-[#525252] text-sm mb-6 max-w-md mx-auto">
        Create your first Community Spotlight contest to engage photographers and showcase their best work.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create First Contest
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE CONTEST MODAL
// ─────────────────────────────────────────────────────────────────────────────

function CreateContestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (contest: ContestSummary) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default dates: submissions start tomorrow, end in 2 weeks
  // Voting starts when submissions end, runs for 1 week
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const submissionEnd = new Date(tomorrow)
  submissionEnd.setDate(submissionEnd.getDate() + 14)

  const votingEnd = new Date(submissionEnd)
  votingEnd.setDate(votingEnd.getDate() + 7)

  const [formData, setFormData] = useState({
    name: '',
    theme: '',
    description: '',
    submissionStartsAt: tomorrow.toISOString().slice(0, 16),
    submissionEndsAt: submissionEnd.toISOString().slice(0, 16),
    votingStartsAt: submissionEnd.toISOString().slice(0, 16),
    votingEndsAt: votingEnd.toISOString().slice(0, 16),
    maxEntriesPerUser: 1,
    maxVotesPerUser: 3,
    requireApproval: true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createContest({
        name: formData.name,
        theme: formData.theme || undefined,
        description: formData.description || undefined,
        submissionStartsAt: new Date(formData.submissionStartsAt),
        submissionEndsAt: new Date(formData.submissionEndsAt),
        votingStartsAt: new Date(formData.votingStartsAt),
        votingEndsAt: new Date(formData.votingEndsAt),
        maxEntriesPerUser: formData.maxEntriesPerUser,
        maxVotesPerUser: formData.maxVotesPerUser,
        requireApproval: formData.requireApproval,
      })

      if (result) {
        onCreated({
          id: result.id,
          name: result.name,
          theme: result.theme,
          description: result.description,
          status: result.status,
          submissionStartsAt: result.submissionStartsAt.toISOString(),
          submissionEndsAt: result.submissionEndsAt.toISOString(),
          votingStartsAt: result.votingStartsAt.toISOString(),
          votingEndsAt: result.votingEndsAt.toISOString(),
          maxEntriesPerUser: result.maxEntriesPerUser,
          maxVotesPerUser: result.maxVotesPerUser,
          showVoteCounts: result.showVoteCounts,
          requireApproval: result.requireApproval,
          winnerEntryId: result.winnerEntryId,
          createdAt: result.createdAt.toISOString(),
          totalEntries: 0,
          approvedEntries: 0,
          pendingEntries: 0,
        })
      } else {
        setError('Failed to create contest. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E5E5E5] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#141414]">Create Contest</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#525252] hover:text-[#141414] hover:bg-[#F5F5F7] transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1.5">
              Contest Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="January 2025 Spotlight"
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1.5">
              Theme (optional)
            </label>
            <input
              type="text"
              value={formData.theme}
              onChange={e => setFormData(prev => ({ ...prev, theme: e.target.value }))}
              placeholder="Winter Wonderland"
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Share your best winter photography..."
              rows={3}
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors resize-none"
            />
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1.5">
                Submissions Start
              </label>
              <input
                type="datetime-local"
                required
                value={formData.submissionStartsAt}
                onChange={e => setFormData(prev => ({ ...prev, submissionStartsAt: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1.5">
                Submissions End
              </label>
              <input
                type="datetime-local"
                required
                value={formData.submissionEndsAt}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  submissionEndsAt: e.target.value,
                  votingStartsAt: e.target.value, // Voting starts when submissions end
                }))}
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1.5">
                Voting Starts
              </label>
              <input
                type="datetime-local"
                required
                value={formData.votingStartsAt}
                onChange={e => setFormData(prev => ({ ...prev, votingStartsAt: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1.5">
                Voting Ends
              </label>
              <input
                type="datetime-local"
                required
                value={formData.votingEndsAt}
                onChange={e => setFormData(prev => ({ ...prev, votingEndsAt: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1.5">
                Max Entries/User
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={formData.maxEntriesPerUser}
                onChange={e => setFormData(prev => ({ ...prev, maxEntriesPerUser: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1.5">
                Max Votes/User
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.maxVotesPerUser}
                onChange={e => setFormData(prev => ({ ...prev, maxVotesPerUser: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] transition-colors"
              />
            </div>
          </div>

          {/* Require Approval Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requireApproval}
              onChange={e => setFormData(prev => ({ ...prev, requireApproval: e.target.checked }))}
              className="w-4 h-4 border-[#E5E5E5] text-[#141414] focus:ring-[#141414]"
            />
            <span className="text-sm text-[#525252]">
              Require admin approval for entries
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#525252] hover:text-[#141414] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Contest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
