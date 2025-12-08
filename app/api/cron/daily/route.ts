import { NextResponse } from 'next/server'

/**
 * Consolidated daily cron job
 * Runs at midnight UTC and handles:
 * 1. Process pending archives
 * 2. Update delivery progress countdown
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  const results: Record<string, unknown> = {}

  // Verify cron secret for archive processing
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const hasValidSecret = secret === process.env.CRON_SECRET

  // 1. Process archives (requires secret)
  if (hasValidSecret) {
    try {
      const archiveResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/process-archives?secret=${secret}`,
        { method: 'GET' }
      )
      results.archives = await archiveResponse.json()
    } catch (error) {
      results.archives = { error: String(error) }
    }
  } else {
    results.archives = { skipped: 'No valid secret provided' }
  }

  // 2. Update delivery progress
  try {
    const deliveryResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/update-delivery-progress`,
      { method: 'GET' }
    )
    results.deliveryProgress = await deliveryResponse.json()
  } catch (error) {
    results.deliveryProgress = { error: String(error) }
  }

  const duration = Date.now() - startTime

  return NextResponse.json({
    success: true,
    duration: `${duration}ms`,
    results,
  })
}
