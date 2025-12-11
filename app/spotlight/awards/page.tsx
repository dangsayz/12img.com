/**
 * ============================================================================
 * SPOTLIGHT AWARDS PAGE
 * ============================================================================
 * 
 * Showcase of all Spotlight awards: SOTD, Featured, SOTM, SOTY.
 * Similar to Awwwards' winners pages.
 * ============================================================================
 */

import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Trophy, Crown, Gem } from 'lucide-react'
import { getRecentAwards } from '@/server/actions/evaluation.actions'
import { AwardBadge } from '@/components/spotlight/AwardBadge'
import { formatScore, getScoreColor, AWARD_BADGES, type AwardType } from '@/lib/spotlight/evaluation-types'

export const dynamic = 'force-dynamic'

export default async function AwardsPage() {
  const { recentSotd, recentFeatured, sotmWinners, sotyWinners } = await getRecentAwards(10)
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/spotlight"
              className="text-stone-500 hover:text-stone-900 transition-colors text-sm"
            >
              ← Back to Spotlight
            </Link>
            
            <h1 className="text-lg font-medium text-stone-900">Awards</h1>
            
            <div className="w-24" />
          </div>
        </div>
      </header>
      
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-4">
              Spotlight Awards
            </h1>
            <p className="text-stone-500 text-lg max-w-2xl mx-auto">
              Celebrating exceptional photography recognized by our jury and community
            </p>
          </div>
          
          {/* Award Categories Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {(['shot_of_the_year', 'shot_of_the_month', 'shot_of_the_day', 'featured'] as AwardType[]).map(type => (
              <a
                key={type}
                href={`#${type}`}
                className="group"
              >
                <AwardBadge award={type} size="lg" />
              </a>
            ))}
          </div>
          
          {/* Shot of the Year */}
          <section id="shot_of_the_year" className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-200">
                <Gem className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-stone-900">Shot of the Year</h2>
                <p className="text-stone-500">The most outstanding photograph of the year</p>
              </div>
            </div>
            
            {sotyWinners.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-50 border border-stone-200 text-center">
                <p className="text-stone-500">No Shot of the Year awards yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sotyWinners.map(award => (
                  <AwardEntryCard key={award.id} award={award} featured />
                ))}
              </div>
            )}
          </section>
          
          {/* Shot of the Month */}
          <section id="shot_of_the_month" className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-pink-50 border border-pink-200">
                <Crown className="w-7 h-7 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-stone-900">Shot of the Month</h2>
                <p className="text-stone-500">Best performing entries each month</p>
              </div>
            </div>
            
            {sotmWinners.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-50 border border-stone-200 text-center">
                <p className="text-stone-500">No Shot of the Month awards yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sotmWinners.map(award => (
                  <AwardEntryCard key={award.id} award={award} />
                ))}
              </div>
            )}
          </section>
          
          {/* Shot of the Day */}
          <section id="shot_of_the_day" className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-200">
                  <Trophy className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-stone-900">Shot of the Day</h2>
                  <p className="text-stone-500">Daily recognition for outstanding work</p>
                </div>
              </div>
              <Link
                href="/spotlight/awards/sotd"
                className="text-sm text-stone-500 hover:text-stone-900"
              >
                View all →
              </Link>
            </div>
            
            {recentSotd.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-50 border border-stone-200 text-center">
                <p className="text-stone-500">No Shot of the Day awards yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentSotd.map(award => (
                  <AwardEntryCard key={award.id} award={award} compact />
                ))}
              </div>
            )}
          </section>
          
          {/* Featured */}
          <section id="featured" className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
                  <Sparkles className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-stone-900">Featured</h2>
                  <p className="text-stone-500">Entries scoring 6.5 or higher</p>
                </div>
              </div>
              <Link
                href="/spotlight/awards/featured"
                className="text-sm text-stone-500 hover:text-stone-900"
              >
                View all →
              </Link>
            </div>
            
            {recentFeatured.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-50 border border-stone-200 text-center">
                <p className="text-stone-500">No Featured entries yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentFeatured.map(award => (
                  <AwardEntryCard key={award.id} award={award} compact />
                ))}
              </div>
            )}
          </section>
          
          {/* How to Win */}
          <section className="mt-20 p-8 rounded-2xl bg-stone-50 border border-stone-200">
            <h2 className="text-xl font-medium text-stone-900 mb-6 text-center">How to Win</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-medium text-stone-900 mb-2">Featured</h3>
                <p className="text-sm text-stone-500">Score 6.5+ from the jury to earn Featured status</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="font-medium text-stone-900 mb-2">Shot of the Day</h3>
                <p className="text-sm text-stone-500">Be the highest-scoring entry on any given day</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="font-medium text-stone-900 mb-2">Shot of the Month</h3>
                <p className="text-sm text-stone-500">Win SOTD and receive the highest monthly score</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Gem className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-medium text-stone-900 mb-2">Shot of the Year</h3>
                <p className="text-sm text-stone-500">Be selected from SOTM winners as the year's best</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

// Award Entry Card Component
function AwardEntryCard({ 
  award, 
  featured = false,
  compact = false,
}: { 
  award: any
  featured?: boolean
  compact?: boolean
}) {
  if (!award.entry) return null
  
  return (
    <Link
      href={`/spotlight/entry/${award.entry.id}`}
      className={`group block rounded-xl overflow-hidden bg-white border border-stone-200 hover:border-stone-300 transition-all ${featured ? 'lg:col-span-1' : ''}`}
    >
      {/* Image */}
      <div className={`relative ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <Image
          src={award.entry.image.previewUrl || award.entry.image.thumbnailUrl}
          alt={award.entry.caption || 'Award entry'}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes={compact ? '200px' : '400px'}
        />
        
        {/* Score Badge */}
        {award.finalScore && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-stone-200">
            <span className={`text-sm font-bold ${getScoreColor(award.finalScore)}`}>
              {formatScore(award.finalScore)}
            </span>
          </div>
        )}
      </div>
      
      {/* Info */}
      {!compact && (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            {award.photographer.avatarUrl ? (
              <Image
                src={award.photographer.avatarUrl}
                alt={award.photographer.displayName}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                <span className="text-stone-500 text-xs">
                  {award.photographer.displayName.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-stone-900 font-medium truncate">
              {award.photographer.displayName}
            </span>
          </div>
          <p className="text-xs text-stone-400">
            {new Date(award.awardDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      )}
    </Link>
  )
}
