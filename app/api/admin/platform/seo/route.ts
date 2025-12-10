/**
 * Admin SEO Settings API
 * GET - Get SEO settings
 * PATCH - Update SEO settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSEOSettings, updateSEOSettings } from '@/server/admin/platform-settings'

export async function GET() {
  try {
    const settings = await getSEOSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get SEO settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    await updateSEOSettings(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update SEO settings' },
      { status: 500 }
    )
  }
}
