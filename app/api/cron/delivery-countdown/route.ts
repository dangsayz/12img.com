import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Cron Job: Delivery Countdown Updater
 * 
 * This endpoint should be called daily (e.g., via Vercel Cron or external scheduler)
 * to check for overdue deliveries and send notifications.
 * 
 * The actual countdown calculations are done in real-time via the delivery_progress view,
 * so this job primarily handles notifications for overdue contracts.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not set, allowing request in development')
    return process.env.NODE_ENV === 'development'
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results = {
    overdueNotified: 0,
    almostDueNotified: 0,
    errors: [] as string[],
  }

  try {
    // 1. Find contracts that just became overdue (within last 24 hours)
    const { data: newlyOverdue, error: overdueError } = await supabaseAdmin
      .from('delivery_progress')
      .select(`
        contract_id,
        photographer_id,
        client_id,
        days_remaining,
        estimated_delivery_date
      `)
      .eq('is_overdue', true)
      .eq('delivery_status', 'overdue')
      .gte('days_remaining', -1) // Just became overdue (within 1 day)

    if (overdueError) {
      console.error('[Cron] Error fetching overdue contracts:', overdueError)
      results.errors.push('Failed to fetch overdue contracts')
    } else if (newlyOverdue && newlyOverdue.length > 0) {
      // Send notifications for newly overdue contracts
      for (const contract of newlyOverdue) {
        try {
          // Create system message for client (softened)
          await supabaseAdmin
            .from('messages')
            .insert({
              client_id: contract.client_id,
              photographer_id: contract.photographer_id,
              is_from_photographer: true,
              message_type: 'system',
              content: '⏳ Your gallery is in final processing and will be ready very soon. Thank you for your patience!',
              status: 'sent',
            })

          // TODO: Send email notification to photographer about overdue delivery
          // await sendOverdueNotification(contract)

          results.overdueNotified++
        } catch (e) {
          console.error('[Cron] Error notifying for contract:', contract.contract_id, e)
          results.errors.push(`Failed to notify for contract ${contract.contract_id}`)
        }
      }
    }

    // 2. Find contracts that are almost due (3 days remaining)
    const { data: almostDue, error: almostDueError } = await supabaseAdmin
      .from('delivery_progress')
      .select(`
        contract_id,
        photographer_id,
        client_id,
        days_remaining,
        estimated_delivery_date
      `)
      .eq('delivery_status', 'in_progress')
      .eq('days_remaining', 3) // Exactly 3 days remaining

    if (almostDueError) {
      console.error('[Cron] Error fetching almost due contracts:', almostDueError)
      results.errors.push('Failed to fetch almost due contracts')
    } else if (almostDue && almostDue.length > 0) {
      // Send reminder notifications
      for (const contract of almostDue) {
        try {
          // Create system message for client
          await supabaseAdmin
            .from('messages')
            .insert({
              client_id: contract.client_id,
              photographer_id: contract.photographer_id,
              is_from_photographer: true,
              message_type: 'system',
              content: '🎉 Great news! Your gallery is almost ready and will be delivered in about 3 days.',
              status: 'sent',
            })

          results.almostDueNotified++
        } catch (e) {
          console.error('[Cron] Error notifying for contract:', contract.contract_id, e)
          results.errors.push(`Failed to notify for contract ${contract.contract_id}`)
        }
      }
    }

    const duration = Date.now() - startTime

    console.log('[Cron] Delivery countdown job completed', {
      duration: `${duration}ms`,
      ...results,
    })

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...results,
    })
  } catch (e) {
    console.error('[Cron] Unexpected error:', e)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unexpected error occurred',
        details: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request)
}
