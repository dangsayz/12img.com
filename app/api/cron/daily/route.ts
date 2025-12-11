import { NextResponse } from 'next/server'

/**
 * Consolidated daily cron job
 * Runs at 6am UTC and handles:
 * 1. Process pending archives
 * 2. Update delivery progress countdown
 * 3. Send contract expiry reminders (3 days and 1 day before)
 * 4. Process expired contracts (notify both parties, archive)
 * 5. Send scheduled workflow emails
 * 6. Contest winner selection and phase transitions
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  const results: Record<string, unknown> = {}

  // Verify cron secret for archive processing
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const hasValidSecret = secret === process.env.CRON_SECRET

  if (!hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Process archives
  try {
    const archiveResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/process-archives?secret=${secret}`,
      { method: 'GET' }
    )
    results.archives = await archiveResponse.json()
  } catch (error) {
    results.archives = { error: String(error) }
  }

  // 2. Update delivery progress
  try {
    const deliveryResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/update-delivery-progress`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${secret}` }
      }
    )
    results.deliveryProgress = await deliveryResponse.json()
  } catch (error) {
    results.deliveryProgress = { error: String(error) }
  }

  // 3. Send contract expiry reminders (3 days and 1 day before expiration)
  try {
    const remindersResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/contract-reminders`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${secret}` }
      }
    )
    results.contractReminders = await remindersResponse.json()
  } catch (error) {
    results.contractReminders = { error: String(error) }
  }

  // 4. Process expired contracts (notify both parties, archive)
  try {
    const expiredResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/contract-expired`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${secret}` }
      }
    )
    results.contractExpired = await expiredResponse.json()
  } catch (error) {
    results.contractExpired = { error: String(error) }
  }

  // 5. Send scheduled workflow emails
  try {
    const workflowsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/send-workflows`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${secret}` }
      }
    )
    results.workflows = await workflowsResponse.json()
  } catch (error) {
    results.workflows = { error: String(error) }
  }

  // 6. Contest winner selection and phase transitions
  try {
    const contestResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/contest-winner`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${secret}` }
      }
    )
    results.contest = await contestResponse.json()
  } catch (error) {
    results.contest = { error: String(error) }
  }

  // 7. Process expired subscription grace periods
  try {
    const subscriptionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/subscription-grace`,
      { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${secret}` }
      }
    )
    results.subscriptionGrace = await subscriptionResponse.json()
  } catch (error) {
    results.subscriptionGrace = { error: String(error) }
  }

  const duration = Date.now() - startTime

  return NextResponse.json({
    success: true,
    duration: `${duration}ms`,
    results,
  })
}
