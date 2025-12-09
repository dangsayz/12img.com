/**
 * API route to get spotlight card data for the landing page
 */

import { NextResponse } from 'next/server'
import { getSpotlightCardData } from '@/server/actions/contest.actions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getSpotlightCardData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Spotlight API] Error:', error)
    return NextResponse.json({ state: 'none' })
  }
}
