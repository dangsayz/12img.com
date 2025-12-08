'use server'

/**
 * Contract Actions
 * 
 * Server actions for contract management, generation, and signing.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import type { ContractStatus, ClauseCategory, Tables } from '@/types/database'
import {
  type ActionResult,
  type ContractWithDetails,
  type ClauseWithState,
  type ClauseSnapshot,
  type MergeFieldData,
  type ClientProfile,
  userError,
  systemError,
  validationError,
} from '@/lib/contracts/types'
import {
  buildMergeDataFromClient,
  replaceMergeFields,
  renderContract,
  getClientSignatureFields,
} from '@/lib/contracts/merge-fields'
import {
  DEFAULT_CONTRACT_HEADER,
  DEFAULT_CONTRACT_FOOTER,
  wrapClause,
  CONTRACT_STYLES,
} from '@/lib/contracts/templates'
import { getClausesForEventType } from '@/lib/contracts/event-clauses'
import { sendContractEmail, sendSignatureConfirmationEmail, sendPhotographerSignatureNotification } from '@/server/services/contract-email.service'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createContractSchema = z.object({
  clientId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  clauseIds: z.array(z.string().uuid()).optional(), // Optional - if empty, uses event-type templates
  templateClauseIds: z.array(z.string()).optional(), // IDs from event-clauses.ts templates
  mergeDataOverrides: z.record(z.string()).optional(),
})

const signContractSchema = z.object({
  contractId: z.string().uuid(),
  signerName: z.string().min(1, 'Name is required'),
  signerEmail: z.string().email('Valid email required'),
  signatureData: z.string().min(100, 'Signature is required'), // Base64 image
  agreedToTerms: z.boolean().refine(v => v === true, 'You must agree to the terms'),
})

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapDbToContract(
  row: Tables<'contracts'>,
  client?: Tables<'client_profiles'>,
  signature?: Tables<'contract_signatures'>
): ContractWithDetails {
  return {
    id: row.id,
    photographerId: row.photographer_id,
    clientId: row.client_id,
    templateId: row.template_id,
    status: row.status as ContractStatus,
    renderedHtml: row.rendered_html,
    renderedText: row.rendered_text,
    mergeData: row.merge_data as unknown as MergeFieldData,
    clausesSnapshot: row.clauses_snapshot as unknown as ClauseSnapshot[],
    sentAt: row.sent_at,
    viewedAt: row.viewed_at,
    signedAt: row.signed_at,
    archivedAt: row.archived_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveryWindowDays: (row as any).delivery_window_days || null,
    eventCompletedAt: (row as any).event_completed_at || null,
    deliveredAt: (row as any).delivered_at || null,
    client: client ? mapDbToClient(client) : undefined,
    signature: signature ? {
      id: signature.id,
      contractId: signature.contract_id,
      signerName: signature.signer_name,
      signerEmail: signature.signer_email,
      signerIp: signature.signer_ip,
      signerUserAgent: signature.signer_user_agent,
      signatureData: signature.signature_data,
      signatureHash: signature.signature_hash,
      signedAt: signature.signed_at,
      agreedToTerms: signature.agreed_to_terms,
    } : undefined,
  }
}

function mapDbToClient(row: Tables<'client_profiles'>): ClientProfile {
  return {
    id: row.id,
    photographerId: row.photographer_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    partnerFirstName: row.partner_first_name,
    partnerLastName: row.partner_last_name,
    partnerEmail: row.partner_email,
    partnerPhone: row.partner_phone,
    eventType: row.event_type as any,
    eventDate: row.event_date,
    eventLocation: row.event_location,
    eventVenue: row.event_venue,
    packageName: row.package_name,
    packagePrice: row.package_price ? Number(row.package_price) : null,
    packageHours: row.package_hours,
    packageDescription: row.package_description,
    retainerFee: (row as any).retainer_fee ? Number((row as any).retainer_fee) : null,
    balanceDueDate: (row as any).balance_due_date || null,
    notes: row.notes,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// GET CLAUSES
// ============================================

export async function getAvailableClauses(): Promise<ActionResult<ClauseWithState[]>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get system clauses (photographer_id is null) and user's custom clauses
    const { data, error } = await supabaseAdmin
      .from('contract_clauses')
      .select('*')
      .or(`photographer_id.is.null,photographer_id.eq.${user.id}`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[getAvailableClauses] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch clauses') }
    }

    const clauses: ClauseWithState[] = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      category: row.category as ClauseCategory,
      content: row.content,
      isRequired: row.is_required,
      isEnabled: row.is_required, // Required clauses start enabled
      sortOrder: row.sort_order,
      isSystem: row.photographer_id === null,
    }))

    return { success: true, data: clauses }
  } catch (e) {
    console.error('[getAvailableClauses] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// CREATE CONTRACT
// ============================================

export async function createContract(
  input: z.infer<typeof createContractSchema>
): Promise<ActionResult<ContractWithDetails>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  // Validate input
  const validation = createContractSchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return {
      success: false,
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')),
    }
  }

  const { clientId, templateId, clauseIds, templateClauseIds, mergeDataOverrides } = validation.data

  try {
    // Get client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', clientId)
      .eq('photographer_id', user.id)
      .single()

    if (clientError || !client) {
      return { success: false, error: userError('NOT_FOUND', 'Client not found') }
    }

    // Get user settings for photographer info
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email, website_url, phone, business_location')
      .eq('user_id', user.id)
      .single()

    // Build merge data first (needed for clause rendering)
    const mergeData = buildMergeDataFromClient(
      mapDbToClient(client),
      {
        name: settings?.business_name || '',
        email: settings?.contact_email || user.email,
        phone: settings?.phone || '',
        website: settings?.website_url || '',
        location: settings?.business_location || '',
      },
      mergeDataOverrides as Partial<MergeFieldData>
    )

    let clausesSnapshot: ClauseSnapshot[] = []

    // Check if we should use template clauses (from event-clauses.ts) or database clauses
    const useTemplateClauses = (!clauseIds || clauseIds.length === 0)

    if (useTemplateClauses) {
      // Use event-type-specific template clauses
      const eventType = client.event_type || 'other'
      const templateClauses = getClausesForEventType(eventType)
      
      // Filter to selected template clause IDs, or use all required + some defaults
      const selectedIds = templateClauseIds && templateClauseIds.length > 0
        ? new Set(templateClauseIds)
        : null

      const clausesToUse = selectedIds
        ? templateClauses.filter(c => selectedIds.has(c.id))
        : templateClauses.filter(c => c.isRequired) // Default to required clauses only

      clausesSnapshot = clausesToUse.map(clause => ({
        id: clause.id,
        title: clause.title,
        category: clause.category as ClauseCategory,
        content: replaceMergeFields(clause.content, mergeData),
        sortOrder: clause.sortOrder,
      }))
    } else {
      // Use database clauses (original behavior)
      const { data: clauses, error: clausesError } = await supabaseAdmin
        .from('contract_clauses')
        .select('*')
        .in('id', clauseIds)
        .or(`photographer_id.is.null,photographer_id.eq.${user.id}`)
        .order('sort_order', { ascending: true })

      if (clausesError) {
        console.error('[createContract] Clauses error:', clausesError)
        return { success: false, error: systemError('DB_ERROR', 'Failed to fetch clauses') }
      }

      clausesSnapshot = (clauses || []).map(clause => ({
        id: clause.id,
        title: clause.title,
        category: clause.category as ClauseCategory,
        content: replaceMergeFields(clause.content, mergeData),
        sortOrder: clause.sort_order,
      }))
    }

    // Build full contract HTML
    const headerHtml = replaceMergeFields(DEFAULT_CONTRACT_HEADER, mergeData)
    const footerHtml = replaceMergeFields(DEFAULT_CONTRACT_FOOTER, mergeData)
    const clausesHtml = clausesSnapshot.map(c => wrapClause(c.title, c.content)).join('\n')

    const fullHtml = `
      ${CONTRACT_STYLES}
      <div class="contract-document">
        ${headerHtml}
        <div class="contract-clauses">
          ${clausesHtml}
        </div>
        ${footerHtml}
      </div>
    `.trim()

    // Create plain text version
    const { text: renderedText } = renderContract(fullHtml, mergeData)

    // Insert contract
    const { data: contract, error: insertError } = await supabaseAdmin
      .from('contracts')
      .insert({
        photographer_id: user.id,
        client_id: clientId,
        template_id: templateId || null,
        status: 'draft',
        rendered_html: fullHtml,
        rendered_text: renderedText,
        merge_data: mergeData as any,
        clauses_snapshot: clausesSnapshot as any,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[createContract] Insert error:', insertError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to create contract') }
    }

    // Update merge data with contract ID
    const updatedMergeData = { ...mergeData, contract_id: contract.id }
    await supabaseAdmin
      .from('contracts')
      .update({ merge_data: updatedMergeData as any })
      .eq('id', contract.id)

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${clientId}`)

    return {
      success: true,
      data: mapDbToContract({ ...contract, merge_data: updatedMergeData as any }, client),
    }
  } catch (e) {
    console.error('[createContract] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET CONTRACT
// ============================================

export async function getContract(
  contractId: string
): Promise<ActionResult<ContractWithDetails>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    const { data: contract, error } = await supabaseAdmin
      .from('contracts')
      .select('*, client_profiles(*), contract_signatures(*)')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (error || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    const client = contract.client_profiles as unknown as Tables<'client_profiles'>
    const signature = (contract.contract_signatures as unknown as Tables<'contract_signatures'>[])?.[0]

    return {
      success: true,
      data: mapDbToContract(contract, client, signature),
    }
  } catch (e) {
    console.error('[getContract] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// SEND CONTRACT
// ============================================

export async function sendContractToClient(
  contractId: string,
  expirationDays: number = 30
): Promise<ActionResult<{ portalUrl: string }>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get contract
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*, client_profiles(*)')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (contractError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    if (contract.status !== 'draft') {
      return { success: false, error: userError('INVALID_STATE', 'Contract has already been sent') }
    }

    const client = contract.client_profiles as unknown as Tables<'client_profiles'>

    // Validate expiration days (min 1, max 30)
    const validExpirationDays = Math.min(Math.max(expirationDays, 1), 30)

    // Generate portal token
    const { data: tokenData } = await supabaseAdmin.rpc('generate_portal_token', {
      p_client_id: client.id,
      p_photographer_id: user.id,
      p_expires_in_days: validExpirationDays,
    })

    if (!tokenData) {
      return { success: false, error: systemError('TOKEN_ERROR', 'Failed to generate portal access') }
    }

    // Update contract status
    const { error: updateError } = await supabaseAdmin
      .from('contracts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + validExpirationDays * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', contractId)

    if (updateError) {
      console.error('[sendContractToClient] Update error:', updateError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to update contract') }
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${tokenData}/contract`

    // Get user settings for photographer info
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email')
      .eq('user_id', user.id)
      .single()

    // Send email notification to client
    const emailResult = await sendContractEmail({
      clientEmail: client.email,
      clientName: `${client.first_name}${client.partner_first_name ? ` & ${client.partner_first_name}` : ''}`,
      photographerName: settings?.business_name || 'Your Photographer',
      photographerEmail: settings?.contact_email || user.email,
      portalUrl,
      eventType: client.event_type || 'Photography',
      eventDate: client.event_date || undefined,
      eventVenue: client.event_venue || undefined,
      eventLocation: client.event_location || undefined,
      packageName: client.package_name || undefined,
      packageHours: client.package_hours || undefined,
      packagePrice: client.package_price ? Number(client.package_price) : undefined,
    })

    if (!emailResult.success) {
      console.error('[sendContractToClient] Email error:', emailResult.error)
      // Don't fail the whole operation if email fails - contract is still sent
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${client.id}`)
    revalidatePath(`/dashboard/contracts/${contractId}`)

    return { success: true, data: { portalUrl } }
  } catch (e) {
    console.error('[sendContractToClient] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// SIGN CONTRACT (Client Portal)
// ============================================

export async function signContract(
  input: z.infer<typeof signContractSchema>,
  context: { clientId: string; ip?: string; userAgent?: string }
): Promise<ActionResult> {
  // Validate input
  const validation = signContractSchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return {
      success: false,
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')),
    }
  }

  const { contractId, signerName, signerEmail, signatureData, agreedToTerms } = validation.data

  try {
    // Get contract and verify it belongs to this client
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('client_id', context.clientId)
      .single()

    if (contractError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    if (contract.status === 'signed' || contract.status === 'archived') {
      return { success: false, error: userError('ALREADY_SIGNED', 'Contract has already been signed') }
    }

    if (contract.status === 'draft') {
      return { success: false, error: userError('NOT_SENT', 'Contract has not been sent yet') }
    }

    // Check expiry
    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return { success: false, error: userError('EXPIRED', 'Contract has expired') }
    }

    // Create signature hash
    const signatureHash = createHash('sha256')
      .update(signatureData + contractId + signerEmail + new Date().toISOString())
      .digest('hex')

    // Insert signature (this triggers the contract status update)
    const { error: signatureError } = await supabaseAdmin
      .from('contract_signatures')
      .insert({
        contract_id: contractId,
        signer_name: signerName,
        signer_email: signerEmail.toLowerCase().trim(),
        signer_ip: context.ip || null,
        signer_user_agent: context.userAgent || null,
        signature_data: signatureData,
        signature_hash: signatureHash,
        agreed_to_terms: agreedToTerms,
      })

    if (signatureError) {
      console.error('[signContract] Signature error:', signatureError)
      if (signatureError.code === '23505') {
        return { success: false, error: userError('ALREADY_SIGNED', 'Contract has already been signed') }
      }
      return { success: false, error: systemError('DB_ERROR', 'Failed to record signature') }
    }

    // Re-render the contract HTML with the signature
    const signedAt = new Date().toISOString()
    const signatureFields = getClientSignatureFields({
      signerName,
      signatureData,
      signedAt,
    })
    
    // Update merge data with signature fields
    const currentMergeData = contract.merge_data as unknown as Partial<MergeFieldData>
    const updatedMergeData = {
      ...currentMergeData,
      ...signatureFields,
    }
    
    // Re-render the contract HTML
    const clausesSnapshot = contract.clauses_snapshot as unknown as ClauseSnapshot[]
    const headerHtml = replaceMergeFields(DEFAULT_CONTRACT_HEADER, updatedMergeData)
    const footerHtml = replaceMergeFields(DEFAULT_CONTRACT_FOOTER, updatedMergeData)
    const clausesHtml = clausesSnapshot.map(c => wrapClause(c.title, c.content)).join('\n')

    const fullHtml = `
      ${CONTRACT_STYLES}
      <div class="contract-document">
        ${headerHtml}
        <div class="contract-clauses">
          ${clausesHtml}
        </div>
        ${footerHtml}
      </div>
    `.trim()

    const { text: renderedText } = renderContract(fullHtml, updatedMergeData)

    // Update contract with new rendered HTML
    await supabaseAdmin
      .from('contracts')
      .update({
        rendered_html: fullHtml,
        rendered_text: renderedText,
        merge_data: updatedMergeData as any,
      })
      .eq('id', contractId)

    // Get client and photographer info for emails
    const { data: clientData } = await supabaseAdmin
      .from('client_profiles')
      .select('*, users!client_profiles_photographer_id_fkey(id, email, display_name)')
      .eq('id', context.clientId)
      .single()

    if (clientData) {
      const photographer = clientData.users as unknown as { id: string; email: string; display_name: string }
      
      // Get photographer settings for business name
      const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('business_name, contact_email')
        .eq('user_id', photographer.id)
        .single()

      const photographerName = settings?.business_name || photographer.display_name || 'Your Photographer'
      const photographerEmail = settings?.contact_email || photographer.email
      const clientName = `${clientData.first_name}${clientData.partner_first_name ? ` & ${clientData.partner_first_name}` : ''}`
      const eventType = clientData.event_type ? clientData.event_type.charAt(0).toUpperCase() + clientData.event_type.slice(1) : 'Photography'

      // Send confirmation email to client
      await sendSignatureConfirmationEmail({
        clientEmail: signerEmail,
        clientName,
        photographerName,
        photographerEmail,
        eventType,
        signedAt,
      })

      // Send notification to photographer
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contracts/${contractId}`
      await sendPhotographerSignatureNotification({
        photographerEmail,
        photographerName,
        clientName,
        eventType,
        signedAt,
        portalUrl: dashboardUrl,
      })
    }

    return { success: true }
  } catch (e) {
    console.error('[signContract] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// MARK CONTRACT VIEWED (Client Portal)
// ============================================

export async function markContractViewed(
  contractId: string,
  clientId: string
): Promise<ActionResult> {
  try {
    const { error } = await supabaseAdmin
      .from('contracts')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', contractId)
      .eq('client_id', clientId)
      .eq('status', 'sent') // Only update if currently 'sent'

    if (error) {
      console.error('[markContractViewed] Error:', error)
      // Don't fail - this is a tracking update
    }

    return { success: true }
  } catch (e) {
    console.error('[markContractViewed] Exception:', e)
    return { success: true } // Don't fail on tracking errors
  }
}

// ============================================
// ARCHIVE CONTRACT
// ============================================

export async function archiveContract(
  contractId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    const { data: contract, error: fetchError } = await supabaseAdmin
      .from('contracts')
      .select('status')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (fetchError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    if (contract.status !== 'signed') {
      return { success: false, error: userError('INVALID_STATE', 'Only signed contracts can be archived') }
    }

    const { error } = await supabaseAdmin
      .from('contracts')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
      })
      .eq('id', contractId)

    if (error) {
      console.error('[archiveContract] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to archive contract') }
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/contracts/${contractId}`)

    return { success: true }
  } catch (e) {
    console.error('[archiveContract] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET CLIENT CONTRACTS
// ============================================

// ============================================
// UPDATE CONTRACT
// ============================================

const updateContractSchema = z.object({
  contractId: z.string().uuid(),
  clausesSnapshot: z.array(z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    content: z.string(),
    sortOrder: z.number(),
  })).optional(),
  mergeDataOverrides: z.record(z.string()).optional(),
})

export async function updateContract(
  input: z.infer<typeof updateContractSchema>
): Promise<ActionResult<ContractWithDetails>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  const validation = updateContractSchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return {
      success: false,
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')),
    }
  }

  const { contractId, clausesSnapshot, mergeDataOverrides } = validation.data

  try {
    // Get existing contract
    const { data: contract, error: fetchError } = await supabaseAdmin
      .from('contracts')
      .select('*, client_profiles(*)')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (fetchError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    // Only allow editing draft contracts
    if (contract.status !== 'draft') {
      return { success: false, error: userError('INVALID_STATE', 'Only draft contracts can be edited') }
    }

    const client = contract.client_profiles as unknown as Tables<'client_profiles'>

    // Get user settings for photographer info
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email, website_url, phone, business_location')
      .eq('user_id', user.id)
      .single()

    // Build updated merge data
    const existingMergeData = contract.merge_data as unknown as MergeFieldData
    const updatedMergeData = mergeDataOverrides
      ? { ...existingMergeData, ...mergeDataOverrides }
      : existingMergeData

    // Use provided clauses or existing ones
    const finalClauses = clausesSnapshot || (contract.clauses_snapshot as unknown as ClauseSnapshot[])

    // Re-render contract HTML with updated data
    const headerHtml = replaceMergeFields(DEFAULT_CONTRACT_HEADER, updatedMergeData)
    const footerHtml = replaceMergeFields(DEFAULT_CONTRACT_FOOTER, updatedMergeData)
    const clausesHtml = finalClauses.map(c => wrapClause(c.title, c.content)).join('\n')

    const fullHtml = `
      ${CONTRACT_STYLES}
      <div class="contract-document">
        ${headerHtml}
        <div class="contract-clauses">
          ${clausesHtml}
        </div>
        ${footerHtml}
      </div>
    `.trim()

    const { text: renderedText } = renderContract(fullHtml, updatedMergeData)

    // Update contract
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('contracts')
      .update({
        rendered_html: fullHtml,
        rendered_text: renderedText,
        merge_data: updatedMergeData as any,
        clauses_snapshot: finalClauses as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)
      .select()
      .single()

    if (updateError) {
      console.error('[updateContract] Update error:', updateError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to update contract') }
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${client.id}`)
    revalidatePath(`/dashboard/contracts/${contractId}`)

    return {
      success: true,
      data: mapDbToContract(updated, client),
    }
  } catch (e) {
    console.error('[updateContract] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// DELETE CONTRACT
// ============================================

export async function deleteContract(
  contractId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get contract to verify ownership and status
    const { data: contract, error: fetchError } = await supabaseAdmin
      .from('contracts')
      .select('status, client_id')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (fetchError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    // Only allow deleting draft contracts
    if (contract.status !== 'draft') {
      return { success: false, error: userError('INVALID_STATE', 'Only draft contracts can be deleted. Sent or signed contracts must be archived.') }
    }

    // Delete the contract
    const { error: deleteError } = await supabaseAdmin
      .from('contracts')
      .delete()
      .eq('id', contractId)

    if (deleteError) {
      console.error('[deleteContract] Delete error:', deleteError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to delete contract') }
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${contract.client_id}`)

    return { success: true }
  } catch (e) {
    console.error('[deleteContract] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// RESEND CONTRACT
// ============================================

export async function resendContract(
  contractId: string
): Promise<ActionResult<{ portalUrl: string }>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get contract
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*, client_profiles(*)')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (contractError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    // Allow resending for sent or viewed contracts (not signed or archived)
    if (contract.status === 'signed' || contract.status === 'archived') {
      return { success: false, error: userError('INVALID_STATE', 'Cannot resend a signed or archived contract') }
    }

    if (contract.status === 'draft') {
      return { success: false, error: userError('INVALID_STATE', 'Contract must be sent first before resending') }
    }

    const client = contract.client_profiles as unknown as Tables<'client_profiles'>

    // Generate new portal token
    const { data: tokenData } = await supabaseAdmin.rpc('generate_portal_token', {
      p_client_id: client.id,
      p_photographer_id: user.id,
      p_expires_in_days: 30,
    })

    if (!tokenData) {
      return { success: false, error: systemError('TOKEN_ERROR', 'Failed to generate portal access') }
    }

    // Update contract with new expiry
    const { error: updateError } = await supabaseAdmin
      .from('contracts')
      .update({
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)

    if (updateError) {
      console.error('[resendContract] Update error:', updateError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to update contract') }
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${tokenData}/contract`

    // Get user settings for photographer info
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email')
      .eq('user_id', user.id)
      .single()

    // Send email notification to client
    const emailResult = await sendContractEmail({
      clientEmail: client.email,
      clientName: `${client.first_name}${client.partner_first_name ? ` & ${client.partner_first_name}` : ''}`,
      photographerName: settings?.business_name || 'Your Photographer',
      photographerEmail: settings?.contact_email || user.email,
      portalUrl,
      eventType: client.event_type || 'Photography',
      eventDate: client.event_date || undefined,
      eventVenue: client.event_venue || undefined,
      eventLocation: client.event_location || undefined,
      packageName: client.package_name || undefined,
      packageHours: client.package_hours || undefined,
      packagePrice: client.package_price ? Number(client.package_price) : undefined,
    })

    if (!emailResult.success) {
      console.error('[resendContract] Email error:', emailResult.error)
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${client.id}`)
    revalidatePath(`/dashboard/contracts/${contractId}`)

    return { success: true, data: { portalUrl } }
  } catch (e) {
    console.error('[resendContract] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// SEND COPY OF SIGNED CONTRACT
// ============================================

export async function sendContractCopy(
  contractId: string
): Promise<ActionResult<{ sent: boolean }>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get contract with client and signature
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*, client_profiles(*), contract_signatures(*)')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (contractError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    // Only allow sending copy for signed contracts
    if (contract.status !== 'signed') {
      return { success: false, error: userError('INVALID_STATE', 'Can only send copy of signed contracts') }
    }

    const client = contract.client_profiles as unknown as Tables<'client_profiles'>
    const signature = Array.isArray(contract.contract_signatures) 
      ? contract.contract_signatures[0] 
      : contract.contract_signatures

    if (!signature) {
      return { success: false, error: userError('NOT_FOUND', 'Signature not found') }
    }

    // Get user settings for photographer info
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email')
      .eq('user_id', user.id)
      .single()

    const photographerName = settings?.business_name || 'Your Photographer'
    const clientName = `${client.first_name}${client.partner_first_name ? ` & ${client.partner_first_name}` : ''}`
    const eventType = client.event_type ? client.event_type.charAt(0).toUpperCase() + client.event_type.slice(1) : 'Photography'

    // Send confirmation email to client
    const emailResult = await sendSignatureConfirmationEmail({
      clientEmail: client.email,
      clientName,
      photographerName,
      photographerEmail: settings?.contact_email || user.email,
      eventType,
      signedAt: signature.signed_at,
    })

    if (!emailResult.success) {
      console.error('[sendContractCopy] Email error')
      return { success: false, error: systemError('EMAIL_ERROR', 'Failed to send email') }
    }

    return { success: true, data: { sent: true } }
  } catch (e) {
    console.error('[sendContractCopy] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// DUPLICATE CONTRACT (Create new draft from existing)
// ============================================

export async function duplicateContract(
  contractId: string
): Promise<ActionResult<ContractWithDetails>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get existing contract
    const { data: contract, error: fetchError } = await supabaseAdmin
      .from('contracts')
      .select('*, client_profiles(*)')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (fetchError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    const client = contract.client_profiles as unknown as Tables<'client_profiles'>

    // Create new contract as draft with same content
    const { data: newContract, error: insertError } = await supabaseAdmin
      .from('contracts')
      .insert({
        photographer_id: user.id,
        client_id: contract.client_id,
        template_id: contract.template_id,
        status: 'draft',
        rendered_html: contract.rendered_html,
        rendered_text: contract.rendered_text,
        merge_data: contract.merge_data,
        clauses_snapshot: contract.clauses_snapshot,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[duplicateContract] Insert error:', insertError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to duplicate contract') }
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${contract.client_id}`)

    return {
      success: true,
      data: mapDbToContract(newContract, client),
    }
  } catch (e) {
    console.error('[duplicateContract] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET CLIENT CONTRACTS
// ============================================

export async function getClientContracts(
  clientId: string
): Promise<ActionResult<ContractWithDetails[]>> {
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
      .from('contracts')
      .select('*, contract_signatures(*)')
      .eq('client_id', clientId)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getClientContracts] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch contracts') }
    }

    const contracts = (data || []).map(contract => {
      const signature = (contract.contract_signatures as unknown as Tables<'contract_signatures'>[])?.[0]
      return mapDbToContract(contract, undefined, signature)
    })

    return { success: true, data: contracts }
  } catch (e) {
    console.error('[getClientContracts] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// REGENERATE CONTRACT HTML
// ============================================

/**
 * Regenerates the contract HTML with updated client/merge data.
 * Called after inline edits to client profile fields.
 */
