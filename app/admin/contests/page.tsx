/**
 * ============================================================================
 * ADMIN: Contests Management Page
 * ============================================================================
 * 
 * Full CRUD interface for managing Community Spotlight contests.
 * 
 * Features:
 * - List all contests with status indicators
 * - Create new contests with date pickers
 * - Edit existing contests
 * - Approve/reject entries
 * - Manual winner selection
 * 
 * Architecture:
 * - Server component for initial data fetch (SSR for fast load)
 * - Client components for interactive forms
 * - Optimistic updates for better UX
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_IMPLEMENTATION.md
 * ============================================================================
 */

import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { ContestsPageContent } from './ContestsPageContent'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────────────────────────────────────────

async function getContests() {
  const supabase = createServerClient()
  
  const { data: contests, error } = await supabase
    .from('contests')
    .select(`
      *,
      contest_entries (
        id,
        approved,
        rejected
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[Admin Contests] Error fetching contests:', error)
    return []
  }
  
  // Calculate entry stats for each contest
  return contests.map(contest => ({
    id: contest.id,
    name: contest.name,
    theme: contest.theme,
    description: contest.description,
    status: contest.status,
    submissionStartsAt: contest.submission_starts_at,
    submissionEndsAt: contest.submission_ends_at,
    votingStartsAt: contest.voting_starts_at,
    votingEndsAt: contest.voting_ends_at,
    maxEntriesPerUser: contest.max_entries_per_user,
    maxVotesPerUser: contest.max_votes_per_user,
    showVoteCounts: contest.show_vote_counts,
    requireApproval: contest.require_approval,
    winnerEntryId: contest.winner_entry_id,
    createdAt: contest.created_at,
    // Stats
    totalEntries: contest.contest_entries?.length || 0,
    approvedEntries: contest.contest_entries?.filter((e: any) => e.approved).length || 0,
    pendingEntries: contest.contest_entries?.filter((e: any) => !e.approved && !e.rejected).length || 0,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default async function AdminContestsPage() {
  const contests = await getContests()
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-4xl text-[#141414]">Contests</h1>
          <p className="text-[#525252] text-sm lg:text-base mt-1">
            Manage Community Spotlight photo contests
          </p>
        </div>
      </div>
      
      <Suspense fallback={<ContestsSkeleton />}>
        <ContestsPageContent initialContests={contests} />
      </Suspense>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function ContestsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-[#E5E5E5] p-6 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-stone-200 rounded" />
              <div className="h-4 w-32 bg-stone-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-stone-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
