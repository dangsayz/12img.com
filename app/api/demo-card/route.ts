import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

// Route segment config
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const BUCKET = 'demo-cards'
const MAX_SIZE = 50 * 1024 * 1024 // 50MB max

// Rate limiting: 5 cards per IP per hour
const RATE_LIMIT = 5
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour
const uploadCounts = new Map<string, { count: number; resetAt: number }>()

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

// GET: Get a signed upload URL (bypasses Vercel body size limit)
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many cards created. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename') || 'image.jpg'
    const contentType = searchParams.get('contentType') || 'image/jpeg'
    const fileSize = parseInt(searchParams.get('fileSize') || '0', 10)

    // Validate file size
    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP' },
        { status: 400 }
      )
    }

    // Generate unique ID and path
    const id = nanoid(12)
    const ext = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]
    const storagePath = `${id}.${ext}`

    // Create signed upload URL (valid for 5 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error) {
      console.error('[DemoCard] Signed URL error:', error)
      return NextResponse.json(
        { error: 'Failed to prepare upload. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id,
      storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
    })
  } catch (error) {
    console.error('[DemoCard] GET error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// POST: Confirm upload and create database record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, storagePath, filename, fileSize, contentType } = body

    if (!id || !storagePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the file exists in storage
    const { data: fileData, error: checkError } = await supabaseAdmin.storage
      .from(BUCKET)
      .list('', { search: storagePath })

    const fileExists = fileData?.some(f => f.name === storagePath)
    if (checkError || !fileExists) {
      return NextResponse.json(
        { error: 'Upload not found. Please try again.' },
        { status: 400 }
      )
    }

    // Create database record
    const { data: card, error: dbError } = await supabaseAdmin
      .from('demo_cards')
      .insert({
        id,
        storage_path: storagePath,
        original_filename: filename || 'image.jpg',
        file_size: fileSize || 0,
        mime_type: contentType || 'image/jpeg',
        title: null,
        subtitle: null,
        photographer_name: null,
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
    console.error('[DemoCard] POST error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
