/**
 * Admin Data & Retention Settings API
 * GET - Get data retention settings
 * PATCH - Update data retention settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDataRetentionSettings, updateDataRetentionSettings, purgeOrphanedFiles, clearAllLogs } from '@/server/admin/platform-settings'

export async function GET() {
  try {
    const settings = await getDataRetentionSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get data retention settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    await updateDataRetentionSettings(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update data retention settings' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'purge_orphans') {
      const result = await purgeOrphanedFiles()
      return NextResponse.json(result)
    } else if (action === 'clear_logs') {
      const result = await clearAllLogs()
      return NextResponse.json(result)
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform action' },
      { status: 500 }
    )
  }
}
