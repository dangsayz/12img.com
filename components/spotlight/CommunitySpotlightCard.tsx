/**
 * ============================================================================
 * COMMUNITY SPOTLIGHT CARD - Homepage Module
 * ============================================================================
 * 
 * A minimal, mobile-first card that displays on the homepage showing:
 * - Current contest winner (after voting ends)
 * - "Vote now" CTA (during voting)
 * - "Submit your shot" CTA (during submissions)
 * 
 * DESIGN:
 * - Ultra-minimal, editorial aesthetic
 * - Glassmorphism optional
 * - Mobile-first with large touch targets
 * - Smooth transitions
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

import Link from 'next/link'
import Image from 'next/image'
import { getSpotlightCardData } from '@/server/actions/contest.actions'
import type { SpotlightCardData } from '@/lib/contest/types'

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Format countdown
// ─────────────────────────────────────────────────────────────────────────────
function formatTimeRemaining(endDate: Date): string {
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  
  if (diff <= 0) return 'Ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h left`
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${minutes}m left`
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT (Server Component)
// ─────────────────────────────────────────────────────────────────────────────
export async function CommunitySpotlightCard() {
  const data = await getSpotlightCardData()
  
  // Don't render if no contest activity
  if (data.state === 'none') {
    return null
  }
  
  return (
    <section className="w-full py-12 md:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2 block">
            Community
          </span>
          <h2 className="text-2xl sm:text-3xl font-light text-stone-900 tracking-tight">
            Spotlight
          </h2>
        </div>
        
        {/* Card Content */}
        <div className="relative">
          {data.state === 'winner' && data.winner && (
            <WinnerCard winner={data.winner} />
          )}
          
          {data.state === 'voting' && data.voting && (
            <VotingCard voting={data.voting} />
          )}
          
          {data.state === 'submissions' && data.submissions && (
            <SubmissionsCard submissions={data.submissions} />
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WINNER CARD
// ─────────────────────────────────────────────────────────────────────────────
function WinnerCard({ winner }: { winner: NonNullable<SpotlightCardData['winner']> }) {
  return (
    <div className="relative group">
      {/* Image */}
      <div className="relative aspect-[4/5] sm:aspect-[3/2] overflow-hidden bg-stone-100">
        {winner.imageUrl && (
          <Image
            src={winner.imageUrl}
            alt={`Winning photo by ${winner.photographerName}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Winner badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-[0.2em] text-stone-700 font-medium">
            <span className="text-amber-500">★</span>
            Winner
          </span>
        </div>
        
        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-1">
            {winner.contestTheme || winner.contestName}
          </p>
          <p className="text-white text-lg sm:text-xl font-light">
            {winner.photographerName}
          </p>
        </div>
      </div>
      
      {/* CTA */}
      <Link
        href="/contest/winners"
        className="mt-4 flex items-center justify-center gap-2 py-3 text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        <span>View all finalists</span>
        <span className="text-xs">→</span>
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VOTING CARD
// ─────────────────────────────────────────────────────────────────────────────
function VotingCard({ voting }: { voting: NonNullable<SpotlightCardData['voting']> }) {
  return (
    <div className="text-center py-8 px-4 border border-stone-200 bg-white/50 backdrop-blur-sm">
      {/* Icon */}
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
        </svg>
      </div>
      
      {/* Text */}
      <h3 className="text-lg font-light text-stone-900 mb-1">
        Voting is Open
      </h3>
      <p className="text-sm text-stone-500 mb-2">
        {voting.entryCount} photos competing
      </p>
      <p className="text-xs text-stone-400 mb-6">
        {formatTimeRemaining(voting.endsAt)}
      </p>
      
      {/* CTA - Large touch target for mobile */}
      <Link
        href={`/contest/${voting.contestId}`}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors min-h-[48px]"
      >
        Vote Now
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSIONS CARD
// ─────────────────────────────────────────────────────────────────────────────
function SubmissionsCard({ submissions }: { submissions: NonNullable<SpotlightCardData['submissions']> }) {
  return (
    <div className="text-center py-8 px-4 border border-stone-200 bg-white/50 backdrop-blur-sm">
      {/* Icon */}
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      </div>
      
      {/* Text */}
      <h3 className="text-lg font-light text-stone-900 mb-1">
        {submissions.theme || 'Monthly Contest'}
      </h3>
      <p className="text-sm text-stone-500 mb-2">
        Submit your best shot
      </p>
      <p className="text-xs text-stone-400 mb-6">
        {formatTimeRemaining(submissions.endsAt)}
      </p>
      
      {/* CTA - Large touch target for mobile */}
      <Link
        href="/contest/submit"
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors min-h-[48px]"
      >
        Enter Contest
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT DEFAULT
// ─────────────────────────────────────────────────────────────────────────────
export default CommunitySpotlightCard