export async function regenerateContractHtml(
  contractId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get contract with client
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*, client_profiles(*)')
      .eq('id', contractId)
      .eq('photographer_id', user.id)
      .single()

    if (contractError || !contract) {
      return { success: false, error: userError('NOT_FOUND', 'Contract not found') }
    }

    // Only allow regeneration for draft contracts
    if (contract.status !== 'draft') {
      return { success: false, error: userError('INVALID_STATE', 'Cannot edit a contract that has been sent') }
    }

    const client = contract.client_profiles as unknown as Tables<'client_profiles'>

    // Get user settings for photographer info
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email, website_url, phone, business_location')
      .eq('user_id', user.id)
      .single()

    // Rebuild merge data with updated client info
    const mergeData = buildMergeDataFromClient(
      mapDbToClient(client),
      {
        name: settings?.business_name || '',
        email: settings?.contact_email || user.email,
        phone: settings?.phone || '',
        website: settings?.website_url || '',
        location: settings?.business_location || '',
      }
    )

    // Get existing clauses snapshot and re-render with new merge data
    const existingClauses = contract.clauses_snapshot as unknown as ClauseSnapshot[]
    
    // Re-render clauses with updated merge data
    // Note: We need to get the original clause content to re-apply merge fields
    // For now, we'll just update the header/footer which contains the client info
    
    // Build full contract HTML
    const headerHtml = replaceMergeFields(DEFAULT_CONTRACT_HEADER, mergeData)
    const footerHtml = replaceMergeFields(DEFAULT_CONTRACT_FOOTER, mergeData)
    const clausesHtml = existingClauses.map(c => wrapClause(c.title, c.content)).join('\n')

    const fullHtml = `
      ${CONTRACT_STYLES}
      <div class="contract-document">
        ${headerHtml}
        <div class="contract-clauses">
          ${clausesHtml}
        </div>
        ${footerHtml}
      </div>
    `.trim()

    // Create plain text version
    const { text: renderedText } = renderContract(fullHtml, mergeData)

    // Update contract
    const { error: updateError } = await supabaseAdmin
      .from('contracts')
      .update({
        rendered_html: fullHtml,
        rendered_text: renderedText,
        merge_data: mergeData as any,
      })
      .eq('id', contractId)

    if (updateError) {
      console.error('[regenerateContractHtml] Update error:', updateError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to update contract') }
    }

    revalidatePath(`/dashboard/contracts/${contractId}`)

    return { success: true }
  } catch (e) {
    console.error('[regenerateContractHtml] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}
