import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { verifyGalleryOwnership } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ galleryId: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { galleryId } = await params
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getOrCreateUserByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isOwner = await verifyGalleryOwnership(galleryId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '50')

    const allImages = await getGalleryImages(galleryId)
    const paginatedImages = allImages.slice(offset, offset + limit)

    // Generate signed URLs for this batch
    const signedUrls = paginatedImages.length > 0
      ? await getSignedUrlsWithSizes(paginatedImages.map((img) => img.storage_path))
      : new Map()

    const imagesWithUrls = paginatedImages.map((img) => {
      const urls = signedUrls.get(img.storage_path)
      return {
        id: img.id,
        storagePath: img.storage_path,
        thumbnailUrl: urls?.thumbnail || '',
        previewUrl: urls?.preview || '',
        originalUrl: urls?.original || '',
        width: img.width,
        height: img.height,
        originalFilename: img.original_filename,
      }
    })

    return NextResponse.json({
      images: imagesWithUrls,
      total: allImages.length,
      offset,
      limit,
      hasMore: offset + limit < allImages.length,
    })
  } catch (error) {
    console.error('Error fetching gallery images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}
