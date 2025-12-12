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

// Placeholder data for demo/preview purposes - uses real images from showcase
const PLACEHOLDER_ENTRIES = [
  {
    id: 'demo-1',
    photographer: { displayName: 'Sarah Chen', slug: 'sarahchen', avatarUrl: null },
    voteCount: 47,
    hasVoted: false,
    caption: 'Golden hour magic',
    image: { thumbnailUrl: '/images/showcase/modern-wedding-gallery-01.jpg', previewUrl: '/images/showcase/modern-wedding-gallery-01.jpg' },
  },
  {
    id: 'demo-2',
    photographer: { displayName: 'Marcus Rivera', slug: 'marcusrivera', avatarUrl: null },
    voteCount: 42,
    hasVoted: true,
    caption: 'First dance',
    image: { thumbnailUrl: '/images/showcase/modern-wedding-gallery-02.jpg', previewUrl: '/images/showcase/modern-wedding-gallery-02.jpg' },
  },
  {
    id: 'demo-3',
    photographer: { displayName: 'Emma Thompson', slug: 'emmathompson', avatarUrl: null },
    voteCount: 38,
    hasVoted: false,
    caption: 'The look',
    image: { thumbnailUrl: '/images/showcase/modern-wedding-gallery-03.jpg', previewUrl: '/images/showcase/modern-wedding-gallery-03.jpg' },
  },
  {
    id: 'demo-4',
    photographer: { displayName: 'James Park', slug: 'jamespark', avatarUrl: null },
    voteCount: 35,
    hasVoted: false,
    caption: 'Quiet moments',
    image: { thumbnailUrl: '/images/showcase/modern-wedding-gallery-04.jpg', previewUrl: '/images/showcase/modern-wedding-gallery-04.jpg' },
  },
  {
    id: 'demo-5',
    photographer: { displayName: 'Ana García', slug: 'anagarcia', avatarUrl: null },
    voteCount: 31,
    hasVoted: false,
    caption: 'Natural light',
    image: { thumbnailUrl: '/images/showcase/modern-wedding-gallery-05.jpg', previewUrl: '/images/showcase/modern-wedding-gallery-05.jpg' },
  },
  {
    id: 'demo-6',
    photographer: { displayName: 'David Kim', slug: 'davidkim', avatarUrl: null },
    voteCount: 28,
    hasVoted: false,
    caption: 'Joy',
    image: { thumbnailUrl: '/images/showcase/modern-wedding-gallery-06.jpg', previewUrl: '/images/showcase/modern-wedding-gallery-06.jpg' },
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
              <div className="relative w-32 h-44 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={(userEntry as any).image.thumbnailUrl}
                  alt="Your entry"
                  fill
                  className="object-cover"
                  sizes="128px"
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
            <div className="max-w-6xl mx-auto">
              {/* Preview Mode Banner */}
              <div className="mb-8 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  Preview Mode — Sample entries shown below
                </span>
              </div>
              
              {/* Large Image Grid for Proper Critique */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {PLACEHOLDER_ENTRIES.map((entry, index) => (
                  <div key={entry.id} className="group">
                    {/* Tall Vogue-Style Image Container */}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-100 mb-4">
                      <Image
                        src={entry.image.thumbnailUrl}
                        alt={`Entry by ${entry.photographer.displayName}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={index < 2}
                      />
                      
                      {/* Rank Badge */}
                      {index < 3 && (
                        <div className="absolute top-4 left-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                            ${index === 0 ? 'bg-amber-400 text-amber-900' : 'bg-white/90 text-stone-700'}`}>
                            #{index + 1}
                          </div>
                        </div>
                      )}
                      
                      {/* Vote Button - Always Visible */}
                      <div className="absolute bottom-4 right-4">
                        <button 
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all shadow-lg
                            ${entry.hasVoted 
                              ? 'bg-rose-500 text-white' 
                              : 'bg-white/95 backdrop-blur-sm text-stone-700 hover:bg-white'}`}
                        >
                          <Heart className={`w-5 h-5 ${entry.hasVoted ? 'fill-current' : ''}`} />
                          <span className="font-medium tabular-nums">{entry.voteCount}</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Photographer Info */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                          <span className="text-stone-600 font-medium">
                            {entry.photographer.displayName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{entry.photographer.displayName}</p>
                          {entry.caption && (
                            <p className="text-sm text-stone-500">{entry.caption}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* How Voting Works */}
              <div className="max-w-2xl mx-auto text-center mb-16 px-6 py-10 bg-stone-50 rounded-3xl">
                <h3 className="text-xl font-medium text-stone-900 mb-6">How Voting Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-5 h-5 text-stone-600" />
                    </div>
                    <p className="font-medium text-stone-900 mb-1">Browse</p>
                    <p className="text-stone-500">View all submissions in full size</p>
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-5 h-5 text-rose-500" />
                    </div>
                    <p className="font-medium text-stone-900 mb-1">Vote</p>
                    <p className="text-stone-500">Click the heart to cast your vote</p>
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="font-medium text-stone-900 mb-1">Win</p>
                    <p className="text-stone-500">Top voted entries win prizes</p>
                  </div>
                </div>
              </div>
              
              {/* CTA Section */}
              <div className="text-center py-10">
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
