'use server'

import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'

export interface EmailLogWithEvents {
  id: string
  email_type: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  status: string
  opened_at: string | null
  opened_count: number
  clicked_at: string | null
  clicked_count: number
  downloaded_at: string | null
  download_count: number
  created_at: string
}

export interface GalleryEmailStats {
  totalEmails: number
  uniqueRecipients: number
  totalOpens: number
  emailsOpened: number
  totalClicks: number
  emailsClicked: number
  totalDownloads: number
  emailsWithDownloads: number
  openRate: number
  clickRate: number
  downloadRate: number
}

/**
 * Get email activity for a specific gallery.
 */
export async function getGalleryEmailActivity(galleryId: string): Promise<{
  emails: EmailLogWithEvents[]
  stats: GalleryEmailStats
  error?: string
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { emails: [], stats: getEmptyStats(), error: 'Unauthorized' }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { emails: [], stats: getEmptyStats(), error: 'User not found' }
  }

  try {
    // Verify gallery ownership
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .eq('user_id', user.id)
      .single()

    if (galleryError || !gallery) {
      return { emails: [], stats: getEmptyStats(), error: 'Gallery not found' }
    }

    // Fetch email logs for this gallery
    const { data: emails, error: emailError } = await supabaseAdmin
      .from('email_logs')
      .select(`
        id,
        email_type,
        recipient_email,
        recipient_name,
        subject,
        status,
        opened_at,
        opened_count,
        clicked_at,
        clicked_count,
        downloaded_at,
        download_count,
        created_at
      `)
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false })

    if (emailError) {
      console.error('[getGalleryEmailActivity] Error:', emailError)
      return { emails: [], stats: getEmptyStats(), error: 'Failed to fetch emails' }
    }

    const emailList = (emails || []) as EmailLogWithEvents[]

    // Calculate stats
    const stats = calculateStats(emailList)

    return { emails: emailList, stats }
  } catch (e) {
    console.error('[getGalleryEmailActivity] Error:', e)
    return { emails: [], stats: getEmptyStats(), error: 'Failed to fetch email activity' }
  }
}

/**
 * Get all email activity for the current user (across all galleries).
 */
export async function getUserEmailActivity(limit = 50): Promise<{
  emails: (EmailLogWithEvents & { gallery_title?: string })[]
  error?: string
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { emails: [], error: 'Unauthorized' }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return { emails: [], error: 'User not found' }
  }

  try {
    const { data: emails, error } = await supabaseAdmin
      .from('email_logs')
      .select(`
        id,
        email_type,
        recipient_email,
        recipient_name,
        subject,
        status,
        opened_at,
        opened_count,
        clicked_at,
        clicked_count,
        downloaded_at,
        download_count,
        created_at,
        galleries (title)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getUserEmailActivity] Error:', error)
      return { emails: [], error: 'Failed to fetch emails' }
    }

    // Transform to include gallery title
    const emailList = (emails || []).map((email: Record<string, unknown>) => ({
      ...email,
      gallery_title: (email.galleries as { title?: string } | null)?.title,
    })) as (EmailLogWithEvents & { gallery_title?: string })[]

    return { emails: emailList }
  } catch (e) {
    console.error('[getUserEmailActivity] Error:', e)
    return { emails: [], error: 'Failed to fetch email activity' }
  }
}

function getEmptyStats(): GalleryEmailStats {
  return {
    totalEmails: 0,
    uniqueRecipients: 0,
    totalOpens: 0,
    emailsOpened: 0,
    totalClicks: 0,
    emailsClicked: 0,
    totalDownloads: 0,
    emailsWithDownloads: 0,
    openRate: 0,
    clickRate: 0,
    downloadRate: 0,
  }
}

function calculateStats(emails: EmailLogWithEvents[]): GalleryEmailStats {
  if (emails.length === 0) return getEmptyStats()

  const uniqueRecipients = new Set(emails.map(e => e.recipient_email)).size
  const totalOpens = emails.reduce((sum, e) => sum + e.opened_count, 0)
  const emailsOpened = emails.filter(e => e.opened_at).length
  const totalClicks = emails.reduce((sum, e) => sum + e.clicked_count, 0)
  const emailsClicked = emails.filter(e => e.clicked_at).length
  const totalDownloads = emails.reduce((sum, e) => sum + e.download_count, 0)
  const emailsWithDownloads = emails.filter(e => e.downloaded_at).length

  return {
    totalEmails: emails.length,
    uniqueRecipients,
    totalOpens,
    emailsOpened,
    totalClicks,
    emailsClicked,
    totalDownloads,
    emailsWithDownloads,
    openRate: emails.length > 0 ? Math.round((emailsOpened / emails.length) * 100) : 0,
    clickRate: emails.length > 0 ? Math.round((emailsClicked / emails.length) * 100) : 0,
    downloadRate: emails.length > 0 ? Math.round((emailsWithDownloads / emails.length) * 100) : 0,
  }
}
