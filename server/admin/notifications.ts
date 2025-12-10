import { supabaseAdmin } from '@/lib/supabase/admin'

export interface AdminNotification {
  id: string
  type: string
  title: string
  message: string | null
  metadata: Record<string, unknown>
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationType = 
  | 'new_user'
  | 'new_subscription'
  | 'subscription_cancelled'
  | 'subscription_upgraded'
  | 'support_ticket'
  | 'contest_entry'
  | 'feature_request'

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  icon: string
  color: string
  bgColor: string
}> = {
  new_user: { icon: 'UserPlus', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  new_subscription: { icon: 'CreditCard', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  subscription_cancelled: { icon: 'XCircle', color: 'text-red-600', bgColor: 'bg-red-50' },
  subscription_upgraded: { icon: 'TrendingUp', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  support_ticket: { icon: 'MessageCircle', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  contest_entry: { icon: 'Trophy', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  feature_request: { icon: 'Lightbulb', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
}

/**
 * Get unread notification count for admin badge
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('admin_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }

  return count || 0
}

/**
 * Get recent notifications for admin dashboard
 */
export async function getAdminNotifications(limit = 20): Promise<AdminNotification[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error getting admin notifications:', error)
    return []
  }

  return data.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    metadata: n.metadata || {},
    isRead: n.is_read,
    readAt: n.read_at,
    createdAt: n.created_at,
  }))
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string, adminUserId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('admin_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
      read_by: adminUserId,
    })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(adminUserId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('admin_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
      read_by: adminUserId,
    })
    .eq('is_read', false)
    .select('id')

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Create an admin notification (for use in webhooks, etc.)
 */
export async function createAdminNotification(
  type: NotificationType,
  title: string,
  message?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_notifications')
    .insert({
      type,
      title,
      message: message || null,
      metadata: metadata || {},
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating admin notification:', error)
    return null
  }

  return data.id
}
