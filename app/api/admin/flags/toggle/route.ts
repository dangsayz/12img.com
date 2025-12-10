/**
 * Admin Feature Flag Toggle API
 * POST /api/admin/flags/toggle - Toggle a flag on/off
 */

import { NextRequest, NextResponse } from 'next/server'
import { toggleFeatureFlag } from '@/server/admin/flags'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    await toggleFeatureFlag(body.flagKey, body.enabled, body.reason)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Toggle flag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle flag' },
      { status: 500 }
    )
  }
}
