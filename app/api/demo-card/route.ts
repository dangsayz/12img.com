import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

// Route segment config
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_SIZE = 25 * 1024 * 1024 // 25MB
const BUCKET = 'demo-cards'

// Rate limiting: 5 cards per IP per hour
const RATE_LIMIT = 5
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour
const uploadCounts = new Map<string, { count: number; resetAt: number }>()

// Magic bytes for image validation
const IMAGE_SIGNATURES: Record<string, { bytes: number[]; offset: number; ext: string }> = {
  jpeg: { bytes: [0xFF, 0xD8, 0xFF], offset: 0, ext: 'jpg' },
  png: { bytes: [0x89, 0x50, 0x4E, 0x47], offset: 0, ext: 'png' },
  webp: { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8, ext: 'webp' },
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
        { error: 'Too many cards created. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const subtitle = formData.get('subtitle') as string | null
    const photographerName = formData.get('photographerName') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate actual file type via magic bytes
    const detectedType = detectImageType(buffer)
    if (!detectedType) {
      return NextResponse.json(
        { error: 'Invalid image file. Allowed: JPG, PNG, WebP' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = nanoid(12)
    const ext = IMAGE_SIGNATURES[detectedType].ext
    const storagePath = `${id}.${ext}`
    const contentType = detectedType === 'jpeg' ? 'image/jpeg' : `image/${detectedType}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        cacheControl: '2592000', // 30 days cache
        upsert: false,
      })

    if (uploadError) {
      console.error('[DemoCard] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Upload failed. Please try again.' },
        { status: 500 }
      )
    }

    // Create database record
    const { data: card, error: dbError } = await supabaseAdmin
      .from('demo_cards')
      .insert({
        id,
        storage_path: storagePath,
        original_filename: file.name,
        file_size: file.size,
        mime_type: contentType,
        title: title?.slice(0, 100) || null,
        subtitle: subtitle?.slice(0, 200) || null,
        photographer_name: photographerName?.slice(0, 100) || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[DemoCard] DB error:', dbError)
      // Clean up uploaded file
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to create card. Please try again.' },
        { status: 500 }
      )
    }

    // Generate the share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'}/card/${id}`

    return NextResponse.json({
      success: true,
      id,
      url: shareUrl,
      card,
    })
  } catch (error) {
    console.error('[DemoCard] Error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
