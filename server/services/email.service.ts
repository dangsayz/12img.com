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
  password?: string  // Actual PIN to include in email if user opts in
  trackingPixelUrl?: string  // For open tracking
  emailLogId?: string  // For link tracking
}

interface ArchiveEmailDataWithTracking extends ArchiveEmailData {
  trackingPixelUrl?: string
  emailLogId?: string
}

type EmailType = 'gallery_invite' | 'archive_ready' | 'reminder' | 'welcome' | 'other'

interface EmailLogEntry {
  id: string
  user_id: string
  gallery_id?: string
  email_type: EmailType
  recipient_email: string
  recipient_name?: string
  subject: string
  resend_message_id?: string
  status: string
}

// Logger
const log = {
  info: (message: string, data?: Record<string, unknown>) => 
    console.log(`[Email] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => 
    console.error(`[Email] ERROR: ${message}`, error, data ? JSON.stringify(data) : ''),
}

/**
 * Check if an email address is suppressed (bounced, complained, etc.)
 * Returns suppression info if suppressed, null if OK to send.
 */
export async function checkEmailSuppression(userId: string, email: string): Promise<{
  suppressed: boolean
  reason?: string
  details?: string
  suppressedAt?: string
} | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_suppression_list')
      .select('reason, details, created_at')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .eq('email', email.toLowerCase())
      .or('expires_at.is.null,expires_at.gt.now()')
      .limit(1)
      .single()
    
    if (error || !data) {
      return null // Not suppressed
    }
    
    return {
      suppressed: true,
      reason: data.reason,
      details: data.details,
      suppressedAt: data.created_at,
    }
  } catch {
    // If table doesn't exist or other error, allow sending
    return null
  }
}

/**
 * Add an email to the suppression list.
 */
export async function addToSuppressionList(
  userId: string,
  email: string,
  reason: 'hard_bounce' | 'spam_complaint' | 'manual' | 'unsubscribe',
  details?: string
): Promise<void> {
  try {
    await supabaseAdmin
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
    
    log.info('Added to suppression list', { userId, email, reason })
  } catch (err) {
    log.error('Failed to add to suppression list', err)
  }
}

/**
 * Remove an email from the suppression list (admin action).
 */
export async function removeFromSuppressionList(
  userId: string,
  email: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('email_suppression_list')
      .delete()
      .eq('user_id', userId)
      .eq('email', email.toLowerCase())
    
    if (error) {
      log.error('Failed to remove from suppression list', error)
      return false
    }
    
    log.info('Removed from suppression list', { userId, email })
    return true
  } catch (err) {
    log.error('Failed to remove from suppression list', err)
    return false
  }
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
 * Get the base URL for tracking endpoints.
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'
}

/**
 * Generate tracking pixel URL for email opens.
 */
function getTrackingPixelUrl(emailLogId: string): string {
  return `${getBaseUrl()}/api/track/open/${emailLogId}`
}

/**
 * Wrap a URL with click tracking.
 */
function getTrackedLinkUrl(emailLogId: string, targetUrl: string): string {
  return `${getBaseUrl()}/api/track/click/${emailLogId}?url=${encodeURIComponent(targetUrl)}`
}

/**
 * Wrap a download URL with download tracking.
 */
function getTrackedDownloadUrl(emailLogId: string, downloadUrl: string): string {
  return `${getBaseUrl()}/api/track/download/${emailLogId}?url=${encodeURIComponent(downloadUrl)}`
}

/**
 * Create an email log entry before sending.
 */
async function createEmailLog(
  userId: string,
  emailType: EmailType,
  recipientEmail: string,
  subject: string,
  options?: {
    galleryId?: string
    recipientName?: string
    metadata?: Record<string, unknown>
  }
): Promise<EmailLogEntry | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_logs')
      .insert({
        user_id: userId,
        gallery_id: options?.galleryId,
        email_type: emailType,
        recipient_email: recipientEmail,
        recipient_name: options?.recipientName,
        subject,
        status: 'pending',
        metadata: options?.metadata || {},
      })
      .select()
      .single()

    if (error) {
      log.error('Failed to create email log', error)
      return null
    }

    return data as EmailLogEntry
  } catch (err) {
    log.error('Error creating email log', err)
    return null
  }
}

/**
 * Update email log after sending.
 */
async function updateEmailLog(
  emailLogId: string,
  updates: {
    status?: string
    resend_message_id?: string
    error_message?: string
  }
): Promise<void> {
  try {
    await supabaseAdmin
      .from('email_logs')
      .update(updates)
      .eq('id', emailLogId)
  } catch (err) {
    log.error('Error updating email log', err)
  }
}

/**
 * Add tracking pixel to HTML email.
 */
function addTrackingPixel(html: string, trackingPixelUrl: string): string {
  // Insert tracking pixel before closing body tag
  const pixelHtml = `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`
  return html.replace('</body>', `${pixelHtml}</body>`)
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
              
              <!-- Client Account CTA -->
              <div style="margin: 32px 0 0; padding: 24px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #18181b;">
                  Never lose access to your photos
                </p>
                <p style="margin: 0 0 16px; font-size: 14px; color: #71717a; line-height: 1.6;">
                  Create a free 12img account to save your galleries, organize your favorites, and access your memories anytime — on any device.
                </p>
                <a href="https://12img.com/sign-up?ref=archive" 
                   style="display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #18181b; font-size: 14px; font-weight: 500; text-decoration: none; border: 1px solid #e5e7eb; border-radius: 6px;">
                  Create Free Account →
                </a>
              </div>
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
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right: 8px;">
                          <span style="font-size: 12px; color: #a1a1aa;">Delivered with</span>
                        </td>
                        <td style="width: 20px; height: 20px; background-color: #18181b; border-radius: 50%; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 7px; font-weight: 700;">12</span>
                        </td>
                        <td style="padding-left: 4px;">
                          <span style="font-size: 12px; font-weight: 600; color: #737373;">img</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
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

Never lose access to your photos.

Create a free 12img account to save your galleries, organize your favorites, and access your memories anytime — on any device.

Create your free account: 12img.com/sign-up

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
    const rawDownloadUrl = await getArchiveDownloadUrl(
      archive.storage_path,
      SIGNED_URL_EXPIRY.ARCHIVE_EMAIL
    )

    // Get photographer info
    const { data: photographer } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', gallery.user_id)
      .single()

    const subject = `Your Gallery "${gallery.title}" is Ready for Download`
    
    // Create email log for tracking
    const emailLog = await createEmailLog(
      gallery.user_id,
      'archive_ready',
      recipientEmail,
      subject,
      { 
        galleryId: gallery.id,
        recipientName,
        metadata: { archiveId: archive.id }
      }
    )

    // Wrap download URL with tracking if we have a log
    const downloadUrl = emailLog 
      ? getTrackedDownloadUrl(emailLog.id, rawDownloadUrl)
      : rawDownloadUrl

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

    // Generate HTML and add tracking pixel
    let html = generateArchiveEmailHtml(emailData)
    if (emailLog) {
      html = addTrackingPixel(html, getTrackingPixelUrl(emailLog.id))
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || '12img <noreply@12img.com>',
      to: recipientEmail,
      subject,
      html,
      text: generateArchiveEmailText(emailData),
      tags: [
        { name: 'type', value: 'archive-notification' },
        { name: 'gallery_id', value: gallery.id },
        { name: 'archive_id', value: archive.id },
      ],
    })

    if (error) {
      log.error('Failed to send email via Resend', error)
      // Update email log with failure
      if (emailLog) {
        await updateEmailLog(emailLog.id, { status: 'failed', error_message: error.message })
      }
      return { success: false, error: error.message }
    }

    // Update email log with success
    if (emailLog) {
      await updateEmailLog(emailLog.id, { status: 'sent', resend_message_id: data?.id })
    }

    // Update archive record with email sent info
    await updateArchiveRecord(archive.id, {
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      email_recipient: recipientEmail,
    })

    log.info('Email sent successfully', { 
      messageId: data?.id, 
      recipient: recipientEmail,
      emailLogId: emailLog?.id
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

  // Add owner if requested AND they have archive notifications enabled
  if (notifyOwner) {
    // Check owner's notification preferences
    const { data: ownerSettings } = await supabaseAdmin
      .from('user_settings')
      .select('notify_archive_ready')
      .eq('user_id', gallery.user_id)
      .single()
    
    // Only notify owner if they haven't disabled archive notifications (default true)
    const shouldNotifyOwner = ownerSettings?.notify_archive_ready !== false
    
    if (shouldNotifyOwner) {
      const { data: owner } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', gallery.user_id)
        .single()
      
      if (owner && !recipients.find(r => r.email === owner.email)) {
        recipients.push({ email: owner.email })
      }
    } else {
      log.info('Owner has archive notifications disabled', { userId: gallery.user_id })
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
 * Warm, personal, elegant design matching 12img brand.
 */
function generateGalleryInviteEmailHtml(data: GalleryInviteEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.galleryTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #fafafa; line-height: 1.7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 48px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width: 32px; height: 32px; background-color: #18181b; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: -0.5px;">12</span>
                  </td>
                  <td style="padding-left: 6px;">
                    <span style="font-size: 18px; font-weight: 700; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">img</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Elegant Divider -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <div style="width: 40px; height: 1px; background-color: #d4d4d4;"></div>
            </td>
          </tr>
          
          <!-- Main Title -->
          <tr>
            <td align="center" style="padding-bottom: 16px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 400; color: #18181b; font-family: 'Georgia', serif; letter-spacing: -0.5px;">
                ${data.galleryTitle}
              </h1>
            </td>
          </tr>
          
          <!-- Ready Message -->
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <p style="margin: 0; font-size: 18px; color: #525252; font-family: 'Georgia', serif;">
                is now ready for you
              </p>
            </td>
          </tr>
          
          <!-- Image Count -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <p style="margin: 0; font-size: 14px; color: #737373; text-transform: uppercase; letter-spacing: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                ${data.imageCount} images
              </p>
            </td>
          </tr>
          
          ${data.photographerName ? `
          <!-- Thank You Message -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 16px; color: #525252; line-height: 1.8;">
                Thank you for trusting <strong style="color: #18181b;">${data.photographerName}</strong> to capture these moments.
              </p>
            </td>
          </tr>
          ` : ''}
          
          ${data.personalMessage ? `
          <!-- Personal Message -->
          <tr>
            <td align="center" style="padding: 0 20px 40px;">
              <p style="margin: 0; font-size: 17px; color: #525252; font-style: italic; line-height: 1.8;">
                "${data.personalMessage}"
              </p>
            </td>
          </tr>
          ` : ''}
          
          <!-- View Gallery Button -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <a href="${data.galleryUrl}" 
                 style="display: inline-block; padding: 16px 48px; background-color: #18181b; color: #ffffff; font-size: 13px; font-weight: 500; text-decoration: none; text-transform: uppercase; letter-spacing: 1.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                View Your Gallery
              </a>
            </td>
          </tr>
          
          ${data.hasPassword ? `
          <!-- PIN Notice -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px 24px;">
                    <p style="margin: 0; font-size: 13px; color: #525252; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      ${data.password 
                        ? `PIN: <strong style="font-family: 'SF Mono', Monaco, monospace; letter-spacing: 3px; color: #18181b; font-size: 16px;">${data.password}</strong>` 
                        : 'This gallery is protected. PIN will be shared separately.'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Elegant Divider -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="width: 40px; height: 1px; background-color: #d4d4d4;"></div>
            </td>
          </tr>
          
          <!-- Client Account CTA -->
          <tr>
            <td align="center" style="padding: 0 20px 32px;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #525252; line-height: 1.7;">
                <strong style="color: #18181b;">Want to keep these memories safe?</strong>
              </p>
              <p style="margin: 0; font-size: 14px; color: #737373; line-height: 1.7;">
                Create a free account to save your gallery, mark your favorites, and access your photos anytime — on any device.
              </p>
              <p style="margin: 12px 0 0;">
                <a href="https://12img.com/sign-up?ref=gallery" style="color: #18181b; font-size: 14px; font-weight: 500; text-decoration: underline;">Create your free account →</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 8px;">
                    <span style="font-size: 12px; color: #a3a3a3;">Delivered with</span>
                  </td>
                  <td style="width: 20px; height: 20px; background-color: #18181b; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 7px; font-weight: 700;">12</span>
                  </td>
                  <td style="padding-left: 4px;">
                    <span style="font-size: 12px; font-weight: 600; color: #737373;">img</span>
                  </td>
                </tr>
              </table>
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
${data.galleryTitle} is now ready for you

${data.imageCount} images waiting to be explored.

${data.photographerName ? `Thank you for trusting ${data.photographerName} to capture these moments.\n` : ''}
${data.personalMessage ? `"${data.personalMessage}"\n` : ''}
View your gallery:
${data.galleryUrl}

${data.hasPassword ? `This gallery is protected.${data.password ? ` Your PIN: ${data.password}` : ' The PIN will be shared separately.'}\n` : ''}
---

Want to keep these memories safe?

Create a free account to save your gallery, mark your favorites, and access your photos anytime — on any device.

Create your free account: 12img.com/sign-up

---
Delivered with 12img
`.trim()
}

/**
 * Send gallery invitation email to a client.
 * Now includes email tracking for opens, clicks, and downloads.
 */
export async function sendGalleryInviteEmail(
  gallery: Gallery,
  recipientEmail: string,
  options: {
    photographerName?: string
    photographerEmail?: string
    personalMessage?: string
    baseUrl: string
    password?: string  // Include PIN in email if provided
    galleryPath?: string  // Custom path for template-based URLs (e.g., /view-grid/[id]?template=mosaic)
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

  // Check if email is suppressed (bounced, complained, etc.)
  const suppression = await checkEmailSuppression(gallery.user_id, recipientEmail)
  if (suppression?.suppressed) {
    log.info('Email suppressed', { 
      recipient: recipientEmail, 
      reason: suppression.reason,
      details: suppression.details 
    })
    return { 
      success: false, 
      error: `Cannot send to ${recipientEmail}: ${suppression.reason === 'hard_bounce' ? 'Email address bounced previously' : suppression.reason === 'spam_complaint' ? 'Recipient marked previous email as spam' : 'Email address is suppressed'}. Contact support to resolve.`
    }
  }

  try {
    // Get image count
    const { count } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', gallery.id)

    const subject = `${gallery.title} is ready for you`
    
    // Create email log for tracking
    const emailLog = await createEmailLog(
      gallery.user_id,
      'gallery_invite',
      recipientEmail,
      subject,
      { galleryId: gallery.id }
    )

    // Build gallery URL - use custom path if provided, otherwise default to view-reel with slug
    const galleryPathToUse = options.galleryPath || `/view-reel/${gallery.slug}`
    const rawGalleryUrl = `${options.baseUrl}${galleryPathToUse}`
    const galleryUrl = emailLog 
      ? getTrackedLinkUrl(emailLog.id, rawGalleryUrl)
      : rawGalleryUrl

    const emailData: GalleryInviteEmailData = {
      galleryTitle: gallery.title,
      galleryUrl,
      imageCount: count ?? 0,
      photographerName: options.photographerName,
      photographerEmail: options.photographerEmail,
      personalMessage: options.personalMessage,
      hasPassword: !!gallery.password_hash,
      password: options.password,
      trackingPixelUrl: emailLog ? getTrackingPixelUrl(emailLog.id) : undefined,
      emailLogId: emailLog?.id,
    }

    // Generate HTML and add tracking pixel
    let html = generateGalleryInviteEmailHtml(emailData)
    if (emailLog) {
      html = addTrackingPixel(html, getTrackingPixelUrl(emailLog.id))
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || '12img <noreply@12img.com>',
      to: recipientEmail,
      subject,
      html,
      text: generateGalleryInviteEmailText(emailData),
      replyTo: options.photographerEmail,
      tags: [
        { name: 'type', value: 'gallery-invite' },
        { name: 'gallery_id', value: gallery.id },
      ],
    })

    if (error) {
      log.error('Failed to send gallery invite via Resend', error)
      // Update email log with failure
      if (emailLog) {
        await updateEmailLog(emailLog.id, { status: 'failed', error_message: error.message })
      }
      // Provide user-friendly error messages
      if (error.message.includes('only send testing emails')) {
        return { success: false, error: 'Email domain not verified. Please verify your domain at resend.com/domains to send to clients.' }
      }
      return { success: false, error: error.message }
    }

    // Update email log with success
    if (emailLog) {
      await updateEmailLog(emailLog.id, { status: 'sent', resend_message_id: data?.id })
    }

    log.info('Gallery invite sent successfully', { 
      messageId: data?.id, 
      recipient: recipientEmail,
      emailLogId: emailLog?.id
    })

    return { success: true, messageId: data?.id }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    log.error('Gallery invite sending failed', err)
    return { success: false, error: errorMessage }
  }
}

// ═══════════════════════════════════════════════════════════════
// VENDOR SHARE EMAIL
// ═══════════════════════════════════════════════════════════════

interface VendorShareEmailData {
  vendorName: string
  vendorEmail: string
  galleryTitle: string
  photographerName: string
  photographerBusiness?: string
  imageCount: number
  accessUrl: string
}

/**
 * Generate ultra-minimalist vendor share email HTML
 */
function generateVendorShareEmailHtml(data: VendorShareEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://12img.com'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gallery Access</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; background: #1c1917; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 14px; font-weight: 700;">12</span>
              </div>
              <p style="margin: 0; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #a8a29e;">
                Gallery Access
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 400; color: #1c1917; text-align: center; font-family: Georgia, serif;">
                ${data.galleryTitle}
              </h1>
              <p style="margin: 0 0 32px; font-size: 14px; color: #78716c; text-align: center;">
                ${data.imageCount} photos by ${data.photographerBusiness || data.photographerName}
              </p>
              
              <!-- Divider -->
              <div style="width: 40px; height: 1px; background: #e7e5e4; margin: 0 auto 32px;"></div>
              
              <!-- Message -->
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.7; color: #44403c; text-align: center;">
                ${data.photographerName} has shared a gallery with you. View and download images for your portfolio.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${data.accessUrl}" style="display: inline-block; padding: 16px 48px; background: #1c1917; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 100px; letter-spacing: 0.02em;">
                      View Gallery
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #fafaf9; border-top: 1px solid #f5f5f4;">
              <p style="margin: 0 0 16px; font-size: 12px; color: #a8a29e; text-align: center;">
                This link is private and unique to you.
              </p>
              <p style="margin: 0; font-size: 12px; color: #78716c; text-align: center; line-height: 1.6;">
                <strong style="color: #44403c;">Build your own portfolio?</strong><br/>
                Create a free 12img account to showcase your work beautifully.
                <br/>
                <a href="https://12img.com/sign-up?ref=vendor" style="color: #1c1917; text-decoration: underline;">Get started free →</a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Logo -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
          <tr>
            <td style="padding: 32px 0; text-align: center;">
              <a href="${baseUrl}" style="font-size: 11px; color: #d6d3d1; text-decoration: none; letter-spacing: 0.1em;">
                12IMG.COM
              </a>
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
function generateVendorShareEmailText(data: VendorShareEmailData): string {
  return `
GALLERY ACCESS
━━━━━━━━━━━━━━

${data.galleryTitle}
${data.imageCount} photos by ${data.photographerBusiness || data.photographerName}

${data.photographerName} has shared a gallery with you.
View and download images for your portfolio.

View Gallery: ${data.accessUrl}

━━━━━━━━━━━━━━
This link is private and unique to you.

---

Build your own portfolio?
Create a free 12img account to showcase your work beautifully.
Get started free: 12img.com/sign-up

━━━━━━━━━━━━━━
12img.com
`.trim()
}

/**
 * Send vendor share notification email
 */
export async function sendVendorShareEmail(
  data: VendorShareEmailData
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    log.info('Email not configured, skipping vendor share email')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const subject = `${data.photographerBusiness || data.photographerName} shared "${data.galleryTitle}" with you`
    const html = generateVendorShareEmailHtml(data)
    const text = generateVendorShareEmailText(data)

    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || '12img <noreply@12img.com>',
      to: data.vendorEmail,
      subject,
      html,
      text,
      tags: [
        { name: 'type', value: 'vendor-share' },
      ],
    })

    if (error) {
      log.error('Failed to send vendor share email', error)
      return { success: false, error: error.message }
    }

    log.info('Vendor share email sent', { 
      messageId: result?.id, 
      recipient: data.vendorEmail,
      gallery: data.galleryTitle
    })

    return { success: true, messageId: result?.id }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    log.error('Vendor share email failed', err)
    return { success: false, error: errorMessage }
  }
}
