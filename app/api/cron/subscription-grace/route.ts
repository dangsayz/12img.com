import { NextResponse } from 'next/server'
import { getUsersWithExpiredGracePeriod, downgradeUser } from '@/server/services/subscription.service'
import { sendCancellationNotification } from '@/server/services/admin-email.service'
import { createAdminNotification } from '@/server/admin/notifications'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Grace Period Expiration Cron
 * 
 * Runs daily to check for users whose grace period has expired.
 * These users had failed payments and didn't resolve them within the 21-day grace period.
 * 
 * Actions:
 * 1. Find users with expired grace periods
 * 2. Downgrade them to free plan
 * 3. Archive excess galleries (keeping oldest 5 based on free plan limit)
 * 4. Send notification to admin
 * 5. Send email to user about downgrade
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization')
  const secret = authHeader?.replace('Bearer ', '')
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results = {
    processed: 0,
    downgraded: 0,
    galleriesArchived: 0,
    errors: [] as string[],
  }

  try {
    // Get users with expired grace periods
    const expiredUsers = await getUsersWithExpiredGracePeriod()
    results.processed = expiredUsers.length

    for (const user of expiredUsers) {
      try {
        // Downgrade user and archive excess galleries
        const { success, archivedCount } = await downgradeUser(user.id, 'grace_period_ended')

        if (success) {
          results.downgraded++
          results.galleriesArchived += archivedCount

          // Get user details for notifications
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('email, display_name')
            .eq('id', user.id)
            .single()

          // Create admin notification
          await createAdminNotification(
            'subscription_cancelled',
            `Grace period expired: ${userData?.email || user.email}`,
            `User downgraded to free after grace period ended. ${archivedCount} galleries archived.`,
            { 
              user_id: user.id, 
              previous_plan: user.plan,
              archived_galleries: archivedCount,
              reason: 'grace_period_ended',
            }
          )

          // Send admin email
          await sendCancellationNotification({
            email: userData?.email || user.email,
            name: userData?.display_name || undefined,
            plan: user.plan,
            reason: 'Grace period expired - payment not recovered',
          })

          console.log(`[Subscription Cron] Downgraded ${user.email} - ${archivedCount} galleries archived`)
        }
      } catch (error) {
        const errorMsg = `Failed to process user ${user.id}: ${String(error)}`
        results.errors.push(errorMsg)
        console.error(`[Subscription Cron] ${errorMsg}`)
      }
    }
  } catch (error) {
    results.errors.push(`Main process error: ${String(error)}`)
    console.error('[Subscription Cron] Error:', error)
  }

  const duration = Date.now() - startTime

  return NextResponse.json({
    success: results.errors.length === 0,
    duration: `${duration}ms`,
    ...results,
  })
}
