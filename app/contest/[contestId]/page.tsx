/**
 * ============================================================================
 * CONTEST PAGE - Awwwards-Style Spotlight
 * ============================================================================
 * 
 * Main voting interface for photo contests.
 * Inspired by Awwwards with photographer-focused features.
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, Heart, Clock, Users, Sparkles, ArrowRight, Plus, MapPin, Trophy, Star, Award } from 'lucide-react'
import { getContestPageData } from '@/server/actions/contest.actions'
import { SpotlightGallery } from './SpotlightGallery'

// Placeholder data for demo/preview purposes
const PLACEHOLDER_ENTRIES = [
  {
    id: 'demo-1',
    photographer: { displayName: 'Sarah Chen', slug: 'sarahchen', avatarUrl: null, location: 'San Francisco, CA' },
    voteCount: 47,
    scores: { composition: 9, lighting: 8, emotion: 9, technique: 8 },
    overallScore: 8.50,
    image: { thumbnailUrl: '/images/showcase/1.jpg', previewUrl: '/images/showcase/1.jpg' },
  },
  {
    id: 'demo-2',
    photographer: { displayName: 'Marcus Rivera', slug: 'marcusrivera', avatarUrl: null, location: 'Austin, TX' },
    voteCount: 42,
    scores: { composition: 8, lighting: 9, emotion: 8, technique: 9 },
    overallScore: 8.50,
    image: { thumbnailUrl: '/images/showcase/2.jpg', previewUrl: '/images/showcase/2.jpg' },
  },
  {
    id: 'demo-3',
    photographer: { displayName: 'Emma Thompson', slug: 'emmathompson', avatarUrl: null, location: 'London, UK' },
    voteCount: 38,
    scores: { composition: 9, lighting: 8, emotion: 9, technique: 7 },
    overallScore: 8.25,
    image: { thumbnailUrl: '/images/showcase/3.jpg', previewUrl: '/images/showcase/3.jpg' },
  },
  {
    id: 'demo-4',
    photographer: { displayName: 'James Park', slug: 'jamespark', avatarUrl: null, location: 'Seoul, Korea' },
    voteCount: 35,
    scores: { composition: 8, lighting: 8, emotion: 8, technique: 8 },
    overallScore: 8.00,
    image: { thumbnailUrl: '/images/showcase/4.jpg', previewUrl: '/images/showcase/4.jpg' },
  },
  {
    id: 'demo-5',
    photographer: { displayName: 'Ana García', slug: 'anagarcia', avatarUrl: null, location: 'Barcelona, Spain' },
    voteCount: 31,
    scores: { composition: 7, lighting: 9, emotion: 8, technique: 8 },
    overallScore: 8.00,
    image: { thumbnailUrl: '/images/showcase/5.jpg', previewUrl: '/images/showcase/5.jpg' },
  },
  {
    id: 'demo-6',
    photographer: { displayName: 'David Kim', slug: 'davidkim', avatarUrl: null, location: 'Los Angeles, CA' },
    voteCount: 28,
    scores: { composition: 8, lighting: 7, emotion: 8, technique: 8 },
    overallScore: 7.75,
    image: { thumbnailUrl: '/images/showcase/6.jpg', previewUrl: '/images/showcase/6.jpg' },
  },
  {
    id: 'demo-7',
    photographer: { displayName: 'Sophie Martin', slug: 'sophiemartin', avatarUrl: null, location: 'Paris, France' },
    voteCount: 24,
    scores: { composition: 8, lighting: 8, emotion: 7, technique: 8 },
    overallScore: 7.75,
    image: { thumbnailUrl: '/images/showcase/7.jpg', previewUrl: '/images/showcase/7.jpg' },
  },
  {
    id: 'demo-8',
    photographer: { displayName: 'Alex Johnson', slug: 'alexjohnson', avatarUrl: null, location: 'New York, NY' },
    voteCount: 21,
    scores: { composition: 7, lighting: 8, emotion: 8, technique: 7 },
    overallScore: 7.50,
    image: { thumbnailUrl: '/images/showcase/8.jpg', previewUrl: '/images/showcase/8.jpg' },
  },
]

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
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-stone-500 hover:text-stone-900 transition-colors text-sm"
            >
              ← Back
            </Link>
            
            <div className="flex items-center gap-4">
              {isVoting && isPaidUser && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-stone-400">Your Votes</p>
                  <p className="text-sm font-medium text-stone-900">
                    {userVoteCount}/{contest.maxVotesPerUser}
                  </p>
                </div>
              )}
              
              {canSubmit && (
                <Link
                  href="/contest/submit"
                  className="px-5 py-2.5 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors rounded-full"
                >
                  Submit Shot
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Big Title */}
          <h1 className="text-[clamp(2.5rem,10vw,5rem)] font-light text-stone-900 leading-[0.9] tracking-tight mb-6">
            SPOTLIGHT
          </h1>
          
          {/* Tagline */}
          <p className="text-stone-500 text-lg mb-8">
            Vote for the best shots from our community
          </p>
          
          {/* Theme Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-stone-50 border border-stone-200 rounded-full mb-8">
            <span className="text-stone-500 text-sm">This Month's Theme:</span>
            <span className="text-stone-900 font-medium">{contest.theme || contest.name}</span>
          </div>
          
          {/* Status Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {isSubmissions && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-600 text-sm">Submissions Open</span>
              </div>
            )}
            {isVoting && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 text-sm">Voting Open</span>
              </div>
            )}
            <div className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-full">
              <span className="text-stone-500 text-sm">{formatTimeRemaining(endDate)}</span>
            </div>
            <div className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-full">
              <span className="text-stone-500 text-sm">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upgrade Banner */}
      {showUpgradeBanner && (
        <div className="mx-6 mb-8">
          <div className="max-w-5xl mx-auto px-6 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-stone-900 font-medium">Upgrade to participate</p>
                <p className="text-stone-500 text-sm">Submit your shots and vote for your favorites</p>
              </div>
              <Link
                href="/pricing"
                className="px-5 py-2.5 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors rounded-full whitespace-nowrap"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Your Entry Card */}
      {userEntry && (userEntry as any).image && (
        <div className="mx-6 mb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-6 p-4 border border-stone-200 rounded-xl bg-white hover:border-stone-300 transition-colors">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={(userEntry as any).image.thumbnailUrl}
                  alt="Your entry"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-stone-400 uppercase tracking-wider">Your Entry</span>
                  {!userEntry.approved && (
                    <span className="text-amber-600 text-xs">· Pending</span>
                  )}
                </div>
                <p className="text-stone-900 font-medium">You're in the Spotlight!</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Heart className="w-4 h-4 text-rose-500" />
                <span className="text-xl font-medium text-stone-900 tabular-nums">{userEntry.voteCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Gallery */}
      <main className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {entries.length === 0 ? (
            <div className="max-w-5xl mx-auto">
              {/* Minimal Preview Indicator */}
              <div className="mb-10 text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-stone-400 border border-stone-200 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                  Preview with sample data
                </span>
              </div>
              
              {/* Leaderboard Table - Refined */}
              <div className="mb-16">
                {/* Table Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <div className="flex items-center gap-4">
                    <span className="w-8" />
                    <span className="w-14" />
                    <span className="text-[11px] text-stone-400 uppercase tracking-[0.15em]">Photographer</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-14 text-center text-[11px] text-stone-400 uppercase tracking-[0.1em] hidden lg:block">Comp</span>
                    <span className="w-14 text-center text-[11px] text-stone-400 uppercase tracking-[0.1em] hidden lg:block">Light</span>
                    <span className="w-14 text-center text-[11px] text-stone-400 uppercase tracking-[0.1em] hidden lg:block">Emotion</span>
                    <span className="w-14 text-center text-[11px] text-stone-400 uppercase tracking-[0.1em] hidden lg:block">Tech</span>
                    <span className="w-20 text-center text-[11px] text-stone-400 uppercase tracking-[0.1em]">Score</span>
                  </div>
                </div>
                
                {/* Table Body */}
                <div>
                  {PLACEHOLDER_ENTRIES.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between py-5 border-b border-stone-100 transition-all duration-200 group cursor-pointer
                        ${index === 0 ? 'bg-stone-50/50' : 'hover:bg-stone-50/50'}`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Rank */}
                        <div className="w-8 flex-shrink-0 text-center">
                          {index === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-medium">1</span>
                          ) : index === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-200 text-stone-700 text-xs font-medium">2</span>
                          ) : index === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-200 text-stone-700 text-xs font-medium">3</span>
                          ) : (
                            <span className="text-stone-400 text-sm tabular-nums">{index + 1}</span>
                          )}
                        </div>
                        
                        {/* Photo Thumbnail */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 ring-1 ring-stone-200/50">
                          <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200" />
                        </div>
                        
                        {/* Photographer Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-stone-900 font-medium text-sm truncate group-hover:text-stone-700 transition-colors">
                            {entry.photographer.displayName}
                          </p>
                          <p className="text-stone-400 text-xs truncate">
                            {entry.photographer.location}
                          </p>
                        </div>
                        
                        {/* Vote Count */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/80">
                          <Heart className="w-3 h-3 text-stone-400" />
                          <span className="text-xs text-stone-600 tabular-nums font-medium">{entry.voteCount}</span>
                        </div>
                      </div>
                      
                      {/* Scores */}
                      <div className="flex items-center">
                        <span className="w-14 text-center text-stone-500 text-sm tabular-nums hidden lg:block">{entry.scores.composition}</span>
                        <span className="w-14 text-center text-stone-500 text-sm tabular-nums hidden lg:block">{entry.scores.lighting}</span>
                        <span className="w-14 text-center text-stone-500 text-sm tabular-nums hidden lg:block">{entry.scores.emotion}</span>
                        <span className="w-14 text-center text-stone-500 text-sm tabular-nums hidden lg:block">{entry.scores.technique}</span>
                        <div className="w-20 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-sm font-semibold tabular-nums
                            ${entry.overallScore >= 8.5 ? 'bg-emerald-50 text-emerald-700' : 
                              entry.overallScore >= 8.0 ? 'bg-stone-100 text-stone-900' : 
                              'text-stone-600'}`}>
                            {entry.overallScore.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* CTA Section */}
              <div className="text-center py-16">
                <p className="text-stone-400 text-xs uppercase tracking-[0.2em] mb-4">Be the first</p>
                <h3 className="text-2xl font-light text-stone-900 mb-4">
                  Your shot could be #1
                </h3>
                <p className="text-stone-500 text-sm mb-10 max-w-sm mx-auto">
                  Submit your best work for "{contest.theme || contest.name}" and start collecting votes.
                </p>
                
                {canSubmit && (
                  <Link
                    href="/contest/submit"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-all rounded-full group"
                  >
                    Submit Your Shot
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                
                {!canSubmit && !isLoggedIn && (
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 px-6 py-3 text-stone-900 text-sm font-medium hover:bg-stone-100 transition-colors rounded-full border border-stone-200"
                  >
                    Sign in to participate
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <SpotlightGallery
              entries={entries}
              canVote={canVote}
              showVoteCounts={contest.showVoteCounts}
            />
          )}
        </div>
      </main>
    </div>
  )
}
