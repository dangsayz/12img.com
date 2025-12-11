/**
 * ============================================================================
 * COMMUNITY SPOTLIGHT - Server Actions
 * ============================================================================
 * 
 * Server actions for the monthly photo-voting contest system.
 * 
 * ACTIONS:
 * - getActiveContest()      - Get current active contest
 * - getContestEntries()     - Get entries for a contest
 * - submitEntry()           - Submit a photo to contest
 * - castVote()              - Vote for an entry
 * - removeVote()            - Remove a vote
 * - getUserVotes()          - Get user's votes for a contest
 * - getSpotlightCardData()  - Get data for homepage card
 * 
 * ADMIN ACTIONS:
 * - createContest()         - Create new contest
 * - updateContest()         - Update contest settings
 * - approveEntry()          - Approve/reject entry
 * - selectWinner()          - Manually select winner
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, getUserWithUsage } from '@/server/queries/user.queries'
import { normalizePlanId, type PlanId } from '@/lib/config/pricing'

// Paid plans that can participate in contests
const PAID_PLANS: PlanId[] = ['essential', 'pro', 'studio', 'elite']
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import type {
  Contest,
  ContestEntry,
  ContestWithStats,
  ContestEntryWithImage,
  ContestEntryWithVoteStatus,
  ContestPageData,
  SpotlightCardData,
  SpotlightCardState,
  SubmitEntryResult,
  VoteResult,
  CreateContestInput,
  UpdateContestInput,
  ApproveEntryInput,
  ContestStatus,
} from '@/lib/contest/types'

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Map DB row to Contest type
// ─────────────────────────────────────────────────────────────────────────────
function mapContest(row: any): Contest {
  return {
    id: row.id,
    name: row.name,
    theme: row.theme,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    submissionStartsAt: new Date(row.submission_starts_at),
    submissionEndsAt: new Date(row.submission_ends_at),
    votingStartsAt: new Date(row.voting_starts_at),
    votingEndsAt: new Date(row.voting_ends_at),
    status: row.status as ContestStatus,
    maxEntriesPerUser: row.max_entries_per_user,
    maxVotesPerUser: row.max_votes_per_user,
    showVoteCounts: row.show_vote_counts,
    requireApproval: row.require_approval,
    minAccountAgeDays: row.min_account_age_days,
    winnerEntryId: row.winner_entry_id,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapEntry(row: any): ContestEntry {
  return {
    id: row.id,
    contestId: row.contest_id,
    imageId: row.image_id,
    userId: row.user_id,
    approved: row.approved,
    rejected: row.rejected,
    rejectionReason: row.rejection_reason,
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    approvedBy: row.approved_by,
    voteCount: row.vote_count,
    caption: row.caption,
    createdAt: new Date(row.created_at),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Active Contest
// ─────────────────────────────────────────────────────────────────────────────
export async function getActiveContest(): Promise<ContestWithStats | null> {
  const supabase = createServerClient()
  
  // Get contest that's either accepting submissions or in voting
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .in('status', ['submissions_open', 'voting'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Get entry count
  const { count: entryCount } = await supabase
    .from('contest_entries')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', data.id)
    .eq('approved', true)
  
  // Get total votes
  const { count: totalVotes } = await supabase
    .from('contest_votes')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', data.id)
  
  return {
    ...mapContest(data),
    entryCount: entryCount || 0,
    totalVotes: totalVotes || 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Contest by ID
// ─────────────────────────────────────────────────────────────────────────────
export async function getContestById(contestId: string): Promise<Contest | null> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('id', contestId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return mapContest(data)
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Contest Entries with Images
// ─────────────────────────────────────────────────────────────────────────────
export async function getContestEntries(
  contestId: string,
  userId?: string
): Promise<ContestEntryWithVoteStatus[]> {
  // Use admin client to bypass RLS on images table for public contest viewing
  // We already filter to approved=true entries only
  const { data: entries, error } = await supabaseAdmin
    .from('contest_entries')
    .select(`
      *,
      images!inner (
        id,
        storage_path,
        width,
        height
      ),
      profiles:user_id (
        id,
        display_name,
        avatar_url,
        slug
      )
    `)
    .eq('contest_id', contestId)
    .eq('approved', true)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('[Contest] Error fetching entries:', JSON.stringify(error, null, 2))
    return []
  }
  
  if (!entries) {
    return []
  }
  
  // Get user's votes if logged in
  let userVotes: Set<string> = new Set()
  if (userId) {
    const { data: votes } = await supabaseAdmin
      .from('contest_votes')
      .select('entry_id')
      .eq('contest_id', contestId)
      .eq('voter_id', userId)
    
    if (votes) {
      userVotes = new Set(votes.map((v: { entry_id: string }) => v.entry_id))
    }
  }
  
  // Get signed URLs for all images
  const storagePaths = entries.map((e: any) => e.images.storage_path)
  const signedUrls = await getSignedUrlsWithSizes(storagePaths)
  
  // Map to response type
  return entries.map((entry: any) => {
    const urls = signedUrls.get(entry.images.storage_path)
    const profile = entry.profiles || {}
    
    return {
      ...mapEntry(entry),
      image: {
        id: entry.images.id,
        thumbnailUrl: urls?.thumbnail || '',
        previewUrl: urls?.preview || '',
        originalUrl: urls?.original || '',
        width: entry.images.width,
        height: entry.images.height,
      },
      photographer: {
        id: profile.id || entry.user_id,
        displayName: profile.display_name || 'Photographer',
        avatarUrl: profile.avatar_url,
        slug: profile.slug,
      },
      hasVoted: userVotes.has(entry.id),
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Full Contest Page Data
// ─────────────────────────────────────────────────────────────────────────────
export async function getContestPageData(contestId: string): Promise<ContestPageData | null> {
  const supabase = createServerClient()
  
  // Get current user via Clerk
  const { userId: clerkId } = await auth()
  
  // Get user data with plan info if logged in
  let userId: string | undefined
  let isPaidUser = false
  
  if (clerkId) {
    const userData = await getUserWithUsage(clerkId)
    if (userData) {
      userId = userData.id
      const userPlan = normalizePlanId(userData.plan)
      isPaidUser = PAID_PLANS.includes(userPlan)
    }
  }
  
  // Get contest
  const contest = await getActiveContest()
  if (!contest || contest.id !== contestId) {
    return null
  }
  
  // Get entries
  const entries = await getContestEntries(contestId, userId)
  
  // Get user's vote count
  let userVoteCount = 0
  let userEntry: ContestEntry | null = null
  
  if (userId) {
    const { count } = await supabase
      .from('contest_votes')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId)
      .eq('voter_id', userId)
    
    userVoteCount = count || 0
    
    // Check if user has submitted - include image data for display
    const { data: entryData } = await supabaseAdmin
      .from('contest_entries')
      .select(`
        *,
        images (
          id,
          storage_path,
          width,
          height
        )
      `)
      .eq('contest_id', contestId)
      .eq('user_id', userId)
      .single()
    
    if (entryData) {
      userEntry = mapEntry(entryData)
      // Add image URL to userEntry for display
      if (entryData.images) {
        const urls = await getSignedUrlsWithSizes([entryData.images.storage_path])
        const imageUrls = urls.get(entryData.images.storage_path)
        ;(userEntry as any).image = {
          id: entryData.images.id,
          thumbnailUrl: imageUrls?.thumbnail || '',
          previewUrl: imageUrls?.preview || '',
          width: entryData.images.width,
          height: entryData.images.height,
        }
      }
    }
  }
  
  // Only paid users can vote and submit
  const canVote = userId !== undefined && 
    isPaidUser &&
    contest.status === 'voting' && 
    userVoteCount < contest.maxVotesPerUser
  
  const canSubmit = userId !== undefined && 
    isPaidUser &&
    contest.status === 'submissions_open' && 
    !userEntry
  
  return {
    contest,
    entries,
    userVoteCount,
    canVote,
    canSubmit,
    userEntry,
    isPaidUser,
    isLoggedIn: !!clerkId,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Submit Entry
// ─────────────────────────────────────────────────────────────────────────────
export async function submitEntry(
  contestId: string,
  imageId: string,
  caption?: string
): Promise<SubmitEntryResult> {
  const supabase = createServerClient()
  
  // Get current user via Clerk
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: 'You must be logged in to submit' }
  }
  
  // Get user with plan info
  const userData = await getUserWithUsage(clerkId)
  if (!userData) {
    return { success: false, error: 'User not found' }
  }
  const userId = userData.id
  
  // Check if user is on a paid plan
  const userPlan = normalizePlanId(userData.plan)
  if (!PAID_PLANS.includes(userPlan)) {
    return { 
      success: false, 
      error: 'Community Spotlight is available for paid members. Upgrade to participate.' 
    }
  }
  
  // Verify contest exists and is accepting submissions
  const { data: contest } = await supabase
    .from('contests')
    .select('*')
    .eq('id', contestId)
    .single()
  
  if (!contest) {
    return { success: false, error: 'Contest not found' }
  }
  
  if (contest.status !== 'submissions_open') {
    return { success: false, error: 'Contest is not accepting submissions' }
  }
  
  const now = new Date()
  if (now < new Date(contest.submission_starts_at) || now > new Date(contest.submission_ends_at)) {
    return { success: false, error: 'Submission window is closed' }
  }
  
  // Verify user owns the image
  // Note: Must specify foreign key because galleries has multiple relationships to images
  const { data: image } = await supabase
    .from('images')
    .select('id, gallery_id, galleries!images_gallery_id_fkey(user_id)')
    .eq('id', imageId)
    .single()
  
  if (!image) {
    return { success: false, error: 'Image not found' }
  }
  
  // @ts-ignore - Supabase join typing
  if (image.galleries.user_id !== userId) {
    return { success: false, error: 'You can only submit your own photos' }
  }
  
  // Check if user already submitted
  const { data: existingEntry } = await supabase
    .from('contest_entries')
    .select('id')
    .eq('contest_id', contestId)
    .eq('user_id', userId)
    .single()
  
  if (existingEntry) {
    return { success: false, error: 'You have already submitted to this contest' }
  }
  
  // Create entry using admin client (RLS bypassed since we validated ownership above)
  const { data: entry, error } = await supabaseAdmin
    .from('contest_entries')
    .insert({
      contest_id: contestId,
      image_id: imageId,
      user_id: userId,
      caption,
      approved: !contest.require_approval, // Auto-approve if not required
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Contest] Submit error:', error)
    return { success: false, error: `Failed to submit entry: ${error.message}` }
  }
  
  revalidatePath('/contest')
  revalidatePath(`/contest/${contestId}`)
  
  return { success: true, entry: mapEntry(entry) }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Cast Vote
// ─────────────────────────────────────────────────────────────────────────────
export async function castVote(entryId: string): Promise<VoteResult> {
  const supabase = createServerClient()
  
  // Get current user via Clerk
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: 'You must be logged in to vote' }
  }
  
  // Get user with plan info
  const userData = await getUserWithUsage(clerkId)
  if (!userData) {
    return { success: false, error: 'User not found' }
  }
  
  // Check if user is on a paid plan
  const userPlan = normalizePlanId(userData.plan)
  if (!PAID_PLANS.includes(userPlan)) {
    return { 
      success: false, 
      error: 'Community Spotlight is available for paid members. Upgrade to vote.' 
    }
  }
  
  // Get entry and contest
  const { data: entry } = await supabase
    .from('contest_entries')
    .select('*, contests!inner(*)')
    .eq('id', entryId)
    .single()
  
  if (!entry) {
    return { success: false, error: 'Entry not found' }
  }
  
  // @ts-ignore
  const contest = entry.contests
  
  if (contest.status !== 'voting') {
    return { success: false, error: 'Voting is not open' }
  }
  
  // Check vote limit
  const { count: currentVotes } = await supabase
    .from('contest_votes')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contest.id)
    .eq('voter_id', userData.id)
  
  if ((currentVotes || 0) >= contest.max_votes_per_user) {
    return { success: false, error: `You've used all ${contest.max_votes_per_user} votes` }
  }
  
  // Can't vote for own entry
  if (entry.user_id === userData.id) {
    return { success: false, error: "You can't vote for your own photo" }
  }
  
  // Cast vote using admin client (since we validated above)
  const { error } = await supabaseAdmin
    .from('contest_votes')
    .insert({
      contest_id: contest.id,
      entry_id: entryId,
      voter_id: userData.id,
    })
  
  if (error) {
    if (error.code === '23505') { // Unique violation
      return { success: false, error: "You've already voted for this photo" }
    }
    console.error('[Contest] Vote error:', error)
    return { success: false, error: 'Failed to cast vote' }
  }
  
  // Get updated counts
  const { data: updatedEntry } = await supabase
    .from('contest_entries')
    .select('vote_count')
    .eq('id', entryId)
    .single()
  
  const { count: newUserVotes } = await supabase
    .from('contest_votes')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contest.id)
    .eq('voter_id', userData.id)
  
  revalidatePath('/contest')
  
  return {
    success: true,
    newVoteCount: updatedEntry?.vote_count || 0,
    userVoteCount: newUserVotes || 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Remove Vote
// ─────────────────────────────────────────────────────────────────────────────
export async function removeVote(entryId: string): Promise<VoteResult> {
  const supabase = createServerClient()
  
  // Get current user via Clerk
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: 'You must be logged in' }
  }
  
  // Get user with plan info
  const userData = await getUserWithUsage(clerkId)
  if (!userData) {
    return { success: false, error: 'User not found' }
  }
  
  // Check if user is on a paid plan (must be paid to have voted in the first place)
  const userPlan = normalizePlanId(userData.plan)
  if (!PAID_PLANS.includes(userPlan)) {
    return { 
      success: false, 
      error: 'Community Spotlight is available for paid members.' 
    }
  }
  
  // Get entry for contest ID
  const { data: entry } = await supabase
    .from('contest_entries')
    .select('contest_id')
    .eq('id', entryId)
    .single()
  
  if (!entry) {
    return { success: false, error: 'Entry not found' }
  }
  
  // Remove vote using admin client
  const { error } = await supabaseAdmin
    .from('contest_votes')
    .delete()
    .eq('entry_id', entryId)
    .eq('voter_id', userData.id)
  
  if (error) {
    console.error('[Contest] Remove vote error:', error)
    return { success: false, error: 'Failed to remove vote' }
  }
  
  // Get updated counts
  const { data: updatedEntry } = await supabase
    .from('contest_entries')
    .select('vote_count')
    .eq('id', entryId)
    .single()
  
  const { count: newUserVotes } = await supabase
    .from('contest_votes')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', entry.contest_id)
    .eq('voter_id', userData.id)
  
  revalidatePath('/contest')
  
  return {
    success: true,
    newVoteCount: updatedEntry?.vote_count || 0,
    userVoteCount: newUserVotes || 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Spotlight Card Data (for homepage)
// ─────────────────────────────────────────────────────────────────────────────
export async function getSpotlightCardData(): Promise<SpotlightCardData> {
  const supabase = createServerClient()
  
  // Check for active contest first
  const activeContest = await getActiveContest()
  
  if (activeContest) {
    if (activeContest.status === 'voting') {
      return {
        state: 'voting',
        voting: {
          contestId: activeContest.id,
          contestName: activeContest.name,
          endsAt: activeContest.votingEndsAt,
          entryCount: activeContest.entryCount,
        },
      }
    }
    
    if (activeContest.status === 'submissions_open') {
      return {
        state: 'submissions',
        submissions: {
          contestId: activeContest.id,
          contestName: activeContest.name,
          theme: activeContest.theme,
          endsAt: activeContest.submissionEndsAt,
        },
      }
    }
  }
  
  // Check for recent winner
  const { data: finishedContest } = await supabase
    .from('contests')
    .select(`
      *,
      winner_entry:contest_entries!winner_entry_id (
        id,
        images!inner (
          storage_path
        ),
        profiles:user_id (
          display_name,
          slug
        )
      )
    `)
    .eq('status', 'finished')
    .order('voting_ends_at', { ascending: false })
    .limit(1)
    .single()
  
  if (finishedContest?.winner_entry) {
    // Get signed URL for winner image
    const storagePath = (finishedContest.winner_entry as any).images.storage_path
    const urls = await getSignedUrlsWithSizes([storagePath])
    const imageUrl = urls.get(storagePath)?.preview || ''
    
    const profile = (finishedContest.winner_entry as any).profiles || {}
    
    return {
      state: 'winner',
      winner: {
        imageUrl,
        photographerName: profile.display_name || 'Photographer',
        photographerSlug: profile.slug,
        contestName: finishedContest.name,
        contestTheme: finishedContest.theme,
      },
    }
  }
  
  return { state: 'none' }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Create Contest
// ─────────────────────────────────────────────────────────────────────────────
export async function createContest(input: CreateContestInput): Promise<Contest | null> {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  // Verify admin using is_admin() function from 007-admin-roles.sql
  // Checks users.role IN ('admin', 'super_admin')
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
  if (!isAdmin) return null
  
  const { data, error } = await supabase
    .from('contests')
    .insert({
      name: input.name,
      theme: input.theme,
      description: input.description,
      submission_starts_at: input.submissionStartsAt.toISOString(),
      submission_ends_at: input.submissionEndsAt.toISOString(),
      voting_starts_at: input.votingStartsAt.toISOString(),
      voting_ends_at: input.votingEndsAt.toISOString(),
      max_entries_per_user: input.maxEntriesPerUser ?? 1,
      max_votes_per_user: input.maxVotesPerUser ?? 3,
      show_vote_counts: input.showVoteCounts ?? false,
      require_approval: input.requireApproval ?? true,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Contest] Create error:', error)
    return null
  }
  
  revalidatePath('/dashboard/admin/contests')
  return mapContest(data)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Update Contest
// ─────────────────────────────────────────────────────────────────────────────
export async function updateContest(input: UpdateContestInput): Promise<boolean> {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  // Verify admin using is_admin() function
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
  if (!isAdmin) return false
  
  const updateData: any = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.theme !== undefined) updateData.theme = input.theme
  if (input.description !== undefined) updateData.description = input.description
  if (input.status !== undefined) updateData.status = input.status
  if (input.submissionStartsAt !== undefined) updateData.submission_starts_at = input.submissionStartsAt.toISOString()
  if (input.submissionEndsAt !== undefined) updateData.submission_ends_at = input.submissionEndsAt.toISOString()
  if (input.votingStartsAt !== undefined) updateData.voting_starts_at = input.votingStartsAt.toISOString()
  if (input.votingEndsAt !== undefined) updateData.voting_ends_at = input.votingEndsAt.toISOString()
  if (input.maxEntriesPerUser !== undefined) updateData.max_entries_per_user = input.maxEntriesPerUser
  if (input.maxVotesPerUser !== undefined) updateData.max_votes_per_user = input.maxVotesPerUser
  if (input.showVoteCounts !== undefined) updateData.show_vote_counts = input.showVoteCounts
  if (input.requireApproval !== undefined) updateData.require_approval = input.requireApproval
  
  const { error } = await supabase
    .from('contests')
    .update(updateData)
    .eq('id', input.id)
  
  if (error) {
    console.error('[Contest] Update error:', error)
    return false
  }
  
  revalidatePath('/dashboard/admin/contests')
  revalidatePath('/contest')
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Approve/Reject Entry
// ─────────────────────────────────────────────────────────────────────────────
export async function approveEntry(input: ApproveEntryInput): Promise<boolean> {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  // Verify admin using is_admin() function
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
  if (!isAdmin) return false
  
  const { error } = await supabase
    .from('contest_entries')
    .update({
      approved: input.approved,
      rejected: !input.approved,
      rejection_reason: input.rejectionReason,
      approved_at: input.approved ? new Date().toISOString() : null,
      approved_by: input.approved ? user.id : null,
    })
    .eq('id', input.entryId)
  
  if (error) {
    console.error('[Contest] Approve error:', error)
    return false
  }
  
  revalidatePath('/dashboard/admin/contests')
  revalidatePath('/contest')
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Select Winner Manually
// ─────────────────────────────────────────────────────────────────────────────
export async function selectWinner(contestId: string, entryId?: string): Promise<boolean> {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  // Verify admin using is_admin() function
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
  if (!isAdmin) return false
  
  if (entryId) {
    // Manual selection
    const { error } = await supabase
      .from('contests')
      .update({
        winner_entry_id: entryId,
        status: 'finished',
      })
      .eq('id', contestId)
    
    if (error) {
      console.error('[Contest] Select winner error:', error)
      return false
    }
  } else {
    // Auto-select by votes
    const { error } = await supabase.rpc('select_contest_winner', {
      p_contest_id: contestId,
    })
    
    if (error) {
      console.error('[Contest] Auto-select winner error:', error)
      return false
    }
  }
  
  revalidatePath('/dashboard/admin/contests')
  revalidatePath('/contest')
  revalidatePath('/')
  return true
}
