/**
 * Merge Field Engine
 * 
 * Handles extraction, replacement, and validation of merge fields
 * in contract templates and clauses.
 */

import type { MergeFieldData, ClientProfile } from './types'
import { EVENT_TYPE_LABELS, DEFAULT_MERGE_DATA } from './types'

// ============================================
// DATE HELPERS
// ============================================

/**
 * Parse a date string as local date (not UTC)
 * Fixes timezone offset bug where "2026-08-01" becomes July 31 in local time
 */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  
  // If it's a date-only string (YYYY-MM-DD), parse as local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }
  
  // Otherwise use standard parsing
  return new Date(dateString)
}

// ============================================
// MERGE FIELD PATTERN
// ============================================

// Matches {{field_name}} pattern
const MERGE_FIELD_PATTERN = /\{\{([a-z_]+)\}\}/gi

// ============================================
// FIELD EXTRACTION
// ============================================

/**
 * Extract all merge field names from a template string
 */
export function extractMergeFields(template: string): string[] {
  const matches = template.matchAll(MERGE_FIELD_PATTERN)
  const fields = new Set<string>()
  
  for (const match of matches) {
    fields.add(match[1].toLowerCase())
  }
  
  return Array.from(fields)
}

/**
 * Check if a template contains any merge fields
 */
export function hasMergeFields(template: string): boolean {
  return MERGE_FIELD_PATTERN.test(template)
}

// ============================================
// MERGE FIELD REPLACEMENT
// ============================================

/**
 * Replace all merge fields in a template with values from data
 * Supports conditional sections: {{#field}}content{{/field}} - only shown if field has value
 */
