/**
 * Admin Integrations Status API
 * GET - Get status of all integrations
 */

import { NextResponse } from 'next/server'
import { getIntegrationsStatus } from '@/server/admin/platform-settings'

export async function GET() {
  try {
    const integrations = await getIntegrationsStatus()
    return NextResponse.json(integrations)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get integrations status' },
      { status: 500 }
    )
  }
}
