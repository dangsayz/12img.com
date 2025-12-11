/**
 * ============================================================================
 * SPOTLIGHT EVALUATION SYSTEM - Type Definitions
 * ============================================================================
 * 
 * Types for the state-of-the-art photography evaluation system.
 * Inspired by Awwwards but tailored for photography.
 * 
 * @see database/migrations/061-spotlight-evaluation-system.sql
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type AwardType =
  | 'featured'              // Score ≥ 6.5/10
  | 'shot_of_the_day'       // Highest scoring entry of the day
  | 'photographer_of_week'  // Most consistent quality
  | 'shot_of_the_month'     // Best of monthly winners
  | 'shot_of_the_year'      // Annual recognition

export type JurySpecialization =
  | 'portrait'
  | 'landscape'
  | 'wedding'
  | 'commercial'
  | 'street'
  | 'documentary'
  | 'fine_art'
  | 'general'

// ─────────────────────────────────────────────────────────────────────────────
// CORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface EvaluationCriteria {
  id: string
  name: string
  slug: string
  description: string
  weight: number
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface JuryMember {
  id: string
  userId: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  websiteUrl: string | null
  specializations: JurySpecialization[]
  isActive: boolean
  totalEvaluations: number
  averageScoreGiven: number | null
  country: string | null
  city: string | null
  appointedAt: Date
  appointedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EntryEvaluation {
  id: string
  entryId: string
  juryMemberId: string
  criteriaId: string
  score: number
  comment: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EntryScores {
  id: string
  entryId: string
  
  // Aggregate scores (all 0-10 scale)
  juryScore: number | null
  communityScore: number | null
  overallScore: number | null
  
  // Per-criteria averages
  compositionScore: number | null
  lightingScore: number | null
  technicalScore: number | null
  creativityScore: number | null
  impactScore: number | null
  postProcessingScore: number | null
  
  // Statistics
  juryCount: number
  scoresExcluded: number
  
  // Engagement
  viewCount: number
  saveCount: number
  shareCount: number
  
  // Evaluation timing
  evaluationStartedAt: Date | null
  evaluationCompletedAt: Date | null
  
  createdAt: Date
  updatedAt: Date
}

export interface SpotlightAward {
  id: string
  entryId: string | null
  userId: string
  contestId: string | null
  awardType: AwardType
  awardDate: Date
  finalScore: number | null
  badgeUrl: string | null
  citation: string | null
  awardedAt: Date
  awardedBy: string | null
  createdAt: Date
}

export interface PhotographerRanking {
  id: string
  userId: string
  periodYear: number
  periodMonth: number
  entriesSubmitted: number
  entriesFeatured: number
  totalVotesReceived: number
  averageScore: number | null
  highestScore: number | null
  sotdCount: number
  featuredCount: number
  rank: number | null
  calculatedAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED TYPES (with relations)
// ─────────────────────────────────────────────────────────────────────────────

export interface JuryMemberWithProfile extends JuryMember {
  profile: {
    displayName: string
    avatarUrl: string | null
    slug: string | null
  }
}

export interface EntryEvaluationWithDetails extends EntryEvaluation {
  juryMember: {
    id: string
    displayName: string
    avatarUrl: string | null
    country: string | null
    specializations: JurySpecialization[]
  }
  criteria: {
    name: string
    slug: string
    weight: number
  }
}

export interface EntryWithScores {
  id: string
  contestId: string
  imageId: string
  userId: string
  approved: boolean
  voteCount: number
  caption: string | null
  createdAt: Date
  
  // Relations
  scores: EntryScores | null
  awards: SpotlightAward[]
  
  // Image data
  image: {
    id: string
    thumbnailUrl: string
    previewUrl: string
    originalUrl: string
    width: number | null
    height: number | null
  }
  
  // Photographer data
  photographer: {
    id: string
    displayName: string
    avatarUrl: string | null
    slug: string | null
    country: string | null
  }
}

export interface EntryEvaluationPage {
  entry: EntryWithScores
  evaluations: EntryEvaluationWithDetails[]
  criteria: EvaluationCriteria[]
  juryCount: number
  isEvaluationComplete: boolean
}

export interface SpotlightAwardWithEntry extends SpotlightAward {
  entry: {
    id: string
    image: {
      thumbnailUrl: string
      previewUrl: string
    }
    caption: string | null
  } | null
  photographer: {
    id: string
    displayName: string
    avatarUrl: string | null
    slug: string | null
  }
}

export interface RankingWithPhotographer extends PhotographerRanking {
  photographer: {
    id: string
    displayName: string
    avatarUrl: string | null
    slug: string | null
    country: string | null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API INPUT/OUTPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitEvaluationInput {
  entryId: string
  scores: {
    criteriaId: string
    score: number
    comment?: string
  }[]
}

export interface SubmitEvaluationResult {
  success: boolean
  error?: string
  evaluation?: EntryEvaluation[]
}

export interface GetLeaderboardInput {
  year?: number
  month?: number
  limit?: number
}

export interface LeaderboardData {
  rankings: RankingWithPhotographer[]
  period: {
    year: number
    month: number
    label: string
  }
  totalPhotographers: number
}

export interface AwardsPageData {
  recentSotd: SpotlightAwardWithEntry[]
  recentFeatured: SpotlightAwardWithEntry[]
  sotmWinners: SpotlightAwardWithEntry[]
  sotyWinners: SpotlightAwardWithEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// UI DISPLAY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoreDisplayData {
  overall: number | null
  jury: number | null
  community: number | null
  breakdown: {
    name: string
    slug: string
    score: number | null
    weight: number
    color: string
  }[]
}

export interface AwardBadge {
  type: AwardType
  label: string
  iconName: 'Sparkles' | 'Trophy' | 'Star' | 'Crown' | 'Gem'
  color: string
  bgColor: string
  borderColor: string
}

export const AWARD_BADGES: Record<AwardType, AwardBadge> = {
  featured: {
    type: 'featured',
    label: 'Featured',
    iconName: 'Sparkles',
    color: '#10B981',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  shot_of_the_day: {
    type: 'shot_of_the_day',
    label: 'Shot of the Day',
    iconName: 'Trophy',
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  photographer_of_week: {
    type: 'photographer_of_week',
    label: 'Photographer of the Week',
    iconName: 'Star',
    color: '#8B5CF6',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  shot_of_the_month: {
    type: 'shot_of_the_month',
    label: 'Shot of the Month',
    iconName: 'Crown',
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  shot_of_the_year: {
    type: 'shot_of_the_year',
    label: 'Shot of the Year',
    iconName: 'Gem',
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
}

export const CRITERIA_COLORS: Record<string, string> = {
  composition: '#3B82F6',    // Blue
  lighting: '#F59E0B',       // Amber
  technical: '#10B981',      // Emerald
  creativity: '#8B5CF6',     // Violet
  impact: '#EC4899',         // Pink
  post_processing: '#6B7280', // Gray
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function formatScore(score: number | null): string {
  if (score === null) return '-'
  return score.toFixed(2)
}

export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-stone-400'
  if (score >= 8) return 'text-emerald-600'
  if (score >= 7) return 'text-green-600'
  if (score >= 6) return 'text-amber-600'
  if (score >= 5) return 'text-orange-600'
  return 'text-red-600'
}

export function getScoreLabel(score: number | null): string {
  if (score === null) return 'Not Rated'
  if (score >= 9) return 'Exceptional'
  if (score >= 8) return 'Outstanding'
  if (score >= 7) return 'Excellent'
  if (score >= 6.5) return 'Great'
  if (score >= 6) return 'Good'
  if (score >= 5) return 'Average'
  return 'Below Average'
}

export function isEligibleForAward(scores: EntryScores | null, award: AwardType): boolean {
  if (!scores || scores.overallScore === null) return false
  
  switch (award) {
    case 'featured':
      return scores.overallScore >= 6.5 && scores.juryCount >= 2
    case 'shot_of_the_day':
      return scores.overallScore >= 7.0 && scores.juryCount >= 3
    case 'shot_of_the_month':
      return scores.overallScore >= 7.5 && scores.juryCount >= 5
    case 'shot_of_the_year':
      return scores.overallScore >= 8.0 && scores.juryCount >= 5
    default:
      return false
  }
}

export function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
