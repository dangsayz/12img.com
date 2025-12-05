import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET')
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data
    const primaryEmail = email_addresses?.find((e) => e.id === evt.data.primary_email_address_id)

    // Create user record
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: id,
        email: primaryEmail?.email_address || '',
      })
      .select('id')
      .single()

    if (userError) {
      console.error('Failed to create user:', userError)
      return new Response('Failed to create user', { status: 500 })
    }

    // Create default settings
    await supabaseAdmin.from('user_settings').insert({
      user_id: user.id,
      default_password_enabled: false,
      default_download_enabled: true,
    })
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses } = evt.data
    const primaryEmail = email_addresses?.find((e) => e.id === evt.data.primary_email_address_id)

    await supabaseAdmin
      .from('users')
      .update({ email: primaryEmail?.email_address || '' })
      .eq('clerk_id', id)
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    // Delete user (cascades to galleries, images, settings)
    await supabaseAdmin.from('users').delete().eq('clerk_id', id)
  }

  return new Response('OK', { status: 200 })
}
