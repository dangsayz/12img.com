/**
 * Contract Email Service
 * 
 * Handles sending contract-related emails to clients.
 */

import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendContractEmailOptions {
  clientEmail: string
  clientName: string
  photographerName: string
  photographerEmail: string
  portalUrl: string
  eventType: string
  eventDate?: string
  eventVenue?: string
  eventLocation?: string
  packageName?: string
  packageHours?: number
  packagePrice?: number
}

/**
 * Send contract notification email to client
 */
export async function sendContractEmail(options: SendContractEmailOptions) {
  const {
    clientEmail,
    clientName,
    photographerName,
    photographerEmail,
    portalUrl,
    eventType,
    eventDate,
    eventVenue,
    eventLocation,
    packageName,
    packageHours,
    packagePrice,
  } = options

  const eventDateFormatted = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  // Calculate days until event
  const daysUntilEvent = eventDate
    ? Math.ceil((new Date(eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const eventTypeCapitalized = eventType.charAt(0).toUpperCase() + eventType.slice(1)
  const subject = `Your Photography Contract`

  const priceFormatted = packagePrice ? `$${packagePrice.toLocaleString()}` : null

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Photography Contract</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
          
          <!-- Logo/Name -->
          <tr>
            <td style="padding-bottom: 48px; text-align: center;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #999999;">
                Photography Contract
              </p>
            </td>
          </tr>
          
          <!-- Photographer Name -->
          <tr>
            <td style="text-align: center; padding-bottom: 48px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 300; color: #000000; letter-spacing: -0.02em; font-family: Georgia, 'Times New Roman', serif;">
                ${photographerName}
              </h1>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 48px;">
              <div style="width: 40px; height: 1px; background: #000000; margin: 0 auto;"></div>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #000000; text-align: center;">
                ${clientName},
              </p>
              <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.7; color: #666666; text-align: center;">
                Your contract is ready for review.
              </p>
            </td>
          </tr>
          
          <!-- Event Details Box -->
          <tr>
            <td style="padding: 32px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e5e5;">
                <tr>
                  <td style="padding: 32px;">
                    ${eventDateFormatted ? `
                    <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #999999;">
                      Date
                    </p>
                    <p style="margin: 0 0 24px; font-size: 18px; color: #000000; font-family: Georgia, 'Times New Roman', serif;">
                      ${eventDateFormatted}
                    </p>
                    ` : ''}
                    
                    ${eventVenue || eventLocation ? `
                    <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #999999;">
                      Location
                    </p>
                    <p style="margin: 0 0 24px; font-size: 16px; color: #000000;">
                      ${eventVenue || ''}${eventVenue && eventLocation ? '<br>' : ''}${eventLocation || ''}
                    </p>
                    ` : ''}
                    
                    ${packageName ? `
                    <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #999999;">
                      Package
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #000000;">
                      ${packageName}${packageHours ? ` · ${packageHours}h` : ''}${priceFormatted ? ` · ${priceFormatted}` : ''}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 16px 0 48px; text-align: center;">
              <a href="${portalUrl}" style="display: inline-block; padding: 18px 48px; background: #000000; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
                Review & Sign
              </a>
            </td>
          </tr>
          
          <!-- Footer Note -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #999999; text-align: center;">
                Questions? Reply directly to this email.
              </p>
            </td>
          </tr>
          
          <!-- Client Account CTA -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">
                <strong style="color: #000000;">Keep everything in one place.</strong>
              </p>
              <p style="margin: 0; font-size: 13px; color: #999999; line-height: 1.6;">
                Create a free 12img account to access your contracts, galleries, and project details anytime.
              </p>
              <p style="margin: 12px 0 0;">
                <a href="https://12img.com/sign-up?ref=contract" style="color: #000000; font-size: 13px; text-decoration: underline;">Create your free account →</a>
              </p>
            </td>
          </tr>
          
          <!-- Branding -->
          <tr>
            <td style="padding-top: 48px; text-align: center;">
              <p style="margin: 0; font-size: 10px; letter-spacing: 0.2em; color: #cccccc;">
                POWERED BY 12IMG
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

  const text = `
${photographerName.toUpperCase()}
Photography Contract

---

${clientName},

Your contract is ready for review.

${eventDateFormatted ? `Date: ${eventDateFormatted}\n` : ''}${eventVenue ? `Venue: ${eventVenue}\n` : ''}${eventLocation ? `Location: ${eventLocation}\n` : ''}${packageName ? `Package: ${packageName}${packageHours ? ` · ${packageHours}h` : ''}${priceFormatted ? ` · ${priceFormatted}` : ''}\n` : ''}

Review & Sign: ${portalUrl}

---

Questions? Reply directly to this email.

---

Keep everything in one place.

Create a free 12img account to access your contracts, galleries, and project details anytime.

Create your free account: 12img.com/sign-up

---
${photographerName}
  `.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: `${photographerName} <contracts@12img.com>`,
      replyTo: photographerEmail,
      to: clientEmail,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('[sendContractEmail] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (e) {
    console.error('[sendContractEmail] Exception:', e)
    return { success: false, error: 'Failed to send email' }
  }
}

interface SendSignatureConfirmationOptions {
  clientEmail: string
  clientName: string
  photographerName: string
  photographerEmail: string
  eventType: string
  signedAt: string
}

/**
 * Send signature confirmation email to client
 */
export async function sendSignatureConfirmationEmail(options: SendSignatureConfirmationOptions) {
  const {
    clientEmail,
    clientName,
    photographerName,
    photographerEmail,
    eventType,
    signedAt,
  } = options

  const signedDate = new Date(signedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const subject = `Contract Signed - ${eventType} Photography with ${photographerName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: #2D2D2D; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <span style="font-family: system-ui, -apple-system, sans-serif; font-size: 24px; font-weight: 600; color: white;">12</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 500; margin: 0; color: #166534;">Contract Signed</h1>
      </div>
      
      <p style="margin-bottom: 16px;">Hi ${clientName},</p>
      
      <p style="margin-bottom: 16px;">
        Thank you for signing your photography contract with ${photographerName}. 
        This email confirms that your contract was successfully signed on ${signedDate}.
      </p>
      
      <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #78716c;">What's Next?</p>
        <ul style="margin: 8px 0 0; padding-left: 20px; color: #44403c;">
          <li>Your photographer will be in touch with next steps</li>
          <li>Keep this email for your records</li>
          <li>You can access your client portal anytime</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #78716c;">
        If you have any questions, please don't hesitate to reach out to ${photographerEmail}.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;">
      
      <!-- Client Account CTA -->
      <div style="background: #f5f5f4; border-radius: 8px; padding: 20px; margin: 0 0 24px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1c1917;">
          Your project, all in one place
        </p>
        <p style="margin: 0 0 12px; font-size: 13px; color: #78716c; line-height: 1.6;">
          Create a free 12img account to access your contract, track your booking, and view your gallery when it's ready.
        </p>
        <a href="https://12img.com/sign-up?ref=signed" style="color: #1c1917; font-size: 13px; text-decoration: underline;">Create your free account →</a>
      </div>
      
      <p style="font-size: 11px; color: #d6d3d1; text-align: center;">
        Sent via <a href="https://12img.com" style="color: #a8a29e;">12IMG</a>
      </p>
    </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: `${photographerName} <contracts@12img.com>`,
      replyTo: photographerEmail,
      to: clientEmail,
      subject,
      html,
    })

    return { success: true }
  } catch (e) {
    console.error('[sendSignatureConfirmationEmail] Exception:', e)
    return { success: false }
  }
}

/**
 * Send notification to photographer when contract is signed
 */
export async function sendPhotographerSignatureNotification(options: {
  photographerEmail: string
  photographerName: string
  clientName: string
  eventType: string
  signedAt: string
  portalUrl: string
}) {
  const { photographerEmail, photographerName, clientName, eventType, signedAt, portalUrl } = options

  const signedDate = new Date(signedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const subject = `Contract Signed — ${clientName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="margin-bottom: 16px;">Hi ${photographerName},</p>
      
      <p style="margin-bottom: 16px;">
        Great news! <strong>${clientName}</strong> has signed their ${eventType} photography contract.
      </p>
      
      <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #78716c;">Signed</p>
        <p style="margin: 4px 0 0; font-weight: 500;">${signedDate}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${portalUrl}" style="display: inline-block; background: #1c1917; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          View Contract
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;">
      
      <p style="font-size: 11px; color: #d6d3d1; text-align: center;">
        Sent via <a href="https://12img.com" style="color: #a8a29e;">12IMG</a>
      </p>
    </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: '12IMG <notifications@12img.com>',
      to: photographerEmail,
      subject,
      html,
    })

    return { success: true }
  } catch (e) {
    console.error('[sendPhotographerSignatureNotification] Exception:', e)
    return { success: false }
  }
}

/**
 * Send friendly reminder email when contract is about to expire
 */
export async function sendContractExpiryReminder(options: {
  clientEmail: string
  clientName: string
  photographerName: string
  photographerEmail: string
  portalUrl: string
  eventType: string
  expiresAt: string
  daysRemaining: number
}) {
  const {
    clientEmail,
    clientName,
    photographerName,
    photographerEmail,
    portalUrl,
    eventType,
    expiresAt,
    daysRemaining,
  } = options

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const urgencyText = daysRemaining <= 1 
    ? 'Expires today' 
    : daysRemaining <= 3 
      ? `Expires in ${daysRemaining} days` 
      : `Expires ${expiryDate}`

  const subject = `Reminder: Your ${eventType} Contract is Waiting`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background: #fafaf9;">
      <!-- Header -->
      <div style="background: #1c1917; padding: 32px 24px; text-align: center;">
        <h1 style="font-size: 24px; font-weight: 300; margin: 0; color: white; letter-spacing: -0.5px;">${photographerName}</h1>
      </div>
      
      <!-- Main content -->
      <div style="padding: 32px 24px; background: white;">
        <p style="margin: 0 0 20px; font-size: 18px;">Hi ${clientName},</p>
        
        <p style="margin: 0 0 20px; color: #44403c;">
          Just a friendly reminder that your photography contract is still waiting for your signature.
        </p>
        
        <!-- Urgency Banner -->
        <div style="background: #fafaf9; border-radius: 0; padding: 16px; margin-bottom: 24px; border-left: 2px solid #1c1917;">
          <p style="margin: 0; font-weight: 600; color: #1c1917; font-size: 15px;">
            ${urgencyText}
          </p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #78716c;">
            Please sign before ${expiryDate} to secure your booking
          </p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${portalUrl}" style="display: inline-block; background: #1c1917; color: white; padding: 16px 32px; border-radius: 0; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.5px;">
            Sign Contract Now →
          </a>
        </div>
        
        <p style="font-size: 14px; color: #78716c; text-align: center;">
          Questions? Just reply to this email.
        </p>
        
        <!-- Client Account CTA -->
        <div style="background: #fafaf9; padding: 20px; margin-top: 24px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 500; color: #1c1917;">
            Stay organized, stress-free
          </p>
          <p style="margin: 0; font-size: 13px; color: #78716c; line-height: 1.6;">
            Create a free 12img account to access your contracts and galleries in one secure place.
            <br/>
            <a href="https://12img.com/sign-up?ref=reminder" style="color: #1c1917; text-decoration: underline;">Create your free account →</a>
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="padding: 24px; text-align: center; border-top: 1px solid #e7e5e4;">
        <p style="font-size: 12px; color: #a8a29e; margin: 0;">
          ${photographerEmail}
        </p>
        <p style="font-size: 11px; color: #d6d3d1; margin: 12px 0 0;">
          Sent via <a href="https://12img.com" style="color: #a8a29e;">12IMG</a>
        </p>
      </div>
    </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: `${photographerName} <contracts@12img.com>`,
      replyTo: photographerEmail,
      to: clientEmail,
      subject,
      html,
    })

    return { success: true }
  } catch (e) {
    console.error('[sendContractExpiryReminder] Exception:', e)
    return { success: false }
  }
}

/**
 * Send notification to client when contract has expired
 */
export async function sendContractExpiredToClient(options: {
  clientEmail: string
  clientName: string
  photographerName: string
  photographerEmail: string
  eventType: string
  expiredAt: string
}) {
  const {
    clientEmail,
    clientName,
    photographerName,
    photographerEmail,
    eventType,
    expiredAt,
  } = options

  const expiredDate = new Date(expiredAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const subject = `Your ${eventType} Contract Has Expired`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background: #fafaf9;">
      <!-- Header -->
      <div style="background: #1c1917; padding: 32px 24px; text-align: center;">
        <h1 style="font-size: 24px; font-weight: 300; margin: 0; color: white; letter-spacing: -0.5px;">${photographerName}</h1>
      </div>
      
      <!-- Main content -->
      <div style="padding: 32px 24px; background: white;">
        <p style="margin: 0 0 20px; font-size: 18px;">Hi ${clientName},</p>
        
        <p style="margin: 0 0 20px; color: #44403c;">
          We wanted to let you know that your photography contract has expired as of ${expiredDate}.
        </p>
        
        <!-- Notice Banner -->
        <div style="background: #fef2f2; border-radius: 0; padding: 16px; margin-bottom: 24px; border-left: 2px solid #dc2626;">
          <p style="margin: 0; font-weight: 600; color: #dc2626; font-size: 15px;">
            Contract Expired
          </p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #78716c;">
            The contract is no longer available for signing
          </p>
        </div>
        
        <p style="margin: 0 0 20px; color: #44403c;">
          If you're still interested in booking photography services, please reach out to ${photographerName} directly to discuss next steps and potentially receive a new contract.
        </p>
        
        <!-- Contact Info -->
        <div style="background: #fafaf9; border-radius: 0; padding: 16px; margin-bottom: 24px; border-left: 2px solid #1c1917;">
          <p style="margin: 0; font-weight: 600; color: #1c1917; font-size: 15px;">
            Get in Touch
          </p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #44403c;">
            <a href="mailto:${photographerEmail}" style="color: #1c1917; text-decoration: underline;">${photographerEmail}</a>
          </p>
        </div>
        
        <p style="font-size: 14px; color: #78716c; text-align: center;">
          We hope to work with you soon!
        </p>
      </div>
      
      <!-- Footer -->
      <div style="padding: 24px; text-align: center; border-top: 1px solid #e7e5e4;">
        <p style="font-size: 12px; color: #a8a29e; margin: 0;">
          ${photographerEmail}
        </p>
        <p style="font-size: 11px; color: #d6d3d1; margin: 12px 0 0;">
          Sent via <a href="https://12img.com" style="color: #a8a29e;">12IMG</a>
        </p>
      </div>
    </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: `${photographerName} <contracts@12img.com>`,
      replyTo: photographerEmail,
      to: clientEmail,
      subject,
      html,
    })

    return { success: true }
  } catch (e) {
    console.error('[sendContractExpiredToClient] Exception:', e)
    return { success: false }
  }
}

/**
 * Send notification to photographer when contract has expired
 */
export async function sendContractExpiredToPhotographer(options: {
  photographerEmail: string
  photographerName: string
  clientName: string
  clientEmail: string
  eventType: string
  eventDate: string | null
  expiredAt: string
  contractId: string
}) {
  const {
    photographerEmail,
    photographerName,
    clientName,
    clientEmail,
    eventType,
    eventDate,
    expiredAt,
    contractId,
  } = options

  const expiredDate = new Date(expiredAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const eventDateFormatted = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const subject = `Contract Expired: ${clientName} - ${eventType}`

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background: #fafaf9;">
      <!-- Header -->
      <div style="background: #1c1917; padding: 32px 24px; text-align: center;">
        <h1 style="font-size: 24px; font-weight: 300; margin: 0; color: white; letter-spacing: -0.5px;">Contract Expired</h1>
      </div>
      
      <!-- Main content -->
      <div style="padding: 32px 24px; background: white;">
        <p style="margin: 0 0 20px; font-size: 18px;">Hi ${photographerName},</p>
        
        <p style="margin: 0 0 20px; color: #44403c;">
          A contract has expired without being signed. The client has been notified.
        </p>
        
        <!-- Contract Details -->
        <div style="background: #fafaf9; border-radius: 0; padding: 20px; margin-bottom: 24px; border: 1px solid #e7e5e4;">
          <p style="margin: 0 0 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #78716c; font-weight: 600;">Contract Details</p>
          
          <div style="margin-bottom: 12px;">
            <p style="margin: 0; font-size: 13px; color: #78716c;">Client</p>
            <p style="margin: 2px 0 0; font-weight: 600; color: #1c1917;">${clientName}</p>
            <p style="margin: 2px 0 0; font-size: 14px; color: #44403c;">${clientEmail}</p>
          </div>
          
          <div style="margin-bottom: 12px;">
            <p style="margin: 0; font-size: 13px; color: #78716c;">Event Type</p>
            <p style="margin: 2px 0 0; font-weight: 500; color: #1c1917;">${eventType}</p>
          </div>
          
          ${eventDateFormatted ? `
          <div style="margin-bottom: 12px;">
            <p style="margin: 0; font-size: 13px; color: #78716c;">Event Date</p>
            <p style="margin: 2px 0 0; font-weight: 500; color: #1c1917;">${eventDateFormatted}</p>
          </div>
          ` : ''}
          
          <div>
            <p style="margin: 0; font-size: 13px; color: #78716c;">Expired On</p>
            <p style="margin: 2px 0 0; font-weight: 500; color: #dc2626;">${expiredDate}</p>
          </div>
        </div>
        
        <!-- Action Suggestion -->
        <div style="background: #fffbeb; border-radius: 0; padding: 16px; margin-bottom: 24px; border-left: 2px solid #f59e0b;">
          <p style="margin: 0; font-weight: 600; color: #92400e; font-size: 15px;">
            What to do next
          </p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #78716c;">
            If the client is still interested, you can create and send a new contract from your dashboard.
          </p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #1c1917; color: white; padding: 16px 32px; border-radius: 0; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.5px;">
            View Dashboard →
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="padding: 24px; text-align: center; border-top: 1px solid #e7e5e4;">
        <p style="font-size: 11px; color: #d6d3d1; margin: 0;">
          Sent via <a href="https://12img.com" style="color: #a8a29e;">12IMG</a>
        </p>
      </div>
    </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: '12IMG <notifications@12img.com>',
      to: photographerEmail,
      subject,
      html,
    })

    return { success: true }
  } catch (e) {
    console.error('[sendContractExpiredToPhotographer] Exception:', e)
    return { success: false }
  }
}

// ============================================
// CONTRACT CANCELLATION EMAILS
// ============================================

interface ContractCancellationEmailOptions {
  clientEmail: string
  clientName: string
  photographerName: string
  photographerEmail: string
  eventType: string
  eventDate?: string
  cancellationReason?: string
}

/**
 * Send contract cancellation notification to client
 */
export async function sendContractCancellationToClient(options: ContractCancellationEmailOptions) {
  const {
    clientEmail,
    clientName,
    photographerName,
    photographerEmail,
    eventType,
    eventDate,
    cancellationReason,
  } = options

  const eventTypeCapitalized = eventType.charAt(0).toUpperCase() + eventType.slice(1)
  const eventDateFormatted = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const subject = `Contract Cancelled - ${photographerName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background: #fafaf9;">
      <!-- Header -->
      <div style="background: #1c1917; padding: 40px 24px; text-align: center;">
        <h1 style="font-size: 24px; font-weight: 300; margin: 0; color: white; letter-spacing: -0.5px;">${photographerName}</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">Photography Services</p>
      </div>
      
      <!-- Main content -->
      <div style="background: white; padding: 32px 24px;">
        <p style="font-size: 16px; margin: 0 0 16px;">Hi ${clientName.split(' ')[0]},</p>
        
        <p style="font-size: 15px; color: #57534e; margin: 0 0 24px;">
          We wanted to let you know that your ${eventTypeCapitalized.toLowerCase()} photography contract has been cancelled by ${photographerName}.
        </p>
        
        ${eventDateFormatted ? `
        <div style="background: #f5f5f4; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #78716c;">Event Date</p>
          <p style="margin: 4px 0 0; font-weight: 500;">${eventDateFormatted}</p>
        </div>
        ` : ''}
        
        ${cancellationReason ? `
        <div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">Reason provided:</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #78716c;">${cancellationReason}</p>
        </div>
        ` : ''}
        
        <p style="font-size: 14px; color: #78716c; margin: 24px 0 0;">
          If you have any questions, please contact ${photographerName} directly at <a href="mailto:${photographerEmail}" style="color: #1c1917;">${photographerEmail}</a>.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="padding: 24px; text-align: center; border-top: 1px solid #e7e5e4;">
        <p style="font-size: 11px; color: #d6d3d1; margin: 0;">
          Sent via <a href="https://12img.com" style="color: #a8a29e;">12IMG</a>
        </p>
      </div>
    </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: '12IMG <notifications@12img.com>',
      to: clientEmail,
      replyTo: photographerEmail,
      subject,
      html,
    })

    return { success: true }
  } catch (e) {
    console.error('[sendContractCancellationToClient] Exception:', e)
    return { success: false }
  }
}

/**
 * Send contract cancellation confirmation to photographer
 */
export async function sendContractCancellationToPhotographer(options: ContractCancellationEmailOptions) {
  const {
    clientName,
    photographerName,
    photographerEmail,
    eventType,
    eventDate,
    cancellationReason,
  } = options

  const eventTypeCapitalized = eventType.charAt(0).toUpperCase() + eventType.slice(1)
  const eventDateFormatted = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const cancelledDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const subject = `Contract Cancelled - ${clientName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background: #fafaf9;">
      <!-- Header -->
      <div style="background: #1c1917; padding: 40px 24px; text-align: center;">
        <h1 style="font-size: 24px; font-weight: 300; margin: 0; color: white;">Contract Cancelled</h1>
      </div>
      
      <!-- Main content -->
      <div style="background: white; padding: 32px 24px;">
        <p style="font-size: 16px; margin: 0 0 16px;">Hi ${photographerName.split(' ')[0]},</p>
        
        <p style="font-size: 15px; color: #57534e; margin: 0 0 24px;">
          This is a confirmation that you have cancelled the ${eventTypeCapitalized.toLowerCase()} photography contract for <strong>${clientName}</strong>.
        </p>
        
        <div style="background: #f5f5f4; padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <p style="margin: 0; font-size: 13px; color: #78716c;">Client</p>
              <p style="margin: 4px 0 0; font-weight: 500;">${clientName}</p>
            </div>
            ${eventDateFormatted ? `
            <div>
              <p style="margin: 0; font-size: 13px; color: #78716c;">Event Date</p>
              <p style="margin: 4px 0 0; font-weight: 500;">${eventDateFormatted}</p>
            </div>
            ` : ''}
          </div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e7e5e4;">
            <p style="margin: 0; font-size: 13px; color: #78716c;">Cancelled On</p>
            <p style="margin: 4px 0 0; font-weight: 500; color: #dc2626;">${cancelledDate}</p>
          </div>
        </div>
        
        ${cancellationReason ? `
        <div style="background: #f5f5f4; border-left: 3px solid #78716c; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #78716c; font-weight: 600;">Your reason:</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #57534e;">${cancellationReason}</p>
        </div>
        ` : ''}
        
        <p style="font-size: 14px; color: #78716c; margin: 24px 0 0;">
          The client has been notified of this cancellation via email.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="padding: 24px; text-align: center; border-top: 1px solid #e7e5e4;">
        <p style="font-size: 11px; color: #d6d3d1; margin: 0;">
          Sent via <a href="https://12img.com" style="color: #a8a29e;">12IMG</a>
        </p>
      </div>
    </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: '12IMG <notifications@12img.com>',
      to: photographerEmail,
      subject,
      html,
    })

    return { success: true }
  } catch (e) {
    console.error('[sendContractCancellationToPhotographer] Exception:', e)
    return { success: false }
  }
}
