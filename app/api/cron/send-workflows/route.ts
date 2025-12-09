// =============================================================================
// CRON: SEND SCHEDULED WORKFLOWS
// Runs every hour to send due workflow emails
// Vercel Cron: 0 * * * * (every hour at minute 0)
// =============================================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || '');

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface CronResults {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface WorkflowRow {
  id: string;
  user_id: string;
  client_id: string;
  template_id: string | null;
  days_offset: number;
  scheduled_for: string;
  status: string;
  email_subject: string;
  email_body_html: string;
  email_body_text: string | null;
  client_profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    event_date: string | null;
  };
}

// -----------------------------------------------------------------------------
// Verify cron secret to prevent unauthorized access
// -----------------------------------------------------------------------------
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow in dev if no secret configured
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

// -----------------------------------------------------------------------------
// Mark workflow as skipped
// -----------------------------------------------------------------------------
async function markWorkflowSkipped(workflowId: string, reason: string) {
  await supabaseAdmin
    .from('scheduled_workflows')
    .update({
      status: 'skipped',
      status_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId);

  await supabaseAdmin.from('workflow_execution_log').insert({
    scheduled_workflow_id: workflowId,
    action: 'skipped',
    details: { reason },
  });
}

// -----------------------------------------------------------------------------
// Mark workflow as failed
// -----------------------------------------------------------------------------
async function markWorkflowFailed(workflowId: string, error: string) {
  await supabaseAdmin
    .from('scheduled_workflows')
    .update({
      status: 'failed',
      status_reason: error,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId);

  await supabaseAdmin.from('workflow_execution_log').insert({
    scheduled_workflow_id: workflowId,
    action: 'failed',
    details: { error },
  });
}

// -----------------------------------------------------------------------------
// Mark workflow as sent
// -----------------------------------------------------------------------------
async function markWorkflowSent(workflowId: string, emailLogId: string | null) {
  const now = new Date().toISOString();

  await supabaseAdmin
    .from('scheduled_workflows')
    .update({
      status: 'sent',
      sent_at: now,
      email_log_id: emailLogId,
      updated_at: now,
    })
    .eq('id', workflowId);

  await supabaseAdmin.from('workflow_execution_log').insert({
    scheduled_workflow_id: workflowId,
    action: 'sent',
    details: { emailLogId, sentAt: now },
  });
}

// -----------------------------------------------------------------------------
// GET Handler - Process due workflows
// -----------------------------------------------------------------------------
export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  const results: CronResults = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // -------------------------------------------------------------------------
    // 1. FETCH DUE WORKFLOWS
    // Get all pending workflows where scheduled_for <= now
    // -------------------------------------------------------------------------
    const { data: dueWorkflows, error: fetchError } = await supabaseAdmin
      .from('scheduled_workflows')
      .select(`
        *,
        client_profiles (id, first_name, last_name, email, event_date)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(100); // Process max 100 per run to avoid timeout

    if (fetchError) {
      console.error('[Workflow Cron] Fetch error:', fetchError);
      return NextResponse.json(
        { error: `Failed to fetch workflows: ${fetchError.message}`, ...results },
        { status: 500 }
      );
    }

    if (!dueWorkflows || dueWorkflows.length === 0) {
      return NextResponse.json({
        message: 'No workflows due',
        ...results,
      });
    }

    console.log(`[Workflow Cron] Processing ${dueWorkflows.length} due workflows`);

    // -------------------------------------------------------------------------
    // 2. PROCESS EACH WORKFLOW
    // -------------------------------------------------------------------------
    for (const workflow of dueWorkflows as WorkflowRow[]) {
      results.processed++;

      try {
        const client = workflow.client_profiles;

        // ---------------------------------------------------------------------
        // 2a. VALIDATION CHECKS
        // ---------------------------------------------------------------------

        // Check if client has email
        if (!client?.email) {
          await markWorkflowSkipped(workflow.id, 'Client has no email address');
          results.skipped++;
          console.log(`[Workflow Cron] Skipped ${workflow.id}: No client email`);
          continue;
        }

        // Check if event date has passed (for pre-event workflows)
        if (workflow.days_offset < 0 && client.event_date) {
          const eventDate = new Date(client.event_date);
          if (eventDate < new Date()) {
            await markWorkflowSkipped(workflow.id, 'Event date has passed');
            results.skipped++;
            console.log(`[Workflow Cron] Skipped ${workflow.id}: Event date passed`);
            continue;
          }
        }

        // ---------------------------------------------------------------------
        // 2b. GET PHOTOGRAPHER INFO FOR FROM ADDRESS
        // ---------------------------------------------------------------------
        const { data: userSettings } = await supabaseAdmin
          .from('user_settings')
          .select('contact_email, business_name')
          .eq('user_id', workflow.user_id)
          .single();

        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('email, display_name')
          .eq('id', workflow.user_id)
          .single();

        // Determine from address
        // Use photographer's contact email if set, otherwise fall back to noreply
        const fromEmail = userSettings?.contact_email || 'noreply@12img.com';
        const fromName = userSettings?.business_name || userProfile?.display_name || '12img';

        // ---------------------------------------------------------------------
        // 2c. CREATE EMAIL LOG ENTRY
        // ---------------------------------------------------------------------
        const { data: emailLog } = await supabaseAdmin
          .from('email_logs')
          .insert({
            user_id: workflow.user_id,
            recipient_email: client.email,
            recipient_name: `${client.first_name} ${client.last_name}`,
            email_type: 'workflow',
            subject: workflow.email_subject,
            status: 'pending',
            metadata: {
              workflow_id: workflow.id,
              template_id: workflow.template_id,
              client_id: workflow.client_id,
            },
          })
          .select('id')
          .single();

        // ---------------------------------------------------------------------
        // 2d. SEND EMAIL VIA RESEND
        // ---------------------------------------------------------------------
        const { error: sendError } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: client.email,
          subject: workflow.email_subject,
          html: workflow.email_body_html,
          text: workflow.email_body_text || undefined,
        });

        if (sendError) {
          throw new Error(sendError.message);
        }

        // ---------------------------------------------------------------------
        // 2e. MARK AS SENT
        // ---------------------------------------------------------------------
        await markWorkflowSent(workflow.id, emailLog?.id || null);

        // Update email log status
        if (emailLog?.id) {
          await supabaseAdmin
            .from('email_logs')
            .update({ status: 'sent', sent_at: now })
            .eq('id', emailLog.id);
        }

        results.sent++;
        console.log(`[Workflow Cron] Sent ${workflow.id} to ${client.email}`);

      } catch (workflowError) {
        // ---------------------------------------------------------------------
        // 2f. HANDLE FAILURE
        // ---------------------------------------------------------------------
        const errorMessage =
          workflowError instanceof Error ? workflowError.message : 'Unknown error';

        await markWorkflowFailed(workflow.id, errorMessage);

        results.failed++;
        results.errors.push(`Workflow ${workflow.id}: ${errorMessage}`);
        console.error(`[Workflow Cron] Failed ${workflow.id}:`, errorMessage);
      }
    }

    // -------------------------------------------------------------------------
    // 3. RETURN RESULTS
    // -------------------------------------------------------------------------
    console.log(`[Workflow Cron] Complete:`, results);

    return NextResponse.json({
      message: 'Workflow processing complete',
      ...results,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Workflow Cron] Fatal error:', errorMessage);

    return NextResponse.json(
      { error: errorMessage, ...results },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// Runtime Configuration
// -----------------------------------------------------------------------------
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 second timeout
