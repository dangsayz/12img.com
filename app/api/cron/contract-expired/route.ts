import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { 
  sendContractExpiredToClient, 
  sendContractExpiredToPhotographer 
} from '@/server/services/contract-email.service'

/**
 * Cron job to handle expired contracts
 * Should run daily (e.g., via Vercel Cron or external scheduler)
 * 
 * Actions:
 * - Finds contracts that have expired (expires_at < now) and are still in 'sent' or 'viewed' status
 * - Sends notification emails to both client and photographer
 * - Updates contract status to 'archived'
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find contracts that have expired but haven't been processed yet
    // Only contracts in 'sent' or 'viewed' status that have passed their expiration date
    const { data: expiredContracts, error } = await supabaseAdmin
      .from('contracts')
      .select(`
        id,
        expires_at,
        photographer_id,
        client_profiles!contracts_client_id_fkey (
          id,
          first_name,
          partner_first_name,
          email,
          event_type,
          event_date
        )
      `)
      .in('status', ['sent', 'viewed'])
      .not('expires_at', 'is', null)
      .lt('expires_at', now.toISOString())

    if (error) {
      console.error('[contract-expired] Query error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    let notificationsSent = 0
    let contractsArchived = 0
    const errors: string[] = []

    for (const contract of expiredContracts || []) {
      const client = contract.client_profiles as unknown as {
        id: string
        first_name: string
        partner_first_name: string | null
        email: string
        event_type: string
        event_date: string | null
      }

      if (!client) continue

      // Get photographer info
      const { data: photographer } = await supabaseAdmin
        .from('users')
        .select('id, email, display_name')
        .eq('id', contract.photographer_id)
        .single()

      if (!photographer) continue

      // Get photographer settings
      const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('business_name, contact_email')
        .eq('user_id', photographer.id)
        .single()

      const clientName = `${client.first_name}${client.partner_first_name ? ` & ${client.partner_first_name}` : ''}`
      const eventType = client.event_type 
        ? client.event_type.charAt(0).toUpperCase() + client.event_type.slice(1) 
        : 'Photography'
      const photographerName = settings?.business_name || photographer.display_name || 'Your Photographer'
      const photographerEmail = settings?.contact_email || photographer.email

      // Send email to client
      const clientEmailResult = await sendContractExpiredToClient({
        clientEmail: client.email,
        clientName,
        photographerName,
        photographerEmail,
        eventType,
        expiredAt: contract.expires_at!,
      })

      // Send email to photographer
      const photographerEmailResult = await sendContractExpiredToPhotographer({
        photographerEmail,
        photographerName,
        clientName,
        clientEmail: client.email,
        eventType,
        eventDate: client.event_date,
        expiredAt: contract.expires_at!,
        contractId: contract.id,
      })

      if (clientEmailResult.success || photographerEmailResult.success) {
        notificationsSent++
      }

      if (!clientEmailResult.success) {
        errors.push(`Failed to send client email for contract ${contract.id}`)
      }

      if (!photographerEmailResult.success) {
        errors.push(`Failed to send photographer email for contract ${contract.id}`)
      }

      // Archive the contract regardless of email success
      // This prevents re-processing on next cron run
      const { error: updateError } = await supabaseAdmin
        .from('contracts')
        .update({
          status: 'archived',
          archived_at: now.toISOString(),
        })
        .eq('id', contract.id)

      if (updateError) {
        errors.push(`Failed to archive contract ${contract.id}: ${updateError.message}`)
      } else {
        contractsArchived++
      }
    }

    return NextResponse.json({
      success: true,
      expiredContractsFound: expiredContracts?.length || 0,
      notificationsSent,
      contractsArchived,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e) {
    console.error('[contract-expired] Exception:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
