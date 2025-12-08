/**
 * Resend Webhook Handler
 * 
 * Handles email delivery events from Resend:
 * - email.delivered
 * - email.bounced
 * - email.complained (spam)
 * - email.delivery_delayed
 * 
 * Setup in Resend dashboard:
 * 1. Go to Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/webhook/resend
 * 3. Select events: email.delivered, email.bounced, email.complained
 * 4. Copy signing secret to RESEND_WEBHOOK_SECRET env var
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Resend webhook event types
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.bounced' | 'email.complained' | 'email.delivery_delayed'
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    // Bounce-specific fields
    bounce?: {
      message: string
      type: 'hard' | 'soft'
    }
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  
  // If no webhook secret configured, log and return success
  // This allows the system to work without webhooks initially
  if (!webhookSecret) {
    console.log('[Resend Webhook] No RESEND_WEBHOOK_SECRET configured, skipping verification')
    // Still process the event for development
    try {
      const body = await request.json()
      await processEvent(body as ResendWebhookEvent)
      return NextResponse.json({ received: true })
    } catch (err) {
      console.error('[Resend Webhook] Error processing unverified event:', err)
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
  }
  
  // Verify webhook signature
  const headersList = await headers()
  const svixId = headersList.get('svix-id')
  const svixTimestamp = headersList.get('svix-timestamp')
  const svixSignature = headersList.get('svix-signature')
  
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('[Resend Webhook] Missing svix headers')
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 })
  }
  
  const body = await request.text()
  
  try {
    const wh = new Webhook(webhookSecret)
    const event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendWebhookEvent
    
    await processEvent(event)
    
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Resend Webhook] Verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
}

async function processEvent(event: ResendWebhookEvent) {
  const { type, data } = event
  
  console.log(`[Resend Webhook] Processing ${type} for ${data.email_id}`)
  
  // Find the email log by resend_message_id
  const { data: emailLog, error: findError } = await supabaseAdmin
    .from('email_logs')
    .select('id, user_id, recipient_email')
    .eq('resend_message_id', data.email_id)
    .single()
  
  if (findError || !emailLog) {
    console.log(`[Resend Webhook] Email log not found for ${data.email_id}`)
    return
  }
  
  switch (type) {
    case 'email.delivered':
      await handleDelivered(emailLog.id)
      break
      
    case 'email.bounced':
      await handleBounced(emailLog.id, emailLog.user_id, emailLog.recipient_email, data.bounce)
      break
      
    case 'email.complained':
      await handleComplained(emailLog.id, emailLog.user_id, emailLog.recipient_email)
      break
      
    case 'email.delivery_delayed':
      await handleDelayed(emailLog.id)
      break
  }
}

async function handleDelivered(emailLogId: string) {
  await supabaseAdmin
    .from('email_logs')
    .update({ status: 'delivered' })
    .eq('id', emailLogId)
  
  await supabaseAdmin
    .from('email_events')
    .insert({
      email_log_id: emailLogId,
      event_type: 'delivered',
    })
  
  console.log(`[Resend Webhook] Marked ${emailLogId} as delivered`)
}

async function handleBounced(
  emailLogId: string, 
  userId: string, 
  recipientEmail: string,
  bounce?: { message: string; type: 'hard' | 'soft' }
) {
  // Update email log
  await supabaseAdmin
    .from('email_logs')
    .update({ 
      status: 'bounced',
      error_message: bounce?.message || 'Email bounced',
    })
    .eq('id', emailLogId)
  
  // Log the event
  await supabaseAdmin
    .from('email_events')
    .insert({
      email_log_id: emailLogId,
      event_type: 'bounced',
    })
  
  // For hard bounces, add to suppression list
  if (bounce?.type === 'hard') {
    await addToSuppressionList(userId, recipientEmail, 'hard_bounce', bounce.message)
  }
  
  console.log(`[Resend Webhook] Marked ${emailLogId} as bounced (${bounce?.type || 'unknown'})`)
}

async function handleComplained(emailLogId: string, userId: string, recipientEmail: string) {
  // Update email log
  await supabaseAdmin
    .from('email_logs')
    .update({ 
      status: 'bounced', // Treat complaints as bounces
      error_message: 'Recipient marked as spam',
    })
    .eq('id', emailLogId)
  
  // Log the event
  await supabaseAdmin
    .from('email_events')
    .insert({
      email_log_id: emailLogId,
      event_type: 'bounced',
    })
  
  // Add to suppression list - never email this address again
  await addToSuppressionList(userId, recipientEmail, 'spam_complaint', 'Recipient marked as spam')
  
  console.log(`[Resend Webhook] Marked ${emailLogId} as spam complaint`)
}

async function handleDelayed(emailLogId: string) {
  // Just log the delay event for visibility
  await supabaseAdmin
    .from('email_events')
    .insert({
      email_log_id: emailLogId,
      event_type: 'sent', // Use 'sent' as we don't have 'delayed' in the enum
    })
  
  console.log(`[Resend Webhook] Logged delivery delay for ${emailLogId}`)
}

/**
 * Add an email to the suppression list.
 * This prevents future emails to addresses that have bounced or complained.
 */
async function addToSuppressionList(
  userId: string,
  email: string,
  reason: 'hard_bounce' | 'spam_complaint' | 'manual',
  details?: string
) {
  // Check if suppression_list table exists (we'll create it in a migration)
  const { error } = await supabaseAdmin
    .from('email_suppression_list')
    .upsert({
      user_id: userId,
      email: email.toLowerCase(),
      reason,
      details,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,email',
    })
  
  if (error) {
    // Table might not exist yet - log but don't fail
    console.log(`[Resend Webhook] Could not add to suppression list:`, error.message)
  }
}
