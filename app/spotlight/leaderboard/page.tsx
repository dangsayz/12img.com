/**
 * ============================================================================
 * SPOTLIGHT LEADERBOARD PAGE
 * ============================================================================
 * 
 * Monthly rankings of photographers based on their Spotlight performance.
 * Shows top photographers with their scores and awards.
 * ============================================================================
 */

import Link from 'next/link'
import Image from 'next/image'
import { getLeaderboard } from '@/server/actions/evaluation.actions'
import { formatScore, getScoreColor, AWARD_BADGES } from '@/lib/spotlight/evaluation-types'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : undefined
  const month = params.month ? parseInt(params.month) : undefined
  
  const { rankings, period, totalPhotographers } = await getLeaderboard(year, month, 50)
  
  // Generate available months for navigation (last 12 months)
  const availableMonths = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    availableMonths.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    })
  }
  
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
            
            <h1 className="text-lg font-medium text-stone-900">Leaderboard</h1>
            
            <div className="w-24" />
          </div>
        </div>
      </header>
      
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-4">
              Photographer Rankings
            </h1>
            <p className="text-stone-500 text-lg">
              Top performers in the Spotlight community
            </p>
          </div>
          
          {/* Month Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {availableMonths.map((m, i) => {
              const isActive = m.year === period.year && m.month === period.month
              return (
                <Link
                  key={`${m.year}-${m.month}`}
                  href={`/spotlight/leaderboard?year=${m.year}&month=${m.month}`}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    isActive
                      ? 'bg-stone-900 text-white font-medium'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  {m.label}
                </Link>
              )
            })}
          </div>
          
          {/* Period Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
            <div>
              <h2 className="text-xl font-medium text-stone-900">{period.label}</h2>
              <p className="text-sm text-stone-500">{totalPhotographers} photographers ranked</p>
            </div>
          </div>
          
          {/* Rankings Table */}
          {rankings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-stone-500">No rankings for this period yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((ranking, index) => {
                const isTop3 = (ranking.rank || index + 1) <= 3
                const rankColors = ['text-amber-500', 'text-stone-400', 'text-amber-700']
                
                return (
                  <div
                    key={ranking.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isTop3 ? 'bg-stone-100' : 'bg-stone-50 hover:bg-stone-100'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-12 text-center ${isTop3 ? 'text-2xl font-bold' : 'text-lg'} ${rankColors[(ranking.rank || index + 1) - 1] || 'text-stone-500'}`}>
                      {ranking.rank || index + 1}
                    </div>
                    
                    {/* Photographer */}
                    <Link
                      href={ranking.photographer.slug ? `/@${ranking.photographer.slug}` : '#'}
                      className="flex items-center gap-3 flex-1 min-w-0 group"
                    >
                      {ranking.photographer.avatarUrl ? (
                        <Image
                          src={ranking.photographer.avatarUrl}
                          alt={ranking.photographer.displayName}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-stone-500">
                            {ranking.photographer.displayName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-stone-900 font-medium truncate group-hover:underline">
                          {ranking.photographer.displayName}
                        </p>
                        {ranking.photographer.country && (
                          <p className="text-sm text-stone-500">
                            {ranking.photographer.country}
                          </p>
                        )}
                      </div>
                    </Link>
                    
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">Entries</p>
                        <p className="text-stone-900 font-medium">{ranking.entriesSubmitted}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">Featured</p>
                        <p className="text-emerald-600 font-medium">{ranking.featuredCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">SOTD</p>
                        <p className="text-amber-600 font-medium">{ranking.sotdCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">Votes</p>
                        <p className="text-stone-900 font-medium">{ranking.totalVotesReceived}</p>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                      <p className={`text-2xl font-bold tabular-nums ${getScoreColor(ranking.averageScore)}`}>
                        {formatScore(ranking.averageScore)}
                      </p>
                      <p className="text-xs text-stone-400">avg score</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-12 p-6 rounded-xl bg-stone-50 border border-stone-200">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
              How Rankings Work
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-stone-500">
              <p>
                <span className="text-stone-900">Average Score:</span> The mean of all jury scores received during the month.
              </p>
              <p>
                <span className="text-stone-900">Featured:</span> Entries scoring 6.5 or higher receive Featured status.
              </p>
              <p>
                <span className="text-stone-900">SOTD:</span> Shot of the Day is awarded to the highest-scoring entry each day.
              </p>
              <p>
                <span className="text-stone-900">Votes:</span> Total community votes received on all entries.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
