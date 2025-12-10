/**
 * Admin Performance Settings API
 * GET - Get performance settings
 * PATCH - Update performance settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceSettings, updatePerformanceSettings, clearAllCaches } from '@/server/admin/platform-settings'

export async function GET() {
  try {
    const settings = await getPerformanceSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get performance settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    await updatePerformanceSettings(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update performance settings' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const result = await clearAllCaches()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear caches' },
      { status: 500 }
    )
  }
}
