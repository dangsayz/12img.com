import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendContractExpiryReminder } from '@/server/services/contract-email.service'

/**
 * Cron job to send friendly reminders for expiring contracts
 * Should run daily (e.g., via Vercel Cron or external scheduler)
 * 
 * Sends reminders when:
 * - Contract expires in 3 days
 * - Contract expires in 1 day (today)
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Find contracts expiring in 1 day or 3 days that haven't been signed
    const { data: expiringContracts, error } = await supabaseAdmin
      .from('contracts')
      .select(`
        id,
        expires_at,
        client_profiles!contracts_client_id_fkey (
          id,
          first_name,
          partner_first_name,
          email,
          event_type,
          photographer_id
        )
      `)
      .in('status', ['sent', 'viewed'])
      .not('expires_at', 'is', null)
      .gte('expires_at', now.toISOString())
      .lte('expires_at', threeDaysFromNow.toISOString())

    if (error) {
      console.error('[contract-reminders] Query error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    let remindersSent = 0
    const errors: string[] = []

    for (const contract of expiringContracts || []) {
      const client = contract.client_profiles as unknown as {
        id: string
        first_name: string
        partner_first_name: string | null
        email: string
        event_type: string
        photographer_id: string
      }

      if (!client) continue

      const expiresAt = new Date(contract.expires_at!)
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Only send reminders at 3 days and 1 day
      if (daysRemaining !== 1 && daysRemaining !== 3) continue

      // Get photographer info
      const { data: photographer } = await supabaseAdmin
        .from('users')
        .select('id, email, display_name')
        .eq('id', client.photographer_id)
        .single()

      if (!photographer) continue

      // Get photographer settings
      const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('business_name, contact_email')
        .eq('user_id', photographer.id)
        .single()

      // Get portal token for this client
      const { data: token } = await supabaseAdmin
        .from('portal_tokens')
        .select('token')
        .eq('client_id', client.id)
        .eq('photographer_id', photographer.id)
        .gt('expires_at', now.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!token) continue

      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${token.token}/contract`
      const clientName = `${client.first_name}${client.partner_first_name ? ` & ${client.partner_first_name}` : ''}`
      const eventType = client.event_type ? client.event_type.charAt(0).toUpperCase() + client.event_type.slice(1) : 'Photography'

      const result = await sendContractExpiryReminder({
        clientEmail: client.email,
        clientName,
        photographerName: settings?.business_name || photographer.display_name || 'Your Photographer',
        photographerEmail: settings?.contact_email || photographer.email,
        portalUrl,
        eventType,
        expiresAt: contract.expires_at!,
        daysRemaining,
      })

      if (result.success) {
        remindersSent++
      } else {
        errors.push(`Failed to send reminder for contract ${contract.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e) {
    console.error('[contract-reminders] Exception:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