export function replaceMergeFields(
  template: string,
  data: Partial<MergeFieldData>,
  options: {
    highlightMissing?: boolean
    missingPlaceholder?: string
    hideEmpty?: boolean
  } = {}
): string {
  const { highlightMissing = false, missingPlaceholder = '[MISSING]', hideEmpty = true } = options
  
  // First, handle conditional sections {{#field}}...{{/field}}
  // These sections are only shown if the field has a non-empty value
  const CONDITIONAL_PATTERN = /\{\{#([a-z_]+)\}\}([\s\S]*?)\{\{\/\1\}\}/gi
  
  let result = template.replace(CONDITIONAL_PATTERN, (match, fieldName, content) => {
    const key = fieldName.toLowerCase() as keyof MergeFieldData
    const value = data[key]
    
    // If field has a value, keep the content (will be processed for merge fields later)
    if (value !== undefined && value !== null && value !== '') {
      return content
    }
    
    // If field is empty, remove the entire section
    return ''
  })
  
  // Then, replace regular merge fields {{field}}
  result = result.replace(MERGE_FIELD_PATTERN, (match, fieldName) => {
    const key = fieldName.toLowerCase() as keyof MergeFieldData
    const value = data[key]
    
    if (value !== undefined && value !== null && value !== '') {
      return String(value)
    }
    
    if (highlightMissing) {
      return `<span class="text-red-500 bg-red-50 px-1">${missingPlaceholder}</span>`
    }
    
    // Hide empty fields by returning empty string (default behavior)
    if (hideEmpty) {
      return ''
    }
    
    return match // Keep original if no replacement
  })
  
  return result
}

/**
 * Replace merge fields and return both HTML and plain text versions
 */
export function renderContract(
  template: string,
  data: Partial<MergeFieldData>
): { html: string; text: string } {
  const html = replaceMergeFields(template, data)
  
  // Strip HTML tags for plain text version
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  
  return { html, text }
}

// ============================================
// DATA EXTRACTION FROM CLIENT
// ============================================

/**
 * Build merge field data from a client profile
 */
export function buildMergeDataFromClient(
  client: ClientProfile,
  photographer?: {
    name?: string
    email?: string
    phone?: string
    website?: string
    location?: string
  },
  overrides?: Partial<MergeFieldData>
): MergeFieldData {
  const fullName = client.partnerFirstName
    ? `${client.firstName} & ${client.partnerFirstName} ${client.lastName}`
    : `${client.firstName} ${client.lastName}`
  
  const partnerName = client.partnerFirstName && client.partnerLastName
    ? `${client.partnerFirstName} ${client.partnerLastName}`
    : client.partnerFirstName || ''
  
  const eventDate = parseLocalDate(client.eventDate)
  const eventDateFormatted = eventDate
    ? eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''
  
  const packagePrice = client.packagePrice ?? 0
  // Use actual retainer fee from client profile, or default to 50% of package price
  const retainerAmount = client.retainerFee ?? (packagePrice * 0.5)
  const remainingBalance = packagePrice - retainerAmount
  
  // Calculate payment due date (14 days before event)
  let paymentDueDate = '14 days before the event'
  if (eventDate) {
    const dueDate = new Date(eventDate)
    dueDate.setDate(dueDate.getDate() - 14)
    paymentDueDate = dueDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
  
  // Extract only custom notes (filter out auto-generated summary lines)
  const extractCustomNotes = (notes: string | null): string => {
    if (!notes) return ''
    
    const lines = notes.split('\n')
    const customLines: string[] = []
    
    // Skip lines that are part of the auto-generated summary
    const summaryPrefixes = [
      'CLIENT:', 'Email:', 'Phone:', 
      'EVENT:', 'Date:', 'Venue:', 'Location:', 'Arrival:',
      'PACKAGE:', 'Coverage:', 'Investment:', 'Deposit:'
    ]
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      // Check if this line is part of the auto-generated summary
      const isSummaryLine = summaryPrefixes.some(prefix => trimmed.startsWith(prefix))
      if (!isSummaryLine) {
        customLines.push(trimmed)
      }
    }
    
    return customLines.join(' • ')
  }
  
  const data: MergeFieldData = {
    // Client Info
    client_name: fullName,
    client_first_name: client.firstName,
    client_last_name: client.lastName,
    client_email: client.email,
    client_phone: client.phone || '',
    client_notes: extractCustomNotes(client.notes),
    partner_name: partnerName,
    partner_first_name: client.partnerFirstName || '',
    partner_last_name: client.partnerLastName || '',
    
    // Event Info
    event_type: client.eventType,
    event_type_display: EVENT_TYPE_LABELS[client.eventType] || client.eventType,
    event_date: client.eventDate || '',
    event_date_formatted: eventDateFormatted,
    event_time: (client as any).eventTime || '',
    event_time_formatted: (client as any).eventTime || '',
    event_location: client.eventLocation || '',
    event_venue: client.eventVenue || '',
    
    // Package Info
    package_name: client.packageName || '',
    package_price: packagePrice.toString(),
    package_price_formatted: formatCurrency(packagePrice),
    package_hours: client.packageHours?.toString() || '',
    package_description: client.packageDescription || '',
    
    // Calculated Fields
    retainer_amount: formatCurrency(retainerAmount),
    retainer_percentage: packagePrice > 0 ? `${Math.round((retainerAmount / packagePrice) * 100)}%` : '50%',
    remaining_balance: formatCurrency(remainingBalance),
    payment_due_date: paymentDueDate,
    delivery_weeks: DEFAULT_MERGE_DATA.delivery_weeks || '4-6',
    estimated_images: DEFAULT_MERGE_DATA.estimated_images || '300-500',
    gallery_expiry_days: DEFAULT_MERGE_DATA.gallery_expiry_days || '90',
    start_time: '',
    end_time: '',
    hourly_rate: DEFAULT_MERGE_DATA.hourly_rate || '250',
    
    // Photographer Info
    photographer_name: photographer?.name || '',
    photographer_email: photographer?.email || '',
    photographer_phone: photographer?.phone || '',
    photographer_website: photographer?.website || '',
    photographer_location: photographer?.location || '',
    travel_radius: DEFAULT_MERGE_DATA.travel_radius || '50',
    travel_rate: DEFAULT_MERGE_DATA.travel_rate || '0.65',
    
    // Legal
    arbitration_location: photographer?.location || '',
    governing_state: '',
    
    // Contract Info
    contract_date: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    contract_id: '',
    
    // Signature Display - Default to awaiting state
    ...getClientSignatureFields(null),
    
    // Apply overrides
    ...overrides,
  }
  
  return data
}

// ============================================
// SIGNATURE FIELD HELPERS
// ============================================

/**
 * Generate client signature merge fields based on signature status
 */
export function getClientSignatureFields(
  signature: {
    signerName: string
    signatureData?: string
    signedAt: string
  } | null
): Pick<MergeFieldData, 'client_signature_class' | 'client_status_class' | 'client_status_text' | 'client_signature_content' | 'client_signed_date'> {
  if (signature) {
    // Signed state
    const signedDate = new Date(signature.signedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    
    // If we have signature image data, show it; otherwise show the name in elegant font
    const signatureContent = signature.signatureData
      ? `<div class="signature-line"><img src="${signature.signatureData}" alt="Signature" class="signature-image" /></div><div class="signature-underline"></div>`
      : `<div class="signature-line"><span class="signature-name elegant">${signature.signerName}</span></div><div class="signature-underline"></div>`
    
    return {
      client_signature_class: 'signed',
      client_status_class: 'signed',
      client_status_text: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Signed',
      client_signature_content: signatureContent,
      client_signed_date: signedDate,
    }
  }
  
  // Awaiting signature state
  return {
    client_signature_class: '',
    client_status_class: 'awaiting',
    client_status_text: 'Awaiting',
    client_signature_content: `
      <div class="signature-placeholder">
        <svg class="signature-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
        <span class="signature-placeholder-text">Awaiting signature</span>
      </div>
      <div class="signature-underline" style="border-bottom: 2px dashed #a8a29e; height: 0;"></div>
    `,
    client_signed_date: '—',
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that all required merge fields have values
 */
export function validateMergeData(
  template: string,
  data: Partial<MergeFieldData>
): { isValid: boolean; missingFields: string[] } {
  const requiredFields = extractMergeFields(template)
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    const key = field as keyof MergeFieldData
    const value = data[key]
    
    if (value === undefined || value === null || value === '') {
      missingFields.push(field)
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Format a number as USD currency
 * - Whole numbers: $5,000
 * - Decimals: $5,000.50 (always 2 decimal places)
 */
export function formatCurrency(amount: number): string {
  const hasDecimals = amount % 1 !== 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Get a list of all available merge fields with descriptions
 */
export function getAvailableMergeFields(): Array<{
  field: string
  description: string
  category: string
}> {
  return [
    // Client
    { field: 'client_name', description: 'Full client name (with partner if applicable)', category: 'Client' },
    { field: 'client_first_name', description: 'Client first name', category: 'Client' },
    { field: 'client_last_name', description: 'Client last name', category: 'Client' },
    { field: 'client_email', description: 'Client email address', category: 'Client' },
    { field: 'client_phone', description: 'Client phone number', category: 'Client' },
    { field: 'partner_name', description: 'Partner full name', category: 'Client' },
    { field: 'partner_first_name', description: 'Partner first name', category: 'Client' },
    
    // Event
    { field: 'event_type', description: 'Event type (wedding, portrait, etc.)', category: 'Event' },
    { field: 'event_type_display', description: 'Event type display name', category: 'Event' },
    { field: 'event_date', description: 'Event date (YYYY-MM-DD)', category: 'Event' },
    { field: 'event_date_formatted', description: 'Event date (formatted)', category: 'Event' },
    { field: 'event_location', description: 'Event location/city', category: 'Event' },
    { field: 'event_venue', description: 'Event venue name', category: 'Event' },
    
    // Package
    { field: 'package_name', description: 'Package name', category: 'Package' },
    { field: 'package_price', description: 'Package price (number)', category: 'Package' },
    { field: 'package_price_formatted', description: 'Package price (formatted)', category: 'Package' },
    { field: 'package_hours', description: 'Coverage hours', category: 'Package' },
    { field: 'package_description', description: 'Package description', category: 'Package' },
    
    // Payment
    { field: 'retainer_amount', description: 'Retainer amount in dollars (e.g. $100)', category: 'Payment' },
    { field: 'retainer_percentage', description: 'Retainer as percentage (e.g. 50%)', category: 'Payment' },
    { field: 'remaining_balance', description: 'Remaining balance', category: 'Payment' },
    { field: 'payment_due_date', description: 'Payment due date', category: 'Payment' },
    
    // Delivery
    { field: 'delivery_weeks', description: 'Delivery timeline in weeks', category: 'Delivery' },
    { field: 'estimated_images', description: 'Estimated image count', category: 'Delivery' },
    { field: 'gallery_expiry_days', description: 'Gallery expiry in days', category: 'Delivery' },
    
    // Schedule
    { field: 'start_time', description: 'Coverage start time', category: 'Schedule' },
    { field: 'end_time', description: 'Coverage end time', category: 'Schedule' },
    { field: 'hourly_rate', description: 'Hourly rate for additional hours', category: 'Schedule' },
    
    // Photographer
    { field: 'photographer_name', description: 'Photographer/business name', category: 'Photographer' },
    { field: 'photographer_email', description: 'Photographer email', category: 'Photographer' },
    { field: 'photographer_phone', description: 'Photographer phone', category: 'Photographer' },
    { field: 'photographer_website', description: 'Photographer website', category: 'Photographer' },
    { field: 'photographer_location', description: 'Photographer location', category: 'Photographer' },
    
    // Travel
    { field: 'travel_radius', description: 'Included travel radius (miles)', category: 'Travel' },
    { field: 'travel_rate', description: 'Per-mile travel rate', category: 'Travel' },
    
    // Legal
    { field: 'arbitration_location', description: 'Arbitration location', category: 'Legal' },
    { field: 'governing_state', description: 'Governing state for contract', category: 'Legal' },
    
    // Contract
    { field: 'contract_date', description: 'Contract creation date', category: 'Contract' },
    { field: 'contract_id', description: 'Contract ID', category: 'Contract' },
  ]
}
