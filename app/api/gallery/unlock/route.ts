import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPassword } from '@/lib/utils/password'

const UNLOCK_TOKEN_SECRET = process.env.GALLERY_TOKEN_SECRET || 'default-secret-change-me'
const UNLOCK_COOKIE_MAX_AGE = 12 * 60 * 60 // 12 hours in seconds

function generateUnlockCookieToken(galleryId: string): string {
  const timestamp = Date.now()
  const nonce = randomBytes(16).toString('hex')
  const payload = `${galleryId}:${timestamp}:${nonce}`
  const signature = createHmac('sha256', UNLOCK_TOKEN_SECRET).update(payload).digest('hex')
  return `${payload}:${signature}`
}

export async function POST(request: NextRequest) {
  try {
    const { galleryId, pin } = await request.json()

    if (!galleryId || !pin) {
      return NextResponse.json(
        { error: 'Gallery ID and PIN are required' },
        { status: 400 }
      )
    }

    // Fetch gallery with lock info
    const { data: gallery } = await supabaseAdmin
      .from('galleries')
      .select('id, is_locked, lock_pin_hash')
      .eq('id', galleryId)
      .single()

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    if (!gallery.is_locked || !gallery.lock_pin_hash) {
      return NextResponse.json(
        { error: 'Gallery is not locked' },
        { status: 400 }
      )
    }

    // Verify PIN
    const isValid = await verifyPassword(pin, gallery.lock_pin_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // Generate unlock token and set cookie
    const token = generateUnlockCookieToken(galleryId)
    
    const cookieStore = await cookies()
    cookieStore.set(`gallery_unlock_${galleryId}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: UNLOCK_COOKIE_MAX_AGE,
      path: '/',
    })

    // Store token hash in database for server-side verification
    await supabaseAdmin
      .from('gallery_unlock_tokens')
      .insert({
        gallery_id: galleryId,
        token_hash: createHmac('sha256', UNLOCK_TOKEN_SECRET).update(token).digest('hex'),
        client_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gallery unlock error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const galleryId = searchParams.get('galleryId')

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get(`gallery_unlock_${galleryId}`)?.value

    if (!token) {
      return NextResponse.json({ unlocked: false })
    }

    // Verify token
    try {
      const parts = token.split(':')
      if (parts.length !== 4) {
        return NextResponse.json({ unlocked: false })
      }

      const [tokenGalleryId, timestamp, nonce, signature] = parts

      // Verify gallery ID matches
      if (tokenGalleryId !== galleryId) {
        return NextResponse.json({ unlocked: false })
      }

      // Verify not expired (12 hours)
      const tokenTime = parseInt(timestamp, 10)
      if (Date.now() - tokenTime > UNLOCK_COOKIE_MAX_AGE * 1000) {
        return NextResponse.json({ unlocked: false })
      }

      // Verify signature
      const payload = `${tokenGalleryId}:${timestamp}:${nonce}`
      const expectedSignature = createHmac('sha256', UNLOCK_TOKEN_SECRET)
        .update(payload)
        .digest('hex')

      if (signature !== expectedSignature) {
        return NextResponse.json({ unlocked: false })
      }

      return NextResponse.json({ unlocked: true })
    } catch {
      return NextResponse.json({ unlocked: false })
    }
  } catch (error) {
    console.error('Gallery unlock check error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
