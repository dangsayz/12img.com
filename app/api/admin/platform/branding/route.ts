/**
 * Admin Branding Settings API
 * GET - Get branding settings
 * PATCH - Update branding settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBrandingSettings, updateBrandingSettings } from '@/server/admin/platform-settings'

export async function GET() {
  try {
    const settings = await getBrandingSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get branding settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    await updateBrandingSettings(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update branding settings' },
      { status: 500 }
    )
  }
}
