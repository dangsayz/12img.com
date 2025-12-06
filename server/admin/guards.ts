/**
 * Admin RBAC Guards
 * 
 * Capability-based access control for admin operations.
 * All admin actions MUST go through these guards.
 */

import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { UserRole, AuditAction, AdminUser } from '@/lib/admin/types'
import { headers } from 'next/headers'

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: UserRole[] = ['user', 'support', 'admin', 'super_admin']

// Capability definitions
const CAPABILITIES: Record<string, UserRole[]> = {
  // User management
  'users.list': ['support', 'admin', 'super_admin'],
  'users.view': ['support', 'admin', 'super_admin'],
  'users.suspend': ['admin', 'super_admin'],
  'users.reactivate': ['admin', 'super_admin'],
  'users.update_limits': ['admin', 'super_admin'],
  'users.update_plan': ['super_admin'],
  'users.delete': ['super_admin'],
  'users.impersonate': ['super_admin'],
  'users.force_logout': ['admin', 'super_admin'],
  
  // Gallery management
  'galleries.list': ['support', 'admin', 'super_admin'],
  'galleries.view': ['support', 'admin', 'super_admin'],
  'galleries.delete': ['admin', 'super_admin'],
  'galleries.restore': ['admin', 'super_admin'],
  
  // Storage management
  'storage.view': ['support', 'admin', 'super_admin'],
  'storage.cleanup': ['admin', 'super_admin'],
  'storage.delete': ['super_admin'],
  
  // Billing management
  'billing.view': ['support', 'admin', 'super_admin'],
  'billing.override': ['super_admin'],
  'billing.sync': ['admin', 'super_admin'],
  'billing.refund': ['super_admin'],
  
  // Email management
  'emails.view': ['support', 'admin', 'super_admin'],
  'emails.send_single': ['admin', 'super_admin'],
  'emails.send_broadcast': ['super_admin'],
  
  // System management
  'system.view_logs': ['support', 'admin', 'super_admin'],
  'system.view_audit': ['admin', 'super_admin'],
  'system.maintenance': ['super_admin'],
  'system.feature_flags': ['admin', 'super_admin'],
  'system.settings': ['super_admin'],
  
  // Admin management
  'admin.view': ['super_admin'],
  'admin.manage_roles': ['super_admin'],
}

interface AuthenticatedAdmin {
  userId: string
  dbUser: AdminUser
  role: UserRole
}

/**
 * Get the current authenticated admin user
 */
export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    return null
  }
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()
  
  if (error || !user) {
    return null
  }
  
  const role = user.role as UserRole
  
  // Only allow admin roles
  if (!['support', 'admin', 'super_admin'].includes(role)) {
    return null
  }
  
  return {
    userId: user.id,
    dbUser: user as AdminUser,
    role,
  }
}

/**
 * Check if a role has a specific capability
 */
export function hasCapability(role: UserRole, capability: string): boolean {
  const allowedRoles = CAPABILITIES[capability]
  if (!allowedRoles) {
    console.warn(`Unknown capability: ${capability}`)
    return false
  }
  return allowedRoles.includes(role)
}

/**
 * Require a specific capability - throws if not authorized
 */
export async function requireCapability(capability: string): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin()
  
  if (!admin) {
    throw new Error('Unauthorized: Not authenticated as admin')
  }
  
  if (!hasCapability(admin.role, capability)) {
    throw new Error(`Forbidden: Requires ${capability} capability`)
  }
  
  return admin
}

/**
 * Require one of multiple roles
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin()
  
  if (!admin) {
    throw new Error('Unauthorized: Not authenticated as admin')
  }
  
  if (!allowedRoles.includes(admin.role)) {
    throw new Error(`Forbidden: Requires role ${allowedRoles.join(' or ')}`)
  }
  
  return admin
}

/**
 * Check if user can perform action on another user
 * Admins can't act on other admins (unless super_admin)
 */
export function canActOnUser(adminRole: UserRole, targetRole: UserRole): boolean {
  const adminLevel = ROLE_HIERARCHY.indexOf(adminRole)
  const targetLevel = ROLE_HIERARCHY.indexOf(targetRole)
  
  // Can only act on users with lower role level
  return adminLevel > targetLevel
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: AuditAction,
  options: {
    targetType?: string
    targetId?: string
    targetIdentifier?: string
    metadata?: Record<string, unknown>
  } = {}
): Promise<void> {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                    headersList.get('x-real-ip') || 
                    'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'
  
  const { data: admin } = await supabaseAdmin
    .from('users')
    .select('email, role')
    .eq('id', adminId)
    .single()
  
  if (!admin) {
    console.error('Failed to log admin action: admin not found')
    return
  }
  
  const { error } = await supabaseAdmin
    .from('admin_audit_logs')
    .insert({
      admin_id: adminId,
      admin_email: admin.email,
      admin_role: admin.role,
      action,
      target_type: options.targetType || null,
      target_id: options.targetId || null,
      target_identifier: options.targetIdentifier || null,
      metadata: options.metadata || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    })
  
  if (error) {
    console.error('Failed to log admin action:', error)
  }
}

/**
 * Guard decorator for server actions
 * Usage: const result = await withAdminGuard('users.suspend', async (admin) => { ... })
 */
export async function withAdminGuard<T>(
  capability: string,
  action: (admin: AuthenticatedAdmin) => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const admin = await requireCapability(capability)
    const result = await action(admin)
    return { success: true, data: result }
  } catch (error) {
    console.error(`Admin action failed (${capability}):`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
