/**
 * Admin User Management
 * 
 * Server-only module for managing users from admin panel.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability, logAdminAction, canActOnUser } from './guards'
import type { 
  AdminUserWithUsage, 
  PaginatedResult, 
  PaginationParams,
  UserFilters,
  UserRole 
} from '@/lib/admin/types'

/**
 * List all users with pagination and filters
 */
export async function listUsers(
  params: PaginationParams & UserFilters = {}
): Promise<PaginatedResult<AdminUserWithUsage>> {
  const admin = await requireCapability('users.list')
  
  const {
    page = 1,
    pageSize = 25,
    sortBy = 'created_at',
    sortOrder = 'desc',
    search,
    plan,
    role,
    isSuspended,
    createdAfter,
    createdBefore,
  } = params
  
  // Build query
  let query = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' })
  
  // Apply filters
  if (search) {
    query = query.or(`email.ilike.%${search}%,clerk_id.ilike.%${search}%`)
  }
  if (plan) {
    query = query.eq('plan', plan)
  }
  if (role) {
    query = query.eq('role', role)
  }
  if (isSuspended !== undefined) {
    query = query.eq('is_suspended', isSuspended)
  }
  if (createdAfter) {
    query = query.gte('created_at', createdAfter)
  }
  if (createdBefore) {
    query = query.lte('created_at', createdBefore)
  }
  
  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  
  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data: users, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`)
  }
  
  // Get usage stats for each user
  const usersWithUsage = await Promise.all(
    (users || []).map(async (user) => {
      const usage = await getUserUsageStats(user.id)
      return { ...user, usage } as AdminUserWithUsage
    })
  )
  
  // Log action
  await logAdminAction(admin.userId, 'user.view', {
    metadata: { filters: params, resultCount: count }
  })
  
  return {
    data: usersWithUsage,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * Get detailed user information
 */
export async function getUser(userId: string): Promise<AdminUserWithUsage> {
  const admin = await requireCapability('users.view')
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error || !user) {
    throw new Error('User not found')
  }
  
  const usage = await getUserUsageStats(userId)
  
  await logAdminAction(admin.userId, 'user.view', {
    targetType: 'user',
    targetId: userId,
    targetIdentifier: user.email,
  })
  
  return { ...user, usage } as AdminUserWithUsage
}

/**
 * Get user's storage usage statistics
 */
async function getUserUsageStats(userId: string) {
  // Get gallery count
  const { count: galleryCount } = await supabaseAdmin
    .from('galleries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  // Get galleries for image query
  const { data: galleries } = await supabaseAdmin
    .from('galleries')
    .select('id')
    .eq('user_id', userId)
  
  const galleryIds = galleries?.map(g => g.id) || []
  
  if (galleryIds.length === 0) {
    return {
      totalBytes: 0,
      imageCount: 0,
      galleryCount: galleryCount || 0,
    }
  }
  
  // Get image stats
  const { data: images } = await supabaseAdmin
    .from('images')
    .select('file_size_bytes')
    .in('gallery_id', galleryIds)
  
  const totalBytes = images?.reduce((sum, img) => sum + (img.file_size_bytes || 0), 0) || 0
  const imageCount = images?.length || 0
  
  return {
    totalBytes,
    imageCount,
    galleryCount: galleryCount || 0,
  }
}

/**
 * Suspend a user account
 */
export async function suspendUser(
  userId: string,
  reason: string
): Promise<void> {
  const admin = await requireCapability('users.suspend')
  
  // Get target user
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('email, role')
    .eq('id', userId)
    .single()
  
  if (!targetUser) {
    throw new Error('User not found')
  }
  
  // Check role hierarchy
  if (!canActOnUser(admin.role, targetUser.role as UserRole)) {
    throw new Error('Cannot suspend user with equal or higher role')
  }
  
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspended_by: admin.userId,
      suspension_reason: reason,
    })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to suspend user: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'user.suspend', {
    targetType: 'user',
    targetId: userId,
    targetIdentifier: targetUser.email,
    metadata: { reason },
  })
}

/**
 * Reactivate a suspended user
 */
export async function reactivateUser(userId: string): Promise<void> {
  const admin = await requireCapability('users.reactivate')
  
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('email, role')
    .eq('id', userId)
    .single()
  
  if (!targetUser) {
    throw new Error('User not found')
  }
  
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      is_suspended: false,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
    })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to reactivate user: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'user.reactivate', {
    targetType: 'user',
    targetId: userId,
    targetIdentifier: targetUser.email,
  })
}

/**
 * Update user's plan limits (override defaults)
 */
export async function updateUserLimits(
  userId: string,
  limits: {
    storage_limit_override?: number | null
    image_limit_override?: number | null
    gallery_limit_override?: number | null
  }
): Promise<void> {
  const admin = await requireCapability('users.update_limits')
  
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()
  
  if (!targetUser) {
    throw new Error('User not found')
  }
  
  const { error } = await supabaseAdmin
    .from('users')
    .update(limits)
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to update limits: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'user.update_limits', {
    targetType: 'user',
    targetId: userId,
    targetIdentifier: targetUser.email,
    metadata: { limits },
  })
}

/**
 * Update user's subscription plan (with 30-day expiry for admin grants)
 */
export async function updateUserPlan(
  userId: string,
  plan: string,
  expiryDays: number = 30
): Promise<void> {
  const admin = await requireCapability('users.update_plan')
  
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('email, plan')
    .eq('id', userId)
    .single()
  
  if (!targetUser) {
    throw new Error('User not found')
  }
  
  // Calculate expiry date (30 days from now for non-free plans)
  const now = new Date()
  const expiresAt = plan === 'free' 
    ? null 
    : new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
  
  const { error } = await supabaseAdmin
    .from('users')
    .update({ 
      plan,
      admin_plan_expires_at: expiresAt,
      admin_plan_granted_by: plan === 'free' ? null : admin.userId,
      admin_plan_granted_at: plan === 'free' ? null : now.toISOString(),
    })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to update plan: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'user.update_plan', {
    targetType: 'user',
    targetId: userId,
    targetIdentifier: targetUser.email,
    metadata: { 
      previousPlan: targetUser.plan, 
      newPlan: plan,
      expiresAt: expiresAt,
      expiryDays: plan === 'free' ? null : expiryDays,
    },
  })
}

/**
 * Update user's role (admin only)
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  const admin = await requireCapability('admin.manage_roles')
  
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('email, role')
    .eq('id', userId)
    .single()
  
  if (!targetUser) {
    throw new Error('User not found')
  }
  
  // Can't demote yourself
  if (userId === admin.userId) {
    throw new Error('Cannot change your own role')
  }
  
  const { error } = await supabaseAdmin
    .from('users')
    .update({ role })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to update role: ${error.message}`)
  }
  
  await logAdminAction(admin.userId, 'admin.role_change', {
    targetType: 'user',
    targetId: userId,
    targetIdentifier: targetUser.email,
    metadata: { previousRole: targetUser.role, newRole: role },
  })
}

