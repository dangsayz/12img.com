/**
 * Admin API for sending promo emails
 * 
 * POST /api/admin/promo-email
 * 
 * Send promo emails to:
 * - Single email
 * - Multiple emails
 * - All free users
 * - Specific user IDs
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { 
  sendPromoEmail, 
  sendBulkPromoEmails, 
  sendPromoToFreeUsers,
  sendPromoToUsers 
} from '@/server/services/promo-email.service'

// Admin user IDs (add your Clerk user ID here)
const ADMIN_USER_IDS = [
  process.env.ADMIN_USER_ID,
].filter(Boolean)

async function isAdmin(userId: string): Promise<boolean> {
  if (ADMIN_USER_IDS.includes(userId)) return true
  
  // Check database for admin role
  const { data } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('clerk_id', userId)
    .single()
  
  return data?.role === 'admin'
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    if (!await isAdmin(userId)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      mode, // 'single' | 'bulk' | 'free_users' | 'user_ids'
      emails, // For 'bulk' mode: array of { email, name? }
      email, // For 'single' mode
      name, // For 'single' mode
      userIds, // For 'user_ids' mode
      discountCode,
      discountText,
      headline,
      message,
      ctaText,
      ctaUrl,
    } = body

    if (!discountCode || !discountText) {
      return NextResponse.json(
        { error: 'discountCode and discountText are required' },
        { status: 400 }
      )
    }

    const promoData = {
      discountCode,
      discountText,
      headline,
      message,
      ctaText,
      ctaUrl,
    }

    let result

    switch (mode) {
      case 'single':
        if (!email) {
          return NextResponse.json({ error: 'email is required for single mode' }, { status: 400 })
        }
        result = await sendPromoEmail({
          recipientEmail: email,
          recipientName: name,
          ...promoData,
        })
        return NextResponse.json({
          success: result.success,
          sent: result.success ? 1 : 0,
          failed: result.success ? 0 : 1,
          error: result.error,
        })

      case 'bulk':
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
          return NextResponse.json({ error: 'emails array is required for bulk mode' }, { status: 400 })
        }
        result = await sendBulkPromoEmails(emails, promoData)
        return NextResponse.json(result)

      case 'free_users':
        result = await sendPromoToFreeUsers(promoData)
        return NextResponse.json(result)

      case 'user_ids':
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json({ error: 'userIds array is required for user_ids mode' }, { status: 400 })
        }
        result = await sendPromoToUsers(userIds, promoData)
        return NextResponse.json(result)

      default:
        return NextResponse.json({ error: 'Invalid mode. Use: single, bulk, free_users, or user_ids' }, { status: 400 })
    }
  } catch (error) {
    console.error('[PromoEmailAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send promo emails' },
      { status: 500 }
    )
  }
}
