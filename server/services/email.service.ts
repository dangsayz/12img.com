/**
 * Email Service
 * 
 * Handles email notifications for gallery archives using Resend.
 * Resend is chosen because:
 * - Simple, modern API
 * - TypeScript-first
 * - Generous free tier (3k emails/month)
 * - Great deliverability
 * 
 * Alternative: Could swap to Nodemailer+SMTP if preferred.
 */

import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SIGNED_URL_EXPIRY } from '@/lib/utils/constants'
import { getArchiveDownloadUrl, updateArchiveRecord } from './archive.service'
import type { Tables } from '@/types/database'

// Initialize Resend client
// Falls back gracefully if key not set (for local dev)
const resend = new Resend(process.env.RESEND_API_KEY || '')

// Check if email is properly configured
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0
}

// Types
type GalleryArchive = Tables<'gallery_archives'>
type Gallery = Tables<'galleries'>

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

interface ArchiveEmailData {
  galleryTitle: string
  imageCount: number
  totalSizeFormatted: string
  downloadUrl: string
  expiresInDays: number
  uploadDate: string
  photographerName?: string
  photographerEmail?: string
}

interface GalleryInviteEmailData {
  galleryTitle: string
  galleryUrl: string
  imageCount: number
  photographerName?: string
  photographerEmail?: string
  personalMessage?: string
  hasPassword: boolean
}

