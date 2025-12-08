'use server'

/**
 * Milestone Actions
 * 
 * Server actions for milestone tracking, delivery countdown,
 * and contract status management.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import {
  type ActionResult,
  type Milestone,
  type MilestoneType,
  type DeliveryProgress,
  type ExtendedContractStatus,
  userError,
  systemError,
  validationError,
  canTransitionTo,
  MILESTONE_TYPE_CONFIG,
} from '@/lib/contracts/types'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createMilestoneSchema = z.object({
  contractId: z.string().uuid(),
  type: z.enum([
    'contract_initiated',
    'contract_signed',
    'event_completed',
    'editing_started',
    'editing_complete',
    'gallery_created',
    'gallery_published',
    'delivery_complete',
    'custom',
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  occurredAt: z.string().datetime().optional(),
})

const markEventCompletedSchema = z.object({
  contractId: z.string().uuid(),
  completedAt: z.string().datetime().optional(),
  deliveryWindowDays: z.number().min(1).max(365).optional(),
})

const updateStatusSchema = z.object({
  contractId: z.string().uuid(),
  newStatus: z.enum([
    'draft', 'sent', 'viewed', 'signed', 
    'in_progress', 'editing', 'ready', 'delivered', 'archived'
  ]),
  reason: z.string().max(500).optional(),
})

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapDbToMilestone(row: any): Milestone {
  return {
    id: row.id,
    contractId: row.contract_id,
    photographerId: row.photographer_id,
    clientId: row.client_id,
    type: row.type as MilestoneType,
    title: row.title,
    description: row.description,
    notes: row.notes,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
    isSystemGenerated: row.is_system_generated,
    metadata: row.metadata || {},
  }
}

function mapDbToDeliveryProgress(row: any): DeliveryProgress {
  return {
    contractId: row.contract_id,
    photographerId: row.photographer_id,
    clientId: row.client_id,
    status: row.status,
    deliveryWindowDays: row.delivery_window_days,
    eventCompletedAt: row.event_completed_at,
    estimatedDeliveryDate: row.estimated_delivery_date,
    daysRemaining: row.days_remaining,
    daysElapsed: row.days_elapsed,
    percentComplete: row.percent_complete,
    isOverdue: row.is_overdue,
    deliveryStatus: row.delivery_status,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// CREATE MILESTONE
// ============================================

export async function createMilestone(
  input: z.infer<typeof createMilestoneSchema>
): Promise<ActionResult<Milestone>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  const validation = createMilestoneSchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return {
      success: false,
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')),
    }
  }

  const { contractId, type, title, description, notes, occurredAt } = validation.data

  try {
    // Verify contract belongs to photographer
    const { data: contract } = await supabaseAdmin
      .from('contracts')
      .select('id, photographer_id, client_id')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (!contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    // Create milestone
    const { data: milestone, error } = await supabaseAdmin
      .from('milestones')
      .insert({
        contract_id: contractId,
        photographer_id: user.id,
        client_id: contract.client_id,
        type,
        title,
        description: description || null,
        notes: notes || null,
        occurred_at: occurredAt || new Date().toISOString(),
        created_by: user.id,
        is_system_generated: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[createMilestone] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to create milestone') }
    }

    // Create system message for client
    const config = MILESTONE_TYPE_CONFIG[type]
    await supabaseAdmin
      .from('messages')
      .insert({
        client_id: contract.client_id,
        photographer_id: user.id,
        is_from_photographer: true,
        message_type: 'system',
        content: `📍 ${config.label}: ${title}${description ? ` — ${description}` : ''}`,
        status: 'sent',
      })

    revalidatePath(`/dashboard/clients/${contract.client_id}`)
    revalidatePath(`/dashboard/contracts/${contractId}`)

    return { success: true, data: mapDbToMilestone(milestone) }
  } catch (e) {
    console.error('[createMilestone] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET MILESTONES FOR CONTRACT
// ============================================

export async function getMilestones(
  contractId: string
): Promise<ActionResult<Milestone[]>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('milestones')
      .select('*')
      .eq('contract_id', contractId)
      .eq('photographer_id', user.id)
      .order('occurred_at', { ascending: true })

    if (error) {
      console.error('[getMilestones] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch milestones') }
    }

    return { success: true, data: (data || []).map(mapDbToMilestone) }
  } catch (e) {
    console.error('[getMilestones] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET MILESTONES FOR CLIENT (Portal)
// ============================================

export async function getClientMilestones(
  contractId: string,
  clientId: string
): Promise<ActionResult<Milestone[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('milestones')
      .select('id, contract_id, type, title, description, occurred_at, created_at, is_system_generated')
      .eq('contract_id', contractId)
      .eq('client_id', clientId)
      .order('occurred_at', { ascending: true })

    if (error) {
      console.error('[getClientMilestones] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch milestones') }
    }

    // Map without internal notes
    const milestones = (data || []).map(row => ({
      id: row.id,
      contractId: row.contract_id,
      photographerId: '',
      clientId: clientId,
      type: row.type as MilestoneType,
      title: row.title,
      description: row.description,
      notes: null, // Don't expose internal notes to client
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
      createdBy: null,
      isSystemGenerated: row.is_system_generated,
      metadata: {},
    }))

    return { success: true, data: milestones }
  } catch (e) {
    console.error('[getClientMilestones] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET DELIVERY PROGRESS
// ============================================

export async function getDeliveryProgress(
  contractId: string
): Promise<ActionResult<DeliveryProgress | null>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('delivery_progress')
      .select('*')
      .eq('contract_id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: null }
      }
      console.error('[getDeliveryProgress] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch delivery progress') }
    }

    return { success: true, data: mapDbToDeliveryProgress(data) }
  } catch (e) {
    console.error('[getDeliveryProgress] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET DELIVERY PROGRESS FOR CLIENT (Portal)
// ============================================

export async function getClientDeliveryProgress(
  contractId: string,
  clientId: string
): Promise<ActionResult<DeliveryProgress | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('delivery_progress')
      .select('*')
      .eq('contract_id', contractId)
      .eq('client_id', clientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: null }
      }
      console.error('[getClientDeliveryProgress] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch delivery progress') }
    }

    return { success: true, data: mapDbToDeliveryProgress(data) }
  } catch (e) {
    console.error('[getClientDeliveryProgress] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// MARK EVENT AS COMPLETED
// ============================================

export async function markEventCompleted(
  input: z.infer<typeof markEventCompletedSchema>
): Promise<ActionResult<{ milestone: Milestone; progress: DeliveryProgress }>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  const validation = markEventCompletedSchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return {
      success: false,
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')),
    }
  }

  const { contractId, completedAt, deliveryWindowDays } = validation.data

  try {
    // Verify contract belongs to photographer
    const { data: contract } = await supabaseAdmin
      .from('contracts')
      .select('id, photographer_id, client_id, delivery_window_days')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (!contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    const eventDate = completedAt || new Date().toISOString()
    const windowDays = deliveryWindowDays || contract.delivery_window_days || 60

    // Update contract with event completion
    const { error: updateError } = await supabaseAdmin
      .from('contracts')
      .update({
        event_completed_at: eventDate,
        delivery_window_days: windowDays,
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)

    if (updateError) {
      console.error('[markEventCompleted] Update error:', updateError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to update contract') }
    }

    // Create milestone
    const { data: milestone, error: milestoneError } = await supabaseAdmin
      .from('milestones')
      .insert({
        contract_id: contractId,
        photographer_id: user.id,
        client_id: contract.client_id,
        type: 'event_completed',
        title: 'Event Completed',
        description: `Your event has been completed! Editing will begin shortly. Expected delivery in ${windowDays} days.`,
        occurred_at: eventDate,
        created_by: user.id,
        is_system_generated: true,
      })
      .select()
      .single()

    if (milestoneError) {
      console.error('[markEventCompleted] Milestone error:', milestoneError)
    }

    // Create system message
    await supabaseAdmin
      .from('messages')
      .insert({
        client_id: contract.client_id,
        photographer_id: user.id,
        is_from_photographer: true,
        message_type: 'system',
        content: `🎉 Event Completed! Your photos are now being processed. Expected delivery: ${new Date(new Date(eventDate).getTime() + windowDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        status: 'sent',
      })

    // Get updated delivery progress
    const { data: progress } = await supabaseAdmin
      .from('delivery_progress')
      .select('*')
      .eq('contract_id', contractId)
      .single()

    revalidatePath(`/dashboard/clients/${contract.client_id}`)
    revalidatePath(`/dashboard/contracts/${contractId}`)

    return {
      success: true,
      data: {
        milestone: milestone ? mapDbToMilestone(milestone) : {} as Milestone,
        progress: progress ? mapDbToDeliveryProgress(progress) : {} as DeliveryProgress,
      },
    }
  } catch (e) {
    console.error('[markEventCompleted] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// UPDATE CONTRACT STATUS
// ============================================

export async function updateContractStatus(
  input: z.infer<typeof updateStatusSchema>
): Promise<ActionResult<{ status: ExtendedContractStatus; milestone?: Milestone }>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  const validation = updateStatusSchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return {
      success: false,
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')),
    }
  }

  const { contractId, newStatus, reason } = validation.data

  try {
    // Get current contract
    const { data: contract } = await supabaseAdmin
      .from('contracts')
      .select('id, photographer_id, client_id, status')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (!contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    const currentStatus = contract.status as ExtendedContractStatus

    // Validate transition
    if (!canTransitionTo(currentStatus, newStatus)) {
      return {
        success: false,
        error: userError('INVALID_TRANSITION', `Cannot transition from ${currentStatus} to ${newStatus}`),
      }
    }

    // Build update object
    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // Set timestamp fields based on status
    if (newStatus === 'editing') {
      updateData.editing_started_at = new Date().toISOString()
    } else if (newStatus === 'ready') {
      updateData.editing_completed_at = new Date().toISOString()
    } else if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    }

    // Update contract
    const { error: updateError } = await supabaseAdmin
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)

    if (updateError) {
      console.error('[updateContractStatus] Update error:', updateError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to update status') }
    }

    // Record in history
    await supabaseAdmin
      .from('contract_status_history')
      .insert({
        contract_id: contractId,
        from_status: currentStatus,
        to_status: newStatus,
        changed_by: user.id,
        changed_by_type: 'photographer',
        reason: reason || null,
      })

    // Create milestone for significant status changes
    const milestoneTypeMap: Partial<Record<ExtendedContractStatus, MilestoneType>> = {
      editing: 'editing_started',
      ready: 'editing_complete',
      delivered: 'delivery_complete',
    }

    let milestone: Milestone | undefined

    if (milestoneTypeMap[newStatus]) {
      const milestoneType = milestoneTypeMap[newStatus]!
      const config = MILESTONE_TYPE_CONFIG[milestoneType]

      const { data: milestoneData } = await supabaseAdmin
        .from('milestones')
        .insert({
          contract_id: contractId,
          photographer_id: user.id,
          client_id: contract.client_id,
          type: milestoneType,
          title: config.label,
          description: reason || null,
          occurred_at: new Date().toISOString(),
          created_by: user.id,
          is_system_generated: true,
        })
        .select()
        .single()

      if (milestoneData) {
        milestone = mapDbToMilestone(milestoneData)
      }

      // Create system message
      await supabaseAdmin
        .from('messages')
        .insert({
          client_id: contract.client_id,
          photographer_id: user.id,
          is_from_photographer: true,
          message_type: 'system',
          content: `📍 ${config.label}${reason ? `: ${reason}` : ''}`,
          status: 'sent',
        })
    }

    revalidatePath(`/dashboard/clients/${contract.client_id}`)
    revalidatePath(`/dashboard/contracts/${contractId}`)

    return { success: true, data: { status: newStatus, milestone } }
  } catch (e) {
    console.error('[updateContractStatus] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET ALL ACTIVE DELIVERY PROGRESS (for dashboard)
// ============================================

export async function getAllDeliveryProgress(): Promise<ActionResult<DeliveryProgress[]>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('delivery_progress')
      .select('*')
      .eq('photographer_id', user.id)
      .in('delivery_status', ['in_progress', 'overdue'])
      .order('days_remaining', { ascending: true })

    if (error) {
      console.error('[getAllDeliveryProgress] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch delivery progress') }
    }

    return { success: true, data: (data || []).map(mapDbToDeliveryProgress) }
  } catch (e) {
    console.error('[getAllDeliveryProgress] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}
