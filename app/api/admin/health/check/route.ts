/**
 * Admin Health Check API
 * POST /api/admin/health/check - Run health checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { runHealthChecks } from '@/server/admin/settings'

export async function POST(request: NextRequest) {
  try {
    const results = await runHealthChecks()
    
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run health checks' },
      { status: 500 }
    )
  }
}
