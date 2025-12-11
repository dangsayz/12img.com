/**
 * ============================================================================
 * SPOTLIGHT EVALUATION SYSTEM - Server Actions
 * ============================================================================
 * 
 * Server actions for the jury-based photography evaluation system.
 * 
 * JURY ACTIONS:
 * - submitEvaluation()       - Submit scores for an entry
 * - getJuryPendingEntries()  - Get entries awaiting evaluation
 * - getMyEvaluations()       - Get jury member's past evaluations
 * 
 * PUBLIC ACTIONS:
 * - getEntryEvaluation()     - Get full evaluation for an entry
 * - getLeaderboard()         - Get photographer rankings
 * - getRecentAwards()        - Get recent SOTD, Featured entries
 * - getEvaluationCriteria()  - Get scoring criteria
 * 
 * ADMIN ACTIONS:
 * - appointJuryMember()      - Add a user to the jury
 * - removeJuryMember()       - Remove from jury
 * - runDailyAwards()         - Trigger SOTD selection
 * 
 * @see lib/spotlight/evaluation-types.ts
 * ============================================================================
 */

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/server/queries/user.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import type {
  EvaluationCriteria,
  JuryMember,
  JuryMemberWithProfile,
  EntryEvaluation,
  EntryScores,
  EntryWithScores,
  EntryEvaluationPage,
  EntryEvaluationWithDetails,
  SpotlightAward,
  SpotlightAwardWithEntry,
  PhotographerRanking,
  RankingWithPhotographer,
  SubmitEvaluationInput,
  SubmitEvaluationResult,
  LeaderboardData,
  AwardsPageData,
} from '@/lib/spotlight/evaluation-types'

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Map DB rows to types
// ─────────────────────────────────────────────────────────────────────────────