/**
 * Get user's galleries
 */
export async function getUserGalleries(userId: string) {
  await requireCapability('galleries.list')
  
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select(`
      *,
      images!gallery_id(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(`Failed to get galleries: ${error.message}`)
  }
  
  return data
}

/**
 * Admin Email Activity Types
 */
export interface AdminEmailLog {
  id: string
  gallery_id: string | null
  gallery_title: string | null
  gallery_slug: string | null
  email_type: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  status: string
  error_message: string | null
  resend_message_id: string | null
  opened_at: string | null
  opened_count: number
  last_opened_at: string | null
  clicked_at: string | null
  clicked_count: number
  last_clicked_at: string | null
  downloaded_at: string | null
  download_count: number
  last_downloaded_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminEmailStats {
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  totalFailed: number
  openRate: number
  clickRate: number
  bounceRate: number
}

/**
 * Get user's email activity (admin view - full details)
 */
export async function getUserEmailActivity(userId: string): Promise<{
  emails: AdminEmailLog[]
  stats: AdminEmailStats
}> {
  await requireCapability('users.view')
  
  // Fetch all email logs for this user with gallery info
  const { data: emails, error } = await supabaseAdmin
    .from('email_logs')
    .select(`
      id,
      gallery_id,
      email_type,
      recipient_email,
      recipient_name,
      subject,
      status,
      error_message,
      resend_message_id,
      opened_at,
      opened_count,
      last_opened_at,
      clicked_at,
      clicked_count,
      last_clicked_at,
      downloaded_at,
      download_count,
      last_downloaded_at,
      created_at,
      updated_at,
      galleries (title, slug)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('[getUserEmailActivity] Error:', error)
    return { emails: [], stats: getEmptyEmailStats() }
  }
  
  // Transform to include gallery info
  const emailList: AdminEmailLog[] = (emails || []).map((email: any) => ({
    ...email,
    gallery_title: email.galleries?.title || null,
    gallery_slug: email.galleries?.slug || null,
  }))
  
  // Calculate stats
  const stats = calculateEmailStats(emailList)
  
  return { emails: emailList, stats }
}

