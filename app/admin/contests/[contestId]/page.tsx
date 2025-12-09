/**
 * ============================================================================
 * ADMIN: Contest Detail Page
 * ============================================================================
 * 
 * View and manage entries for a specific contest.
 * 
 * Features:
 * - Grid view of all entries (approved, pending, rejected)
 * - Quick approve/reject actions
 * - Vote count display
 * - Manual winner selection
 * 
 * Architecture:
 * - Server component fetches contest + entries with signed URLs
 * - Client component handles interactive approval workflow
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_IMPLEMENTATION.md
 * ============================================================================
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { ContestEntriesContent } from './ContestEntriesContent'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────────────────────────────────────────

async function getContestWithEntries(contestId: string) {
  // Get contest
  const { data: contest, error: contestError } = await supabaseAdmin
    .from('contests')
    .select('*')
    .eq('id', contestId)
    .single()
  
  if (contestError || !contest) {
    return null
  }
  
  // Get entries with image and user data
  const { data: entries, error: entriesError } = await supabaseAdmin
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
        email
      )
    `)
    .eq('contest_id', contestId)
    .order('created_at', { ascending: true })
  
  if (entriesError) {
    console.error('[Admin Contest] Error fetching entries:', entriesError.message, entriesError.code)
    return { contest, entries: [] }
  }
  
  // Get signed URLs for all images
  const storagePaths = entries?.map((e: any) => e.images.storage_path) || []
  const signedUrls = await getSignedUrlsWithSizes(storagePaths)
  
  // Map entries with URLs
  const mappedEntries = entries?.map((entry: any) => {
    const urls = signedUrls.get(entry.images.storage_path)
    const profile = entry.profiles || {}
    
    return {
      id: entry.id,
      imageId: entry.image_id,
      userId: entry.user_id,
      approved: entry.approved,
      rejected: entry.rejected,
      rejectionReason: entry.rejection_reason,
      voteCount: entry.vote_count,
      caption: entry.caption,
      createdAt: entry.created_at,
      image: {
        thumbnailUrl: urls?.thumbnail || '',
        previewUrl: urls?.preview || '',
        width: entry.images.width,
        height: entry.images.height,
      },
      photographer: {
        displayName: profile.display_name || 'Unknown',
        email: profile.email || '',
      },
    }
  }) || []
  
  return {
    contest: {
      id: contest.id,
      name: contest.name,
      theme: contest.theme,
      status: contest.status,
      winnerEntryId: contest.winner_entry_id,
      showVoteCounts: contest.show_vote_counts,
    },
    entries: mappedEntries,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ contestId: string }>
}) {
  const { contestId } = await params
  const data = await getContestWithEntries(contestId)
  
  if (!data) {
    notFound()
  }
  
  const { contest, entries } = data
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <Link 
          href="/admin/contests"
          className="inline-flex items-center gap-1.5 text-sm text-[#525252] hover:text-[#141414] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contests
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-4xl text-[#141414]">{contest.name}</h1>
            {contest.theme && (
              <p className="text-[#525252] text-sm lg:text-base mt-1">
                Theme: {contest.theme}
              </p>
            )}
          </div>
          
          {/* Status Badge */}
          <div className="text-sm text-[#525252]">
            Status: <span className="font-medium text-[#141414] capitalize">{contest.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
      
      <ContestEntriesContent 
        contestId={contest.id}
        entries={entries}
        winnerEntryId={contest.winnerEntryId}
        contestStatus={contest.status}
      />
    </div>
  )
}
