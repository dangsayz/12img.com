/**
 * ============================================================================
 * CONTEST VOTING PAGE
 * ============================================================================
 * 
 * Main voting interface for a specific contest.
 * Mobile-first design with large touch targets.
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContestPageData } from '@/server/actions/contest.actions'
import { ContestGalleryClient } from './ContestGalleryClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ contestId: string }>
}

export default async function ContestVotingPage({ params }: Props) {
  const { contestId } = await params
  const data = await getContestPageData(contestId)
  
  if (!data) {
    notFound()
  }
  
  const { contest, entries, userVoteCount, canVote, canSubmit, userEntry, isPaidUser, isLoggedIn } = data
  
  // Show upgrade banner for logged-in free users
  const showUpgradeBanner = isLoggedIn && !isPaidUser
  
  // Format time remaining
  const formatTimeRemaining = (date: Date): string => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    if (diff <= 0) return 'Ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h left`
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes}m left`
  }
  
  const isVoting = contest.status === 'voting'
  const isSubmissions = contest.status === 'submissions_open'
  const endDate = isVoting ? contest.votingEndsAt : contest.submissionEndsAt
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Sticky on mobile */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <Link
              href="/"
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
            >
              <span className="text-lg">←</span>
              <span className="text-sm hidden sm:inline">Home</span>
            </Link>
            
            {/* Contest info */}
            <div className="text-center flex-1 px-4">
              <h1 className="text-sm sm:text-base font-medium text-stone-900 truncate">
                {contest.theme || contest.name}
              </h1>
              <p className="text-xs text-stone-400">
                {formatTimeRemaining(endDate)}
              </p>
            </div>
            
            {/* Vote counter / Submit CTA */}
            <div className="flex items-center gap-3">
              {isVoting && (
                <div className="text-right">
                  <p className="text-xs text-stone-400">Votes</p>
                  <p className="text-sm font-medium text-stone-900">
                    {userVoteCount}/{contest.maxVotesPerUser}
                  </p>
                </div>
              )}
              
              {isSubmissions && canSubmit && (
                <Link
                  href="/contest/submit"
                  className="px-4 py-2 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors min-h-[40px] flex items-center"
                >
                  Submit
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Status Banner */}
      {isSubmissions && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 text-center">
          <p className="text-sm text-blue-700">
            📸 Submissions open — voting starts soon
          </p>
        </div>
      )}
      
      {userEntry && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3 text-center">
          <p className="text-sm text-emerald-700">
            ✓ You've submitted to this contest
            {!userEntry.approved && ' (pending approval)'}
          </p>
        </div>
      )}
      
      {/* Upgrade Banner for Free Users */}
      {showUpgradeBanner && (
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-4">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-stone-900">
                Upgrade to participate
              </p>
              <p className="text-xs text-stone-500">
                Community Spotlight is available for paid members
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors whitespace-nowrap"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}
      
      {/* Gallery */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-stone-400 mb-4">No entries yet</p>
            {canSubmit && (
              <Link
                href="/contest/submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Be the first to submit
              </Link>
            )}
          </div>
        ) : (
          <ContestGalleryClient
            entries={entries}
            canVote={canVote}
            showVoteCounts={contest.showVoteCounts}
          />
        )}
      </main>
      
      {/* Mobile Bottom Bar - Vote Counter */}
      {isVoting && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-100 px-4 py-3 sm:hidden safe-area-bottom">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400">Your votes</p>
              <p className="text-lg font-medium text-stone-900">
                {userVoteCount} / {contest.maxVotesPerUser}
              </p>
            </div>
            
            {userVoteCount < contest.maxVotesPerUser && (
              <p className="text-sm text-stone-500">
                {contest.maxVotesPerUser - userVoteCount} remaining
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