function mapCriteria(row: any): EvaluationCriteria {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    weight: row.weight,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapJuryMember(row: any): JuryMember {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    websiteUrl: row.website_url,
    specializations: row.specializations || ['general'],
    isActive: row.is_active,
    totalEvaluations: row.total_evaluations,
    averageScoreGiven: row.average_score_given ? parseFloat(row.average_score_given) : null,
    country: row.country,
    city: row.city,
    appointedAt: new Date(row.appointed_at),
    appointedBy: row.appointed_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapEntryScores(row: any): EntryScores {
  return {
    id: row.id,
    entryId: row.entry_id,
    juryScore: row.jury_score ? parseFloat(row.jury_score) : null,
    communityScore: row.community_score ? parseFloat(row.community_score) : null,
    overallScore: row.overall_score ? parseFloat(row.overall_score) : null,
    compositionScore: row.composition_score ? parseFloat(row.composition_score) : null,
    lightingScore: row.lighting_score ? parseFloat(row.lighting_score) : null,
    technicalScore: row.technical_score ? parseFloat(row.technical_score) : null,
    creativityScore: row.creativity_score ? parseFloat(row.creativity_score) : null,
    impactScore: row.impact_score ? parseFloat(row.impact_score) : null,
    postProcessingScore: row.post_processing_score ? parseFloat(row.post_processing_score) : null,
    juryCount: row.jury_count,
    scoresExcluded: row.scores_excluded,
    viewCount: row.view_count,
    saveCount: row.save_count,
    shareCount: row.share_count,
    evaluationStartedAt: row.evaluation_started_at ? new Date(row.evaluation_started_at) : null,
    evaluationCompletedAt: row.evaluation_completed_at ? new Date(row.evaluation_completed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapAward(row: any): SpotlightAward {
  return {
    id: row.id,
    entryId: row.entry_id,
    userId: row.user_id,
    contestId: row.contest_id,
    awardType: row.award_type,
    awardDate: new Date(row.award_date),
    finalScore: row.final_score ? parseFloat(row.final_score) : null,
    badgeUrl: row.badge_url,
    citation: row.citation,
    awardedAt: new Date(row.awarded_at),
    awardedBy: row.awarded_by,
    createdAt: new Date(row.created_at),
  }
}

function mapRanking(row: any): PhotographerRanking {
  return {
    id: row.id,
    userId: row.user_id,
    periodYear: row.period_year,
    periodMonth: row.period_month,
    entriesSubmitted: row.entries_submitted,
    entriesFeatured: row.entries_featured,
    totalVotesReceived: row.total_votes_received,
    averageScore: row.average_score ? parseFloat(row.average_score) : null,
    highestScore: row.highest_score ? parseFloat(row.highest_score) : null,
    sotdCount: row.sotd_count,
    featuredCount: row.featured_count,
    rank: row.rank,
    calculatedAt: new Date(row.calculated_at),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Evaluation Criteria
// ─────────────────────────────────────────────────────────────────────────────
export async function getEvaluationCriteria(): Promise<EvaluationCriteria[]> {
  const { data, error } = await supabaseAdmin
    .from('evaluation_criteria')
    .select('*')
    .eq('is_active', true)
    .order('display_order')
  
  if (error || !data) {
    console.error('[Evaluation] Error fetching criteria:', error)
    return []
  }
  
  return data.map(mapCriteria)
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Entry Evaluation (full breakdown)
// ─────────────────────────────────────────────────────────────────────────────
export async function getEntryEvaluation(entryId: string): Promise<EntryEvaluationPage | null> {
  // Get entry with scores
  const { data: entryData, error: entryError } = await supabaseAdmin
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
        slug,
        country
      ),
      entry_scores (*)
    `)
    .eq('id', entryId)
    .single()
  
  if (entryError || !entryData) {
    console.error('[Evaluation] Error fetching entry:', entryError)
    return null
  }
  
  // Get awards for this entry
  const { data: awardsData } = await supabaseAdmin
    .from('spotlight_awards')
    .select('*')
    .eq('entry_id', entryId)
  
  // Get all evaluations with jury member info
  const { data: evaluationsData } = await supabaseAdmin
    .from('entry_evaluations')
    .select(`
      *,
      jury_members (
        id,
        display_name,
        avatar_url,
        country,
        specializations
      ),
      evaluation_criteria (
        name,
        slug,
        weight
      )
    `)
    .eq('entry_id', entryId)
    .order('created_at')
  
  // Get criteria
  const criteria = await getEvaluationCriteria()
  
  // Get signed URLs for images
  const urls = await getSignedUrlsWithSizes([entryData.images.storage_path])
  const imageUrls = urls.get(entryData.images.storage_path)
  
  const profile = entryData.profiles || {}
  const scores = entryData.entry_scores?.[0] || null
  
  const entry: EntryWithScores = {
    id: entryData.id,
    contestId: entryData.contest_id,
    imageId: entryData.image_id,
    userId: entryData.user_id,
    approved: entryData.approved,
    voteCount: entryData.vote_count,
    caption: entryData.caption,
    createdAt: new Date(entryData.created_at),
    scores: scores ? mapEntryScores(scores) : null,
    awards: (awardsData || []).map(mapAward),
    image: {
      id: entryData.images.id,
      thumbnailUrl: imageUrls?.thumbnail || '',
      previewUrl: imageUrls?.preview || '',
      originalUrl: imageUrls?.original || '',
      width: entryData.images.width,
      height: entryData.images.height,
    },
    photographer: {
      id: profile.id || entryData.user_id,
      displayName: profile.display_name || 'Photographer',
      avatarUrl: profile.avatar_url,
      slug: profile.slug,
      country: profile.country,
    },
  }
  
  // Map evaluations
  const evaluations: EntryEvaluationWithDetails[] = (evaluationsData || []).map((e: any) => ({
    id: e.id,
    entryId: e.entry_id,
    juryMemberId: e.jury_member_id,
    criteriaId: e.criteria_id,
    score: parseFloat(e.score),
    comment: e.comment,
    createdAt: new Date(e.created_at),
    updatedAt: new Date(e.updated_at),
    juryMember: {
      id: e.jury_members.id,
      displayName: e.jury_members.display_name,
      avatarUrl: e.jury_members.avatar_url,
      country: e.jury_members.country,
      specializations: e.jury_members.specializations,
    },
    criteria: {
      name: e.evaluation_criteria.name,
      slug: e.evaluation_criteria.slug,
      weight: e.evaluation_criteria.weight,
    },
  }))
  
  // Count unique jury members
  const juryCount = new Set(evaluations.map(e => e.juryMemberId)).size
  
  // Check if evaluation is complete (at least 3 jury members for all criteria)
  const isEvaluationComplete = juryCount >= 3
  
  return {
    entry,
    evaluations,
    criteria,
    juryCount,
    isEvaluationComplete,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Leaderboard
// ─────────────────────────────────────────────────────────────────────────────
export async function getLeaderboard(
  year?: number,
  month?: number,
  limit: number = 20
): Promise<LeaderboardData> {
  const now = new Date()
  const targetYear = year || now.getFullYear()
  const targetMonth = month || now.getMonth() + 1
  
  const { data, error } = await supabaseAdmin
    .from('photographer_rankings')
    .select(`
      *,
      profiles:user_id (
        id,
        display_name,
        avatar_url,
        slug,
        country
      )
    `)
    .eq('period_year', targetYear)
    .eq('period_month', targetMonth)
    .order('rank')
    .limit(limit)
  
  if (error) {
    console.error('[Evaluation] Error fetching leaderboard:', error)
  }
  
  const rankings: RankingWithPhotographer[] = (data || []).map((r: any) => ({
    ...mapRanking(r),
    photographer: {
      id: r.profiles?.id || r.user_id,
      displayName: r.profiles?.display_name || 'Photographer',
      avatarUrl: r.profiles?.avatar_url,
      slug: r.profiles?.slug,
      country: r.profiles?.country,
    },
  }))
  
  // Get total count
  const { count } = await supabaseAdmin
    .from('photographer_rankings')
    .select('*', { count: 'exact', head: true })
    .eq('period_year', targetYear)
    .eq('period_month', targetMonth)
  
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  
  return {
    rankings,
    period: {
      year: targetYear,
      month: targetMonth,
      label: `${monthNames[targetMonth]} ${targetYear}`,
    },
    totalPhotographers: count || 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Recent Awards
// ─────────────────────────────────────────────────────────────────────────────
export async function getRecentAwards(limit: number = 10): Promise<AwardsPageData> {
  const fetchAwards = async (awardType: string, fetchLimit: number) => {
    const { data } = await supabaseAdmin
      .from('spotlight_awards')
      .select(`
        *,
        contest_entries:entry_id (
          id,
          caption,
          images (
            storage_path
          )
        ),
        profiles:user_id (
          id,
          display_name,
          avatar_url,
          slug
        )
      `)
      .eq('award_type', awardType)
      .order('awarded_at', { ascending: false })
      .limit(fetchLimit)
    
    if (!data) return []
    
    // Get signed URLs for all images
    const storagePaths = data
      .filter((a: any) => a.contest_entries?.images?.storage_path)
      .map((a: any) => a.contest_entries.images.storage_path)
    
    const signedUrls = await getSignedUrlsWithSizes(storagePaths)
    
    return data.map((a: any): SpotlightAwardWithEntry => {
      const urls = a.contest_entries?.images?.storage_path 
        ? signedUrls.get(a.contest_entries.images.storage_path) 
        : null
      
      return {
        ...mapAward(a),
        entry: a.contest_entries ? {
          id: a.contest_entries.id,
          image: {
            thumbnailUrl: urls?.thumbnail || '',
            previewUrl: urls?.preview || '',
          },
          caption: a.contest_entries.caption,
        } : null,
        photographer: {
          id: a.profiles?.id || a.user_id,
          displayName: a.profiles?.display_name || 'Photographer',
          avatarUrl: a.profiles?.avatar_url,
          slug: a.profiles?.slug,
        },
      }
    })
  }
  
  const [recentSotd, recentFeatured, sotmWinners, sotyWinners] = await Promise.all([
    fetchAwards('shot_of_the_day', limit),
    fetchAwards('featured', limit),
    fetchAwards('shot_of_the_month', 12),
    fetchAwards('shot_of_the_year', 5),
  ])
  
  return {
    recentSotd,
    recentFeatured,
    sotmWinners,
    sotyWinners,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get Active Jury Members
// ─────────────────────────────────────────────────────────────────────────────
export async function getActiveJuryMembers(): Promise<JuryMemberWithProfile[]> {
  const { data, error } = await supabaseAdmin
    .from('jury_members')
    .select(`
      *,
      profiles:user_id (
        display_name,
        avatar_url,
        slug
      )
    `)
    .eq('is_active', true)
    .order('total_evaluations', { ascending: false })
  
  if (error || !data) {
    console.error('[Evaluation] Error fetching jury:', error)
    return []
  }
  
  return data.map((j: any) => ({
    ...mapJuryMember(j),
    profile: {
      displayName: j.profiles?.display_name || j.display_name,
      avatarUrl: j.profiles?.avatar_url || j.avatar_url,
      slug: j.profiles?.slug,
    },
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// JURY: Check if current user is a jury member
// ─────────────────────────────────────────────────────────────────────────────
export async function isJuryMember(): Promise<{ isJury: boolean; juryMember: JuryMember | null }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { isJury: false, juryMember: null }
  }
  
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return { isJury: false, juryMember: null }
  }
  
  const { data } = await supabaseAdmin
    .from('jury_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()
  
  if (!data) {
    return { isJury: false, juryMember: null }
  }
  
  return { isJury: true, juryMember: mapJuryMember(data) }
}

// ─────────────────────────────────────────────────────────────────────────────
// JURY: Get Entries Pending Evaluation
// ─────────────────────────────────────────────────────────────────────────────
export async function getJuryPendingEntries(): Promise<EntryWithScores[]> {
  const { isJury, juryMember } = await isJuryMember()
  if (!isJury || !juryMember) {
    return []
  }
  
  // Get entries that this jury member hasn't fully evaluated
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
        slug,
        country
      ),
      entry_scores (*),
      spotlight_awards (*)
    `)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error || !entries) {
    console.error('[Evaluation] Error fetching pending entries:', error)
    return []
  }
  
  // Get criteria count
  const criteria = await getEvaluationCriteria()
  const criteriaCount = criteria.length
  
  // Get this jury member's existing evaluations
  const { data: myEvaluations } = await supabaseAdmin
    .from('entry_evaluations')
    .select('entry_id, criteria_id')
    .eq('jury_member_id', juryMember.id)
  
  // Group evaluations by entry
  const evaluationsByEntry = new Map<string, Set<string>>()
  for (const ev of myEvaluations || []) {
    if (!evaluationsByEntry.has(ev.entry_id)) {
      evaluationsByEntry.set(ev.entry_id, new Set())
    }
    evaluationsByEntry.get(ev.entry_id)!.add(ev.criteria_id)
  }
  
  // Filter to entries not fully evaluated
  const pendingEntries = entries.filter((e: any) => {
    const evaluatedCriteria = evaluationsByEntry.get(e.id)
    return !evaluatedCriteria || evaluatedCriteria.size < criteriaCount
  })
  
  // Get signed URLs
  const storagePaths = pendingEntries.map((e: any) => e.images.storage_path)
  const signedUrls = await getSignedUrlsWithSizes(storagePaths)
  
  return pendingEntries.map((e: any) => {
    const urls = signedUrls.get(e.images.storage_path)
    const profile = e.profiles || {}
    const scores = e.entry_scores?.[0] || null
    
    return {
      id: e.id,
      contestId: e.contest_id,
      imageId: e.image_id,
      userId: e.user_id,
      approved: e.approved,
      voteCount: e.vote_count,
      caption: e.caption,
      createdAt: new Date(e.created_at),
      scores: scores ? mapEntryScores(scores) : null,
      awards: (e.spotlight_awards || []).map(mapAward),
      image: {
        id: e.images.id,
        thumbnailUrl: urls?.thumbnail || '',
        previewUrl: urls?.preview || '',
        originalUrl: urls?.original || '',
        width: e.images.width,
        height: e.images.height,
      },
      photographer: {
        id: profile.id || e.user_id,
        displayName: profile.display_name || 'Photographer',
        avatarUrl: profile.avatar_url,
        slug: profile.slug,
        country: profile.country,
      },
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// JURY: Submit Evaluation
// ─────────────────────────────────────────────────────────────────────────────
export async function submitEvaluation(
  input: SubmitEvaluationInput
): Promise<SubmitEvaluationResult> {
  const { isJury, juryMember } = await isJuryMember()
  if (!isJury || !juryMember) {
    return { success: false, error: 'You must be a jury member to evaluate' }
  }
  
  // Validate scores
  for (const score of input.scores) {
    if (score.score < 0 || score.score > 10) {
      return { success: false, error: 'Scores must be between 0 and 10' }
    }
  }
  
  // Verify entry exists and is approved
  const { data: entry } = await supabaseAdmin
    .from('contest_entries')
    .select('id, approved')
    .eq('id', input.entryId)
    .single()
  
  if (!entry) {
    return { success: false, error: 'Entry not found' }
  }
  
  if (!entry.approved) {
    return { success: false, error: 'Entry is not approved for evaluation' }
  }
  
  // Upsert evaluations
  const evaluations = input.scores.map(s => ({
    entry_id: input.entryId,
    jury_member_id: juryMember.id,
    criteria_id: s.criteriaId,
    score: s.score,
    comment: s.comment || null,
    updated_at: new Date().toISOString(),
  }))
  
  const { data: inserted, error } = await supabaseAdmin
    .from('entry_evaluations')
    .upsert(evaluations, {
      onConflict: 'entry_id,jury_member_id,criteria_id',
    })
    .select()
  
  if (error) {
    console.error('[Evaluation] Error submitting:', error)
    return { success: false, error: 'Failed to submit evaluation' }
  }
  
  // Update jury member stats
  await supabaseAdmin
    .from('jury_members')
    .update({
      total_evaluations: juryMember.totalEvaluations + input.scores.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', juryMember.id)
  
  // Mark evaluation as started if first evaluation
  await supabaseAdmin
    .from('entry_scores')
    .upsert({
      entry_id: input.entryId,
      evaluation_started_at: new Date().toISOString(),
    }, {
      onConflict: 'entry_id',
    })
  
  revalidatePath('/spotlight')
  revalidatePath(`/spotlight/entry/${input.entryId}`)
  
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Appoint Jury Member
// ─────────────────────────────────────────────────────────────────────────────
export async function appointJuryMember(
  userId: string,
  displayName: string,
  specializations: string[] = ['general'],
  bio?: string
): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: 'Not authenticated' }
  }
  
  const admin = await getUserByClerkId(clerkId)
  if (!admin?.is_admin) {
    return { success: false, error: 'Admin access required' }
  }
  
  const { error } = await supabaseAdmin
    .from('jury_members')
    .upsert({
      user_id: userId,
      display_name: displayName,
      specializations,
      bio,
      is_active: true,
      appointed_by: admin.id,
      appointed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
  
  if (error) {
    console.error('[Evaluation] Error appointing jury:', error)
    return { success: false, error: 'Failed to appoint jury member' }
  }
  
  revalidatePath('/admin/spotlight')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Remove Jury Member
// ─────────────────────────────────────────────────────────────────────────────
export async function removeJuryMember(
  juryMemberId: string
): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: 'Not authenticated' }
  }
  
  const admin = await getUserByClerkId(clerkId)
  if (!admin?.is_admin) {
    return { success: false, error: 'Admin access required' }
  }
  
  const { error } = await supabaseAdmin
    .from('jury_members')
    .update({ is_active: false })
    .eq('id', juryMemberId)
  
  if (error) {
    console.error('[Evaluation] Error removing jury:', error)
    return { success: false, error: 'Failed to remove jury member' }
  }
  
  revalidatePath('/admin/spotlight')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Run Daily Awards
// ─────────────────────────────────────────────────────────────────────────────
export async function runDailyAwards(): Promise<{
  success: boolean
  sotdAwarded: boolean
  featuredCount: number
  error?: string
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, sotdAwarded: false, featuredCount: 0, error: 'Not authenticated' }
  }
  
  const admin = await getUserByClerkId(clerkId)
  if (!admin?.is_admin) {
    return { success: false, sotdAwarded: false, featuredCount: 0, error: 'Admin access required' }
  }
  
  try {
    // Award SOTD for yesterday
    const { data: sotdResult } = await supabaseAdmin.rpc('award_shot_of_the_day')
    
    // Award Featured entries
    const { data: featuredResult } = await supabaseAdmin.rpc('award_featured_entries')
    
    revalidatePath('/spotlight')
    revalidatePath('/spotlight/awards')
    
    return {
      success: true,
      sotdAwarded: !!sotdResult,
      featuredCount: featuredResult || 0,
    }
  } catch (error) {
    console.error('[Evaluation] Error running daily awards:', error)
    return {
      success: false,
      sotdAwarded: false,
      featuredCount: 0,
      error: String(error),
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Update Rankings
// ─────────────────────────────────────────────────────────────────────────────
export async function updateRankings(
  year?: number,
  month?: number
): Promise<{ success: boolean; count: number; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, count: 0, error: 'Not authenticated' }
  }
  
  const admin = await getUserByClerkId(clerkId)
  if (!admin?.is_admin) {
    return { success: false, count: 0, error: 'Admin access required' }
  }
  
  try {
    const { data: count } = await supabaseAdmin.rpc('update_photographer_rankings', {
      p_year: year || new Date().getFullYear(),
      p_month: month || new Date().getMonth() + 1,
    })
    
    revalidatePath('/spotlight/leaderboard')
    
    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('[Evaluation] Error updating rankings:', error)
    return { success: false, count: 0, error: String(error) }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Track Entry View
// ─────────────────────────────────────────────────────────────────────────────
export async function trackEntryView(entryId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('entry_scores')
      .upsert({
        entry_id: entryId,
        view_count: 1,
      }, {
        onConflict: 'entry_id',
      })
    
    // Note: increment_entry_view RPC would need to be created separately
  } catch {
    // Silently fail - view tracking is not critical
  }
}
