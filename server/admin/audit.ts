/**
 * Admin Audit Log Queries
 * 
 * Server-only module for viewing audit logs.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability } from './guards'
import type { AuditLog, AuditAction, PaginatedResult } from '@/lib/admin/types'

export interface AuditLogFilters {
  action?: AuditAction
  adminId?: string
  targetType?: string
  targetId?: string
  startDate?: string
  endDate?: string
}

/**
 * Get audit logs with pagination and filters
 */
export async function getAuditLogs(params: {
  page?: number
  pageSize?: number
  filters?: AuditLogFilters
}): Promise<PaginatedResult<AuditLog>> {
  await requireCapability('system.view_audit')
  
  const {
    page = 1,
    pageSize = 50,
    filters = {},
  } = params
  
  let query = supabaseAdmin
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
  
  // Apply filters
  if (filters.action) {
    query = query.eq('action', filters.action)
  }
  if (filters.adminId) {
    query = query.eq('admin_id', filters.adminId)
  }
  if (filters.targetType) {
    query = query.eq('target_type', filters.targetType)
  }
  if (filters.targetId) {
    query = query.eq('target_id', filters.targetId)
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  
  // Order by most recent
  query = query.order('created_at', { ascending: false })
  
  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`)
  }
  
  return {
    data: (data || []) as AuditLog[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * Get unique action types for filter dropdown
 */
export async function getAuditActionTypes(): Promise<string[]> {
  await requireCapability('system.view_audit')
  
  const { data, error } = await supabaseAdmin
    .from('admin_audit_logs')
    .select('action')
    .limit(1000)
  
  if (error) {
    return []
  }
  
  const uniqueActions = [...new Set(data?.map(d => d.action) || [])]
  return uniqueActions.sort()
}

/**
 * Get unique admin users for filter dropdown
 */
export async function getAuditAdmins(): Promise<{ id: string; email: string }[]> {
  await requireCapability('system.view_audit')
  
  const { data, error } = await supabaseAdmin
    .from('admin_audit_logs')
    .select('admin_id, admin_email')
    .limit(1000)
  
  if (error) {
    return []
  }
  
  const uniqueAdmins = new Map<string, string>()
  data?.forEach(d => {
    if (!uniqueAdmins.has(d.admin_id)) {
      uniqueAdmins.set(d.admin_id, d.admin_email)
    }
  })
  
  return Array.from(uniqueAdmins.entries()).map(([id, email]) => ({ id, email }))
}
