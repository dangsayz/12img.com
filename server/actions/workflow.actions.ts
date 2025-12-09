'use server';

// =============================================================================
// AUTOMATED WORKFLOWS - SERVER ACTIONS
// Handles scheduling, managing, and previewing automated email workflows
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries';
import {
  WorkflowTemplate,
  ScheduledWorkflow,
  ScheduledWorkflowWithClient,
  WorkflowLimitsResponse,
  ScheduleWorkflowResponse,
  WorkflowFormData,
  WorkflowPreview,
  WORKFLOW_PLAN_LIMITS,
  PlanWithWorkflows,
} from '@/lib/workflows/types';

// -----------------------------------------------------------------------------
// HELPER: Get authenticated user with internal ID
// -----------------------------------------------------------------------------
async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getOrCreateUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

// -----------------------------------------------------------------------------
// HELPER: Get user's plan
// -----------------------------------------------------------------------------
async function getUserPlan(userId: string): Promise<PlanWithWorkflows> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('plan, admin_plan_expires_at')
    .eq('id', userId)
    .single();

  if (!user) return 'free';

  // Check if admin-granted plan has expired
  if (user.admin_plan_expires_at && new Date(user.admin_plan_expires_at) < new Date()) {
    return 'free';
  }

  return (user.plan || 'free') as PlanWithWorkflows;
}

// -----------------------------------------------------------------------------
// HELPER: Check plan limits
// -----------------------------------------------------------------------------
async function checkWorkflowLimits(userId: string): Promise<WorkflowLimitsResponse> {
  const plan = await getUserPlan(userId);
  const limits = WORKFLOW_PLAN_LIMITS[plan] || WORKFLOW_PLAN_LIMITS.free;

  // Get current counts in parallel
  const [activeResult, templateResult] = await Promise.all([
    supabaseAdmin
      .from('scheduled_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending'),
    supabaseAdmin
      .from('workflow_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_system', false),
  ]);

  const activeCount = activeResult.count || 0;
  const templateCount = templateResult.count || 0;

  return {
    activeWorkflows: activeCount,
    maxActiveWorkflows: limits.activeWorkflows,
    customTemplates: templateCount,
    maxCustomTemplates: limits.customTemplates,
    canCreateWorkflow: activeCount < limits.activeWorkflows,
    canCreateTemplate: templateCount < limits.customTemplates,
  };
}

// =============================================================================
// TEMPLATE ACTIONS
// =============================================================================

