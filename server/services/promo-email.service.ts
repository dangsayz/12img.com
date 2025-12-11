/**
 * Promo Email Service
 * 
 * Send promotional emails with discount codes to users.
 * Uses Resend for delivery.
 */

import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY || '')

interface PromoEmailData {
  recipientEmail: string
  recipientName?: string
  discountCode: string
  discountText: string // e.g., "15% off", "First month free"
  headline?: string
  message?: string
  ctaText?: string
  ctaUrl?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

interface BulkEmailResult {
  sent: number
  failed: number
  errors: string[]
}

/**
 * Generate promo email HTML
 */
function generatePromoEmailHtml(data: PromoEmailData): string {
  const headline = data.headline || `Here's a special offer for you`
  const message = data.message || `Use this exclusive discount code to save on your 12img subscription.`
  const ctaText = data.ctaText || 'Claim Your Discount'
  const ctaUrl = data.ctaUrl || `https://12img.com/pricing?promo=${data.discountCode}`
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width: 32px; height: 32px; background-color: #18181b; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: -0.5px;">12</span>
                  </td>
                  <td style="padding-left: 6px;">
                    <span style="font-size: 18px; font-weight: 700; color: #18181b;">img</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 40px 32px; text-align: center;">
                    <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff;">
                      ${headline}
                    </h1>
                    ${data.recipientName ? `
                    <p style="margin: 0; font-size: 16px; color: #a1a1aa;">
                      Hi ${data.recipientName}!
                    </p>
                    ` : ''}
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <p style="margin: 0 0 24px; font-size: 16px; color: #52525b; text-align: center;">
                      ${message}
                    </p>
                    
                    <!-- Discount Badge -->
                    <div style="text-align: center; margin-bottom: 24px;">
                      <span style="display: inline-block; padding: 8px 20px; background-color: #dcfce7; color: #166534; font-size: 14px; font-weight: 600; border-radius: 100px;">
                        ${data.discountText}
                      </span>
                    </div>
                    
                    <!-- Code Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center">
                          <div style="display: inline-block; padding: 20px 40px; background-color: #f4f4f5; border: 2px dashed #d4d4d8; border-radius: 12px;">
                            <p style="margin: 0 0 4px; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">
                              Your code
                            </p>
                            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #18181b; font-family: 'SF Mono', Monaco, monospace; letter-spacing: 3px;">
                              ${data.discountCode}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${ctaUrl}" 
                             style="display: inline-block; padding: 16px 48px; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #a1a1aa;">
                You received this email because you're subscribed to 12img updates.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                <a href="https://12img.com/settings" style="color: #71717a;">Manage preferences</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Generate plain text version
 */
function generatePromoEmailText(data: PromoEmailData): string {
  const headline = data.headline || `Here's a special offer for you`
  const message = data.message || `Use this exclusive discount code to save on your 12img subscription.`
  const ctaUrl = data.ctaUrl || `https://12img.com/pricing?promo=${data.discountCode}`
  
  return `
${data.recipientName ? `Hi ${data.recipientName}!\n\n` : ''}${headline}

${message}

Your discount: ${data.discountText}
Your code: ${data.discountCode}

Claim your discount: ${ctaUrl}

---
12img - Beautiful gallery delivery for photographers
`.trim()
}

/**
 * Send a promo email to a single recipient
 */
export async function sendPromoEmail(data: PromoEmailData): Promise<EmailResult> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || '12img <noreply@12img.com>',
      to: data.recipientEmail,
      subject: data.headline || `Your exclusive discount code from 12img`,
      html: generatePromoEmailHtml(data),
      text: generatePromoEmailText(data),
      tags: [
        { name: 'type', value: 'promo' },
        { name: 'discount_code', value: data.discountCode },
      ],
    })

    if (error) {
      console.error('[PromoEmail] Send failed:', error)
      return { success: false, error: error.message }
    }

    // Log the email
    await supabaseAdmin
      .from('email_logs')
      .insert({
        user_id: null, // Promo emails may go to non-users
        email_type: 'promo',
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: data.headline || `Your exclusive discount code from 12img`,
        status: 'sent',
        resend_message_id: result?.id,
        metadata: { discount_code: data.discountCode, discount_text: data.discountText },
      })

    return { success: true, messageId: result?.id }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[PromoEmail] Error:', err)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send promo emails to multiple recipients
 */
export async function sendBulkPromoEmails(
  recipients: Array<{ email: string; name?: string }>,
  promoData: {
    discountCode: string
    discountText: string
    headline?: string
    message?: string
    ctaText?: string
    ctaUrl?: string
  }
): Promise<BulkEmailResult> {
  const results: BulkEmailResult = { sent: 0, failed: 0, errors: [] }

  for (const recipient of recipients) {
    const result = await sendPromoEmail({
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      ...promoData,
    })

    if (result.success) {
      results.sent++
    } else {
      results.failed++
      results.errors.push(`${recipient.email}: ${result.error}`)
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

/**
 * Send promo email to all free users
 */
export async function sendPromoToFreeUsers(promoData: {
  discountCode: string
  discountText: string
  headline?: string
  message?: string
}): Promise<BulkEmailResult> {
  // Get all free users
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('email, business_name')
    .eq('subscription_tier', 'free')

  if (error || !users) {
    return { sent: 0, failed: 0, errors: ['Failed to fetch users'] }
  }

  const recipients = users.map(u => ({
    email: u.email,
    name: u.business_name || undefined,
  }))

  return sendBulkPromoEmails(recipients, promoData)
}

/**
 * Send promo email to specific user IDs
 */
export async function sendPromoToUsers(
  userIds: string[],
  promoData: {
    discountCode: string
    discountText: string
    headline?: string
    message?: string
  }
): Promise<BulkEmailResult> {
  // Get users by IDs
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('email, business_name')
    .in('id', userIds)

  if (error || !users) {
    return { sent: 0, failed: 0, errors: ['Failed to fetch users'] }
  }

  const recipients = users.map(u => ({
    email: u.email,
    name: u.business_name || undefined,
  }))

  return sendBulkPromoEmails(recipients, promoData)
}
