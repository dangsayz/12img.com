/**
 * ============================================================================
 * COMMUNITY SPOTLIGHT CARD - Client Component
 * ============================================================================
 * 
 * Client-side version of the spotlight card for use in client components
 * like the landing page. Fetches data via API.
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function CommunitySpotlightCardClient() {
  const [data, setData] = useState<SpotlightCardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/contest/spotlight')
        if (response.ok) {
          const result = await response.json()
          // Parse dates
          if (result.voting?.endsAt) {
            result.voting.endsAt = new Date(result.voting.endsAt)
          }
          if (result.submissions?.endsAt) {
            result.submissions.endsAt = new Date(result.submissions.endsAt)
          }
          setData(result)
        }
      } catch (error) {
        console.error('[Spotlight] Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Show promotional card even when no active contest
  const showPromo = !loading && (!data || data.state === 'none')

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 bg-[#F5F5F7]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2 block">
            Community
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#141414]">
            Spotlight
          </h2>
        </div>
        
        {/* Card Content */}
        <div className="relative">
          {loading && <LoadingCard />}
          
          {showPromo && <PromoCard />}
          
          {data?.state === 'winner' && data.winner && (
            <WinnerCard winner={data.winner} />
          )}
          
          {data?.state === 'voting' && data.voting && (
            <VotingCard voting={data.voting} />
          )}
          
          {data?.state === 'submissions' && data.submissions && (
            <SubmissionsCard submissions={data.submissions} />
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING CARD
// ─────────────────────────────────────────────────────────────────────────────
function LoadingCard() {
  return (
    <div className="border border-stone-200 bg-white p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 animate-pulse" />
      <div className="h-6 w-48 mx-auto mb-2 bg-stone-100 rounded animate-pulse" />
      <div className="h-4 w-32 mx-auto bg-stone-100 rounded animate-pulse" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMO CARD - Show when no active contest
// ─────────────────────────────────────────────────────────────────────────────
function PromoCard() {
  return (
    <div className="border border-stone-200 bg-white overflow-hidden">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 px-6 py-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">
          Monthly Photo Contest
        </p>
        <h3 className="text-2xl sm:text-3xl font-light text-white mb-2">
          Showcase Your Best Work
        </h3>
        <p className="text-stone-400 text-sm">
          Compete with photographers worldwide
        </p>
      </div>
      
      {/* Contest info */}
      <div className="p-6">
        <p className="text-center text-stone-600 mb-6">
          Submit your favorite wedding shot and get recognized.
          <br className="hidden sm:block" />
          <span className="text-stone-900 font-medium">Daily, weekly, monthly, and annual awards.</span>
        </p>
        
        {/* Award tiers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="text-center p-3 bg-stone-50 rounded-lg">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Daily</p>
            <p className="text-sm font-medium text-stone-900">Shot of the Day</p>
          </div>
          <div className="text-center p-3 bg-stone-50 rounded-lg">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Weekly</p>
            <p className="text-sm font-medium text-stone-900">Top 7</p>
          </div>
          <div className="text-center p-3 bg-stone-50 rounded-lg">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Monthly</p>
            <p className="text-sm font-medium text-stone-900">Champion</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Annual</p>
            <p className="text-sm font-medium text-amber-700">POTY</p>
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors rounded-full"
          >
            Join & Enter Contest
          </Link>
          <p className="text-xs text-stone-400 mt-3">
            Free to enter for all members
          </p>
        </div>
      </div>
    </div>
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
    <div className="text-center py-8 px-4 border border-stone-200 bg-white/80 backdrop-blur-sm">
      {/* Icon */}
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
        </svg>
      </div>
      
      {/* Text */}
      <h3 className="text-lg font-light text-[#141414] mb-1">
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
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors min-h-[48px]"
      >
        Vote Now
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSIONS CARD - Enhanced for landing page
// ─────────────────────────────────────────────────────────────────────────────
function SubmissionsCard({ submissions }: { submissions: NonNullable<SpotlightCardData['submissions']> }) {
  return (
    <div className="border border-stone-200 bg-white overflow-hidden">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 px-6 py-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">
          This Month's Theme
        </p>
        <h3 className="text-2xl sm:text-3xl font-light text-white mb-2">
          {submissions.theme || 'Wedding Photography'}
        </h3>
        <p className="text-stone-400 text-sm">
          {formatTimeRemaining(submissions.endsAt)}
        </p>
      </div>
      
      {/* Contest info */}
      <div className="p-6">
        <p className="text-center text-stone-600 mb-6">
          Submit your best wedding shot and compete for recognition.
          <br className="hidden sm:block" />
          <span className="text-stone-900 font-medium">Winners get featured on our homepage.</span>
        </p>
        
        {/* Award tiers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="text-center p-3 bg-stone-50 rounded-lg">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Daily</p>
            <p className="text-sm font-medium text-stone-900">Shot of the Day</p>
          </div>
          <div className="text-center p-3 bg-stone-50 rounded-lg">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Weekly</p>
            <p className="text-sm font-medium text-stone-900">Top 7</p>
          </div>
          <div className="text-center p-3 bg-stone-50 rounded-lg">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Monthly</p>
            <p className="text-sm font-medium text-stone-900">Champion</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Annual</p>
            <p className="text-sm font-medium text-amber-700">POTY</p>
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <Link
            href="/contest/submit"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors rounded-full"
          >
            Submit Your Best Shot
          </Link>
          <p className="text-xs text-stone-400 mt-3">
            Free to enter for all members
          </p>
        </div>
      </div>
    </div>
  )
}

export default CommunitySpotlightCardClient
