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
  const subject = `✨ Your ${eventTypeCapitalized} Photography Contract is Ready!`

  const priceFormatted = packagePrice ? `$${packagePrice.toLocaleString()}` : null

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background: #fafaf9;">
      <!-- Header with gradient -->
      <div style="background: linear-gradient(135deg, #1c1917 0%, #44403c 100%); padding: 40px 24px; text-align: center;">
        <h1 style="font-size: 28px; font-weight: 300; margin: 0; color: white; letter-spacing: -0.5px;">${photographerName}</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">Photography Services</p>
      </div>
      
      <!-- Main content -->
      <div style="padding: 32px 24px; background: white;">
        <p style="margin: 0 0 24px; font-size: 18px;">Hi ${clientName},</p>
        
        <p style="margin: 0 0 24px; color: #44403c;">
          We're excited to work with you! Your photography contract is ready for review and signature.
        </p>
        
        <!-- Event Details Card -->
        <div style="background: #fafaf9; border-radius: 0; padding: 24px; margin-bottom: 24px; border: 1px solid #1c1917;">
          <p style="margin: 0 0 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #78716c; font-weight: 600;">Your ${eventTypeCapitalized}</p>
          
          ${eventDateFormatted ? `
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <div style="width: 20px; height: 20px; margin-right: 12px; flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                  <rect x="3" y="4" width="18" height="18" rx="0" ry="0"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <p style="margin: 0; font-weight: 600; font-size: 15px; color: #1c1917;">${eventDateFormatted}</p>
                ${daysUntilEvent && daysUntilEvent > 0 ? `<p style="margin: 4px 0 0; font-size: 13px; color: #78716c;">${daysUntilEvent} days away</p>` : ''}
              </div>
            </div>
          ` : ''}
          
          ${eventVenue ? `
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <div style="width: 20px; height: 20px; margin-right: 12px; flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div>
                <p style="margin: 0; font-weight: 500; color: #1c1917;">${eventVenue}</p>
                ${eventLocation ? `<p style="margin: 4px 0 0; font-size: 13px; color: #78716c;">${eventLocation}</p>` : ''}
              </div>
            </div>
          ` : eventLocation ? `
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <div style="width: 20px; height: 20px; margin-right: 12px; flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <p style="margin: 0; font-weight: 500; color: #1c1917;">${eventLocation}</p>
            </div>
          ` : ''}
          
          ${packageName ? `
            <div style="display: flex; align-items: flex-start;">
              <div style="width: 20px; height: 20px; margin-right: 12px; flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                  <rect x="3" y="3" width="18" height="18" rx="0" ry="0"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <div>
                <p style="margin: 0; font-weight: 500; color: #1c1917;">${packageName}</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #78716c;">
                  ${packageHours ? `${packageHours} hours of coverage` : ''}
                  ${packageHours && priceFormatted ? ' · ' : ''}
                  ${priceFormatted ? priceFormatted : ''}
                </p>
              </div>
            </div>
          ` : ''}
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${portalUrl}" style="display: inline-block; background: #1c1917; color: white; padding: 16px 32px; border-radius: 0; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.5px;">
            View & Sign Contract →
          </a>
        </div>
        
        <!-- What's Next -->
        <div style="background: #fafaf9; border-radius: 0; padding: 20px; margin-top: 24px; border-left: 2px solid #1c1917;">
          <p style="margin: 0 0 12px; font-weight: 600; color: #1c1917; font-size: 14px;">What happens next?</p>
          <ol style="margin: 0; padding-left: 20px; color: #44403c; font-size: 14px;">
            <li style="margin-bottom: 6px;">Review your contract details</li>
            <li style="margin-bottom: 6px;">Sign electronically</li>
            <li>We'll be in touch to plan the details</li>
          </ol>
        </div>
        
        <p style="font-size: 14px; color: #78716c; margin-top: 24px; text-align: center;">
          Questions? Just reply to this email.
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

  const text = `
Hi ${clientName}!

We're so excited to work with you! Your photography contract is ready for review and signature.

YOUR ${eventTypeCapitalized.toUpperCase()}
${eventDateFormatted ? `📅 ${eventDateFormatted}${daysUntilEvent && daysUntilEvent > 0 ? ` (${daysUntilEvent} days away)` : ''}\n` : ''}${eventVenue ? `📍 ${eventVenue}${eventLocation ? `, ${eventLocation}` : ''}\n` : eventLocation ? `📍 ${eventLocation}\n` : ''}${packageName ? `📸 ${packageName}${packageHours ? ` - ${packageHours} hours` : ''}${priceFormatted ? ` - ${priceFormatted}` : ''}\n` : ''}

View & Sign Contract: ${portalUrl}

What happens next?
1. Review your contract details
2. Sign electronically  
3. We'll be in touch to plan the details!

Questions? Reply to this email — we're here to help!

${photographerName}
${photographerEmail}
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

  const subject = `🎉 Contract Signed by ${clientName}`

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
