/**
 * ============================================================================
 * SPOTLIGHT AWARDS CRON JOB
 * ============================================================================
 * 
 * Runs daily to:
 * 1. Award Shot of the Day to highest scoring entry from yesterday
 * 2. Award Featured status to all entries scoring >= 6.5
 * 3. Update photographer rankings
 * 
 * Schedule: Daily at 1:00 AM UTC
 * Vercel Cron: 0 1 * * *
 * 
 * @see database/migrations/061-spotlight-evaluation-system.sql
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
    sotdAwarded: false,
    sotdEntryId: null as string | null,
    featuredCount: 0,
    rankingsUpdated: 0,
    errors: [] as string[],
  }
  
  try {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    // ─────────────────────────────────────────────────────────────────────────
    // 1. AWARD SHOT OF THE DAY for yesterday
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const { data: sotdResult, error: sotdError } = await supabaseAdmin.rpc(
        'award_shot_of_the_day',
        { p_date: yesterdayStr }
      )
      
      if (sotdError) {
        results.errors.push(`SOTD error: ${sotdError.message}`)
      } else if (sotdResult) {
        results.sotdAwarded = true
        results.sotdEntryId = sotdResult
        console.log(`[Spotlight Cron] SOTD awarded: ${sotdResult}`)
      }
    } catch (err) {
      results.errors.push(`SOTD exception: ${err}`)
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 2. AWARD FEATURED to entries scoring >= 6.5
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const { data: featuredResult, error: featuredError } = await supabaseAdmin.rpc(
        'award_featured_entries'
      )
      
      if (featuredError) {
        results.errors.push(`Featured error: ${featuredError.message}`)
      } else {
        results.featuredCount = featuredResult || 0
        console.log(`[Spotlight Cron] Featured awarded: ${results.featuredCount}`)
      }
    } catch (err) {
      results.errors.push(`Featured exception: ${err}`)
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 3. UPDATE RANKINGS for current month
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const { data: rankingsResult, error: rankingsError } = await supabaseAdmin.rpc(
        'update_photographer_rankings',
        {
          p_year: now.getFullYear(),
          p_month: now.getMonth() + 1,
        }
      )
      
      if (rankingsError) {
        results.errors.push(`Rankings error: ${rankingsError.message}`)
      } else {
        results.rankingsUpdated = rankingsResult || 0
        console.log(`[Spotlight Cron] Rankings updated: ${results.rankingsUpdated}`)
      }
    } catch (err) {
      results.errors.push(`Rankings exception: ${err}`)
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // DONE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Spotlight Cron] Results:', results)
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
    
  } catch (error) {
    console.error('[Spotlight Cron] Error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      results,
    }, { status: 500 })
  }
}
