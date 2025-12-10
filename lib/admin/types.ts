/**
 * Admin Panel Type Definitions
 */

export type UserRole = 'user' | 'support' | 'admin' | 'super_admin'

export type AuditAction =
  | 'user.view'
  | 'user.suspend'
  | 'user.reactivate'
  | 'user.update_limits'
  | 'user.update_plan'
  | 'user.delete'
  | 'user.impersonate'
  | 'user.force_logout'
  | 'gallery.view'
  | 'gallery.delete'
  | 'gallery.restore'
  | 'gallery.update'
  | 'gallery.transfer'
  | 'storage.cleanup'
  | 'storage.delete_file'
  | 'storage.view'
  | 'billing.override_plan'
  | 'billing.sync'
  | 'billing.refund'
  | 'email.send_single'
  | 'email.send_broadcast'
  | 'system.maintenance_on'
  | 'system.maintenance_off'
  | 'system.feature_flag_update'
  | 'system.settings_update'
  | 'admin.role_change'
  | 'admin.login'
  | 'admin.logout'

export interface AdminUser {
  id: string
  email: string
  role: UserRole
  clerk_id: string
  plan: string
  is_suspended: boolean
  suspended_at: string | null
  suspension_reason: string | null
  storage_limit_override: number | null
  image_limit_override: number | null
  gallery_limit_override: number | null
  created_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export interface AdminUserWithUsage extends AdminUser {
  usage: {
    totalBytes: number
    imageCount: number
    galleryCount: number
  }
}

export interface AuditLog {
  id: string
  admin_id: string
  admin_email: string
  admin_role: UserRole
  action: AuditAction
  target_type: string | null
  target_id: string | null
  target_identifier: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string | null
  enabled: boolean
  enabled_for_plans: string[]
  enabled_for_users: string[]
  rollout_percentage: number
  created_at: string
  updated_at: string
}

export interface SystemSetting {
  key: string
  value: unknown
  description: string | null
  updated_at: string
}

export interface MaintenanceWindow {
  id: string
  starts_at: string
  ends_at: string
  reason: string | null
  allow_admins: boolean
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface AdminDashboardStats {
  totalUsers: number
  activeUsers: number // logged in last 30 days
  suspendedUsers: number
  totalGalleries: number
  totalImages: number
  totalStorageBytes: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  planBreakdown: Record<string, number>
}

export interface AdminActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// Pagination
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Filters
export interface UserFilters {
  search?: string
  plan?: string
  role?: UserRole
  isSuspended?: boolean
  createdAfter?: string
  createdBefore?: string
}
