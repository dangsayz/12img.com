/**
 * Cron Endpoint for Archive Processing
 * 
 * POST /api/cron/process-archives
 * 
 * This endpoint should be called periodically (e.g., every minute) by a cron service
 * like Vercel Cron, Upstash QStash, or a traditional cron job.
 * 
 * It processes pending archive jobs from the queue.
 * 
 * Security: Protected by a secret token to prevent unauthorized triggers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runWorkerOnce, releaseStaleJobs } from '@/server/services/job-queue.service'
import { cleanupExpiredArchives } from '@/server/services/archive.service'

// Verify cron secret to prevent unauthorized triggers
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // If no secret configured, reject all requests
  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not configured')
    return false
  }
  
  // Check bearer token
  if (authHeader === `Bearer ${cronSecret}`) {
    return true
  }
  
  // Also check query param for Vercel Cron compatibility
  const querySecret = request.nextUrl.searchParams.get('secret')
  return querySecret === cronSecret
}

/**
 * POST handler for cron triggers
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    // Process multiple jobs in one cron run (up to 5)
    const results = {
      processed: 0,
      released: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < 5; i++) {
      try {
        const { processed, released } = await runWorkerOnce()
        
        if (released > 0) {
          results.released += released
        }
        
        if (processed) {
          results.processed++
        } else {
          // No more jobs to process
          break
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        results.errors.push(errorMsg)
        console.error('[Cron] Error processing job:', err)
      }
    }

    const duration = Date.now() - startTime

    console.log('[Cron] Process archives completed', {
      processed: results.processed,
      released: results.released,
      errors: results.errors.length,
      durationMs: duration,
    })

    return NextResponse.json({
      success: true,
      ...results,
      durationMs: duration,
    })
  } catch (error) {
    console.error('[Cron] Fatal error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process archives',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler for health check / status
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'ok',
    service: 'archive-processor',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Cleanup expired archives (should be run less frequently, e.g., daily)
 * 
 * POST /api/cron/process-archives?cleanup=true
 */
export async function handleCleanup(): Promise<{ cleaned: number }> {
  try {
    const cleaned = await cleanupExpiredArchives()
    console.log('[Cron] Cleanup completed', { cleaned })
    return { cleaned }
  } catch (error) {
    console.error('[Cron] Cleanup error:', error)
    return { cleaned: 0 }
  }
}
