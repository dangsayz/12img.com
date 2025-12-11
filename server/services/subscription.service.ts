/**
 * Subscription Lifecycle Service
 * 
 * Handles:
 * - Payment failure tracking and grace periods
 * - Automatic downgrades after grace period
 * - Gallery archiving for downgraded users
 * - Subscription event logging
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { clerkClient } from '@clerk/nextjs/server'
import type { SubscriptionStatus, GalleryArchivedReason } from '@/types/database'

// Grace period duration in days
const GRACE_PERIOD_DAYS = 21
// Days before data deletion warning
const DELETION_WARNING_DAYS = 60
// Days before final data deletion
const FINAL_DELETION_DAYS = 90

interface SubscriptionEventData {
  userId: string
  eventType: string
  previousPlan?: string
  newPlan?: string
  stripeEventId?: string
  metadata?: Record<string, unknown>
}

/**
 * Log a subscription event for auditing
 */
export async function logSubscriptionEvent(data: SubscriptionEventData): Promise<void> {
  try {
    await supabaseAdmin.from('subscription_events').insert({
      user_id: data.userId,
      event_type: data.eventType,
      previous_plan: data.previousPlan,
      new_plan: data.newPlan,
      stripe_event_id: data.stripeEventId,
      metadata: data.metadata || {},
    })
  } catch (error) {
    console.error('[Subscription] Failed to log event:', error)
  }
}

/**
 * Handle payment failure - starts grace period tracking
 */
export async function handlePaymentFailure(
  stripeCustomerId: string,
  stripeEventId?: string
): Promise<{ userId: string; failureCount: number; inGracePeriod: boolean } | null> {
  // Find user by Stripe customer ID
  const { data: user, error: findError } = await supabaseAdmin
    .from('users')
    .select('id, clerk_id, email, plan, payment_failure_count, grace_period_ends_at')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (findError || !user) {
    console.error('[Subscription] User not found for customer:', stripeCustomerId)
    return null
  }

  const newFailureCount = (user.payment_failure_count || 0) + 1
  const now = new Date()
  
  // Start grace period on first failure
  let gracePeriodEndsAt = user.grace_period_ends_at
  let subscriptionStatus: SubscriptionStatus = 'past_due'

  if (!gracePeriodEndsAt) {
    gracePeriodEndsAt = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()
    subscriptionStatus = 'grace_period'
    
    // Log grace period start
    await logSubscriptionEvent({
      userId: user.id,
      eventType: 'grace_period_started',
      stripeEventId,
      metadata: { 
        failure_count: newFailureCount,
        grace_period_ends_at: gracePeriodEndsAt 
      },
    })
  }

  // Update user record
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: subscriptionStatus,
      payment_failed_at: user.payment_failure_count === 0 ? now.toISOString() : undefined,
      payment_failure_count: newFailureCount,
      grace_period_ends_at: gracePeriodEndsAt,
    })
    .eq('id', user.id)

  // Log the payment failure
  await logSubscriptionEvent({
    userId: user.id,
    eventType: 'payment_failed',
    stripeEventId,
    metadata: { 
      failure_count: newFailureCount,
      plan: user.plan,
    },
  })

  console.log(`[Subscription] Payment failed for ${user.email} (attempt ${newFailureCount})`)

  return {
    userId: user.id,
    failureCount: newFailureCount,
    inGracePeriod: !!gracePeriodEndsAt,
  }
}

/**
 * Handle payment recovery - clears grace period
 */
export async function handlePaymentRecovered(
  stripeCustomerId: string,
  stripeEventId?: string
): Promise<boolean> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, clerk_id, email, plan')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (error || !user) return false

  // Clear payment failure state
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      payment_failed_at: null,
      payment_failure_count: 0,
      grace_period_ends_at: null,
    })
    .eq('id', user.id)

  // Update Clerk metadata
  if (user.clerk_id) {
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(user.clerk_id, {
        publicMetadata: {
          subscriptionStatus: 'active',
        },
      })
    } catch (err) {
      console.error('[Subscription] Failed to update Clerk:', err)
    }
  }

  // Cancel any scheduled deletions
  await supabaseAdmin
    .from('scheduled_deletions')
    .update({ canceled_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('executed_at', null)

  // Log recovery
  await logSubscriptionEvent({
    userId: user.id,
    eventType: 'payment_recovered',
    stripeEventId,
  })

  console.log(`[Subscription] Payment recovered for ${user.email}`)
  return true
}

/**
 * Downgrade user to free plan and archive excess galleries
 */
export async function downgradeUser(
  userId: string,
  reason: 'subscription_canceled' | 'grace_period_ended' = 'subscription_canceled',
  galleryIdsToKeep?: string[]
): Promise<{ success: boolean; archivedCount: number }> {
  // Get current user data
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, clerk_id, email, plan')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return { success: false, archivedCount: 0 }
  }

  const previousPlan = user.plan

  // Update user to free plan
  await supabaseAdmin
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      previous_plan: previousPlan,
      downgraded_at: new Date().toISOString(),
      payment_failed_at: null,
      payment_failure_count: 0,
      grace_period_ends_at: null,
    })
    .eq('id', userId)

  // Update Clerk metadata
  if (user.clerk_id) {
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(user.clerk_id, {
        publicMetadata: {
          plan: 'free',
          subscriptionStatus: 'canceled',
          previousPlan,
        },
      })
    } catch (err) {
      console.error('[Subscription] Failed to update Clerk:', err)
    }
  }

  // Archive excess galleries
  let archivedCount = 0
  if (galleryIdsToKeep && galleryIdsToKeep.length > 0) {
    // User selected which galleries to keep
    const { data: result } = await supabaseAdmin.rpc('archive_excess_galleries', {
      p_user_id: userId,
      p_gallery_ids_to_keep: galleryIdsToKeep,
      p_reason: reason === 'grace_period_ended' ? 'payment_failed' : 'downgrade',
    })
    archivedCount = result || 0
  } else {
    // Auto-archive: keep oldest galleries up to free plan limit (5)
    const FREE_GALLERY_LIMIT = 5
    
    const { data: galleries } = await supabaseAdmin
      .from('galleries')
      .select('id')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .limit(FREE_GALLERY_LIMIT)

    const keepIds = galleries?.map(g => g.id) || []
    
    if (keepIds.length > 0) {
      const { data: result } = await supabaseAdmin.rpc('archive_excess_galleries', {
        p_user_id: userId,
        p_gallery_ids_to_keep: keepIds,
        p_reason: reason === 'grace_period_ended' ? 'payment_failed' : 'downgrade',
      })
      archivedCount = result || 0
    }
  }

  // Log the downgrade
  await logSubscriptionEvent({
    userId,
    eventType: 'downgrade_completed',
    previousPlan,
    newPlan: 'free',
    metadata: { 
      reason,
      archived_gallery_count: archivedCount,
    },
  })

  if (archivedCount > 0) {
    await logSubscriptionEvent({
      userId,
      eventType: 'galleries_archived',
      metadata: { count: archivedCount, reason },
    })
  }

  // Schedule data deletion if they don't resubscribe
  await scheduleDataDeletion(userId)

  console.log(`[Subscription] Downgraded ${user.email} from ${previousPlan} to free, archived ${archivedCount} galleries`)
  return { success: true, archivedCount }
}

