/**
 * Admin Email Notification Service
 * 
 * Sends email notifications to admin for important events:
 * - New user signups
 * - New subscriptions/payments
 * - Subscription cancellations
 * - Subscription upgrades
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

// Admin email - you can set this in env or hardcode
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@12img.com'
const FROM_EMAIL = process.env.EMAIL_FROM || '12img <noreply@12img.com>'

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// =============================================================================
// NEW USER SIGNUP
// =============================================================================

interface NewUserData {
  email: string
  name?: string
  createdAt: string
}

export async function sendNewUserNotification(data: NewUserData): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Admin Email] Skipping - no API key configured')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🎉 New signup: ${data.email}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: #141414; padding: 24px 32px;">
              <div style="display: inline-block; background: white; padding: 4px 8px; font-weight: bold; font-size: 12px; letter-spacing: -0.5px;">12</div>
              <span style="color: white; font-size: 18px; margin-left: 8px; font-weight: 500;">New Signup</span>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #525252; font-size: 14px; line-height: 1.6;">
                A new user just signed up for 12img.
              </p>
              
              <div style="background: #f5f5f5; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; font-weight: 500; text-align: right;">${data.email}</td>
                  </tr>
                  ${data.name ? `
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Name</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; font-weight: 500; text-align: right;">${data.name}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Signed up</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; text-align: right;">${new Date(data.createdAt).toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'}/admin/users" 
                 style="display: inline-block; background: #141414; color: white; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 4px;">
                View in Admin →
              </a>
            </div>
            
            <!-- Footer -->
            <div style="padding: 20px 32px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #a3a3a3; font-size: 11px;">
                This is an automated notification from 12img admin.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('[Admin Email] Failed to send new user notification:', error)
      return { success: false, error: error.message }
    }

    console.log('[Admin Email] New user notification sent:', result?.id)
    return { success: true, messageId: result?.id }
  } catch (err) {
    console.error('[Admin Email] Error:', err)
    return { success: false, error: String(err) }
  }
}

// =============================================================================
// NEW SUBSCRIPTION / PAYMENT
// =============================================================================

interface NewSubscriptionData {
  email: string
  name?: string
  plan: string
  amount: number
  currency: string
  interval: 'month' | 'year'
  isUpgrade?: boolean
  previousPlan?: string
}

export async function sendNewSubscriptionNotification(data: NewSubscriptionData): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Admin Email] Skipping - no API key configured')
    return { success: false, error: 'Email not configured' }
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency.toUpperCase(),
  }).format(data.amount / 100)

  const subject = data.isUpgrade 
    ? `💰 Upgrade: ${data.email} → ${data.plan} (${formattedAmount}/${data.interval})`
    : `💰 New payment: ${data.email} - ${data.plan} (${formattedAmount}/${data.interval})`

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: #141414; padding: 24px 32px;">
              <div style="display: inline-block; background: white; padding: 4px 8px; font-weight: bold; font-size: 12px; letter-spacing: -0.5px;">12</div>
              <span style="color: white; font-size: 18px; margin-left: 8px; font-weight: 500;">
                ${data.isUpgrade ? 'Plan Upgrade' : 'New Payment'}
              </span>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #525252; font-size: 14px; line-height: 1.6;">
                ${data.isUpgrade 
                  ? `A user just upgraded their plan from ${data.previousPlan || 'Free'} to ${data.plan}.`
                  : `A new subscription payment was received.`
                }
              </p>
              
              <!-- Amount highlight -->
              <div style="text-align: center; padding: 24px; background: linear-gradient(135deg, #141414 0%, #2d2d2d 100%); border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; color: #a3a3a3; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Amount</p>
                <p style="margin: 0; color: white; font-size: 32px; font-weight: 600;">${formattedAmount}</p>
                <p style="margin: 4px 0 0; color: #737373; font-size: 12px;">per ${data.interval}</p>
              </div>
              
              <div style="background: #f5f5f5; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Customer</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; font-weight: 500; text-align: right;">${data.email}</td>
                  </tr>
                  ${data.name ? `
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Name</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; text-align: right;">${data.name}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Plan</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; font-weight: 500; text-align: right;">
                      <span style="background: #141414; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">${data.plan}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Billing</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; text-align: right;">${data.interval === 'year' ? 'Annual' : 'Monthly'}</td>
                  </tr>
                  ${data.isUpgrade && data.previousPlan ? `
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Previous</td>
                    <td style="padding: 8px 0; color: #737373; font-size: 14px; text-align: right;">${data.previousPlan}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'}/admin/billing" 
                 style="display: inline-block; background: #141414; color: white; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 4px;">
                View in Admin →
              </a>
            </div>
            
            <!-- Footer -->
            <div style="padding: 20px 32px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #a3a3a3; font-size: 11px;">
                This is an automated notification from 12img admin.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('[Admin Email] Failed to send subscription notification:', error)
      return { success: false, error: error.message }
    }

    console.log('[Admin Email] Subscription notification sent:', result?.id)
    return { success: true, messageId: result?.id }
  } catch (err) {
    console.error('[Admin Email] Error:', err)
    return { success: false, error: String(err) }
  }
}

// =============================================================================
// SUBSCRIPTION CANCELLED
// =============================================================================

interface CancellationData {
  email: string
  name?: string
  plan: string
  reason?: string
}

export async function sendCancellationNotification(data: CancellationData): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'Email not configured' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `⚠️ Cancellation: ${data.email} (${data.plan})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: #525252; padding: 24px 32px;">
              <div style="display: inline-block; background: white; padding: 4px 8px; font-weight: bold; font-size: 12px; letter-spacing: -0.5px;">12</div>
              <span style="color: white; font-size: 18px; margin-left: 8px; font-weight: 500;">Subscription Cancelled</span>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #525252; font-size: 14px; line-height: 1.6;">
                A user has cancelled their subscription.
              </p>
              
              <div style="background: #f5f5f5; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; font-weight: 500; text-align: right;">${data.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Plan</td>
                    <td style="padding: 8px 0; color: #141414; font-size: 14px; text-align: right;">${data.plan}</td>
                  </tr>
                  ${data.reason ? `
                  <tr>
                    <td style="padding: 8px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Reason</td>
                    <td style="padding: 8px 0; color: #525252; font-size: 14px; text-align: right;">${data.reason}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'}/admin/billing" 
                 style="display: inline-block; background: #141414; color: white; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 4px;">
                View in Admin →
              </a>
            </div>
            
            <!-- Footer -->
            <div style="padding: 20px 32px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #a3a3a3; font-size: 11px;">
                This is an automated notification from 12img admin.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
