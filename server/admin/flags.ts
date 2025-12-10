/**
 * Admin Feature Flags - GOD MODE
 * 
 * State-of-the-art feature flag system with:
 * - Multiple targeting strategies (boolean, percentage, plan, user list, date range)
 * - Consistent hashing for percentage rollouts
 * - Full audit trail of all changes
 * - Real-time toggle capabilities
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability, logAdminAction } from './guards'

// ============================================================================
// TYPES
// ============================================================================

export type FlagType = 'boolean' | 'percentage' | 'plan_based' | 'user_list' | 'date_range'
export type FlagCategory = 'general' | 'ui' | 'billing' | 'experimental'

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string | null
  isEnabled: boolean
  flagType: FlagType
  rolloutPercentage: number
  targetPlans: string[]
  targetUserCount: number
  startsAt: string | null
  endsAt: string | null
  category: FlagCategory
  isKillswitch: boolean
  createdAt: string
  updatedAt: string
}

export interface FlagHistoryEntry {
  id: string
  flagId: string
  changedBy: string | null
  changeType: 'created' | 'enabled' | 'disabled' | 'updated' | 'deleted'
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  reason: string | null
  changedAt: string
}

export interface CreateFlagInput {
  key: string
  name: string
  description?: string
  flagType: FlagType
  category: FlagCategory
  rolloutPercentage?: number
  targetPlans?: string[]
  startsAt?: string
  endsAt?: string
  isKillswitch?: boolean
}

export interface UpdateFlagInput {
  name?: string
  description?: string
  flagType?: FlagType
  rolloutPercentage?: number
  targetPlans?: string[]
  startsAt?: string | null
  endsAt?: string | null
  category?: FlagCategory
  isKillswitch?: boolean
}

// ============================================================================
// GET ALL FLAGS
// ============================================================================

export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  await requireCapability('system.feature_flags')
  
  const { data, error } = await supabaseAdmin.rpc('get_all_feature_flags')
  
  if (error) {
    console.error('Get flags error:', error)
    // Fallback to direct query
    return fallbackGetAllFlags()
  }
  
  return (data || []).map(transformFlag)
}

async function fallbackGetAllFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabaseAdmin
    .from('feature_flags')
    .select('*')
    .order('category')
    .order('name')
  
  if (error) {
    throw new Error(`Failed to get flags: ${error.message}`)
  }
  
  return (data || []).map((row: any) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    isEnabled: row.is_enabled,
    flagType: row.flag_type,
    rolloutPercentage: row.rollout_percentage || 0,
    targetPlans: row.target_plans || [],
    targetUserCount: (row.target_user_ids?.length || 0) + (row.target_user_emails?.length || 0),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    category: row.category,
    isKillswitch: row.is_killswitch,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

function transformFlag(row: any): FeatureFlag {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    isEnabled: row.is_enabled,
    flagType: row.flag_type,
    rolloutPercentage: row.rollout_percentage || 0,
    targetPlans: row.target_plans || [],
    targetUserCount: row.target_user_count || 0,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    category: row.category,
    isKillswitch: row.is_killswitch,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================================================
// GET SINGLE FLAG
// ============================================================================

export async function getFeatureFlag(flagId: string): Promise<FeatureFlag | null> {
  await requireCapability('system.feature_flags')
  
  const { data, error } = await supabaseAdmin
    .from('feature_flags')
    .select('*')
    .eq('id', flagId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    id: data.id,
    key: data.key,
    name: data.name,
    description: data.description,
    isEnabled: data.is_enabled,
    flagType: data.flag_type,
    rolloutPercentage: data.rollout_percentage || 0,
    targetPlans: data.target_plans || [],
    targetUserCount: (data.target_user_ids?.length || 0) + (data.target_user_emails?.length || 0),
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    category: data.category,
    isKillswitch: data.is_killswitch,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// ============================================================================
// TOGGLE FLAG
// ============================================================================

export async function toggleFeatureFlag(
  flagKey: string,
  enabled: boolean,
  reason?: string
): Promise<boolean> {
  const admin = await requireCapability('system.feature_flags')
  
  const { data, error } = await supabaseAdmin.rpc('toggle_feature_flag', {
    p_flag_key: flagKey,
    p_enabled: enabled,
    p_admin_id: admin.userId,
    p_reason: reason || null,
  })
  
  if (error) {
    // Fallback to direct update
    const { error: updateError } = await supabaseAdmin
      .from('feature_flags')
      .update({ 
        is_enabled: enabled, 
        updated_at: new Date().toISOString(),
        updated_by: admin.userId,
      })
      .eq('key', flagKey)
    
    if (updateError) {
      throw new Error(`Failed to toggle flag: ${updateError.message}`)
    }
    
    // Log manually
    await logAdminAction(admin.userId, 'system.feature_flag_update', {
      targetType: 'feature_flag',
      targetIdentifier: flagKey,
      metadata: {
        action: enabled ? 'enabled' : 'disabled',
        reason,
      },
    })
  }
  
  return true
}

// ============================================================================
// CREATE FLAG
// ============================================================================

export async function createFeatureFlag(input: CreateFlagInput): Promise<string> {
  const admin = await requireCapability('system.feature_flags')
  
  // Validate key format
  if (!/^[a-z][a-z0-9_]*$/.test(input.key)) {
    throw new Error('Flag key must be lowercase with underscores, starting with a letter')
  }
  
  const { data, error } = await supabaseAdmin
    .from('feature_flags')
    .insert({
      key: input.key,
      name: input.name,
      description: input.description || null,
      flag_type: input.flagType,
      category: input.category,
      rollout_percentage: input.rolloutPercentage || 0,
      target_plans: input.targetPlans || [],
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      is_killswitch: input.isKillswitch || false,
      is_enabled: false,
      created_by: admin.userId,
    })
    .select('id')
    .single()
  
  if (error) {
    throw new Error(`Failed to create flag: ${error.message}`)
  }
  
  // Log creation
  await logAdminAction(admin.userId, 'system.feature_flag_update', {
    targetType: 'feature_flag',
    targetId: data.id,
    targetIdentifier: input.key,
    metadata: {
      action: 'created',
      flagType: input.flagType,
      category: input.category,
    },
  })
  
  return data.id
}

// ============================================================================
// UPDATE FLAG
// ============================================================================

export async function updateFeatureFlag(
  flagId: string,
  updates: UpdateFlagInput,
  reason?: string
): Promise<boolean> {
  const admin = await requireCapability('system.feature_flags')
  
  // Get current flag for audit
  const { data: currentFlag } = await supabaseAdmin
    .from('feature_flags')
    .select('*')
    .eq('id', flagId)
    .single()
  
  if (!currentFlag) {
    throw new Error('Flag not found')
  }
  
  // Build update object
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
    updated_by: admin.userId,
  }
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.flagType !== undefined) updateData.flag_type = updates.flagType
  if (updates.rolloutPercentage !== undefined) updateData.rollout_percentage = updates.rolloutPercentage
  if (updates.targetPlans !== undefined) updateData.target_plans = updates.targetPlans
  if (updates.startsAt !== undefined) updateData.starts_at = updates.startsAt
  if (updates.endsAt !== undefined) updateData.ends_at = updates.endsAt
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.isKillswitch !== undefined) updateData.is_killswitch = updates.isKillswitch
  
  const { error } = await supabaseAdmin
    .from('feature_flags')
    .update(updateData)
    .eq('id', flagId)
  
  if (error) {
    throw new Error(`Failed to update flag: ${error.message}`)
  }
  
  // Log to history
  await supabaseAdmin.from('feature_flag_history').insert({
    flag_id: flagId,
    changed_by: admin.userId,
    change_type: 'updated',
    old_value: currentFlag,
    new_value: updates,
    reason,
  })
  
  // Log to admin audit
  await logAdminAction(admin.userId, 'system.feature_flag_update', {
    targetType: 'feature_flag',
    targetId: flagId,
    targetIdentifier: currentFlag.key,
    metadata: {
      action: 'updated',
      changes: updates,
      reason,
    },
  })
  
  return true
}

// ============================================================================
// DELETE FLAG
// ============================================================================

export async function deleteFeatureFlag(flagId: string, reason?: string): Promise<boolean> {
  const admin = await requireCapability('system.feature_flags')
  
  // Get flag for audit
  const { data: flag } = await supabaseAdmin
    .from('feature_flags')
    .select('*')
    .eq('id', flagId)
    .single()
  
  if (!flag) {
    throw new Error('Flag not found')
  }
  
  // Log to history before deletion
  await supabaseAdmin.from('feature_flag_history').insert({
    flag_id: flagId,
    changed_by: admin.userId,
    change_type: 'deleted',
    old_value: flag,
    reason,
  })
  
  // Delete flag
  const { error } = await supabaseAdmin
    .from('feature_flags')
    .delete()
    .eq('id', flagId)
  
  if (error) {
    throw new Error(`Failed to delete flag: ${error.message}`)
  }
  
  // Log to admin audit
  await logAdminAction(admin.userId, 'system.feature_flag_update', {
    targetType: 'feature_flag',
    targetIdentifier: flag.key,
    metadata: {
      action: 'deleted',
      flagName: flag.name,
      reason,
    },
  })
  
  return true
}

// ============================================================================
// GET FLAG HISTORY
// ============================================================================

export async function getFlagHistory(flagId: string): Promise<FlagHistoryEntry[]> {
  await requireCapability('system.feature_flags')
  
  const { data, error } = await supabaseAdmin
    .from('feature_flag_history')
    .select('*')
    .eq('flag_id', flagId)
    .order('changed_at', { ascending: false })
    .limit(50)
  
  if (error) {
    throw new Error(`Failed to get flag history: ${error.message}`)
  }
  
  return (data || []).map((row: any) => ({
    id: row.id,
    flagId: row.flag_id,
    changedBy: row.changed_by,
    changeType: row.change_type,
    oldValue: row.old_value,
    newValue: row.new_value,
    reason: row.reason,
    changedAt: row.changed_at,
  }))
}

// ============================================================================
// EVALUATE FLAG (for client-side use)
// ============================================================================

export async function evaluateFlag(
  flagKey: string,
  userId?: string,
  userPlan?: string,
  userEmail?: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('evaluate_feature_flag', {
    p_flag_key: flagKey,
    p_user_id: userId || null,
    p_user_plan: userPlan || null,
    p_user_email: userEmail || null,
  })
  
  if (error) {
    console.error('Flag evaluation error:', error)
    return false
  }
  
  return data === true
}

// ============================================================================
// GET FLAGS BY CATEGORY
// ============================================================================

export async function getFlagsByCategory(): Promise<Record<FlagCategory, FeatureFlag[]>> {
  const flags = await getAllFeatureFlags()
  
  const grouped: Record<FlagCategory, FeatureFlag[]> = {
    general: [],
    ui: [],
    billing: [],
    experimental: [],
  }
  
  for (const flag of flags) {
    const category = flag.category as FlagCategory
    if (grouped[category]) {
      grouped[category].push(flag)
    } else {
      grouped.general.push(flag)
    }
  }
  
  return grouped
}

// ============================================================================
// FLAG STATS
// ============================================================================

export async function getFlagStats(): Promise<{
  total: number
  enabled: number
  disabled: number
  byCategory: Record<string, number>
  byType: Record<string, number>
}> {
  await requireCapability('system.feature_flags')
  
  const { data: flags } = await supabaseAdmin
    .from('feature_flags')
    .select('is_enabled, category, flag_type')
  
  if (!flags) {
    return {
      total: 0,
      enabled: 0,
      disabled: 0,
      byCategory: {},
      byType: {},
    }
  }
  
  const byCategory: Record<string, number> = {}
  const byType: Record<string, number> = {}
  let enabled = 0
  
  for (const flag of flags) {
    if (flag.is_enabled) enabled++
    byCategory[flag.category] = (byCategory[flag.category] || 0) + 1
    byType[flag.flag_type] = (byType[flag.flag_type] || 0) + 1
  }
  
  return {
    total: flags.length,
    enabled,
    disabled: flags.length - enabled,
    byCategory,
    byType,
  }
}