// Logger
const log = {
  info: (message: string, data?: Record<string, unknown>) => 
    console.log(`[Email] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => 
    console.error(`[Email] ERROR: ${message}`, error, data ? JSON.stringify(data) : ''),
}

/**
 * Format bytes to human-readable size.
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Generate the HTML email template for archive notifications.
 * Modern, clean design that works across email clients.
 */
function generateArchiveEmailHtml(data: ArchiveEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Gallery Archive is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff;">
                Your Gallery is Ready
              </h1>
              <p style="margin: 0; font-size: 16px; color: #a1a1aa;">
                ${data.galleryTitle}
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; color: #3f3f46;">
                Great news! Your gallery archive has been created and is ready for download. 
                This backup contains all ${data.imageCount} images from your gallery.
              </p>
              
              <!-- Stats Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;">
                <tr>
                  <td width="50%" style="padding: 16px; background-color: #f4f4f5; border-radius: 8px 0 0 8px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">
                      Total Images
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                      ${data.imageCount}
                    </p>
                  </td>
                  <td width="50%" style="padding: 16px; background-color: #f4f4f5; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">
                      Archive Size
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                      ${data.totalSizeFormatted}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Download Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${data.downloadUrl}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #18181b; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">
                      Download Archive
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiry Notice -->
              <p style="margin: 24px 0 0; padding: 16px; background-color: #fef9c3; border-radius: 8px; font-size: 14px; color: #854d0e; text-align: center;">
                ⏰ This download link expires in <strong>${data.expiresInDays} days</strong>. 
                Save it somewhere safe!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f4f4f5; border-top: 1px solid #e4e4e7;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                      <strong>Gallery:</strong> ${data.galleryTitle}
                    </p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                      <strong>Created:</strong> ${data.uploadDate}
                    </p>
                    ${data.photographerName ? `
                    <p style="margin: 0; font-size: 14px; color: #71717a;">
                      <strong>Photographer:</strong> ${data.photographerName}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                Powered by 12img • Your images, beautifully delivered
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
 * Generate plain text version of the email (for clients that don't support HTML).
 */
function generateArchiveEmailText(data: ArchiveEmailData): string {
  return `
Your Gallery Archive is Ready!

Gallery: ${data.galleryTitle}
Images: ${data.imageCount}
Archive Size: ${data.totalSizeFormatted}
Created: ${data.uploadDate}
${data.photographerName ? `Photographer: ${data.photographerName}` : ''}

Download your archive here:
${data.downloadUrl}

⚠️ IMPORTANT: This download link expires in ${data.expiresInDays} days. Please download and save your images before then.

---
Powered by 12img
Your images, beautifully delivered
`.trim()
}

/**
 * Send archive notification email to a recipient.
 * 
 * @param archive - The completed archive record
 * @param gallery - The gallery metadata
 * @param recipientEmail - Email address to send to
 * @param recipientName - Optional name for personalization
 */
export async function sendArchiveNotificationEmail(
  archive: GalleryArchive,
  gallery: Gallery,
  recipientEmail: string,
  recipientName?: string
): Promise<EmailResult> {
  log.info('Sending archive notification', { 
    archiveId: archive.id, 
    galleryId: gallery.id,
    recipient: recipientEmail 
  })

  if (!isEmailConfigured()) {
    log.error('Email not configured - RESEND_API_KEY missing')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // Generate download URL with extended expiry for email
    const downloadUrl = await getArchiveDownloadUrl(
      archive.storage_path,
      SIGNED_URL_EXPIRY.ARCHIVE_EMAIL
    )

    // Get photographer info
    const { data: photographer } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', gallery.user_id)
      .single()

    // Prepare email data
    const emailData: ArchiveEmailData = {
      galleryTitle: gallery.title,
      imageCount: archive.image_count,
      totalSizeFormatted: formatFileSize(archive.file_size_bytes ?? 0),
      downloadUrl,
      expiresInDays: 7,
      uploadDate: new Date(archive.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      photographerEmail: photographer?.email,
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || '12img <noreply@12img.com>',
      to: recipientEmail,
      subject: `Your Gallery "${gallery.title}" is Ready for Download`,
      html: generateArchiveEmailHtml(emailData),
      text: generateArchiveEmailText(emailData),
      tags: [
        { name: 'type', value: 'archive-notification' },
        { name: 'gallery_id', value: gallery.id },
        { name: 'archive_id', value: archive.id },
      ],
    })

    if (error) {
      log.error('Failed to send email via Resend', error)
      return { success: false, error: error.message }
    }

    // Update archive record with email sent info
    await updateArchiveRecord(archive.id, {
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      email_recipient: recipientEmail,
    })

    log.info('Email sent successfully', { 
      messageId: data?.id, 
      recipient: recipientEmail 
    })

    return { success: true, messageId: data?.id }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    log.error('Email sending failed', err)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send archive notifications to all clients associated with a gallery.
 * Also optionally notifies the gallery owner.
 */
export async function sendArchiveNotificationsToClients(
  archiveId: string,
  notifyOwner = true
): Promise<{ sent: number; failed: number }> {
  // Fetch archive with gallery details
  const { data: archive, error: archiveError } = await supabaseAdmin
    .from('gallery_archives')
    .select('*, galleries(*)')
    .eq('id', archiveId)
    .single()

  if (archiveError || !archive) {
    log.error('Failed to fetch archive for email notification', archiveError)
    return { sent: 0, failed: 0 }
  }

  // Type assertion for joined data
  const gallery = archive.galleries as unknown as Gallery
  if (!gallery) {
    log.error('Gallery not found for archive')
    return { sent: 0, failed: 0 }
  }

  // Get all clients for this gallery
  const { data: clients } = await supabaseAdmin
    .from('gallery_clients')
    .select('email, name')
    .eq('gallery_id', gallery.id)
    .eq('notify_on_archive', true)

  const recipients: Array<{ email: string; name?: string }> = []

  // Add clients
  if (clients) {
    recipients.push(...clients.map(c => ({ email: c.email, name: c.name ?? undefined })))
  }

  // Add owner if requested
  if (notifyOwner) {
    const { data: owner } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', gallery.user_id)
      .single()
    
    if (owner && !recipients.find(r => r.email === owner.email)) {
      recipients.push({ email: owner.email })
    }
  }

  if (recipients.length === 0) {
    log.info('No recipients to notify')
    return { sent: 0, failed: 0 }
  }

  // Send emails
  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    const result = await sendArchiveNotificationEmail(
      archive as GalleryArchive,
      gallery,
      recipient.email,
      recipient.name
    )
    
    if (result.success) {
      sent++
    } else {
      failed++
    }
  }

  log.info('Notifications complete', { sent, failed, total: recipients.length })
  return { sent, failed }
}

/**
 * Retry sending email for an archive that failed to send.
 */
export async function retryArchiveEmail(
  archiveId: string,
  recipientEmail: string,
  maxAttempts = 3
): Promise<EmailResult> {
  const { data: archive, error: archiveError } = await supabaseAdmin
    .from('gallery_archives')
    .select('*, galleries(*)')
    .eq('id', archiveId)
    .single()

  if (archiveError || !archive) {
    return { success: false, error: 'Archive not found' }
  }

  const gallery = archive.galleries as unknown as Gallery

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log.info('Retry attempt', { attempt, archiveId, recipient: recipientEmail })
    
    const result = await sendArchiveNotificationEmail(
      archive as GalleryArchive,
      gallery,
      recipientEmail
    )

    if (result.success) {
      return result
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
    }
  }

  return { success: false, error: `Failed after ${maxAttempts} attempts` }
}

// ============================================
// Gallery Invitation Emails
// ============================================

/**
 * Generate HTML email for gallery invitation.
 */
function generateGalleryInviteEmailHtml(data: GalleryInviteEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Gallery is Ready to View</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff;">
                Your Photos Are Ready! 📸
              </h1>
              <p style="margin: 0; font-size: 16px; color: #a1a1aa;">
                ${data.galleryTitle}
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              ${data.photographerName ? `
              <p style="margin: 0 0 24px; font-size: 16px; color: #3f3f46;">
                <strong>${data.photographerName}</strong> has shared a gallery with you containing ${data.imageCount} beautiful images.
              </p>
              ` : `
              <p style="margin: 0 0 24px; font-size: 16px; color: #3f3f46;">
                A gallery with ${data.imageCount} images has been shared with you.
              </p>
              `}
              
              ${data.personalMessage ? `
              <div style="margin: 0 0 24px; padding: 20px; background-color: #f4f4f5; border-radius: 8px; border-left: 4px solid #18181b;">
                <p style="margin: 0; font-size: 15px; color: #3f3f46; font-style: italic;">
                  "${data.personalMessage}"
                </p>
              </div>
              ` : ''}
              
              <!-- View Gallery Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${data.galleryUrl}" 
                       style="display: inline-block; padding: 16px 48px; background-color: #18181b; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      View Gallery
                    </a>
                  </td>
                </tr>
              </table>
              
              ${data.hasPassword ? `
              <p style="margin: 24px 0 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; font-size: 14px; color: #92400e; text-align: center;">
                🔒 This gallery is password protected. The photographer will share the password with you.
              </p>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f4f4f5; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                <strong>Gallery:</strong> ${data.galleryTitle}
              </p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                <strong>Images:</strong> ${data.imageCount}
              </p>
              ${data.photographerEmail ? `
              <p style="margin: 0; font-size: 14px; color: #71717a;">
                <strong>From:</strong> ${data.photographerEmail}
              </p>
              ` : ''}
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                Powered by 12img • Your images, beautifully delivered
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
 * Generate plain text version of the gallery invite email.
 */
function generateGalleryInviteEmailText(data: GalleryInviteEmailData): string {
  return `
Your Photos Are Ready!

Gallery: ${data.galleryTitle}
Images: ${data.imageCount}
${data.photographerName ? `From: ${data.photographerName}` : ''}
${data.photographerEmail ? `Contact: ${data.photographerEmail}` : ''}

${data.personalMessage ? `Message from the photographer:\n"${data.personalMessage}"\n` : ''}
View your gallery here:
${data.galleryUrl}

${data.hasPassword ? '🔒 This gallery is password protected. The photographer will share the password with you.' : ''}

---
Powered by 12img
Your images, beautifully delivered
`.trim()
}

/**
 * Send gallery invitation email to a client.
 */
export async function sendGalleryInviteEmail(
  gallery: Gallery,
  recipientEmail: string,
  options: {
    photographerName?: string
    photographerEmail?: string
    personalMessage?: string
    baseUrl: string
  }
): Promise<EmailResult> {
  log.info('Sending gallery invite', { 
    galleryId: gallery.id,
    recipient: recipientEmail 
  })

  if (!isEmailConfigured()) {
    log.error('Email not configured - RESEND_API_KEY missing')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // Get image count
    const { count } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', gallery.id)

    const galleryUrl = `${options.baseUrl}/g/${gallery.slug}`

    const emailData: GalleryInviteEmailData = {
      galleryTitle: gallery.title,
      galleryUrl,
      imageCount: count ?? 0,
      photographerName: options.photographerName,
      photographerEmail: options.photographerEmail,
      personalMessage: options.personalMessage,
      hasPassword: !!gallery.password_hash,
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || '12img <noreply@12img.com>',
      to: recipientEmail,
      subject: `${options.photographerName || 'Your photographer'} shared "${gallery.title}" with you`,
      html: generateGalleryInviteEmailHtml(emailData),
      text: generateGalleryInviteEmailText(emailData),
      replyTo: options.photographerEmail,
      tags: [
        { name: 'type', value: 'gallery-invite' },
        { name: 'gallery_id', value: gallery.id },
      ],
    })

    if (error) {
      log.error('Failed to send gallery invite via Resend', error)
      return { success: false, error: error.message }
    }

    log.info('Gallery invite sent successfully', { 
      messageId: data?.id, 
      recipient: recipientEmail 
    })

    return { success: true, messageId: data?.id }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    log.error('Gallery invite sending failed', err)
    return { success: false, error: errorMessage }
  }
}
