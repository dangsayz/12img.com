/**
 * Admin Maintenance Mode API
 * POST /api/admin/maintenance - Toggle maintenance mode
 */

import { NextRequest, NextResponse } from 'next/server'
import { toggleMaintenanceMode } from '@/server/admin/settings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const windowId = await toggleMaintenanceMode(body.enabled, {
      title: body.title,
      message: body.message,
      severity: body.severity,
      endsAt: body.endsAt,
    })
    
    return NextResponse.json({ success: true, windowId })
  } catch (error) {
    console.error('Maintenance toggle error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle maintenance' },
      { status: 500 }
    )
  }
}
