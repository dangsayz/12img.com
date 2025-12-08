import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Cron Job: Update Delivery Progress
 * 
 * Runs nightly to recalculate days_remaining, percent_complete,
 * and is_overdue for all active delivery progress records.
 * 
 * Schedule: 0 0 * * * (midnight daily)
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-delivery-progress",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call the database function to update all delivery progress
    const { data, error } = await supabaseAdmin.rpc('update_all_delivery_progress')

    if (error) {
      console.error('[update-delivery-progress] Error:', error)
      return NextResponse.json(
        { error: 'Failed to update delivery progress', details: error.message },
        { status: 500 }
      )
    }

    // Get overdue contracts for notification
    const { data: overdueContracts, error: overdueError } = await supabaseAdmin
      .from('delivery_progress')
      .select(`
        id,
        contract_id,
        photographer_id,
        client_id,
        days_remaining,
        estimated_delivery_date,
        is_overdue
      `)
      .eq('is_overdue', true)
      .eq('delivery_status', 'overdue')

    if (overdueError) {
      console.error('[update-delivery-progress] Overdue query error:', overdueError)
    }

    // Log results
    console.log(`[update-delivery-progress] Updated ${data} records`)
    console.log(`[update-delivery-progress] ${overdueContracts?.length || 0} overdue contracts`)

    // TODO: Send notifications for newly overdue contracts
    // This would integrate with your email service

    return NextResponse.json({
      success: true,
      updated: data,
      overdue: overdueContracts?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[update-delivery-progress] Exception:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request)
}
