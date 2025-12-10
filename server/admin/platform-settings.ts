/**
 * Platform Settings - God Mode Backend
 * Extended settings management for SEO, Performance, Integrations, etc.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability, logAdminAction, getAuthenticatedAdmin } from './guards'

// Helper to log actions with current admin
async function logAction(action: string, metadata?: Record<string, unknown>) {
  const admin = await getAuthenticatedAdmin()
  if (admin) {
    await logAdminAction(admin.userId, action as any, { metadata })
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface SEOSettings {
  siteTitle: string
  metaDescription: string
  defaultOgImage: string
  twitterHandle: string
  facebookAppId: string | null
  allowIndexing: boolean
  generateSitemap: boolean
  includeProfilesInSitemap: boolean
}

export interface PerformanceSettings {
  compressionQuality: number
  maxImageDimension: number
  enableWebP: boolean
  signedUrlTTLHours: number
  browserCacheTTLDays: number
}

export interface NotificationSettings {
  adminEmail: string
  alertOnNewUser: boolean
  alertOnNewSubscription: boolean
  alertOnCancellation: boolean
  alertOnSupportMessage: boolean
  storageWarningPercent: number
  storageCriticalPercent: number
}

export interface BrandingSettings {
  logoUrl: string | null
  primaryColor: string
  accentColor: string
}

export interface DataRetentionSettings {
  deleteInactiveAccountsAfterMonths: number | null
  deleteDemoCardsAfterDays: number
  deleteAuditLogsAfterDays: number | null
}

export interface IntegrationStatus {
  name: string
  status: 'connected' | 'not_configured' | 'error'
  lastChecked: string | null
  errorMessage: string | null
}

// ============================================================================
// SEO SETTINGS
// ============================================================================

export async function getSEOSettings(): Promise<SEOSettings> {
  await requireCapability('system.settings')
  
  const keys = [
    'seo_site_title',
    'seo_meta_description', 
    'seo_default_og_image',
    'seo_twitter_handle',
    'seo_facebook_app_id',
    'seo_allow_indexing',
    'seo_generate_sitemap',
    'seo_include_profiles',
  ]
  
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .in('key', keys)
  
  const settings = Object.fromEntries((data || []).map(s => [s.key, s.value]))
  
  return {
    siteTitle: settings.seo_site_title || '12img - Professional Photo Galleries',
    metaDescription: settings.seo_meta_description || 'Create stunning photo galleries for your clients.',
    defaultOgImage: settings.seo_default_og_image || 'https://12img.com/og-default.jpg',
    twitterHandle: settings.seo_twitter_handle || '@12img',
    facebookAppId: settings.seo_facebook_app_id || null,
    allowIndexing: settings.seo_allow_indexing !== false,
    generateSitemap: settings.seo_generate_sitemap !== false,
    includeProfilesInSitemap: settings.seo_include_profiles === true,
  }
}

export async function updateSEOSettings(updates: Partial<SEOSettings>): Promise<void> {
  await requireCapability('system.settings')
  
  const keyMap: Record<keyof SEOSettings, string> = {
    siteTitle: 'seo_site_title',
    metaDescription: 'seo_meta_description',
    defaultOgImage: 'seo_default_og_image',
    twitterHandle: 'seo_twitter_handle',
    facebookAppId: 'seo_facebook_app_id',
    allowIndexing: 'seo_allow_indexing',
    generateSitemap: 'seo_generate_sitemap',
    includeProfilesInSitemap: 'seo_include_profiles',
  }
  
  for (const [field, value] of Object.entries(updates)) {
    const key = keyMap[field as keyof SEOSettings]
    if (key) {
      await supabaseAdmin
        .from('system_settings')
        .upsert({
          key,
          value: JSON.stringify(value),
          value_type: typeof value === 'boolean' ? 'boolean' : 'string',
          category: 'general',
          name: `SEO: ${field}`,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
    }
  }
  
  await logAction('system.seo_update', { updates })
}

// ============================================================================
// PERFORMANCE SETTINGS
// ============================================================================

export async function getPerformanceSettings(): Promise<PerformanceSettings> {
  await requireCapability('system.settings')
  
  const keys = [
    'perf_compression_quality',
    'perf_max_dimension',
    'perf_enable_webp',
    'perf_signed_url_ttl',
    'perf_browser_cache_ttl',
  ]
  
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .in('key', keys)
  
  const settings = Object.fromEntries((data || []).map(s => [s.key, s.value]))
  
  return {
    compressionQuality: Number(settings.perf_compression_quality) || 85,
    maxImageDimension: Number(settings.perf_max_dimension) || 4096,
    enableWebP: settings.perf_enable_webp === true,
    signedUrlTTLHours: Number(settings.perf_signed_url_ttl) || 24,
    browserCacheTTLDays: Number(settings.perf_browser_cache_ttl) || 7,
  }
}

export async function updatePerformanceSettings(updates: Partial<PerformanceSettings>): Promise<void> {
  await requireCapability('system.settings')
  
  const keyMap: Record<keyof PerformanceSettings, string> = {
    compressionQuality: 'perf_compression_quality',
    maxImageDimension: 'perf_max_dimension',
    enableWebP: 'perf_enable_webp',
    signedUrlTTLHours: 'perf_signed_url_ttl',
    browserCacheTTLDays: 'perf_browser_cache_ttl',
  }
  
  for (const [field, value] of Object.entries(updates)) {
    const key = keyMap[field as keyof PerformanceSettings]
    if (key) {
      await supabaseAdmin
        .from('system_settings')
        .upsert({
          key,
          value: JSON.stringify(value),
          value_type: typeof value === 'boolean' ? 'boolean' : 'number',
          category: 'storage',
          name: `Performance: ${field}`,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
    }
  }
  
  await logAction('system.performance_update', { updates })
}

export async function clearAllCaches(): Promise<{ cleared: number }> {
  await requireCapability('system.settings')
  
  // In a real implementation, this would:
  // 1. Invalidate CDN cache
  // 2. Clear any server-side caches
  // 3. Regenerate signed URLs
  
  await logAction('system.cache_clear', {})
  
  return { cleared: 1 }
}

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

export async function getNotificationSettings(): Promise<NotificationSettings> {
  await requireCapability('system.settings')
  
  const keys = [
    'notify_admin_email',
    'notify_new_user',
    'notify_new_subscription',
    'notify_cancellation',
    'notify_support_message',
    'notify_storage_warning',
    'notify_storage_critical',
  ]
  
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .in('key', keys)
  
  const settings = Object.fromEntries((data || []).map(s => [s.key, s.value]))
  
  return {
    adminEmail: settings.notify_admin_email || 'admin@12img.com',
    alertOnNewUser: settings.notify_new_user !== false,
    alertOnNewSubscription: settings.notify_new_subscription !== false,
    alertOnCancellation: settings.notify_cancellation !== false,
    alertOnSupportMessage: settings.notify_support_message !== false,
    storageWarningPercent: Number(settings.notify_storage_warning) || 80,
    storageCriticalPercent: Number(settings.notify_storage_critical) || 95,
  }
}

export async function updateNotificationSettings(updates: Partial<NotificationSettings>): Promise<void> {
  await requireCapability('system.settings')
  
  const keyMap: Record<keyof NotificationSettings, string> = {
    adminEmail: 'notify_admin_email',
    alertOnNewUser: 'notify_new_user',
    alertOnNewSubscription: 'notify_new_subscription',
    alertOnCancellation: 'notify_cancellation',
    alertOnSupportMessage: 'notify_support_message',
    storageWarningPercent: 'notify_storage_warning',
    storageCriticalPercent: 'notify_storage_critical',
  }
  
  for (const [field, value] of Object.entries(updates)) {
    const key = keyMap[field as keyof NotificationSettings]
    if (key) {
      await supabaseAdmin
        .from('system_settings')
        .upsert({
          key,
          value: JSON.stringify(value),
          value_type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
          category: 'general',
          name: `Notifications: ${field}`,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
    }
  }
  
  await logAction('system.notifications_update', { updates })
}

// ============================================================================
// BRANDING SETTINGS
// ============================================================================

export async function getBrandingSettings(): Promise<BrandingSettings> {
  await requireCapability('system.settings')
  
  const keys = ['brand_logo_url', 'brand_primary_color', 'brand_accent_color']
  
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .in('key', keys)
  
  const settings = Object.fromEntries((data || []).map(s => [s.key, s.value]))
  
  return {
    logoUrl: settings.brand_logo_url || null,
    primaryColor: settings.brand_primary_color || '#141414',
    accentColor: settings.brand_accent_color || '#525252',
  }
}

export async function updateBrandingSettings(updates: Partial<BrandingSettings>): Promise<void> {
  await requireCapability('system.settings')
  
  const keyMap: Record<keyof BrandingSettings, string> = {
    logoUrl: 'brand_logo_url',
    primaryColor: 'brand_primary_color',
    accentColor: 'brand_accent_color',
  }
  
  for (const [field, value] of Object.entries(updates)) {
    const key = keyMap[field as keyof BrandingSettings]
    if (key) {
      await supabaseAdmin
        .from('system_settings')
        .upsert({
          key,
          value: JSON.stringify(value),
          value_type: 'string',
          category: 'general',
          name: `Branding: ${field}`,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
    }
  }
  
  await logAction('system.branding_update', { updates })
}

// ============================================================================
// DATA & RETENTION SETTINGS
// ============================================================================

export async function getDataRetentionSettings(): Promise<DataRetentionSettings> {
  await requireCapability('system.settings')
  
  const keys = [
    'retention_inactive_accounts',
    'retention_demo_cards',
    'retention_audit_logs',
  ]
  
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .in('key', keys)
  
  const settings = Object.fromEntries((data || []).map(s => [s.key, s.value]))
  
  return {
    deleteInactiveAccountsAfterMonths: settings.retention_inactive_accounts ? Number(settings.retention_inactive_accounts) : null,
    deleteDemoCardsAfterDays: Number(settings.retention_demo_cards) || 30,
    deleteAuditLogsAfterDays: settings.retention_audit_logs ? Number(settings.retention_audit_logs) : null,
  }
}

export async function updateDataRetentionSettings(updates: Partial<DataRetentionSettings>): Promise<void> {
  await requireCapability('system.settings')
  
  const keyMap: Record<keyof DataRetentionSettings, string> = {
    deleteInactiveAccountsAfterMonths: 'retention_inactive_accounts',
    deleteDemoCardsAfterDays: 'retention_demo_cards',
    deleteAuditLogsAfterDays: 'retention_audit_logs',
  }
  
  for (const [field, value] of Object.entries(updates)) {
    const key = keyMap[field as keyof DataRetentionSettings]
    if (key) {
      await supabaseAdmin
        .from('system_settings')
        .upsert({
          key,
          value: value === null ? 'null' : JSON.stringify(value),
          value_type: 'number',
          category: 'storage',
          name: `Retention: ${field}`,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
    }
  }
  
  await logAction('system.retention_update', { updates })
}

// ============================================================================
// DATA EXPORT
// ============================================================================

export async function exportUsers(): Promise<{ data: string; filename: string }> {
  await requireCapability('users.list')
  
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, plan, role, created_at, last_sign_in_at')
    .order('created_at', { ascending: false })
  
  const csv = [
    'id,email,display_name,plan,role,created_at,last_sign_in_at',
    ...(users || []).map(u => 
      `${u.id},${u.email},${u.display_name || ''},${u.plan || 'free'},${u.role || 'user'},${u.created_at},${u.last_sign_in_at || ''}`
    )
  ].join('\n')
  
  await logAction('system.export_users', { count: users?.length })
  
  return {
    data: csv,
    filename: `12img-users-${new Date().toISOString().split('T')[0]}.csv`
  }
}

export async function exportGalleries(): Promise<{ data: string; filename: string }> {
  await requireCapability('galleries.list')
  
  const { data: galleries } = await supabaseAdmin
    .from('galleries')
    .select(`
      id, 
      title, 
      slug, 
      is_public, 
      created_at, 
      user_id,
      users!user_id (email)
    `)
    .order('created_at', { ascending: false })
  
  const csv = [
    'id,title,slug,is_public,created_at,user_id,user_email',
    ...(galleries || []).map((g: any) => 
      `${g.id},"${g.title}",${g.slug},${g.is_public},${g.created_at},${g.user_id},${g.users?.email || ''}`
    )
  ].join('\n')
  
  await logAction('system.export_galleries', { count: galleries?.length })
  
  return {
    data: csv,
    filename: `12img-galleries-${new Date().toISOString().split('T')[0]}.csv`
  }
}

export async function exportAuditLogs(): Promise<{ data: string; filename: string }> {
  await requireCapability('system.logs')
  
  const { data: logs } = await supabaseAdmin
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10000)
  
  await logAction('system.export_logs', { count: logs?.length })
  
  return {
    data: JSON.stringify(logs, null, 2),
    filename: `12img-audit-logs-${new Date().toISOString().split('T')[0]}.json`
  }
}

export async function exportAllSettings(): Promise<{ data: string; filename: string }> {
  await requireCapability('system.settings')
  
  const { data: settings } = await supabaseAdmin
    .from('system_settings')
    .select('key, value, value_type, category, name, description')
    .order('category')
  
  await logAction('system.export_settings', { count: settings?.length })
  
  return {
    data: JSON.stringify(settings, null, 2),
    filename: `12img-settings-${new Date().toISOString().split('T')[0]}.json`
  }
}

// ============================================================================
// DANGER ZONE
// ============================================================================

export async function purgeOrphanedFiles(): Promise<{ deleted: number }> {
  await requireCapability('system.settings')
  
  // Find files in storage that don't have corresponding image records
  // This is a safety operation to clean up orphaned files
  
  // In production, this would:
  // 1. List all files in storage buckets
  // 2. Compare against images table
  // 3. Delete files not in database
  
  await logAction('system.purge_orphans', {})
  
  return { deleted: 0 } // Placeholder
}

export async function clearAllLogs(): Promise<{ deleted: number }> {
  await requireCapability('system.settings')
  
  // Delete all audit logs older than 30 days (keep recent for safety)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Count first, then delete
  const { count } = await supabaseAdmin
    .from('admin_audit_logs')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', thirtyDaysAgo.toISOString())
  
  await supabaseAdmin
    .from('admin_audit_logs')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
  
  await logAction('system.clear_logs', { deleted: count })
  
  return { deleted: count || 0 }
}

// ============================================================================
// INTEGRATIONS STATUS
// ============================================================================

export async function getIntegrationsStatus(): Promise<IntegrationStatus[]> {
  await requireCapability('system.settings')
  
  const integrations: IntegrationStatus[] = []
  
  // Check Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY
  integrations.push({
    name: 'Stripe',
    status: stripeKey ? 'connected' : 'not_configured',
    lastChecked: new Date().toISOString(),
    errorMessage: stripeKey ? null : 'STRIPE_SECRET_KEY not set',
  })
  
  // Check Resend
  const resendKey = process.env.RESEND_API_KEY
  integrations.push({
    name: 'Resend',
    status: resendKey ? 'connected' : 'not_configured',
    lastChecked: new Date().toISOString(),
    errorMessage: resendKey ? null : 'RESEND_API_KEY not set',
  })
  
  // Check Clerk
  const clerkKey = process.env.CLERK_SECRET_KEY
  integrations.push({
    name: 'Clerk',
    status: clerkKey ? 'connected' : 'not_configured',
    lastChecked: new Date().toISOString(),
    errorMessage: clerkKey ? null : 'CLERK_SECRET_KEY not set',
  })
  
  // Check Supabase (always connected if we got here)
  integrations.push({
    name: 'Supabase',
    status: 'connected',
    lastChecked: new Date().toISOString(),
    errorMessage: null,
  })
  
  // Check Google Analytics
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  integrations.push({
    name: 'Google Analytics',
    status: gaId ? 'connected' : 'not_configured',
    lastChecked: new Date().toISOString(),
    errorMessage: gaId ? null : 'NEXT_PUBLIC_GA_ID not set',
  })
  
  return integrations
}
