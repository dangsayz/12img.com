import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getPublicProfileBySlug } from '@/server/actions/profile.actions'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { ProfilePageClient } from './ProfilePageClient'
import { ProfileUnavailable } from './not-found'

interface ProfilePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicProfileBySlug(slug)
  
  if (!result || 'redirect' in result || 'status' in result) {
    return {
      title: 'Profile Not Found',
    }
  }

  const profile = result
  
  // Get signed URL for OG image (longer expiry for crawlers)
  let ogImageUrl: string | undefined
  if (profile.portfolioImages?.[0]?.storage_path) {
    const urlMap = await getSignedUrlsBatch([profile.portfolioImages[0].storage_path], 86400, 'PREVIEW')
    ogImageUrl = urlMap.get(profile.portfolioImages[0].storage_path)
  }

  return {
    title: profile.display_name || 'Photographer Profile',
    description: profile.bio || `View ${profile.display_name || 'this photographer'}'s portfolio on 12img`,
    openGraph: {
      title: profile.display_name || 'Photographer Profile',
      description: profile.bio || `View ${profile.display_name || 'this photographer'}'s portfolio on 12img`,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params
  const { userId } = await auth()
  const result = await getPublicProfileBySlug(slug, userId || undefined)

  // Handle redirect for old slugs
  if (result && 'redirect' in result) {
    redirect(`/profile/${result.redirect}`)
  }

  // Handle unavailable profiles with beautiful fallback
  if (!result || 'status' in result) {
    const reason = result?.status || 'not_found'
    const photographerName = result && 'photographerName' in result ? result.photographerName : undefined
    return <ProfileUnavailable reason={reason} photographerName={photographerName} />
  }

  // Collect all storage paths that need signed URLs
  const portfolioPaths = result.portfolioImages?.map(img => img.storage_path).filter(Boolean) || []
  const galleryCoverPaths = result.galleries
    .map(g => g.coverImagePath)
    .filter((p): p is string => Boolean(p))
  
  const allPaths = [...new Set([...portfolioPaths, ...galleryCoverPaths])]
  
  // Get signed URLs for all images in batch (using PREVIEW size for quality)
  const signedUrlMap = allPaths.length > 0 
    ? await getSignedUrlsBatch(allPaths, 3600, 'PREVIEW')
    : new Map<string, string>()

  // Transform portfolio images with signed URLs
  const portfolioImagesWithUrls = result.portfolioImages?.map(img => ({
    ...img,
    imageUrl: signedUrlMap.get(img.storage_path) || '',
  })) || []

  // Transform galleries with signed cover URLs
  const galleriesWithUrls = result.galleries.map(g => ({
    ...g,
    coverImageUrl: g.coverImagePath ? signedUrlMap.get(g.coverImagePath) || null : null,
  }))

  return (
    <ProfilePageClient 
      profile={{
        ...result,
        portfolioImages: portfolioImagesWithUrls,
        galleries: galleriesWithUrls,
      }} 
    />
  )
}
