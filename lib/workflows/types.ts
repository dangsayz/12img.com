// =============================================================================
// AUTOMATED WORKFLOWS - TYPE DEFINITIONS
// =============================================================================

// -----------------------------------------------------------------------------
// Database Enum Types
// -----------------------------------------------------------------------------

/**
 * Template category - determines when template is typically used
 */
export type WorkflowTemplateCategory = 'pre_event' | 'post_event' | 'custom';

/**
 * Workflow execution status
 * - pending: Waiting to be sent
 * - sent: Successfully delivered
 * - skipped: Skipped (event passed, no email, etc.)
 * - failed: Send attempt failed
 * - cancelled: Manually cancelled by user
 */
export type ScheduledWorkflowStatus =
  | 'pending'
  | 'sent'
  | 'skipped'
  | 'failed'
  | 'cancelled';

/**
 * Execution log action types
 */
export type WorkflowExecutionAction =
  | 'scheduled'
  | 'sent'
  | 'skipped'
  | 'failed'
  | 'cancelled'
  | 'rescheduled';

// -----------------------------------------------------------------------------
// Domain Models
// -----------------------------------------------------------------------------

/**
 * Workflow template - reusable email template
 */
export interface WorkflowTemplate {
  id: string;
  userId: string | null; // null = system template
  name: string;
  description: string | null;
  category: WorkflowTemplateCategory;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  defaultDaysOffset: number; // Negative = before event
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Scheduled workflow - individual scheduled email for a client
 */
export interface ScheduledWorkflow {
  id: string;
  userId: string;
  clientId: string;
  templateId: string | null;
  daysOffset: number;
  scheduledFor: string; // ISO timestamp
  status: ScheduledWorkflowStatus;
  statusReason: string | null;
  emailSubject: string;
  emailBodyHtml: string;
  emailBodyText: string | null;
  sentAt: string | null;
  emailLogId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Execution log entry
 */
export interface WorkflowExecutionLog {
  id: string;
  scheduledWorkflowId: string;
  action: WorkflowExecutionAction;
  details: Record<string, unknown> | null;
  executedAt: string;
}

// -----------------------------------------------------------------------------
// Extended Types (with relations)
// -----------------------------------------------------------------------------

/**
 * Scheduled workflow with client and template info
 */
export interface ScheduledWorkflowWithClient extends ScheduledWorkflow {
  client: {
    id: string;
    name: string;
    email: string;
    eventDate: string | null;
    eventType: string | null;
  };
  template: {
    id: string;
    name: string;
    category: WorkflowTemplateCategory;
  } | null;
}

/**
 * Template with usage statistics
 */
export interface WorkflowTemplateWithUsage extends WorkflowTemplate {
  activeCount: number;
  totalSent: number;
}

// -----------------------------------------------------------------------------
// Merge Fields
// -----------------------------------------------------------------------------

/**
 * All supported merge fields for workflow templates
 */
export const WORKFLOW_MERGE_FIELDS = [
  // Client fields
  '{{client_name}}',
  '{{client_first_name}}',
  '{{client_email}}',

  // Event fields
  '{{event_type}}',
  '{{event_date}}',
  '{{event_date_formatted}}',
  '{{event_time}}',
  '{{event_time_formatted}}',
  '{{event_location}}',
  '{{days_until_event}}',
  '{{days_since_event}}',

  // Photographer fields
  '{{photographer_name}}',
  '{{photographer_email}}',
  '{{photographer_phone}}',
  '{{photographer_business}}',

  // Contract/delivery fields
  '{{delivery_window}}',
  '{{package_name}}',
] as const;

export type WorkflowMergeField = (typeof WORKFLOW_MERGE_FIELDS)[number];

/**
 * Merge field descriptions for UI
 */
export const MERGE_FIELD_DESCRIPTIONS: Record<WorkflowMergeField, string> = {
  '{{client_name}}': 'Full client name',
  '{{client_first_name}}': 'Client first name only',
  '{{client_email}}': 'Client email address',
  '{{event_type}}': 'Event type (Wedding, Portrait, etc.)',
  '{{event_date}}': 'Event date (YYYY-MM-DD)',
  '{{event_date_formatted}}': 'Event date (Saturday, March 15, 2025)',
  '{{event_time}}': 'Arrival time (HH:MM)',
  '{{event_time_formatted}}': 'Arrival time (2:30 PM)',
  '{{event_location}}': 'Event location/venue',
  '{{days_until_event}}': 'Days until event',
  '{{days_since_event}}': 'Days since event',
  '{{photographer_name}}': 'Your display name',
  '{{photographer_email}}': 'Your contact email',
  '{{photographer_phone}}': 'Your phone number',
  '{{photographer_business}}': 'Your business name',
  '{{delivery_window}}': 'Delivery window in days',
  '{{package_name}}': 'Client package name',
};

// -----------------------------------------------------------------------------
// Plan Limits
// -----------------------------------------------------------------------------

/**
 * Workflow limits per plan tier
 */
export const WORKFLOW_PLAN_LIMITS = {
  free: {
    activeWorkflows: 3,
    customTemplates: 0,
  },
  essential: {
    activeWorkflows: 10,
    customTemplates: 3,
  },
  pro: {
    activeWorkflows: Infinity,
    customTemplates: Infinity,
  },
  studio: {
    activeWorkflows: Infinity,
    customTemplates: Infinity,
  },
  elite: {
    activeWorkflows: Infinity,
    customTemplates: Infinity,
  },
} as const;

export type PlanWithWorkflows = keyof typeof WORKFLOW_PLAN_LIMITS;

// -----------------------------------------------------------------------------
// UI Types
// -----------------------------------------------------------------------------

/**
 * Form data for scheduling a workflow
 */
export interface WorkflowFormData {
  templateId: string;
  daysOffset: number;
  customSubject?: string;
  customBody?: string;
}

/**
 * Preview data for workflow email
 */
export interface WorkflowPreview {
  subject: string;
  bodyHtml: string;
  scheduledFor: string;
  recipientEmail: string;
  recipientName: string;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

/**
 * Current workflow limits for user
 */
export interface WorkflowLimitsResponse {
  activeWorkflows: number;
  maxActiveWorkflows: number;
  customTemplates: number;
  maxCustomTemplates: number;
  canCreateWorkflow: boolean;
  canCreateTemplate: boolean;
}

/**
 * Result of scheduling a workflow
 */
export interface ScheduleWorkflowResponse {
  success: boolean;
  workflowId?: string;
  error?: string;
  scheduledFor?: string;
}

// -----------------------------------------------------------------------------
// Status Configuration (for UI)
// -----------------------------------------------------------------------------

/**
 * Status display configuration
 */
export const WORKFLOW_STATUS_CONFIG = {
  pending: {
    label: 'Scheduled',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Waiting to be sent',
  },
  sent: {
    label: 'Sent',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    description: 'Successfully delivered',
  },
  skipped: {
    label: 'Skipped',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    description: 'Skipped due to conditions',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    description: 'Send attempt failed',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-stone-400',
    bg: 'bg-stone-50',
    border: 'border-stone-200',
    description: 'Cancelled by user',
  },
} as const;

/**
 * Category display configuration
 */
export const WORKFLOW_CATEGORY_CONFIG = {
  pre_event: {
    label: 'Pre-Event',
    description: 'Sent before the event date',
  },
  post_event: {
    label: 'Post-Event',
    description: 'Sent after the event date',
  },
  custom: {
    label: 'Custom',
    description: 'Custom timing',
  },
} as const;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Format days offset for display
 * @example formatDaysOffset(-14) => "14 days before"
 * @example formatDaysOffset(1) => "1 day after"
 */
export function formatDaysOffset(days: number): string {
  const absDays = Math.abs(days);
  const unit = absDays === 1 ? 'day' : 'days';
  const direction = days < 0 ? 'before' : 'after';
  return `${absDays} ${unit} ${direction}`;
}

/**
 * Check if a plan has unlimited workflows
 */
export function hasUnlimitedWorkflows(plan: PlanWithWorkflows): boolean {
  return WORKFLOW_PLAN_LIMITS[plan].activeWorkflows === Infinity;
}

/**
 * Check if a plan can create custom templates
 */
export function canCreateCustomTemplates(plan: PlanWithWorkflows): boolean {
  return WORKFLOW_PLAN_LIMITS[plan].customTemplates > 0;
}
