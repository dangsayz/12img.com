/**
 * Message Email Service
 * 
 * Handles email notifications for new messages.
 * Sends portal link to clients so they can join the conversation.
 */

import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY || '')

// Check if email is properly configured
function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0
}

// Logger
const log = {
  info: (message: string, data?: Record<string, unknown>) => 
    console.log(`[MessageEmail] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => 
    console.error(`[MessageEmail] ERROR: ${message}`, error, data ? JSON.stringify(data) : ''),
}

interface NewMessageNotificationData {
  clientId: string
  clientEmail: string
  clientName: string
  photographerId: string
  photographerName: string
  messagePreview: string
}

/**
 * Generate or get existing portal token for the client
 */
async function getOrCreatePortalToken(
  clientId: string, 
  photographerId: string
): Promise<string | null> {
  try {
    // Check for existing valid token
    const { data: existingToken } = await supabaseAdmin
      .from('portal_tokens')
      .select('token')
      .eq('client_id', clientId)
      .eq('photographer_id', photographerId)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingToken) {
      return existingToken.token
    }

    // Generate new token using database function
    const { data: newToken, error } = await supabaseAdmin.rpc('generate_portal_token', {
      p_client_id: clientId,
      p_photographer_id: photographerId,
      p_expires_in_days: 30,
      p_can_view_contract: true,
      p_can_sign_contract: true,
      p_can_message: true,
      p_can_view_gallery: true,
      p_can_download: true,
    })

    if (error) {
      log.error('Failed to generate portal token', error)
      return null
    }

    return newToken
  } catch (e) {
    log.error('Exception generating portal token', e)
    return null
  }
}

/**
 * Build the portal URL for the client
 */
function buildPortalUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/portal/${token}/messages`
}

/**
 * Send new message notification email to client
 */
export async function sendNewMessageNotification(
  data: NewMessageNotificationData
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    log.info('Email not configured, skipping notification')
    return { success: true }
  }

  const { clientId, clientEmail, clientName, photographerId, photographerName, messagePreview } = data

  try {
    // Get or create portal token
    const token = await getOrCreatePortalToken(clientId, photographerId)
    if (!token) {
      return { success: false, error: 'Failed to generate portal access' }
    }

    const portalUrl = buildPortalUrl(token)
    const firstName = clientName.split(' ')[0]

    // Build email HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message from ${photographerName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 32px 32px 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">
                New Message
              </h1>
              <p style="margin: 8px 0 0; color: #a8a29e; font-size: 14px;">
                from ${photographerName}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #44403c; font-size: 16px; line-height: 1.6;">
                Hi ${firstName},
              </p>
              
              <p style="margin: 0 0 24px; color: #44403c; font-size: 16px; line-height: 1.6;">
                ${photographerName} sent you a message:
              </p>
              
              <!-- Message Preview -->
              <div style="background-color: #fafaf9; border-left: 4px solid #1c1917; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
                <p style="margin: 0; color: #57534e; font-size: 15px; line-height: 1.6; font-style: italic;">
                  "${messagePreview}${messagePreview.length >= 200 ? '...' : ''}"
                </p>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: -0.3px;">
                      View & Reply
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 28px 0 0; color: #78716c; font-size: 13px; line-height: 1.6; text-align: center;">
                Click the button above to view the full message and reply.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 20px 32px; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0; color: #a8a29e; font-size: 12px; text-align: center; line-height: 1.5;">
                This is a secure message from your photographer's client portal.<br>
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Branding -->
        <p style="margin: 24px 0 0; color: #a8a29e; font-size: 11px; text-align: center;">
          Powered by 12img
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    // Send email
    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@12img.com',
      to: clientEmail,
      subject: `New message from ${photographerName}`,
      html,
    })

    if (error) {
      log.error('Failed to send email', error)
      return { success: false, error: error.message }
    }

    log.info('Message notification sent', { 
      clientEmail, 
      messageId: result?.id,
      portalUrl 
    })

    return { success: true }
  } catch (e) {
    log.error('Exception sending notification', e)
    return { success: false, error: 'Failed to send notification' }
  }
}

/**
 * Send notification when client replies (to photographer)
 * This notifies the photographer that they have a new message
 */
export async function sendClientReplyNotification(data: {
  photographerEmail: string
  photographerName: string
  clientName: string
  clientId: string
  messagePreview: string
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: true }
  }

  const { photographerEmail, photographerName, clientName, clientId, messagePreview } = data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const dashboardUrl = `${baseUrl}/dashboard/clients/${clientId}`

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reply from ${clientName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 32px 32px 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                💬 New Reply
              </h1>
              <p style="margin: 8px 0 0; color: #a8a29e; font-size: 14px;">
                from ${clientName}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #44403c; font-size: 16px; line-height: 1.6;">
                Hi ${photographerName.split(' ')[0]},
              </p>
              
              <p style="margin: 0 0 24px; color: #44403c; font-size: 16px; line-height: 1.6;">
                ${clientName} replied to your message:
              </p>
              
              <!-- Message Preview -->
              <div style="background-color: #fafaf9; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
                <p style="margin: 0; color: #57534e; font-size: 15px; line-height: 1.6; font-style: italic;">
                  "${messagePreview}${messagePreview.length >= 200 ? '...' : ''}"
                </p>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;">
                      View Conversation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 20px 32px; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0; color: #a8a29e; font-size: 12px; text-align: center;">
                Powered by 12img
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@12img.com',
      to: photographerEmail,
      subject: `💬 New reply from ${clientName}`,
      html,
    })

    if (error) {
      log.error('Failed to send reply notification', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    log.error('Exception sending reply notification', e)
    return { success: false, error: 'Failed to send notification' }
  }
}
