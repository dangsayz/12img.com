/**
 * Contract Engine Types
 * 
 * Domain models for the contract generation and signing system.
 */

import type { 
  EventType, 
  ContractStatus, 
  ClauseCategory,
  Tables 
} from '@/types/database'

// ============================================
// MERGE FIELD TYPES
// ============================================

export interface MergeFieldData {
  // Client Info
  client_name: string
  client_first_name: string
  client_last_name: string
  client_email: string
  client_phone: string
  partner_name: string
  partner_first_name: string
  partner_last_name: string
  
  // Event Info
  event_type: string
  event_type_display: string
  event_date: string
  event_date_formatted: string
  event_location: string
  event_venue: string
  
  // Package Info
  package_name: string
  package_price: string
  package_price_formatted: string
  package_hours: string
  package_description: string
  
  // Calculated Fields
  retainer_amount: string
  remaining_balance: string
  payment_due_date: string
  delivery_weeks: string
  estimated_images: string
  gallery_expiry_days: string
  start_time: string
  end_time: string
  hourly_rate: string
  
  // Photographer Info
  photographer_name: string
  photographer_email: string
  photographer_phone: string
  photographer_website: string
  photographer_location: string
  travel_radius: string
  travel_rate: string
  
  // Legal
  arbitration_location: string
  governing_state: string
  
  // Contract Info
  contract_date: string
  contract_id: string
  
  // Signature Display (dynamic based on contract status)
  client_signature_class: string
  client_status_class: string
  client_status_text: string
  client_signature_content: string
  client_signed_date: string
}

// Default merge field values
export const DEFAULT_MERGE_DATA: Partial<MergeFieldData> = {
  retainer_amount: '50%',
  remaining_balance: '50%',
  payment_due_date: '14 days before the event',
  delivery_weeks: '4-6',
  estimated_images: '300-500',
  gallery_expiry_days: '90',
  hourly_rate: '250',
  travel_radius: '50',
  travel_rate: '0.65',
}

// ============================================
// CLAUSE TYPES
// ============================================

export interface ClauseWithState {
  id: string
  title: string
  category: ClauseCategory
  content: string
  isRequired: boolean
  isEnabled: boolean
  sortOrder: number
  isSystem: boolean // photographer_id is null
}

export interface ClauseSnapshot {
  id: string
  title: string
  category: ClauseCategory
  content: string // Rendered with merge fields
  sortOrder: number
}

// ============================================
// CONTRACT TYPES
// ============================================

export interface ContractWithDetails {
  id: string
  photographerId: string
  clientId: string
  templateId: string | null
  status: ContractStatus
  renderedHtml: string | null
  renderedText: string | null
  mergeData: MergeFieldData
  clausesSnapshot: ClauseSnapshot[]
  sentAt: string | null
  viewedAt: string | null
  signedAt: string | null
  archivedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  
  // Delivery tracking fields
  deliveryWindowDays: number | null
  eventCompletedAt: string | null
  deliveredAt: string | null
  
  // Joined data
  client?: ClientProfile
  signature?: ContractSignature
}

export interface ContractSignature {
  id: string
  contractId: string
  signerName: string
  signerEmail: string
  signerIp: string | null
  signerUserAgent: string | null
  signatureData: string // Base64 image
  signatureHash: string
  signedAt: string
  agreedToTerms: boolean
}

// ============================================
// CLIENT TYPES
// ============================================

export interface ClientProfile {
  id: string
  photographerId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  partnerFirstName: string | null
  partnerLastName: string | null
  partnerEmail: string | null
  partnerPhone: string | null
  eventType: EventType
  eventDate: string | null
  eventLocation: string | null
  eventVenue: string | null
  packageName: string | null
  packagePrice: number | null
  packageHours: number | null
  packageDescription: string | null
  retainerFee: number | null
  balanceDueDate: string | null
  notes: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface ClientWithStats extends ClientProfile {
  contractStatus: ContractStatus | null
  unreadMessages: number
  hasActivePortal: boolean
}

// ============================================
// PORTAL TYPES
// ============================================

export interface PortalPermissions {
  canViewContract: boolean
  canSignContract: boolean
  canMessage: boolean
  canViewGallery: boolean
  canDownload: boolean
}

export interface PortalContext {
  isValid: boolean
  clientId: string | null
  photographerId: string | null
  permissions: PortalPermissions
  errorMessage: string | null
}

// ============================================
// ACTION RESULT TYPES
// ============================================

export type ErrorType = 'USER_ERROR' | 'SYSTEM_ERROR' | 'VALIDATION_ERROR'

export interface ActionError {
  type: ErrorType
  code: string
  message: string
  field?: string
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: ActionError
}

// Helper to create errors
export function createError(
  type: ErrorType,
  code: string,
  message: string,
  field?: string
): ActionError {
  return { type, code, message, field }
}

export function userError(code: string, message: string, field?: string): ActionError {
  return createError('USER_ERROR', code, message, field)
}

export function systemError(code: string, message: string): ActionError {
  return createError('SYSTEM_ERROR', code, message)
}

export function validationError(code: string, message: string, field: string): ActionError {
  return createError('VALIDATION_ERROR', code, message, field)
}

// ============================================
// EVENT TYPE DISPLAY NAMES
// ============================================

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  engagement: 'Engagement',
  portrait: 'Portrait',
  family: 'Family',
  newborn: 'Newborn',
  maternity: 'Maternity',
  corporate: 'Corporate',
  event: 'Event',
  other: 'Other',
}