function getEmptyEmailStats(): AdminEmailStats {
  return {
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    totalFailed: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
  }
}

function calculateEmailStats(emails: AdminEmailLog[]): AdminEmailStats {
  if (emails.length === 0) return getEmptyEmailStats()
  
  const totalSent = emails.length
  const totalDelivered = emails.filter(e => e.status === 'delivered' || e.status === 'opened').length
  const totalOpened = emails.filter(e => e.opened_at).length
  const totalClicked = emails.filter(e => e.clicked_at).length
  const totalBounced = emails.filter(e => e.status === 'bounced').length
  const totalFailed = emails.filter(e => e.status === 'failed').length
  
  return {
    totalSent,
    totalDelivered,
    totalOpened,
    totalClicked,
    totalBounced,
    totalFailed,
    openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    bounceRate: totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0,
  }
}

/**
 * Get email events for a specific email log (admin view)
 */
export async function getEmailEvents(emailLogId: string) {
  await requireCapability('users.view')
  
  const { data, error } = await supabaseAdmin
    .from('email_events')
    .select('*')
    .eq('email_log_id', emailLogId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('[getEmailEvents] Error:', error)
    return []
  }
  
  return data || []
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  await requireCapability('users.list')
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Total users
  const { count: totalUsers } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  // Suspended users
  const { count: suspendedUsers } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_suspended', true)
  
  // New users today
  const { count: newUsersToday } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
  
  // New users this week
  const { count: newUsersThisWeek } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())
  
  // New users this month
  const { count: newUsersThisMonth } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthAgo.toISOString())
  
  // Total galleries
  const { count: totalGalleries } = await supabaseAdmin
    .from('galleries')
    .select('*', { count: 'exact', head: true })
  
  // Total images
  const { count: totalImages } = await supabaseAdmin
    .from('images')
    .select('*', { count: 'exact', head: true })
  
  // Total storage
  const { data: storageData } = await supabaseAdmin
    .from('images')
    .select('file_size_bytes')
  
  const totalStorageBytes = storageData?.reduce((sum, img) => sum + (img.file_size_bytes || 0), 0) || 0
  
  // Plan breakdown
  const { data: planData } = await supabaseAdmin
    .from('users')
    .select('plan')
  
  const planBreakdown: Record<string, number> = {}
  planData?.forEach(user => {
    const plan = user.plan || 'free'
    planBreakdown[plan] = (planBreakdown[plan] || 0) + 1
  })
  
  return {
    totalUsers: totalUsers || 0,
    activeUsers: 0, // TODO: track last login
    suspendedUsers: suspendedUsers || 0,
    totalGalleries: totalGalleries || 0,
    totalImages: totalImages || 0,
    totalStorageBytes,
    newUsersToday: newUsersToday || 0,
    newUsersThisWeek: newUsersThisWeek || 0,
    newUsersThisMonth: newUsersThisMonth || 0,
    planBreakdown,
  }
}
