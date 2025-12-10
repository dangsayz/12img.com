/**
 * Admin Data Export API
 * GET - Export data (users, galleries, logs, settings)
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportUsers, exportGalleries, exportAuditLogs, exportAllSettings } from '@/server/admin/platform-settings'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    let result: { data: string; filename: string }
    
    switch (type) {
      case 'users':
        result = await exportUsers()
        break
      case 'galleries':
        result = await exportGalleries()
        break
      case 'logs':
        result = await exportAuditLogs()
        break
      case 'settings':
        result = await exportAllSettings()
        break
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }
    
    const contentType = result.filename.endsWith('.csv') 
      ? 'text/csv' 
      : 'application/json'
    
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export data' },
      { status: 500 }
    )
  }
}
