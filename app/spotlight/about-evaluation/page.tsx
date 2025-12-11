/**
 * ============================================================================
 * ABOUT EVALUATION PAGE
 * ============================================================================
 * 
 * Explains the Spotlight evaluation system, criteria, jury process, and awards.
 * Light theme with Lucide icons.
 * ============================================================================
 */

import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Trophy, Star, Crown, Gem, Users, Scale, Award } from 'lucide-react'
import { getActiveJuryMembers, getEvaluationCriteria } from '@/server/actions/evaluation.actions'
import { CRITERIA_COLORS, AWARD_BADGES, type AwardType } from '@/lib/spotlight/evaluation-types'
import { AwardBadge } from '@/components/spotlight/AwardBadge'

export const dynamic = 'force-dynamic'

export default async function AboutEvaluationPage() {
  const [criteria, juryMembers] = await Promise.all([
    getEvaluationCriteria(),
    getActiveJuryMembers(),
  ])
  
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
            
            <h1 className="text-lg font-medium text-stone-900">Evaluation System</h1>
            
            <Link
              href="/spotlight/awards"
              className="text-sm text-stone-500 hover:text-stone-900"
            >
              View Awards →
            </Link>
          </div>
        </div>
      </header>
      
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="px-6 mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-6">
              Evaluation System
            </h1>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              Evaluating photography requires both technical expertise and artistic sensibility. 
              Our jury-based system ensures fair and transparent recognition for outstanding work.
            </p>
          </div>
        </section>
        
        {/* Criteria Section */}
        <section className="px-6 mb-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light text-stone-900 mb-4">Evaluation Criteria</h2>
              <p className="text-stone-500">
                Each entry is scored across multiple photography-specific criteria
              </p>
            </div>
            
            {/* Criteria Weight Visualization */}
            <div className="mb-12">
              <div className="h-3 rounded-full overflow-hidden flex bg-stone-100">
                {criteria.map((c, i) => (
                  <div
                    key={c.id}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${c.weight}%`,
                      backgroundColor: CRITERIA_COLORS[c.slug],
                    }}
                    title={`${c.name}: ${c.weight}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-3">
                {criteria.filter(c => c.weight > 0).map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CRITERIA_COLORS[c.slug] }}
                    />
                    <span className="text-stone-500">{c.name} ({c.weight}%)</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Criteria Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {criteria.filter(c => c.weight > 0).map(c => (
                <div
                  key={c.id}
                  className="p-6 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ 
                        backgroundColor: `${CRITERIA_COLORS[c.slug]}15`,
                        color: CRITERIA_COLORS[c.slug]
                      }}
                    >
                      {c.weight}%
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-stone-900 mb-2">{c.name}</h3>
                  <p className="text-stone-500 text-sm">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Scoring System */}
        <section className="px-6 mb-20 py-16 bg-stone-50">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-light text-stone-900 mb-6">A Fair & Transparent System</h2>
                <div className="space-y-4 text-stone-500">
                  <p>
                    Our evaluation system combines expert jury scoring with community engagement 
                    to create a balanced and fair assessment of each entry.
                  </p>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white border border-stone-200">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 text-sm font-bold">70%</span>
                    </div>
                    <div>
                      <p className="text-stone-900 font-medium">Jury Score</p>
                      <p className="text-sm">Weighted average from professional jury members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white border border-stone-200">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-sm font-bold">30%</span>
                    </div>
                    <div>
                      <p className="text-stone-900 font-medium">Community Score</p>
                      <p className="text-sm">Based on votes from verified community members</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-5 h-5 text-stone-400" />
                  <h3 className="text-lg font-medium text-stone-900">Outlier Removal</h3>
                </div>
                <p className="text-stone-500 mb-4">
                  To ensure fairness, when an entry receives 6 or more jury evaluations, 
                  the highest and lowest scores are automatically excluded from the final average.
                </p>
                <p className="text-stone-500">
                  This statistical approach, similar to Olympic judging, prevents any single 
                  extreme score from unfairly affecting the overall result.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Award Tiers */}
        <section className="px-6 mb-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light text-stone-900 mb-4">Award Tiers</h2>
              <p className="text-stone-500">
                Outstanding entries are recognized with prestigious awards
              </p>
            </div>
            
            {/* Award Journey */}
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-300 via-amber-300 to-blue-300 hidden lg:block" />
              
              <div className="space-y-8">
                {/* Step 1: Submit */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="lg:text-right lg:pr-12">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-100 border border-stone-200 text-stone-900 font-bold mb-4">1</span>
                    <h3 className="text-lg font-medium text-stone-900 mb-2">Submit Your Shot</h3>
                    <p className="text-stone-500">
                      Share your best work with the Spotlight community. Your entry will be 
                      reviewed by our team before being sent to the jury.
                    </p>
                  </div>
                  <div className="hidden lg:block" />
                </div>
                
                {/* Step 2: Jury Voting */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="hidden lg:block" />
                  <div className="lg:pl-12">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-100 border border-stone-200 text-stone-900 font-bold mb-4">2</span>
                    <h3 className="text-lg font-medium text-stone-900 mb-2">Jury Evaluation</h3>
                    <p className="text-stone-500">
                      Once approved, your entry is evaluated by our jury of professional 
                      photographers across all criteria. Community members can also vote.
                    </p>
                  </div>
                </div>
                
                {/* Step 3: Featured */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="lg:text-right lg:pr-12">
                    <div className="mb-4">
                      <AwardBadge award="featured" size="lg" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 mb-2">Score 6.5+ → Featured</h3>
                    <p className="text-stone-500">
                      Entries scoring 6.5 or higher earn Featured status, recognizing 
                      solid work that stands out in the community.
                    </p>
                  </div>
                  <div className="hidden lg:block" />
                </div>
                
                {/* Step 4: SOTD */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="hidden lg:block" />
                  <div className="lg:pl-12">
                    <div className="mb-4">
                      <AwardBadge award="shot_of_the_day" size="lg" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 mb-2">Daily Recognition</h3>
                    <p className="text-stone-500">
                      The highest-scoring entry each day (minimum 7.0) receives Shot of 
                      the Day, a career-defining achievement.
                    </p>
                  </div>
                </div>
                
                {/* Step 5: SOTM */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="lg:text-right lg:pr-12">
                    <div className="mb-4 lg:flex lg:justify-end">
                      <AwardBadge award="shot_of_the_month" size="lg" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 mb-2">Monthly Champion</h3>
                    <p className="text-stone-500">
                      The best SOTD winners compete for Shot of the Month. The jury 
                      re-evaluates top entries, and community votes carry extra weight.
                    </p>
                  </div>
                  <div className="hidden lg:block" />
                </div>
                
                {/* Step 6: SOTY */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="hidden lg:block" />
                  <div className="lg:pl-12">
                    <div className="mb-4">
                      <AwardBadge award="shot_of_the_year" size="lg" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 mb-2">Annual Excellence</h3>
                    <p className="text-stone-500">
                      All Shot of the Month winners are nominated for Shot of the Year, 
                      the most prestigious recognition in the Spotlight community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Jury Section */}
        <section className="px-6 mb-20 py-16 bg-stone-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light text-stone-900 mb-4">Our Jury</h2>
              <p className="text-stone-500">
                Expert photographers who evaluate submissions with care and expertise
              </p>
            </div>
            
            {juryMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
                  <Users className="w-7 h-7 text-stone-400" />
                </div>
                <p className="text-stone-500">Jury members coming soon</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {juryMembers.map(jury => (
                  <div
                    key={jury.id}
                    className="p-6 rounded-xl bg-white border border-stone-200"
                  >
                    <div className="flex items-start gap-4">
                      {jury.avatarUrl ? (
                        <Image
                          src={jury.avatarUrl}
                          alt={jury.displayName}
                          width={64}
                          height={64}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                          <span className="text-stone-500 text-xl">
                            {jury.displayName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-stone-900 truncate">{jury.displayName}</h3>
                        {jury.city && jury.country && (
                          <p className="text-sm text-stone-500">
                            {jury.city}, {jury.country}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {jury.specializations.map(spec => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 bg-stone-100 rounded text-xs text-stone-500 capitalize"
                            >
                              {spec.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {jury.bio && (
                      <p className="text-sm text-stone-500 mt-4 line-clamp-3">{jury.bio}</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between text-xs text-stone-400">
                      <span>{jury.totalEvaluations} evaluations</span>
                      {jury.websiteUrl && (
                        <a
                          href={jury.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-500 hover:text-stone-900"
                        >
                          Website →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        
        {/* CTA */}
        <section className="px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-light text-stone-900 mb-4">Ready to Shine?</h2>
            <p className="text-stone-500 mb-8">
              Submit your best work to the Spotlight and get recognized by our 
              expert jury and photography community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/spotlight"
                className="px-8 py-3 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
              >
                Enter Spotlight
              </Link>
              <Link
                href="/spotlight/awards"
                className="px-8 py-3 bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors"
              >
                View Awards
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
