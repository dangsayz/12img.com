/**
 * Admin Settings API
 * PATCH /api/admin/settings - Update a setting
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateSetting } from '@/server/admin/settings'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    await updateSetting(body.key, body.value, body.reason)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update setting error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update setting' },
      { status: 500 }
    )
  }
}
