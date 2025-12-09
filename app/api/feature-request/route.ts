import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, request: featureRequest } = body

    if (!featureRequest?.trim()) {
      return NextResponse.json(
        { error: 'Feature request is required' },
        { status: 400 }
      )
    }

    // Get IP and user agent for spam prevention
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const { error } = await supabaseAdmin
      .from('feature_requests')
      .insert({
        email: email?.trim() || null,
        request: featureRequest.trim(),
        ip_address: ip,
        user_agent: userAgent,
      })

    if (error) {
      console.error('Error saving feature request:', error)
      return NextResponse.json(
        { error: 'Failed to save feature request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feature request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
