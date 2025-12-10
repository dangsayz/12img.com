import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/server/queries/user.queries'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ galleryId: string }>
}

/**
 * Debug endpoint to diagnose gallery image loading issues.
 * Admin-only access.
 * 
 * Returns:
 * - Gallery metadata
 * - Image count and sample storage paths
 * - Tests signed URL generation for first few images
 * - Tests if images actually exist in storage
 */
export async function GET(request: NextRequest, { params }: Props) {
  try {
    // Auth check - admin only
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const isAdmin = await checkIsAdmin(clerkId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { galleryId } = await params
    
    // 1. Get gallery info
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, title, slug, user_id, is_public, created_at')
      .eq('id', galleryId)
      .single()
    
    if (galleryError || !gallery) {
      return NextResponse.json({ 
        error: 'Gallery not found',
        details: galleryError?.message 
      }, { status: 404 })
    }

    // 2. Get image count and sample images
    const { data: images, error: imagesError, count } = await supabaseAdmin
      .from('images')
      .select('id, storage_path, width, height, file_size_bytes, created_at', { count: 'exact' })
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: true })
      .limit(5)
    
    if (imagesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch images',
        details: imagesError.message 
      }, { status: 500 })
    }

    // 3. Test signed URL generation and storage access for sample images
    const imageTests = await Promise.all((images || []).map(async (img) => {
      const result: {
        id: string
        storagePath: string
        fileSize: number | null
        signedUrlSuccess: boolean
        signedUrl?: string
        signedUrlError?: string
        storageExists: boolean
        storageError?: string
        transformTest?: {
          success: boolean
          error?: string
        }
      } = {
        id: img.id,
        storagePath: img.storage_path,
        fileSize: img.file_size_bytes,
        signedUrlSuccess: false,
        storageExists: false,
      }

      // Test basic signed URL (no transform)
      try {
        const { data: signedData, error: signedError } = await supabaseAdmin.storage
          .from('gallery-images')
          .createSignedUrl(img.storage_path, 60) // 1 minute expiry for test
        
        if (signedError) {
          result.signedUrlError = signedError.message
        } else if (signedData?.signedUrl) {
          result.signedUrlSuccess = true
          result.signedUrl = signedData.signedUrl
        }
      } catch (err) {
        result.signedUrlError = err instanceof Error ? err.message : 'Unknown error'
      }

      // Test if file exists in storage
      try {
        const { data: fileData, error: fileError } = await supabaseAdmin.storage
          .from('gallery-images')
          .list(img.storage_path.split('/').slice(0, -1).join('/'), {
            search: img.storage_path.split('/').pop()
          })
        
        if (fileError) {
          result.storageError = fileError.message
        } else {
          result.storageExists = (fileData?.length || 0) > 0
        }
      } catch (err) {
        result.storageError = err instanceof Error ? err.message : 'Unknown error'
      }

      // Test transformed URL (thumbnail)
      try {
        const { data: transformData, error: transformError } = await supabaseAdmin.storage
          .from('gallery-images')
          .createSignedUrl(img.storage_path, 60, {
            transform: {
              width: 600,
              quality: 80,
              resize: 'contain',
            },
          })
        
        result.transformTest = {
          success: !transformError && !!transformData?.signedUrl,
          error: transformError?.message,
        }
      } catch (err) {
        result.transformTest = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      return result
    }))

    // 4. Check bucket info
    const { data: bucketInfo } = await supabaseAdmin.storage.getBucket('gallery-images')

    return NextResponse.json({
      gallery: {
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
        isPublic: gallery.is_public,
        createdAt: gallery.created_at,
      },
      images: {
        total: count,
        sampleCount: images?.length || 0,
        tests: imageTests,
      },
      bucket: {
        name: bucketInfo?.name,
        public: bucketInfo?.public,
        fileSizeLimit: bucketInfo?.file_size_limit,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
