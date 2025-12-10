/**
 * Admin Feature Flags API
 * POST /api/admin/flags - Create a new flag
 */

import { NextRequest, NextResponse } from 'next/server'
import { createFeatureFlag } from '@/server/admin/flags'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const flagId = await createFeatureFlag({
      key: body.key,
      name: body.name,
      description: body.description,
      flagType: body.flagType,
      category: body.category,
      rolloutPercentage: body.rolloutPercentage,
      targetPlans: body.targetPlans,
      isKillswitch: body.isKillswitch,
    })
    
    return NextResponse.json({ success: true, flagId })
  } catch (error) {
    console.error('Create flag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create flag' },
      { status: 500 }
    )
  }
}