/**
 * Restore user's archived galleries when they resubscribe
 */
export async function restoreUserGalleries(userId: string): Promise<number> {
  const { data: result } = await supabaseAdmin.rpc('restore_archived_galleries', {
    p_user_id: userId,
  })

  const restoredCount = result || 0

  if (restoredCount > 0) {
    // Clear previous downgrade state
    await supabaseAdmin
      .from('users')
      .update({
        downgraded_at: null,
        previous_plan: null,
      })
      .eq('id', userId)

    // Cancel scheduled deletions
    await supabaseAdmin
      .from('scheduled_deletions')
      .update({ canceled_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('executed_at', null)

    await logSubscriptionEvent({
      userId,
      eventType: 'galleries_restored',
      metadata: { count: restoredCount },
    })
  }

  return restoredCount
}

/**
 * Schedule data for deletion after extended non-payment
 */
async function scheduleDataDeletion(userId: string): Promise<void> {
  const now = new Date()
  const deletionDate = new Date(now.getTime() + FINAL_DELETION_DAYS * 24 * 60 * 60 * 1000)
  const warningDate = new Date(now.getTime() + DELETION_WARNING_DAYS * 24 * 60 * 60 * 1000)

  // Check if already scheduled
  const { data: existing } = await supabaseAdmin
    .from('scheduled_deletions')
    .select('id')
    .eq('user_id', userId)
    .eq('deletion_type', 'user_storage')
    .is('executed_at', null)
    .is('canceled_at', null)
    .single()

  if (existing) return // Already scheduled

  await supabaseAdmin.from('scheduled_deletions').insert({
    user_id: userId,
    deletion_type: 'user_storage',
    scheduled_for: deletionDate.toISOString(),
  })

  console.log(`[Subscription] Scheduled data deletion for user ${userId} on ${deletionDate.toISOString()}`)
}

/**
 * Get users whose grace period has ended (for cron job)
 */
export async function getUsersWithExpiredGracePeriod(): Promise<
  { id: string; email: string; plan: string; grace_period_ends_at: string }[]
> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, plan, grace_period_ends_at')
    .not('grace_period_ends_at', 'is', null)
    .lt('grace_period_ends_at', new Date().toISOString())
    .neq('plan', 'free')

  if (error) {
    console.error('[Subscription] Failed to get expired grace periods:', error)
    return []
  }

  return data || []
}

/**
 * Get scheduled deletions that need warning emails
 */
export async function getPendingDeletionWarnings(): Promise<
  { id: string; user_id: string; scheduled_for: string }[]
> {
  const warningThreshold = new Date()
  warningThreshold.setDate(warningThreshold.getDate() + 30) // 30 days before deletion

  const { data, error } = await supabaseAdmin
    .from('scheduled_deletions')
    .select('id, user_id, scheduled_for')
    .is('warning_sent_at', null)
    .is('executed_at', null)
    .is('canceled_at', null)
    .lte('scheduled_for', warningThreshold.toISOString())

  if (error) return []
  return data || []
}

/**
 * Check if a gallery is archived
 */
export async function isGalleryArchived(galleryId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('galleries')
    .select('archived_at')
    .eq('id', galleryId)
    .single()

  return !!data?.archived_at
}

/**
 * Get user's gallery counts for downgrade flow
 */
export async function getUserGalleryCounts(userId: string): Promise<{
  total: number
  active: number
  archived: number
}> {
  const { data: galleries } = await supabaseAdmin
    .from('galleries')
    .select('id, archived_at')
    .eq('user_id', userId)

  if (!galleries) return { total: 0, active: 0, archived: 0 }

  const active = galleries.filter(g => !g.archived_at).length
  const archived = galleries.filter(g => g.archived_at).length

  return {
    total: galleries.length,
    active,
    archived,
  }
}
