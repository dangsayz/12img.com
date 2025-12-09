/**
 * ============================================================================
 * COMMUNITY SPOTLIGHT - Type Definitions
 * ============================================================================
 * 
 * Types for the monthly photo-voting contest system.
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md for full documentation
 * @see database/migrations/050-community-spotlight.sql for schema
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type ContestStatus = 
  | 'draft'              // Admin is setting up
  | 'submissions_open'   // Accepting photo submissions
  | 'voting'             // Voting in progress
  | 'finished'           // Winner selected
  | 'cancelled'          // Contest cancelled

// ─────────────────────────────────────────────────────────────────────────────
// CORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Contest {
  id: string
  name: string
  theme: string | null
  description: string | null
  coverImageUrl: string | null
  
  // Timing
  submissionStartsAt: Date
  submissionEndsAt: Date
  votingStartsAt: Date
  votingEndsAt: Date
  
  // Status
  status: ContestStatus
  
  // Settings
  maxEntriesPerUser: number
  maxVotesPerUser: number
  showVoteCounts: boolean
  requireApproval: boolean
  minAccountAgeDays: number
  
  // Winner
  winnerEntryId: string | null
  
  // Audit
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ContestEntry {
  id: string
  contestId: string
  imageId: string
  userId: string
  
  // Approval
  approved: boolean
  rejected: boolean
  rejectionReason: string | null
  approvedAt: Date | null
  approvedBy: string | null
  
  // Stats
  voteCount: number
  
  // Content
  caption: string | null
  
  // Audit
  createdAt: Date
}

export interface ContestVote {
  id: string
  contestId: string
  entryId: string
  voterId: string
  createdAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED TYPES (with relations)
// ─────────────────────────────────────────────────────────────────────────────

export interface ContestWithStats extends Contest {
  entryCount: number
  totalVotes: number
  winnerEntry?: ContestEntryWithImage | null
}

export interface ContestEntryWithImage extends ContestEntry {
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
  }
}

export interface ContestEntryWithVoteStatus extends ContestEntryWithImage {
  hasVoted: boolean  // Whether current user has voted for this entry
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ContestPageData {
  contest: ContestWithStats
  entries: ContestEntryWithVoteStatus[]
  userVoteCount: number
  canVote: boolean
  canSubmit: boolean
  userEntry: ContestEntry | null
  /** Whether the user is on a paid plan (can participate) */
  isPaidUser: boolean
  /** Whether the user is logged in */
  isLoggedIn: boolean
}

export interface SubmitEntryResult {
  success: boolean
  entry?: ContestEntry
  error?: string
}

export interface VoteResult {
  success: boolean
  newVoteCount?: number
  userVoteCount?: number
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE SPOTLIGHT CARD
// ─────────────────────────────────────────────────────────────────────────────

export type SpotlightCardState = 
  | 'winner'           // Show last month's winner
  | 'voting'           // Voting in progress
  | 'submissions'      // Accepting submissions
  | 'coming_soon'      // Next contest announced
  | 'none'             // No active contest

export interface SpotlightCardData {
  state: SpotlightCardState
  
  // For 'winner' state
  winner?: {
    imageUrl: string
    photographerName: string
    photographerSlug: string | null
    contestName: string
    contestTheme: string | null
  }
  
  // For 'voting' state
  voting?: {
    contestId: string
    contestName: string
    endsAt: Date
    entryCount: number
  }
  
  // For 'submissions' state
  submissions?: {
    contestId: string
    contestName: string
    theme: string | null
    endsAt: Date
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateContestInput {
  name: string
  theme?: string
  description?: string
  submissionStartsAt: Date
  submissionEndsAt: Date
  votingStartsAt: Date
  votingEndsAt: Date
  maxEntriesPerUser?: number
  maxVotesPerUser?: number
  showVoteCounts?: boolean
  requireApproval?: boolean
}

export interface UpdateContestInput {
  id: string
  name?: string
  theme?: string
  description?: string
  status?: ContestStatus
  submissionStartsAt?: Date
  submissionEndsAt?: Date
  votingStartsAt?: Date
  votingEndsAt?: Date
  maxEntriesPerUser?: number
  maxVotesPerUser?: number
  showVoteCounts?: boolean
  requireApproval?: boolean
}

export interface ApproveEntryInput {
  entryId: string
  approved: boolean
  rejectionReason?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const CONTEST_STATUS_LABELS: Record<ContestStatus, string> = {
  draft: 'Draft',
  submissions_open: 'Accepting Submissions',
  voting: 'Voting Open',
  finished: 'Finished',
  cancelled: 'Cancelled',
}

export const CONTEST_STATUS_COLORS: Record<ContestStatus, string> = {
  draft: 'bg-stone-100 text-stone-600',
  submissions_open: 'bg-blue-100 text-blue-700',
  voting: 'bg-emerald-100 text-emerald-700',
  finished: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
}
