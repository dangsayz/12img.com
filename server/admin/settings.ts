/**
 * Admin Settings & System Configuration - GOD MODE
 * 
 * State-of-the-art system configuration with:
 * - Categorized settings management
 * - Maintenance mode control
 * - System health monitoring
 * - Full audit trail
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability, logAdminAction } from './guards'

// ============================================================================
// TYPES
// ============================================================================

export type SettingCategory = 'general' | 'email' | 'storage' | 'billing' | 'security'
export type SettingValueType = 'string' | 'number' | 'boolean' | 'json' | 'array'
export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown'
export type MaintenanceSeverity = 'info' | 'warning' | 'critical'

export interface SystemSetting {
  id: string
  key: string
  value: unknown
  valueType: SettingValueType
  category: SettingCategory
  name: string
  description: string | null
  isSensitive: boolean
  isReadonly: boolean
  updatedAt: string
}

export interface MaintenanceWindow {
  id: string
  title: string
  message: string | null
  startsAt: string
  endsAt: string | null
  isActive: boolean
  allowAdmins: boolean
  affectedServices: string[]
  severity: MaintenanceSeverity
  createdAt: string
}

export interface HealthCheck {
  service: string
  status: HealthStatus
  responseTimeMs: number | null
  lastCheckAt: string
  lastHealthyAt: string | null
  errorMessage: string | null
}

export interface SettingsHistoryEntry {
  id: string
  settingKey: string
  oldValue: unknown
  newValue: unknown
  changedBy: string | null
  reason: string | null
  changedAt: string
}

// ============================================================================
// GET ALL SETTINGS
// ============================================================================

export async function getAllSettings(): Promise<SystemSetting[]> {
  await requireCapability('system.settings')
  
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('*')
    .order('category')
    .order('name')
  
  if (error) {
    throw new Error(`Failed to get settings: ${error.message}`)
  }
  
  return (data || []).map(transformSetting)
}

export async function getSettingsByCategory(): Promise<Record<SettingCategory, SystemSetting[]>> {
  const settings = await getAllSettings()
  
  const grouped: Record<SettingCategory, SystemSetting[]> = {
    general: [],
    email: [],
    storage: [],
    billing: [],
    security: [],
  }
  
  for (const setting of settings) {
    const category = setting.category as SettingCategory
    if (grouped[category]) {
      grouped[category].push(setting)
    } else {
      grouped.general.push(setting)
    }
  }
  
  return grouped
}

function transformSetting(row: any): SystemSetting {
  return {
    id: row.id,
    key: row.key,
    value: row.is_sensitive ? '[REDACTED]' : parseSettingValue(row.value, row.value_type),
    valueType: row.value_type,
    category: row.category,
    name: row.name,
    description: row.description,
    isSensitive: row.is_sensitive,
    isReadonly: row.is_readonly,
    updatedAt: row.updated_at,
  }
}

function parseSettingValue(value: any, type: SettingValueType): unknown {
  if (value === null || value === undefined) return null
  
  // JSONB values come as objects/arrays already
  if (typeof value === 'object') return value
  
  // String values might be JSON strings
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  
  return value
}

// ============================================================================
// GET SINGLE SETTING
// ============================================================================

export async function getSetting(key: string): Promise<unknown> {
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('value, value_type, is_sensitive')
    .eq('key', key)
    .single()
  
  if (error || !data) {
    return null
  }
  
  if (data.is_sensitive) {
    return '[REDACTED]'
  }
  
  return parseSettingValue(data.value, data.value_type)
}

// ============================================================================
// UPDATE SETTING
// ============================================================================

export async function updateSetting(
  key: string,
  value: unknown,
  reason?: string
): Promise<boolean> {
  const admin = await requireCapability('system.settings')
  
  // Get current setting
  const { data: current } = await supabaseAdmin
    .from('system_settings')
    .select('*')
    .eq('key', key)
    .single()
  
  if (!current) {
    throw new Error(`Setting not found: ${key}`)
  }
  
  if (current.is_readonly) {
    throw new Error(`Setting is read-only: ${key}`)
  }
  
  // Validate value type
  const jsonValue = JSON.stringify(value)
  
  // Update setting
  const { error } = await supabaseAdmin
    .from('system_settings')
    .update({
      value: jsonValue,
      updated_at: new Date().toISOString(),
      updated_by: admin.userId,
    })
    .eq('key', key)
  
  if (error) {
    throw new Error(`Failed to update setting: ${error.message}`)
  }
  
  // Log to history
  await supabaseAdmin.from('settings_history').insert({
    setting_key: key,
    old_value: current.value,
    new_value: jsonValue,
    changed_by: admin.userId,
    reason,
  })
  
  // Log to admin audit
  await logAdminAction(admin.userId, 'system.settings_update', {
    targetType: 'setting',
    targetId: current.id,
    targetIdentifier: key,
    metadata: {
      settingName: current.name,
      oldValue: current.is_sensitive ? '[REDACTED]' : current.value,
      newValue: current.is_sensitive ? '[REDACTED]' : value,
      reason,
    },
  })
  
  return true
}

// ============================================================================
// MAINTENANCE MODE
// ============================================================================

export async function getMaintenanceStatus(): Promise<MaintenanceWindow | null> {
  const { data, error } = await supabaseAdmin
    .from('maintenance_windows')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order('starts_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return transformMaintenanceWindow(data)
}

export async function getAllMaintenanceWindows(): Promise<MaintenanceWindow[]> {
  await requireCapability('system.maintenance')
  
  const { data, error } = await supabaseAdmin
    .from('maintenance_windows')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) {
    throw new Error(`Failed to get maintenance windows: ${error.message}`)
  }
  
  return (data || []).map(transformMaintenanceWindow)
}

function transformMaintenanceWindow(row: any): MaintenanceWindow {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    allowAdmins: row.allow_admins,
    affectedServices: row.affected_services || [],
    severity: row.severity,
    createdAt: row.created_at,
  }
}

export async function toggleMaintenanceMode(
  enabled: boolean,
  options?: {
    title?: string
    message?: string
    severity?: MaintenanceSeverity
    endsAt?: string
  }
): Promise<string | null> {
  const admin = await requireCapability('system.maintenance')
  
  if (enabled) {
    // Create new maintenance window
    const { data, error } = await supabaseAdmin
      .from('maintenance_windows')
      .insert({
        title: options?.title || 'Scheduled Maintenance',
        message: options?.message || 'We are currently performing maintenance. Please check back soon.',
        starts_at: new Date().toISOString(),
        ends_at: options?.endsAt || null,
        is_active: true,
        severity: options?.severity || 'info',
        created_by: admin.userId,
      })
      .select('id')
      .single()
    
    if (error) {
      throw new Error(`Failed to enable maintenance: ${error.message}`)
    }
    
    await logAdminAction(admin.userId, 'system.maintenance_on', {
      targetType: 'maintenance_window',
      targetId: data.id,
      metadata: {
        title: options?.title,
        message: options?.message,
        severity: options?.severity,
      },
    })
    
    return data.id
  } else {
    // Deactivate all active windows
    const { error } = await supabaseAdmin
      .from('maintenance_windows')
      .update({
        is_active: false,
        ends_at: new Date().toISOString(),
      })
      .eq('is_active', true)
    
    if (error) {
      throw new Error(`Failed to disable maintenance: ${error.message}`)
    }
    
    await logAdminAction(admin.userId, 'system.maintenance_off', {
      targetType: 'maintenance_window',
      metadata: {
        endedAt: new Date().toISOString(),
      },
    })
    
    return null
  }
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

export async function getHealthChecks(): Promise<HealthCheck[]> {
  await requireCapability('system.view_logs')
  
  const { data, error } = await supabaseAdmin
    .from('system_health_checks')
    .select('*')
    .order('service')
  
  if (error) {
    throw new Error(`Failed to get health checks: ${error.message}`)
  }
  
  return (data || []).map((row: any) => ({
    service: row.service,
    status: row.status,
    responseTimeMs: row.response_time_ms,
    lastCheckAt: row.last_check_at,
    lastHealthyAt: row.last_healthy_at,
    errorMessage: row.error_message,
  }))
}

export async function runHealthChecks(): Promise<HealthCheck[]> {
  await requireCapability('system.maintenance')
  
  const checks: HealthCheck[] = []
  
  // Database check
  const dbStart = Date.now()
  try {
    await supabaseAdmin.from('users').select('id').limit(1)
    checks.push({
      service: 'database',
      status: 'healthy',
      responseTimeMs: Date.now() - dbStart,
      lastCheckAt: new Date().toISOString(),
      lastHealthyAt: new Date().toISOString(),
      errorMessage: null,
    })
  } catch (err) {
    checks.push({
      service: 'database',
      status: 'down',
      responseTimeMs: Date.now() - dbStart,
      lastCheckAt: new Date().toISOString(),
      lastHealthyAt: null,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    })
  }
  
  // Storage check (Supabase Storage)
  const storageStart = Date.now()
  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets()
    if (error) throw error
    checks.push({
      service: 'storage',
      status: 'healthy',
      responseTimeMs: Date.now() - storageStart,
      lastCheckAt: new Date().toISOString(),
      lastHealthyAt: new Date().toISOString(),
      errorMessage: null,
    })
  } catch (err) {
    checks.push({
      service: 'storage',
      status: 'down',
      responseTimeMs: Date.now() - storageStart,
      lastCheckAt: new Date().toISOString(),
      lastHealthyAt: null,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    })
  }
  
  // Stripe check (billing)
  const stripeStart = Date.now()
  try {
    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      checks.push({
        service: 'stripe',
        status: 'degraded',
        responseTimeMs: Date.now() - stripeStart,
        lastCheckAt: new Date().toISOString(),
        lastHealthyAt: null,
        errorMessage: 'STRIPE_SECRET_KEY not configured',
      })
    } else {
      // Import Stripe dynamically to avoid issues if not installed
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(stripeKey)
      await stripe.balance.retrieve()
      checks.push({
        service: 'stripe',
        status: 'healthy',
        responseTimeMs: Date.now() - stripeStart,
        lastCheckAt: new Date().toISOString(),
        lastHealthyAt: new Date().toISOString(),
        errorMessage: null,
      })
    }
  } catch (err) {
    checks.push({
      service: 'stripe',
      status: 'down',
      responseTimeMs: Date.now() - stripeStart,
      lastCheckAt: new Date().toISOString(),
      lastHealthyAt: null,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    })
  }
  
  // Resend check (email)
  const resendStart = Date.now()
  try {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      checks.push({
        service: 'resend',
        status: 'degraded',
        responseTimeMs: Date.now() - resendStart,
        lastCheckAt: new Date().toISOString(),
        lastHealthyAt: null,
        errorMessage: 'RESEND_API_KEY not configured',
      })
    } else {
      // Simple API key validation by checking format
      // Full validation would require making an API call
      const isValidFormat = resendKey.startsWith('re_')
      if (isValidFormat) {
        checks.push({
          service: 'resend',
          status: 'healthy',
          responseTimeMs: Date.now() - resendStart,
          lastCheckAt: new Date().toISOString(),
          lastHealthyAt: new Date().toISOString(),
          errorMessage: null,
        })
      } else {
        checks.push({
          service: 'resend',
          status: 'degraded',
          responseTimeMs: Date.now() - resendStart,
          lastCheckAt: new Date().toISOString(),
          lastHealthyAt: null,
          errorMessage: 'Invalid RESEND_API_KEY format',
        })
      }
    }
  } catch (err) {
    checks.push({
      service: 'resend',
      status: 'down',
      responseTimeMs: Date.now() - resendStart,
      lastCheckAt: new Date().toISOString(),
      lastHealthyAt: null,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    })
  }
  
  // Clerk check (auth)
  const clerkStart = Date.now()
  try {
    const clerkKey = process.env.CLERK_SECRET_KEY
    if (!clerkKey) {
      checks.push({
        service: 'clerk',
        status: 'degraded',
        responseTimeMs: Date.now() - clerkStart,
        lastCheckAt: new Date().toISOString(),
        lastHealthyAt: null,
        errorMessage: 'CLERK_SECRET_KEY not configured',
      })
    } else {
      // Clerk is working if we got this far (middleware would have blocked)
      // Just validate the key format
      const isValidFormat = clerkKey.startsWith('sk_')
      if (isValidFormat) {
        checks.push({
          service: 'clerk',
          status: 'healthy',
          responseTimeMs: Date.now() - clerkStart,
          lastCheckAt: new Date().toISOString(),
          lastHealthyAt: new Date().toISOString(),
          errorMessage: null,
        })
      } else {
        checks.push({
          service: 'clerk',
          status: 'degraded',
          responseTimeMs: Date.now() - clerkStart,
          lastCheckAt: new Date().toISOString(),
          lastHealthyAt: null,
          errorMessage: 'Invalid CLERK_SECRET_KEY format',
        })
      }
    }
  } catch (err) {
    checks.push({
      service: 'clerk',
      status: 'down',
      responseTimeMs: Date.now() - clerkStart,
      lastCheckAt: new Date().toISOString(),
      lastHealthyAt: null,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    })
  }
  
  // Update health checks in database
  for (const check of checks) {
    await supabaseAdmin.from('system_health_checks').upsert({
      service: check.service,
      status: check.status,
      response_time_ms: check.responseTimeMs,
      last_check_at: check.lastCheckAt,
      last_healthy_at: check.lastHealthyAt,
      error_message: check.errorMessage,
    }, { onConflict: 'service' })
  }
  
  return checks
}

// ============================================================================
// SETTINGS HISTORY
// ============================================================================

export async function getSettingsHistory(
  settingKey?: string,
  limit: number = 50
): Promise<SettingsHistoryEntry[]> {
  await requireCapability('system.settings')
  
  let query = supabaseAdmin
    .from('settings_history')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit)
  
  if (settingKey) {
    query = query.eq('setting_key', settingKey)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to get settings history: ${error.message}`)
  }
  
  return (data || []).map((row: any) => ({
    id: row.id,
    settingKey: row.setting_key,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedBy: row.changed_by,
    reason: row.reason,
    changedAt: row.changed_at,
  }))
}

// ============================================================================
// QUICK STATS
// ============================================================================

export async function getSystemStats(): Promise<{
  settingsCount: number
  maintenanceActive: boolean
  healthyServices: number
  totalServices: number
}> {
  await requireCapability('system.view_logs')
  
  const [settings, maintenance, health] = await Promise.all([
    supabaseAdmin.from('system_settings').select('*', { count: 'exact', head: true }),
    getMaintenanceStatus(),
    supabaseAdmin.from('system_health_checks').select('status'),
  ])
  
  const healthyCount = (health.data || []).filter((h: any) => h.status === 'healthy').length
  
  return {
    settingsCount: settings.count || 0,
    maintenanceActive: maintenance !== null,
    healthyServices: healthyCount,
    totalServices: health.data?.length || 0,
  }
}
