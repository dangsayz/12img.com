/**
 * ============================================================================
 * SPOTLIGHT ENTRY EVALUATION PAGE
 * ============================================================================
 * 
 * Awwwards-style evaluation breakdown page for a single entry.
 * Shows full scoring details, jury evaluations, and awards.
 * 
 * @see lib/spotlight/evaluation-types.ts
 * ============================================================================
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getEntryEvaluation, isJuryMember, getEvaluationCriteria } from '@/server/actions/evaluation.actions'
import { ScoreDisplay } from '@/components/spotlight/ScoreDisplay'
import { AwardStack, AwardCard } from '@/components/spotlight/AwardBadge'
import { JuryEvaluationForm } from '@/components/spotlight/JuryEvaluationForm'
import { CRITERIA_COLORS, formatScore, getScoreColor } from '@/lib/spotlight/evaluation-types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ entryId: string }>
}

export default async function EntryEvaluationPage({ params }: Props) {
  const { entryId } = await params
  
  const [data, juryStatus] = await Promise.all([
    getEntryEvaluation(entryId),
    isJuryMember(),
  ])
  
  if (!data) {
    notFound()
  }
  
  const { entry, evaluations, criteria, juryCount, isEvaluationComplete } = data
  const { isJury, juryMember } = juryStatus
  
  // Group evaluations by jury member
  const evaluationsByJury = new Map<string, typeof evaluations>()
  for (const ev of evaluations) {
    const existing = evaluationsByJury.get(ev.juryMemberId) || []
    evaluationsByJury.set(ev.juryMemberId, [...existing, ev])
  }
  
  // Get existing scores for this jury member (if jury)
  const myExistingScores: Record<string, number> = {}
  if (juryMember) {
    const myEvaluations = evaluations.filter(e => e.juryMemberId === juryMember.id)
    myEvaluations.forEach(e => {
      myExistingScores[e.criteriaId] = e.score
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
            
            <div className="text-center">
              <p className="text-xs text-stone-400 uppercase tracking-wider">Evaluation</p>
            </div>
            
            <div className="w-24" /> {/* Spacer */}
          </div>
        </div>
      </header>
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero Section - Image + Score */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
              <Image
                src={entry.image.previewUrl || entry.image.thumbnailUrl}
                alt={entry.caption || 'Spotlight entry'}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              
              {/* Awards overlay */}
              {entry.awards.length > 0 && (
                <div className="absolute top-4 left-4">
                  <AwardStack awards={entry.awards} size="md" />
                </div>
              )}
            </div>
            
            {/* Score Panel */}
            <div className="flex flex-col justify-center">
              {/* Big Score Display */}
              <div className="mb-8">
                <p className="text-sm text-stone-400 uppercase tracking-wider mb-2">Overall Score</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-stone-300 text-4xl">→</span>
                  <span className={`text-7xl font-bold tabular-nums ${getScoreColor(entry.scores?.overallScore ?? null)}`}>
                    {formatScore(entry.scores?.overallScore ?? null)}
                  </span>
                  <span className="text-stone-400 text-2xl">/ 10</span>
                </div>
              </div>
              
              {/* Score Breakdown */}
              {entry.scores && (
                <ScoreDisplay 
                  scores={entry.scores} 
                  showBreakdown={true}
                  size="lg"
                  animated={true}
                />
              )}
              
              {/* Photographer Info */}
              <div className="mt-8 pt-6 border-t border-stone-200">
                <Link 
                  href={entry.photographer.slug ? `/@${entry.photographer.slug}` : '#'}
                  className="flex items-center gap-3 group"
                >
                  {entry.photographer.avatarUrl ? (
                    <Image
                      src={entry.photographer.avatarUrl}
                      alt={entry.photographer.displayName}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
                      <span className="text-stone-500 text-lg">
                        {entry.photographer.displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-stone-900 font-medium group-hover:underline">
                      {entry.photographer.displayName}
                    </p>
                    {entry.photographer.country && (
                      <p className="text-sm text-stone-500">from {entry.photographer.country}</p>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Detailed Breakdown */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Criteria Scores */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-medium text-stone-900">Criteria Breakdown</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {criteria.map(c => {
                  const score = entry.scores ? (entry.scores as any)[`${c.slug}Score`] : null
                  
                  return (
                    <div
                      key={c.id}
                      className="p-5 rounded-xl bg-stone-50 border border-stone-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-stone-900">{c.name}</h3>
                          <p className="text-xs text-stone-400 mt-0.5">{c.weight}% weight</p>
                        </div>
                        <span
                          className="text-3xl font-bold tabular-nums"
                          style={{ color: CRITERIA_COLORS[c.slug] }}
                        >
                          {formatScore(score)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">{c.description}</p>
                      
                      {/* Progress bar */}
                      <div className="mt-3 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${((score || 0) / 10) * 100}%`,
                            backgroundColor: CRITERIA_COLORS[c.slug],
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Jury Evaluations Table */}
              {juryCount > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-stone-900 mb-4">Jury Evaluations</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-200">
                          <th className="text-left py-3 text-sm text-stone-400 font-normal">Jury</th>
                          {criteria.map(c => (
                            <th 
                              key={c.id} 
                              className="text-center py-3 text-sm text-stone-400 font-normal px-2"
                            >
                              {c.name.substring(0, 4)}
                            </th>
                          ))}
                          <th className="text-right py-3 text-sm text-stone-400 font-normal">Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(evaluationsByJury.entries()).map(([juryId, evals]) => {
                          const firstEval = evals[0]
                          const avgScore = evals.reduce((sum, e) => sum + e.score, 0) / evals.length
                          
                          return (
                            <tr key={juryId} className="border-b border-stone-100">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  {firstEval.juryMember.avatarUrl ? (
                                    <Image
                                      src={firstEval.juryMember.avatarUrl}
                                      alt={firstEval.juryMember.displayName}
                                      width={32}
                                      height={32}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                                      <span className="text-stone-500 text-xs">
                                        {firstEval.juryMember.displayName.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm text-stone-900">{firstEval.juryMember.displayName}</p>
                                    {firstEval.juryMember.country && (
                                      <p className="text-xs text-stone-400">{firstEval.juryMember.country}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {criteria.map(c => {
                                const eval_ = evals.find(e => e.criteriaId === c.id)
                                return (
                                  <td key={c.id} className="text-center py-4 px-2">
                                    <span className={`text-sm font-medium ${getScoreColor(eval_?.score ?? null)}`}>
                                      {eval_ ? formatScore(eval_.score) : '-'}
                                    </span>
                                  </td>
                                )
                              })}
                              <td className="text-right py-4">
                                <span className={`text-sm font-bold ${getScoreColor(avgScore)}`}>
                                  {formatScore(avgScore)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {entry.scores && entry.scores.scoresExcluded > 0 && (
                    <p className="text-xs text-stone-400 mt-4">
                      * {entry.scores.scoresExcluded} outlier scores excluded from the final average
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Awards */}
              {entry.awards.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-stone-900 mb-4">Awards</h2>
                  <div className="space-y-3">
                    {entry.awards.map(award => (
                      <AwardCard key={award.id} award={award} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Jury Evaluation Form */}
              {isJury && juryMember && (
                <div className="p-6 rounded-xl bg-stone-50 border border-stone-200">
                  <JuryEvaluationForm
                    entryId={entryId}
                    criteria={criteria}
                    existingScores={myExistingScores}
                  />
                </div>
              )}
              
              {/* Stats */}
              <div className="p-6 rounded-xl bg-stone-50 border border-stone-200">
                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Stats</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Community Votes</dt>
                    <dd className="text-stone-900 font-medium">{entry.voteCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Jury Evaluations</dt>
                    <dd className="text-stone-900 font-medium">{juryCount}</dd>
                  </div>
                  {entry.scores && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-stone-500">Views</dt>
                        <dd className="text-stone-900 font-medium">{entry.scores.viewCount}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Submitted</dt>
                    <dd className="text-stone-900 font-medium">
                      {entry.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
              
              {/* Evaluation Status */}
              <div className={`p-4 rounded-xl border ${isEvaluationComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isEvaluationComplete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className={`text-sm font-medium ${isEvaluationComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isEvaluationComplete ? 'Evaluation Complete' : 'Evaluation in Progress'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  {isEvaluationComplete 
                    ? 'This entry has been fully evaluated by our jury.'
                    : `${juryCount}/3 jury members have evaluated this entry.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
