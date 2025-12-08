'use server'

/**
 * Client Profile Actions
 * 
 * Server actions for managing client profiles.
 * All actions require photographer authentication.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import type { EventType, Tables } from '@/types/database'
import { 
  type ActionResult, 
  type ClientProfile, 
  type ClientWithStats,
  userError, 
  systemError, 
  validationError 
} from '@/lib/contracts/types'

// ============================================
// VALIDATION SCHEMAS & SANITIZATION
// ============================================

// Regex patterns for validation
const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\u0100-\u017F\s'-]+$/  // Letters, accents, spaces, hyphens, apostrophes
const SAFE_TEXT_PATTERN = /^[^<>{}]*$/  // No HTML/script tags or curly braces

// Sanitize string to prevent XSS - strips HTML tags and trims
function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/[<>]/g, '')     // Remove any remaining angle brackets
    .trim()
}

// Name validation: letters only, reasonable length
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(50, 'Name is too long (max 50 characters)')
  .regex(NAME_PATTERN, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(sanitizeString)

// Optional name (for partner)
const optionalNameSchema = z.string()
  .max(50, 'Name is too long (max 50 characters)')
  .regex(NAME_PATTERN, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(sanitizeString)
  .optional()
  .nullable()
  .or(z.literal(''))

// Phone validation: 000-000-0000 format (12 chars with dashes) or empty
const PHONE_FORMAT_PATTERN = /^\d{3}-\d{3}-\d{4}$/
const phoneSchema = z.union([
  z.literal(''),
  z.literal(null),
  z.string()
    .max(12, 'Phone number must be 10 digits')
    .regex(PHONE_FORMAT_PATTERN, 'Phone must be in format 000-000-0000'),
]).optional().nullable()

// Safe text for locations, venues, package names
const safeTextSchema = (maxLength: number) => z.string()
  .max(maxLength, `Text is too long (max ${maxLength} characters)`)
  .regex(SAFE_TEXT_PATTERN, 'Text contains invalid characters')
  .transform(sanitizeString)
  .optional()
  .nullable()
  .or(z.literal(''))

// Notes/description - more permissive but still sanitized
const notesSchema = (maxLength: number) => z.string()
  .max(maxLength, `Text is too long (max ${maxLength} characters)`)
  .transform(sanitizeString)
  .optional()
  .nullable()
  .or(z.literal(''))

const clientProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email is too long')
    .transform(s => s.toLowerCase().trim()),
  phone: phoneSchema,
  partnerFirstName: optionalNameSchema,
  partnerLastName: optionalNameSchema,
  partnerEmail: z.string()
    .email('Invalid email address')
    .max(254, 'Email is too long')
    .transform(s => s.toLowerCase().trim())
    .optional()
    .nullable()
    .or(z.literal('')),
  partnerPhone: phoneSchema,
  eventType: z.enum(['wedding', 'engagement', 'portrait', 'family', 'newborn', 'maternity', 'corporate', 'event', 'other'] as const),
  eventDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .nullable()
    .or(z.literal('')),
  eventLocation: safeTextSchema(200),
  eventVenue: safeTextSchema(200),
  packageName: safeTextSchema(100),
  packagePrice: z.number().min(0, 'Price cannot be negative').max(1000000, 'Price is too high').optional().nullable(),
  packageHours: z.number().min(1, 'Hours must be at least 1').max(24, 'Hours cannot exceed 24').optional().nullable(),
  packageDescription: notesSchema(1000),
  retainerFee: z.number().min(0, 'Retainer cannot be negative').max(99999, 'Retainer cannot exceed 99999').optional().nullable(),
  balanceDueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: notesSchema(5000),
})

type ClientProfileInput = z.infer<typeof clientProfileSchema>

// ============================================
// HELPER FUNCTIONS
// ============================================

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
    eventType: row.event_type as EventType,
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
// CREATE CLIENT
// ============================================

export async function createClientProfile(
  input: ClientProfileInput
): Promise<ActionResult<ClientProfile>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  // Validate input
  const validation = clientProfileSchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return { 
      success: false, 
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')) 
    }
  }

  const data = validation.data

  try {
    const { data: client, error } = await supabaseAdmin
      .from('client_profiles')
      .insert({
        photographer_id: user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        partner_first_name: data.partnerFirstName || null,
        partner_last_name: data.partnerLastName || null,
        partner_email: data.partnerEmail || null,
        partner_phone: data.partnerPhone || null,
        event_type: data.eventType,
        event_date: data.eventDate || null,
        event_location: data.eventLocation || null,
        event_venue: data.eventVenue || null,
        package_name: data.packageName || null,
        package_price: data.packagePrice || null,
        package_hours: data.packageHours || null,
        package_description: data.packageDescription || null,
        retainer_fee: data.retainerFee || null,
        balance_due_date: data.balanceDueDate || null,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[createClientProfile] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to create client') }
    }

    revalidatePath('/dashboard/clients')
    
    return { success: true, data: mapDbToClient(client) }
  } catch (e) {
    console.error('[createClientProfile] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// UPDATE CLIENT
// ============================================

export async function updateClientProfile(
  clientId: string,
  input: Partial<ClientProfileInput>
): Promise<ActionResult<ClientProfile>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  // Validate partial input
  const validation = clientProfileSchema.partial().safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return { 
      success: false, 
      error: validationError('INVALID_INPUT', firstError.message, firstError.path.join('.')) 
    }
  }

  const data = validation.data

  try {
    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('client_profiles')
      .select('id')
      .eq('id', clientId)
      .eq('photographer_id', user.id)
      .single()

    if (!existing) {
      return { success: false, error: userError('NOT_FOUND', 'Client not found') }
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (data.firstName !== undefined) updates.first_name = data.firstName
    if (data.lastName !== undefined) updates.last_name = data.lastName
    if (data.email !== undefined) updates.email = data.email.toLowerCase().trim()
    if (data.phone !== undefined) updates.phone = data.phone || null
    if (data.partnerFirstName !== undefined) updates.partner_first_name = data.partnerFirstName || null
    if (data.partnerLastName !== undefined) updates.partner_last_name = data.partnerLastName || null
    if (data.partnerEmail !== undefined) updates.partner_email = data.partnerEmail || null
    if (data.partnerPhone !== undefined) updates.partner_phone = data.partnerPhone || null
    if (data.eventType !== undefined) updates.event_type = data.eventType
    if (data.eventDate !== undefined) updates.event_date = data.eventDate || null
    if (data.eventLocation !== undefined) updates.event_location = data.eventLocation || null
    if (data.eventVenue !== undefined) updates.event_venue = data.eventVenue || null
    if (data.packageName !== undefined) updates.package_name = data.packageName || null
    if (data.packagePrice !== undefined) updates.package_price = data.packagePrice || null
    if (data.packageHours !== undefined) updates.package_hours = data.packageHours || null
    if (data.packageDescription !== undefined) updates.package_description = data.packageDescription || null
    if (data.retainerFee !== undefined) updates.retainer_fee = data.retainerFee || null
    if (data.balanceDueDate !== undefined) updates.balance_due_date = data.balanceDueDate || null
    if (data.notes !== undefined) updates.notes = data.notes || null

    const { data: client, error } = await supabaseAdmin
      .from('client_profiles')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      console.error('[updateClientProfile] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to update client') }
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${clientId}`)

    return { success: true, data: mapDbToClient(client) }
  } catch (e) {
    console.error('[updateClientProfile] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// DELETE CLIENT (Soft)
// ============================================

export async function archiveClientProfile(
  clientId: string
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
      .from('client_profiles')
      .update({ is_archived: true })
      .eq('id', clientId)
      .eq('photographer_id', user.id)

    if (error) {
      console.error('[archiveClientProfile] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to archive client') }
    }

    revalidatePath('/dashboard/clients')

    return { success: true }
  } catch (e) {
    console.error('[archiveClientProfile] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// RESTORE CLIENT
// ============================================

export async function restoreClientProfile(
  clientId: string
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
      .from('client_profiles')
      .update({ is_archived: false })
      .eq('id', clientId)
      .eq('photographer_id', user.id)

    if (error) {
      console.error('[restoreClientProfile] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to restore client') }
    }

    revalidatePath('/dashboard/clients')

    return { success: true }
  } catch (e) {
    console.error('[restoreClientProfile] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET CLIENTS
// ============================================

export async function getClientProfiles(options?: {
  includeArchived?: boolean
  limit?: number
  offset?: number
}): Promise<ActionResult<ClientProfile[]>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  const { includeArchived = false, limit = 100, offset = 0 } = options || {}

  try {
    let query = supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getClientProfiles] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch clients') }
    }

    return { success: true, data: (data || []).map(mapDbToClient) }
  } catch (e) {
    console.error('[getClientProfiles] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET SINGLE CLIENT
// ============================================

export async function getClientProfile(
  clientId: string
): Promise<ActionResult<ClientProfile>> {
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
      .from('client_profiles')
      .select('*')
      .eq('id', clientId)
      .eq('photographer_id', user.id)
      .single()

    if (error || !data) {
      return { success: false, error: userError('NOT_FOUND', 'Client not found') }
    }

    return { success: true, data: mapDbToClient(data) }
  } catch (e) {
    console.error('[getClientProfile] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET CLIENTS WITH STATS
// ============================================

export async function getClientsWithStats(): Promise<ActionResult<ClientWithStats[]>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  try {
    // Get clients
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('photographer_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (clientsError) {
      console.error('[getClientsWithStats] Clients error:', clientsError)
      return { success: false, error: systemError('DB_ERROR', 'Failed to fetch clients') }
    }

    // Get contract statuses
    const { data: contracts } = await supabaseAdmin
      .from('contracts')
      .select('client_id, status')
      .eq('photographer_id', user.id)
      .in('client_id', (clients || []).map(c => c.id))

    // Get unread message counts
    const { data: unreadCounts } = await supabaseAdmin
      .from('messages')
      .select('client_id')
      .eq('photographer_id', user.id)
      .eq('is_from_photographer', false)
      .neq('status', 'read')
      .is('deleted_at', null)

    // Get active portal tokens
    const { data: activeTokens } = await supabaseAdmin
      .from('portal_tokens')
      .select('client_id')
      .eq('photographer_id', user.id)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())

    // Build stats map
    const contractMap = new Map<string, string>()
    contracts?.forEach(c => {
      if (!contractMap.has(c.client_id) || c.status === 'signed') {
        contractMap.set(c.client_id, c.status)
      }
    })

    const unreadMap = new Map<string, number>()
    unreadCounts?.forEach(m => {
      unreadMap.set(m.client_id, (unreadMap.get(m.client_id) || 0) + 1)
    })

    const activePortalSet = new Set(activeTokens?.map(t => t.client_id) || [])

    // Combine data
    const clientsWithStats: ClientWithStats[] = (clients || []).map(client => ({
      ...mapDbToClient(client),
      contractStatus: (contractMap.get(client.id) as any) || null,
      unreadMessages: unreadMap.get(client.id) || 0,
      hasActivePortal: activePortalSet.has(client.id),
    }))

    return { success: true, data: clientsWithStats }
  } catch (e) {
    console.error('[getClientsWithStats] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// SEARCH CLIENTS
// ============================================

export async function searchClients(
  query: string
): Promise<ActionResult<ClientProfile[]>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: userError('UNAUTHORIZED', 'Please sign in to continue') }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: systemError('USER_NOT_FOUND', 'User account not found') }
  }

  if (!query || query.length < 2) {
    return { success: true, data: [] }
  }

  try {
    const searchTerm = `%${query.toLowerCase()}%`

    const { data, error } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('photographer_id', user.id)
      .eq('is_archived', false)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[searchClients] Error:', error)
      return { success: false, error: systemError('DB_ERROR', 'Failed to search clients') }
    }

    return { success: true, data: (data || []).map(mapDbToClient) }
  } catch (e) {
    console.error('[searchClients] Exception:', e)
    return { success: false, error: systemError('UNKNOWN', 'An unexpected error occurred') }
  }
}

// ============================================
// GET LOCATION/VENUE SUGGESTIONS
// ============================================

export async function getClientLocationSuggestions(): Promise<{
  locations: string[]
  venues: string[]
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { locations: [], venues: [] }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { locations: [], venues: [] }

  try {
    const { data, error } = await supabaseAdmin
      .from('client_profiles')
      .select('event_location, event_venue')
      .eq('photographer_id', user.id)
      .eq('is_archived', false)

    if (error || !data) {
      return { locations: [], venues: [] }
    }

    // Extract unique non-null values
    const locationSet = new Set<string>()
    const venueSet = new Set<string>()

    data.forEach(client => {
      if (client.event_location) locationSet.add(client.event_location)
      if (client.event_venue) venueSet.add(client.event_venue)
    })

    return {
      locations: Array.from(locationSet).sort(),
      venues: Array.from(venueSet).sort(),
    }
  } catch (e) {
    console.error('[getClientLocationSuggestions] Exception:', e)
    return { locations: [], venues: [] }
  }
}
