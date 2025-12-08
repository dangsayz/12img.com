import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

// Route segment config for App Router
export const maxDuration = 60 // 60 seconds timeout
export const dynamic = 'force-dynamic'

const MAX_SIZE = 25 * 1024 * 1024 // 25MB
const BUCKET = 'quick-share'

// Rate limiting: 10 uploads per IP per hour
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour
const uploadCounts = new Map<string, { count: number; resetAt: number }>()

// Magic bytes for image validation (prevents MIME spoofing)
const IMAGE_SIGNATURES: Record<string, { bytes: number[]; offset: number; ext: string }> = {
  jpeg: { bytes: [0xFF, 0xD8, 0xFF], offset: 0, ext: 'jpg' },
  png: { bytes: [0x89, 0x50, 0x4E, 0x47], offset: 0, ext: 'png' },
  gif: { bytes: [0x47, 0x49, 0x46, 0x38], offset: 0, ext: 'gif' },
  webp: { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8, ext: 'webp' }, // RIFF....WEBP
}

function detectImageType(buffer: Buffer): string | null {
  for (const [type, sig] of Object.entries(IMAGE_SIGNATURES)) {
    const matches = sig.bytes.every((byte, i) => buffer[sig.offset + i] === byte)
    if (matches) return type
  }
  return null
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = uploadCounts.get(ip)
  
  if (!record || now > record.resetAt) {
    uploadCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size first (before reading into memory)
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate actual file type via magic bytes (prevents MIME spoofing)
    const detectedType = detectImageType(buffer)
    if (!detectedType) {
      return NextResponse.json(
        { error: 'Invalid image file. Allowed: JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Generate a short, unique ID
    const id = nanoid(10)
    const ext = IMAGE_SIGNATURES[detectedType].ext
    const fileName = `${id}.${ext}`
    const contentType = detectedType === 'jpeg' ? 'image/jpeg' : `image/${detectedType}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType, // Use detected type, not user-provided
        cacheControl: '604800', // 7 days cache
        upsert: false,
      })

    if (uploadError) {
      console.error('[QuickShare] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Upload failed. Please try again.' },
        { status: 500 }
      )
    }

    // Generate the share URL (branded with 12img.com)
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'}/s/${id}`

    return NextResponse.json({
      success: true,
      id,
      url: shareUrl,
    })
  } catch (error) {
    console.error('[QuickShare] Error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
