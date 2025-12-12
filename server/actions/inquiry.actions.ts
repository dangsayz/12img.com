'use server'

/**
 * Contact Inquiry Actions
 * 
 * Server actions for handling public contact form submissions.
 * Allows visitors to reach out to photographers from their public profile.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || '')

// ============================================
// TYPES
// ============================================

export interface ContactInquiry {
  id: string
  photographerId: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  eventType: string | null
  eventDate: string | null
  status: 'new' | 'read' | 'replied' | 'archived'
  readAt: string | null
  repliedAt: string | null
  createdAt: string
}

// ============================================
// VALIDATION
// ============================================

const submitInquirySchema = z.object({
  photographerId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  eventType: z.string().max(50).optional(),
  eventDate: z.string().optional(),
  // Anti-spam fields
  honeypot: z.string().max(0, 'Invalid submission').optional(), // Must be empty
  formLoadedAt: z.number().optional(), // Timestamp when form was loaded
})

// ============================================
// RATE LIMITING (Simple in-memory)
// ============================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5 // Max 5 submissions per hour per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  record.count++
  return true
}

// ============================================
// SUBMIT INQUIRY (Public)
// ============================================

export async function submitContactInquiry(
  input: z.infer<typeof submitInquirySchema>
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = submitInquirySchema.safeParse(input)
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    return { success: false, error: firstError.message }
  }

  const { photographerId, name, email, phone, subject, message, eventType, eventDate, honeypot, formLoadedAt } = validation.data

  // ============================================
  // SPAM DETECTION
  // ============================================
  
  // Honeypot check - bots fill hidden fields
  if (honeypot && honeypot.length > 0) {
    console.log('[submitContactInquiry] Honeypot triggered - likely bot')
    // Return success to not tip off bots, but don't actually submit
    return { success: true }
  }

  // Timing check - form submitted too fast (< 3 seconds) = likely bot
  if (formLoadedAt) {
    const submissionTime = Date.now() - formLoadedAt
    if (submissionTime < 3000) {
      console.log('[submitContactInquiry] Form submitted too fast - likely bot')
      return { success: true } // Silent fail for bots
    }
  }

  try {
    // Get request metadata
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               'unknown'
    const userAgent = headersList.get('user-agent') || null

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return { success: false, error: 'Too many requests. Please try again later.' }
    }

    // Verify photographer exists and has public profile
    const { data: photographer } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, visibility_mode')
      .eq('id', photographerId)
      .in('visibility_mode', ['PUBLIC', 'PUBLIC_LOCKED'])
      .single()

    if (!photographer) {
      return { success: false, error: 'Photographer not found' }
    }

    // Insert inquiry
    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from('contact_inquiries')
      .insert({
        photographer_id: photographerId,
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        event_type: eventType || null,
        event_date: eventDate || null,
        status: 'new',
        source: 'profile',
        ip_address: ip !== 'unknown' ? ip : null,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[submitContactInquiry] Insert error:', insertError)
      return { success: false, error: 'Failed to submit inquiry' }
    }

    // Send email notification to photographer
    try {
      await sendInquiryNotification({
        photographerEmail: photographer.email,
        photographerName: photographer.display_name || 'Photographer',
        senderName: name,
        senderEmail: email,
        subject: subject || 'New Inquiry',
        message,
        eventType,
        eventDate,
      })
    } catch (emailError) {
      // Don't fail the submission if email fails
      console.error('[submitContactInquiry] Email notification failed:', emailError)
    }

    return { success: true }
  } catch (e) {
    console.error('[submitContactInquiry] Exception:', e)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// ============================================
// GET INQUIRIES (Photographer)
// ============================================

export async function getInquiries(options?: {
  status?: 'new' | 'read' | 'replied' | 'archived'
  limit?: number
  offset?: number
}): Promise<{ data?: ContactInquiry[]; total?: number; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { error: 'Unauthorized' }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { error: 'User not found' }
  }

  const { status, limit = 50, offset = 0 } = options || {}

  try {
    let query = supabaseAdmin
      .from('contact_inquiries')
      .select('*', { count: 'exact' })
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[getInquiries] Error:', error)
      return { error: 'Failed to fetch inquiries' }
    }

    const inquiries: ContactInquiry[] = (data || []).map(row => ({
      id: row.id,
      photographerId: row.photographer_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      eventType: row.event_type,
      eventDate: row.event_date,
      status: row.status,
      readAt: row.read_at,
      repliedAt: row.replied_at,
      createdAt: row.created_at,
    }))

    return { data: inquiries, total: count || 0 }
  } catch (e) {
    console.error('[getInquiries] Exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}

// ============================================
// MARK INQUIRY READ
// ============================================

export async function markInquiryRead(inquiryId: string): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { success: false, error: 'Unauthorized' }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  try {
    const { error } = await supabaseAdmin
      .from('contact_inquiries')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', inquiryId)
      .eq('photographer_id', user.id)
      .eq('status', 'new')

    if (error) {
      console.error('[markInquiryRead] Error:', error)
      return { success: false, error: 'Failed to update inquiry' }
    }

    return { success: true }
  } catch (e) {
    console.error('[markInquiryRead] Exception:', e)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// ============================================
// GET UNREAD COUNT
// ============================================

export async function getUnreadInquiryCount(): Promise<{ count: number; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { count: 0, error: 'Unauthorized' }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { count: 0, error: 'User not found' }
  }

  try {
    const { count, error } = await supabaseAdmin
      .from('contact_inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', user.id)
      .eq('status', 'new')

    if (error) {
      console.error('[getUnreadInquiryCount] Error:', error)
      return { count: 0, error: 'Failed to fetch count' }
    }

    return { count: count || 0 }
  } catch (e) {
    console.error('[getUnreadInquiryCount] Exception:', e)
    return { count: 0, error: 'An unexpected error occurred' }
  }
}

// ============================================
// EMAIL NOTIFICATION
// ============================================

interface InquiryNotificationData {
  photographerEmail: string
  photographerName: string
  senderName: string
  senderEmail: string
  subject: string
  message: string
  eventType?: string
  eventDate?: string
}

async function sendInquiryNotification(data: InquiryNotificationData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[sendInquiryNotification] Email not configured, skipping')
    return
  }

  const { photographerEmail, photographerName, senderName, senderEmail, subject, message, eventType, eventDate } = data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry from ${senderName}</title>
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
                ✉️ New Inquiry
              </h1>
              <p style="margin: 8px 0 0; color: #a8a29e; font-size: 14px;">
                from your profile page
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
                You received a new inquiry from your profile:
              </p>
              
              <!-- Sender Info -->
              <div style="background-color: #fafaf9; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">From</span><br>
                      <span style="color: #1c1917; font-size: 15px; font-weight: 600;">${senderName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span><br>
                      <a href="mailto:${senderEmail}" style="color: #1c1917; font-size: 15px; text-decoration: none;">${senderEmail}</a>
                    </td>
                  </tr>
                  ${eventType ? `
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Event Type</span><br>
                      <span style="color: #1c1917; font-size: 15px;">${eventType}</span>
                    </td>
                  </tr>
                  ` : ''}
                  ${eventDate ? `
                  <tr>
                    <td>
                      <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Event Date</span><br>
                      <span style="color: #1c1917; font-size: 15px;">${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <!-- Message -->
              <div style="border-left: 4px solid #1c1917; padding: 16px 20px; background-color: #fafaf9; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
                <p style="margin: 0 0 8px; color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
                <p style="margin: 0; color: #44403c; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
              </div>
              
              <!-- Reply Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;">
                      Reply to ${senderName.split(' ')[0]}
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
                This inquiry was submitted through your 12img profile.
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

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@12img.com',
    to: photographerEmail,
    replyTo: senderEmail,
    subject: `✉️ New inquiry from ${senderName}`,
    html,
  })
}
