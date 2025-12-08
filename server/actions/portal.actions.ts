'use server'

/**
 * Portal Actions
 * 
 * Server actions for client portal token management and access.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import type { Tables } from '@/types/database'
import {
  type ActionResult,
  type PortalContext,
  type PortalPermissions,
  type ClientProfile,
  userError,
  systemError,
} from '@/lib/contracts/types'

// ============================================
// TYPES
// ============================================

export interface PortalToken {
  id: string
  clientId: string
  photographerId: string
  token: string
  permissions: PortalPermissions
  expiresAt: string
  isRevoked: boolean
  revokedAt: string | null
  lastUsedAt: string | null
  useCount: number
  createdAt: string
}

export interface PortalData {
  client: ClientProfile
  photographerName: string
  photographerEmail: string
  permissions: PortalPermissions
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapDbToPortalToken(row: Tables<'portal_tokens'>): PortalToken {
  return {
    id: row.id,
    clientId: row.client_id,
    photographerId: row.photographer_id,
    token: row.token,
    permissions: {
      canViewContract: row.can_view_contract,
      canSignContract: row.can_sign_contract,
      canMessage: row.can_message,
      canViewGallery: row.can_view_gallery,
      canDownload: row.can_download,
    },
    expiresAt: row.expires_at,
    isRevoked: row.is_revoked,
    revokedAt: row.revoked_at,
    lastUsedAt: row.last_used_at,
    useCount: row.use_count,
    createdAt: row.created_at,
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
// GENERATE PORTAL TOKEN
// ============================================

export async function generatePortalToken(
  clientId: string,
  options?: {
    expiresInDays?: number
    canViewContract?: boolean
    canSignContract?: boolean
    canMessage?: boolean
    canViewGallery?: boolean
    canDownload?: boolean
  }
): Promise<ActionResult<PortalToken>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  const {
    expiresInDays = 30,
    canViewContract = true,
    canSignContract = true,
    canMessage = true,
    canViewGallery = true,
    canDownload = true,
  } = options || {}

  try {
    // Verify client belongs to photographer
    const { data: client } = await supabaseAdmin
      .from('client_profiles')
      .select('id')
      .eq('id', clientId)
      .eq('photographer_id', user.id)
      .single()

    if (!client) {
      return { success: false, error: userError('NOT_FOUND', 'Client not found') }
    }

    // Generate token using database function
    const { data: token, error } = await supabaseAdmin.rpc('generate_portal_token', {
      p_client_id: clientId,
      p_photographer_id: user.id,
      p_expires_in_days: expiresInDays,
    })

    if (error || !token) {
      console.error('[generatePortalToken] Error:', error)
      return { success: false, error: systemError('TOKEN_ERROR', 'Failed to generate portal token') }
    }

    // Update permissions
    const { data: portalToken, error: updateError } = await supabaseAdmin
      .from('portal_tokens')
      .update({
        can_view_contract: canViewContract,
        can_sign_contract: canSignContract,
        can_message: canMessage,
        can_view_gallery: canViewGallery,
        can_download: canDownload,
      })
      .eq('token', token)
      .select()
      .single()

    if (updateError || !portalToken) {
      console.error('[generatePortalToken] Update error:', updateError)
      return { success: false, error: systemError('TOKEN_ERROR', 'Failed to configure portal token') }
    }

    revalidatePath(`/dashboard/clients/${clientId}`)

    return { success: true, data: mapDbToPortalToken(portalToken) }
  } catch (e) {
    console.error('[generatePortalToken] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// VALIDATE PORTAL TOKEN
// ============================================

export async function validatePortalToken(
  token: string,
  options?: { logAccess?: boolean; ip?: string; userAgent?: string }
): Promise<PortalContext> {
  const { logAccess = true, ip, userAgent } = options || {}

  try {
    // Validate token using database function
    const { data: isValid } = await supabaseAdmin.rpc('validate_portal_token', {
      p_token: token,
    })

    if (!isValid) {
      return {
        isValid: false,
        clientId: null,
        photographerId: null,
        permissions: {
          canViewContract: false,
          canSignContract: false,
          canMessage: false,
          canViewGallery: false,
          canDownload: false,
        },
        errorMessage: 'Invalid or expired portal link',
      }
    }

    // Get token details
    const { data: portalToken, error } = await supabaseAdmin
      .from('portal_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !portalToken) {
      return {
        isValid: false,
        clientId: null,
        photographerId: null,
        permissions: {
          canViewContract: false,
          canSignContract: false,
          canMessage: false,
          canViewGallery: false,
          canDownload: false,
        },
        errorMessage: 'Portal token not found',
      }
    }

    // Log access if requested
    if (logAccess) {
      await supabaseAdmin.rpc('log_portal_access', {
        p_token: token,
        p_ip_address: ip || null,
        p_user_agent: userAgent || null,
        p_page_visited: 'portal',
      })
    }

    return {
      isValid: true,
      clientId: portalToken.client_id,
      photographerId: portalToken.photographer_id,
      permissions: {
        canViewContract: portalToken.can_view_contract,
        canSignContract: portalToken.can_sign_contract,
        canMessage: portalToken.can_message,
        canViewGallery: portalToken.can_view_gallery,
        canDownload: portalToken.can_download,
      },
      errorMessage: null,
    }
  } catch (e) {
    console.error('[validatePortalToken] Exception:', e)
    return {
      isValid: false,
      clientId: null,
      photographerId: null,
      permissions: {
        canViewContract: false,
        canSignContract: false,
        canMessage: false,
        canViewGallery: false,
        canDownload: false,
      },
      errorMessage: 'An error occurred validating portal access',
    }
  }
}

// ============================================
// GET PORTAL DATA
// ============================================

export async function getPortalData(
  token: string
): Promise<ActionResult<PortalData>> {
  const context = await validatePortalToken(token)

  if (!context.isValid || !context.clientId || !context.photographerId) {
    return { success: false, error: userError('INVALID_TOKEN', context.errorMessage || 'Invalid portal access') }
  }

  try {
    // Get client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', context.clientId)
      .single()

    if (clientError || !client) {
      return { success: false, error: userError('NOT_FOUND', 'Client not found') }
    }

    // Get photographer info
    const { data: photographer, error: photographerError } = await supabaseAdmin
      .from('users')
      .select('display_name, email')
      .eq('id', context.photographerId)
      .single()

    if (photographerError || !photographer) {
      return { success: false, error: userError('NOT_FOUND', 'Photographer not found') }
    }

    // Get photographer settings for business name
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name')
      .eq('user_id', context.photographerId)
      .single()

    return {
      success: true,
      data: {
        client: mapDbToClient(client),
        photographerName: settings?.business_name || photographer.display_name || 'Photographer',
        photographerEmail: photographer.email,
        permissions: context.permissions,
      },
    }
  } catch (e) {
    console.error('[getPortalData] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// REVOKE PORTAL TOKEN
// ============================================

export async function revokePortalToken(
  tokenId: string,
  reason?: string
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
    const { error } = await supabaseAdmin
      .from('portal_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason || null,
      })
      .eq('id', tokenId)
      .eq('photographer_id', user.id)

    if (error) {
      console.error('[revokePortalToken] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to revoke token') }
    }

    return { success: true }
  } catch (e) {
    console.error('[revokePortalToken] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET CLIENT PORTAL TOKENS
// ============================================

export async function getClientPortalTokens(
  clientId: string
): Promise<ActionResult<PortalToken[]>> {
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
      .from('portal_tokens')
      .select('*')
      .eq('client_id', clientId)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getClientPortalTokens] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch tokens') }
    }

    return { success: true, data: (data || []).map(mapDbToPortalToken) }
  } catch (e) {
    console.error('[getClientPortalTokens] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET PORTAL URL
// ============================================

export async function getPortalUrl(token: string, page?: 'contract' | 'messages' | 'gallery'): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const path = page ? `/portal/${token}/${page}` : `/portal/${token}`
  return `${baseUrl}${path}`
}
