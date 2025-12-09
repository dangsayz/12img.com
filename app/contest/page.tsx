/**
 * ============================================================================
 * CONTEST PAGE - Main Voting Gallery
 * ============================================================================
 * 
 * Displays all contest entries for voting.
 * Redirects to active contest if one exists.
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

import { redirect } from 'next/navigation'
import { getActiveContest } from '@/server/actions/contest.actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ContestPage() {
  const contest = await getActiveContest()
  
  if (contest) {
    redirect(`/contest/${contest.id}`)
  }
  
  // No active contest
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-light text-stone-900 mb-3">
          No Active Contest
        </h1>
        <p className="text-stone-500 mb-8">
          Check back soon for the next Community Spotlight contest.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <span>←</span>
          <span>Back to home</span>
        </Link>
      </div>
    </div>
  )
}