// ============================================
// CONTRACT STATUS DISPLAY
// ============================================

export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, {
  label: string
  color: string
  bgColor: string
}> = {
  draft: {
    label: 'Draft',
    color: 'text-stone-600',
    bgColor: 'bg-stone-100',
  },
  sent: {
    label: 'Awaiting Signature',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  viewed: {
    label: 'Viewed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  signed: {
    label: 'Signed',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  archived: {
    label: 'Archived',
    color: 'text-stone-500',
    bgColor: 'bg-stone-50',
  },
}

// ============================================
// CLAUSE CATEGORY DISPLAY
// ============================================

export const CLAUSE_CATEGORY_LABELS: Record<ClauseCategory, string> = {
  payment: 'Payment Terms',
  cancellation: 'Cancellation Policy',
  liability: 'Liability',
  copyright: 'Copyright & Usage',
  usage_rights: 'Usage Rights',
  delivery: 'Delivery',
  scheduling: 'Scheduling',
  meals_breaks: 'Meals & Breaks',
  travel: 'Travel',
  equipment: 'Equipment',
  force_majeure: 'Force Majeure',
  dispute_resolution: 'Dispute Resolution',
  custom: 'Custom',
}

// ============================================
// MILESTONE TYPES
// ============================================

export type MilestoneType = 
  | 'contract_initiated'
  | 'contract_signed'
  | 'event_completed'
  | 'editing_started'
  | 'editing_complete'
  | 'gallery_created'
  | 'gallery_published'
  | 'delivery_complete'
  | 'custom'

export interface Milestone {
  id: string
  contractId: string
  photographerId: string
  clientId: string
  type: MilestoneType
  title: string
  description: string | null
  notes: string | null
  occurredAt: string
  createdAt: string
  createdBy: string | null
  isSystemGenerated: boolean
  metadata: Record<string, unknown>
}

export const MILESTONE_TYPE_CONFIG: Record<MilestoneType, {
  label: string
  icon: string
  color: string
  bgColor: string
}> = {
  contract_initiated: {
    label: 'Contract Created',
    icon: 'FileText',
    color: 'text-stone-600',
    bgColor: 'bg-stone-100',
  },
  contract_signed: {
    label: 'Contract Signed',
    icon: 'PenTool',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  event_completed: {
    label: 'Event Completed',
    icon: 'Camera',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  editing_started: {
    label: 'Editing Started',
    icon: 'Palette',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  editing_complete: {
    label: 'Editing Complete',
    icon: 'CheckCircle',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  gallery_created: {
    label: 'Gallery Created',
    icon: 'Images',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  gallery_published: {
    label: 'Gallery Published',
    icon: 'Globe',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  delivery_complete: {
    label: 'Delivered',
    icon: 'Gift',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  custom: {
    label: 'Update',
    icon: 'Bell',
    color: 'text-stone-600',
    bgColor: 'bg-stone-100',
  },
}

// ============================================
// DELIVERY PROGRESS TYPES
// ============================================

export interface DeliveryProgress {
  contractId: string
  photographerId: string
  clientId: string
  status: ContractStatus
  deliveryWindowDays: number
  eventCompletedAt: string | null
  estimatedDeliveryDate: string | null
  daysRemaining: number | null
  daysElapsed: number
  percentComplete: number
  isOverdue: boolean
  deliveryStatus: 'pending_event' | 'in_progress' | 'overdue' | 'delivered'
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
}

// ============================================
// CONTRACT STATUS EXTENDED
// ============================================

export type ExtendedContractStatus = 
  | ContractStatus 
  | 'in_progress' 
  | 'editing' 
  | 'ready' 
  | 'delivered'

export const EXTENDED_STATUS_CONFIG: Record<ExtendedContractStatus, {
  label: string
  color: string
  bgColor: string
  description: string
}> = {
  draft: {
    label: 'Draft',
    color: 'text-stone-600',
    bgColor: 'bg-stone-100',
    description: 'Contract is being prepared',
  },
  sent: {
    label: 'Awaiting Signature',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Waiting for client to sign',
  },
  viewed: {
    label: 'Viewed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Client has viewed the contract',
  },
  signed: {
    label: 'Signed',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Contract signed, awaiting event',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Event completed, work in progress',
  },
  editing: {
    label: 'Editing',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Photos are being edited',
  },
  ready: {
    label: 'Ready for Delivery',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    description: 'Gallery is ready to be delivered',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Gallery has been delivered',
  },
  archived: {
    label: 'Archived',
    color: 'text-stone-500',
    bgColor: 'bg-stone-50',
    description: 'Contract is archived',
  },
}

// Status transition rules
export const STATUS_TRANSITIONS: Record<ExtendedContractStatus, ExtendedContractStatus[]> = {
  draft: ['sent'],
  sent: ['viewed', 'signed'],
  viewed: ['signed'],
  signed: ['in_progress'],
  in_progress: ['editing'],
  editing: ['ready'],
  ready: ['delivered'],
  delivered: ['archived'],
  archived: [],
}

export function canTransitionTo(
  currentStatus: ExtendedContractStatus, 
  newStatus: ExtendedContractStatus
): boolean {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
}
