/**
 * ============================================================================
 * CONTEST WINNER CRON JOB
 * ============================================================================
 * 
 * Runs daily to:
 * 1. Select winners for contests where voting has ended
 * 2. Transition contests between phases
 * 3. Send notification emails
 * 
 * Schedule: Daily at midnight UTC
 * Vercel Cron: 0 0 * * *
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const results = {
    winnersSelected: 0,
    transitioned: {
      toSubmissions: 0,
      toVoting: 0,
    },
    errors: [] as string[],
  }
  
  try {
    const now = new Date().toISOString()
    
    // ─────────────────────────────────────────────────────────────────────────
    // 1. SELECT WINNERS for contests where voting has ended
    // ─────────────────────────────────────────────────────────────────────────
    const { data: votingEnded, error: votingError } = await supabaseAdmin
      .from('contests')
      .select('id, name')
      .eq('status', 'voting')
      .lt('voting_ends_at', now)
    
    if (votingError) {
      results.errors.push(`Voting query error: ${votingError.message}`)
    } else if (votingEnded && votingEnded.length > 0) {
      for (const contest of votingEnded) {
        try {
          // Call the select_contest_winner function
          const { error: winnerError } = await supabaseAdmin.rpc('select_contest_winner', {
            p_contest_id: contest.id,
          })
          
          if (winnerError) {
            results.errors.push(`Winner selection error for ${contest.name}: ${winnerError.message}`)
          } else {
            results.winnersSelected++
            
            // TODO: Send winner notification email
            // await sendWinnerEmail(contest.id)
          }
        } catch (err) {
          results.errors.push(`Exception selecting winner for ${contest.name}: ${err}`)
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 2. TRANSITION: Draft → Submissions Open
    // ─────────────────────────────────────────────────────────────────────────
    const { data: toSubmissions, error: subError } = await supabaseAdmin
      .from('contests')
      .update({ status: 'submissions_open' })
      .eq('status', 'draft')
      .lte('submission_starts_at', now)
      .gt('submission_ends_at', now)
      .select('id')
    
    if (subError) {
      results.errors.push(`Submissions transition error: ${subError.message}`)
    } else {
      results.transitioned.toSubmissions = toSubmissions?.length || 0
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 3. TRANSITION: Submissions → Voting
    // ─────────────────────────────────────────────────────────────────────────
    const { data: toVoting, error: voteError } = await supabaseAdmin
      .from('contests')
      .update({ status: 'voting' })
      .eq('status', 'submissions_open')
      .lte('voting_starts_at', now)
      .gt('voting_ends_at', now)
      .select('id')
    
    if (voteError) {
      results.errors.push(`Voting transition error: ${voteError.message}`)
    } else {
      results.transitioned.toVoting = toVoting?.length || 0
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // DONE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Contest Cron] Results:', results)
    
    return NextResponse.json({
      success: true,
      timestamp: now,
      results,
    })
    
  } catch (error) {
    console.error('[Contest Cron] Error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      results,
    }, { status: 500 })
  }
}
