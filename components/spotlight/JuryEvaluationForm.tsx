'use client'

/**
 * ============================================================================
 * JURY EVALUATION FORM
 * ============================================================================
 * 
 * Form for jury members to score entries across all criteria.
 * Features sliders with real-time score preview.
 * ============================================================================
 */

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  EvaluationCriteria,
  CRITERIA_COLORS,
  formatScore,
} from '@/lib/spotlight/evaluation-types'
import { submitEvaluation } from '@/server/actions/evaluation.actions'

interface JuryEvaluationFormProps {
  entryId: string
  criteria: EvaluationCriteria[]
  existingScores?: Record<string, number>
  onSuccess?: () => void
  className?: string
}

export function JuryEvaluationForm({
  entryId,
  criteria,
  existingScores = {},
  onSuccess,
  className,
}: JuryEvaluationFormProps) {
  const [isPending, startTransition] = useTransition()
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    criteria.forEach(c => {
      initial[c.id] = existingScores[c.id] ?? 5
    })
    return initial
  })
  const [comments, setComments] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Calculate weighted average preview
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
  const weightedAvg = totalWeight > 0
    ? criteria.reduce((sum, c) => sum + (scores[c.id] || 0) * c.weight, 0) / totalWeight
    : 0
  
  const handleSubmit = () => {
    setError(null)
    
    startTransition(async () => {
      const result = await submitEvaluation({
        entryId,
        scores: criteria.map(c => ({
          criteriaId: c.id,
          score: scores[c.id] || 5,
          comment: comments[c.id] || undefined,
        })),
      })
      
      if (result.success) {
        setSuccess(true)
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to submit evaluation')
      }
    })
  }
  
  if (success) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-stone-900 mb-2">Evaluation Submitted</h3>
        <p className="text-stone-500">Thank you for your evaluation!</p>
      </div>
    )
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Preview */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h3 className="text-lg font-medium text-stone-900">Your Evaluation</h3>
          <p className="text-sm text-stone-500">Score each criteria from 0-10</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400 uppercase tracking-wider">Weighted Score</p>
          <p className="text-3xl font-bold text-stone-900 tabular-nums">
            {formatScore(weightedAvg)}
          </p>
        </div>
      </div>
      
      {/* Criteria Sliders */}
      <div className="space-y-6">
        {criteria.map(c => (
          <div key={c.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-stone-900">{c.name}</label>
                <p className="text-xs text-stone-400">{c.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: CRITERIA_COLORS[c.slug] }}
                >
                  {formatScore(scores[c.id])}
                </span>
                <span className="text-xs text-stone-400">
                  ({c.weight}%)
                </span>
              </div>
            </div>
            
            {/* Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={scores[c.id]}
                onChange={(e) => setScores(prev => ({
                  ...prev,
                  [c.id]: parseFloat(e.target.value),
                }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${CRITERIA_COLORS[c.slug]} 0%, ${CRITERIA_COLORS[c.slug]} ${(scores[c.id] / 10) * 100}%, #e7e5e4 ${(scores[c.id] / 10) * 100}%, #e7e5e4 100%)`,
                }}
              />
              {/* Score markers */}
              <div className="flex justify-between px-1 mt-1">
                {[0, 2.5, 5, 7.5, 10].map(v => (
                  <span key={v} className="text-[10px] text-stone-400">{v}</span>
                ))}
              </div>
            </div>
            
            {/* Optional comment */}
            <textarea
              placeholder="Add a comment (optional)..."
              value={comments[c.id] || ''}
              onChange={(e) => setComments(prev => ({
                ...prev,
                [c.id]: e.target.value,
              }))}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:border-stone-300"
            />
          </div>
        ))}
      </div>
      
      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className={cn(
          'w-full py-3 rounded-lg font-medium transition-all',
          'bg-stone-900 text-white hover:bg-stone-800',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isPending ? 'Submitting...' : 'Submit Evaluation'}
      </button>
      
      {/* Guidelines reminder */}
      <p className="text-xs text-stone-400 text-center">
        Please evaluate fairly based on the photography merit of this entry.
        Your scores will be averaged with other jury members.
      </p>
    </div>
  )
}
