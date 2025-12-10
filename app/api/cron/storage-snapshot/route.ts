/**
 * Storage Snapshot Cron Job
 * 
 * Captures daily storage metrics for trend analysis.
 * Should be called once per day via Vercel Cron or similar.
 * 
 * Endpoint: POST /api/cron/storage-snapshot
 * Auth: Requires CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server'
import { captureStorageSnapshot } from '@/server/admin/storage'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const success = await captureStorageSnapshot()
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Storage snapshot captured',
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to capture snapshot' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Storage snapshot cron error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
