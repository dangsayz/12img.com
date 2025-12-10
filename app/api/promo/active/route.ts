import { NextResponse } from 'next/server'
import { getActiveCampaign } from '@/server/actions/promo.actions'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute

export async function GET() {
  try {
    const campaign = await getActiveCampaign()
    
    if (!campaign) {
      return NextResponse.json({ campaign: null })
    }
    
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error fetching active campaign:', error)
    return NextResponse.json({ campaign: null })
  }
}
