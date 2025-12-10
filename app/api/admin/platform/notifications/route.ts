/**
 * Admin Notification Settings API
 * GET - Get notification settings
 * PATCH - Update notification settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getNotificationSettings, updateNotificationSettings } from '@/server/admin/platform-settings'

export async function GET() {
  try {
    const settings = await getNotificationSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get notification settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    await updateNotificationSettings(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}