// -----------------------------------------------------------------------------
// Get all available templates (system + user's custom)
// -----------------------------------------------------------------------------
export async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabaseAdmin
    .from('workflow_templates')
    .select('*')
    .or(`user_id.eq.${user.id},is_system.eq.true`)
    .order('is_system', { ascending: false })
    .order('category')
    .order('default_days_offset');

  if (error) {
    console.error('getWorkflowTemplates error:', error);
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    category: row.category,
    subject: row.subject,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    defaultDaysOffset: row.default_days_offset,
    isSystem: row.is_system,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// -----------------------------------------------------------------------------
// Create custom template
// -----------------------------------------------------------------------------
export async function createWorkflowTemplate(data: {
  name: string;
  description?: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  defaultDaysOffset: number;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  const user = await getAuthenticatedUser();
  const limits = await checkWorkflowLimits(user.id);

  // Check plan limits
  if (!limits.canCreateTemplate) {
    const maxTemplates = limits.maxCustomTemplates;
    if (maxTemplates === 0) {
      return {
        success: false,
        error: 'Custom templates are not available on your plan. Upgrade to Essential or higher.',
      };
    }
    return {
      success: false,
      error: `You've reached the maximum of ${maxTemplates} custom templates on your plan.`,
    };
  }

  const { data: template, error } = await supabaseAdmin
    .from('workflow_templates')
    .insert({
      user_id: user.id,
      name: data.name,
      description: data.description || null,
      category: data.category,
      subject: data.subject,
      body_html: data.bodyHtml,
      body_text: data.bodyText || null,
      default_days_offset: data.defaultDaysOffset,
      is_system: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('createWorkflowTemplate error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, templateId: template.id };
}

// -----------------------------------------------------------------------------
// Update custom template
// -----------------------------------------------------------------------------
export async function updateWorkflowTemplate(
  templateId: string,
  data: Partial<{
    name: string;
    description: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    defaultDaysOffset: number;
  }>
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();

  // Verify ownership and not system template
  const { data: existing } = await supabaseAdmin
    .from('workflow_templates')
    .select('user_id, is_system')
    .eq('id', templateId)
    .single();

  if (!existing || existing.user_id !== user.id || existing.is_system) {
    return { success: false, error: 'Cannot edit this template' };
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.subject !== undefined) updateData.subject = data.subject;
  if (data.bodyHtml !== undefined) updateData.body_html = data.bodyHtml;
  if (data.bodyText !== undefined) updateData.body_text = data.bodyText;
  if (data.defaultDaysOffset !== undefined) updateData.default_days_offset = data.defaultDaysOffset;

  const { error } = await supabaseAdmin
    .from('workflow_templates')
    .update(updateData)
    .eq('id', templateId);

  if (error) {
    console.error('updateWorkflowTemplate error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// -----------------------------------------------------------------------------
// Delete custom template
// -----------------------------------------------------------------------------
export async function deleteWorkflowTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();

  const { error } = await supabaseAdmin
    .from('workflow_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', user.id)
    .eq('is_system', false);

  if (error) {
    console.error('deleteWorkflowTemplate error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================================================
// SCHEDULED WORKFLOW ACTIONS
// =============================================================================

// -----------------------------------------------------------------------------
// Get workflows for a specific client
// -----------------------------------------------------------------------------
export async function getClientWorkflows(clientId: string): Promise<ScheduledWorkflow[]> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabaseAdmin
    .from('scheduled_workflows')
    .select(`
      *,
      workflow_templates (id, name, category)
    `)
    .eq('user_id', user.id)
    .eq('client_id', clientId)
    .order('scheduled_for', { ascending: true });

  if (error) {
    console.error('getClientWorkflows error:', error);
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    templateId: row.template_id,
    daysOffset: row.days_offset,
    scheduledFor: row.scheduled_for,
    status: row.status,
    statusReason: row.status_reason,
    emailSubject: row.email_subject,
    emailBodyHtml: row.email_body_html,
    emailBodyText: row.email_body_text,
    sentAt: row.sent_at,
    emailLogId: row.email_log_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// -----------------------------------------------------------------------------
// Get all pending workflows for dashboard overview
// -----------------------------------------------------------------------------
export async function getAllPendingWorkflows(): Promise<ScheduledWorkflowWithClient[]> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabaseAdmin
    .from('scheduled_workflows')
    .select(`
      *,
      workflow_templates (id, name, category),
      client_profiles (id, name, email, event_date, event_type)
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true })
    .limit(50);

  if (error) {
    console.error('getAllPendingWorkflows error:', error);
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    templateId: row.template_id,
    daysOffset: row.days_offset,
    scheduledFor: row.scheduled_for,
    status: row.status,
    statusReason: row.status_reason,
    emailSubject: row.email_subject,
    emailBodyHtml: row.email_body_html,
    emailBodyText: row.email_body_text,
    sentAt: row.sent_at,
    emailLogId: row.email_log_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    template: row.workflow_templates
      ? {
          id: row.workflow_templates.id,
          name: row.workflow_templates.name,
          category: row.workflow_templates.category,
        }
      : null,
    client: {
      id: row.client_profiles.id,
      name: row.client_profiles.name,
      email: row.client_profiles.email,
      eventDate: row.client_profiles.event_date,
      eventType: row.client_profiles.event_type,
    },
  }));
}

// -----------------------------------------------------------------------------
// Schedule a workflow for a client
// -----------------------------------------------------------------------------
export async function scheduleWorkflow(
  clientId: string,
  formData: WorkflowFormData
): Promise<ScheduleWorkflowResponse> {
  const user = await getAuthenticatedUser();
  const limits = await checkWorkflowLimits(user.id);

  // Check plan limits
  if (!limits.canCreateWorkflow) {
    return {
      success: false,
      error: `You've reached the maximum of ${limits.maxActiveWorkflows} active automations on your plan. Upgrade to add more.`,
    };
  }

  // Get client and template data in parallel
  const [clientResult, templateResult] = await Promise.all([
    supabaseAdmin
      .from('client_profiles')
      .select('id, first_name, last_name, email, event_date, event_time, event_type, event_location')
      .eq('id', clientId)
      .eq('photographer_id', user.id)
      .single(),
    supabaseAdmin
      .from('workflow_templates')
      .select('*')
      .eq('id', formData.templateId)
      .single(),
  ]);

  const client = clientResult.data;
  const template = templateResult.data;

  // Validation
  if (!client) return { success: false, error: 'Client not found' };
  if (!template) return { success: false, error: 'Template not found' };
  if (!client.event_date) return { success: false, error: 'Client has no event date set' };
  if (!client.email) return { success: false, error: 'Client has no email address' };

  // Calculate scheduled date
  const eventDate = new Date(client.event_date);
  const scheduledFor = new Date(eventDate);
  scheduledFor.setDate(scheduledFor.getDate() + formData.daysOffset);
  scheduledFor.setHours(9, 0, 0, 0); // 9 AM

  // Check if scheduled date is in the past
  if (scheduledFor < new Date()) {
    return {
      success: false,
      error: 'Cannot schedule workflow for a past date',
    };
  }

  // Get photographer info for merge fields
  const [settingsResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email, phone')
      .eq('user_id', user.id)
      .single(),
    supabaseAdmin
      .from('users')
      .select('display_name, email')
      .eq('id', user.id)
      .single(),
  ]);

  const userSettings = settingsResult.data;
  const userProfile = profileResult.data;

  // Build merge data
  const clientName = `${client.first_name} ${client.last_name}`
  
  // Format event time for display (e.g., "2:30 PM")
  const formatEventTime = (time: string | null): string => {
    if (!time) return 'TBD';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  const mergeData: Record<string, string> = {
    client_name: clientName,
    client_first_name: client.first_name,
    client_email: client.email,
    event_type: client.event_type || 'session',
    event_date: client.event_date,
    event_date_formatted: eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    event_time: (client as any).event_time || 'TBD',
    event_time_formatted: formatEventTime((client as any).event_time),
    event_location: client.event_location || 'TBD',
    days_until_event: Math.abs(formData.daysOffset).toString(),
    days_since_event: Math.abs(formData.daysOffset).toString(),
    photographer_name: userProfile?.display_name || userSettings?.business_name || 'Your Photographer',
    photographer_email: userSettings?.contact_email || userProfile?.email || '',
    photographer_phone: userSettings?.phone || '',
    photographer_business: userSettings?.business_name || '',
    delivery_window: '14',
    package_name: '',
  };

  // Replace merge fields in subject and body
  let subject = formData.customSubject || template.subject;
  let bodyHtml = formData.customBody || template.body_html;
  let bodyText = template.body_text || '';

  Object.entries(mergeData).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    bodyHtml = bodyHtml.replace(regex, value);
    bodyText = bodyText.replace(regex, value);
  });

  // Insert scheduled workflow
  const { data: workflow, error } = await supabaseAdmin
    .from('scheduled_workflows')
    .insert({
      user_id: user.id,
      client_id: clientId,
      template_id: formData.templateId,
      days_offset: formData.daysOffset,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
      email_subject: subject,
      email_body_html: bodyHtml,
      email_body_text: bodyText,
    })
    .select('id')
    .single();

  if (error) {
    console.error('scheduleWorkflow error:', error);
    return { success: false, error: error.message };
  }

  // Log the scheduling
  await supabaseAdmin.from('workflow_execution_log').insert({
    scheduled_workflow_id: workflow.id,
    action: 'scheduled',
    details: { templateId: formData.templateId, daysOffset: formData.daysOffset },
  });

  revalidatePath(`/dashboard/clients/${clientId}`);

  return {
    success: true,
    workflowId: workflow.id,
    scheduledFor: scheduledFor.toISOString(),
  };
}

// -----------------------------------------------------------------------------
// Cancel a pending workflow
// -----------------------------------------------------------------------------
export async function cancelWorkflow(
  workflowId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();

  // Get workflow to verify ownership and status
  const { data: workflow } = await supabaseAdmin
    .from('scheduled_workflows')
    .select('id, client_id, status')
    .eq('id', workflowId)
    .eq('user_id', user.id)
    .single();

  if (!workflow) return { success: false, error: 'Workflow not found' };
  if (workflow.status !== 'pending') {
    return { success: false, error: 'Can only cancel pending workflows' };
  }

  const { error } = await supabaseAdmin
    .from('scheduled_workflows')
    .update({
      status: 'cancelled',
      status_reason: 'Cancelled by user',
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId);

  if (error) {
    console.error('cancelWorkflow error:', error);
    return { success: false, error: error.message };
  }

  // Log cancellation
  await supabaseAdmin.from('workflow_execution_log').insert({
    scheduled_workflow_id: workflowId,
    action: 'cancelled',
    details: { cancelledAt: new Date().toISOString() },
  });

  revalidatePath(`/dashboard/clients/${workflow.client_id}`);

  return { success: true };
}

// -----------------------------------------------------------------------------
// Preview workflow email with merge fields filled
// -----------------------------------------------------------------------------
export async function previewWorkflow(
  clientId: string,
  formData: WorkflowFormData
): Promise<WorkflowPreview | { error: string }> {
  const user = await getAuthenticatedUser();

  // Get client and template
  const [clientResult, templateResult] = await Promise.all([
    supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', clientId)
      .eq('photographer_id', user.id)
      .single(),
    supabaseAdmin
      .from('workflow_templates')
      .select('*')
      .eq('id', formData.templateId)
      .single(),
  ]);

  const client = clientResult.data;
  const template = templateResult.data;

  if (!client) return { error: 'Client not found' };
  if (!template) return { error: 'Template not found' };
  if (!client.event_date) return { error: 'Client has no event date' };

  // Calculate scheduled date
  const eventDate = new Date(client.event_date);
  const scheduledFor = new Date(eventDate);
  scheduledFor.setDate(scheduledFor.getDate() + formData.daysOffset);
  scheduledFor.setHours(9, 0, 0, 0);

  // Get photographer info
  const [settingsResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email, phone')
      .eq('user_id', user.id)
      .single(),
    supabaseAdmin
      .from('users')
      .select('display_name, email')
      .eq('id', user.id)
      .single(),
  ]);

  const userSettings = settingsResult.data;
  const userProfile = profileResult.data;

  // Build merge data
  const clientNamePreview = `${client.first_name} ${client.last_name}`
  
  // Format event time for display (e.g., "2:30 PM")
  const formatEventTimePreview = (time: string | null): string => {
    if (!time) return 'TBD';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  const mergeData: Record<string, string> = {
    client_name: clientNamePreview,
    client_first_name: client.first_name,
    client_email: client.email || '',
    event_type: client.event_type || 'session',
    event_date: client.event_date,
    event_date_formatted: eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    event_time: client.event_time || 'TBD',
    event_time_formatted: formatEventTimePreview(client.event_time),
    event_location: client.event_location || 'TBD',
    days_until_event: Math.abs(formData.daysOffset).toString(),
    days_since_event: Math.abs(formData.daysOffset).toString(),
    photographer_name: userProfile?.display_name || userSettings?.business_name || 'Your Photographer',
    photographer_email: userSettings?.contact_email || userProfile?.email || '',
    photographer_phone: userSettings?.phone || '',
    photographer_business: userSettings?.business_name || '',
    delivery_window: '14',
    package_name: '',
  };

  let subject = formData.customSubject || template.subject;
  let bodyHtml = formData.customBody || template.body_html;

  Object.entries(mergeData).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    bodyHtml = bodyHtml.replace(regex, value);
  });

  return {
    subject,
    bodyHtml,
    scheduledFor: scheduledFor.toISOString(),
    recipientEmail: client.email || '',
    recipientName: client.name,
  };
}

// -----------------------------------------------------------------------------
// Get current workflow limits for user
// -----------------------------------------------------------------------------
export async function getWorkflowLimits(): Promise<WorkflowLimitsResponse> {
  const user = await getAuthenticatedUser();
  return checkWorkflowLimits(user.id);
}
