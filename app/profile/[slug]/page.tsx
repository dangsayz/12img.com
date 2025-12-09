import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getPublicProfileBySlug } from '@/server/actions/profile.actions'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { ProfilePageClient } from './ProfilePageClient'
import { ProfileUnavailable } from './not-found'
import { PersonJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'

interface ProfilePageProps {
  params: Promise<{ slug: string }>
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicProfileBySlug(slug)
  
  if (!result || 'redirect' in result || 'status' in result) {
    return {
      title: 'Profile Not Found',
    }
  }

  const profile = result
  const photographerName = profile.display_name || 'Photographer'
  const galleryCount = profile.galleries?.length || 0
  
  // Get signed URL for OG image (longer expiry for crawlers)
  let ogImageUrl: string | undefined
  if (profile.portfolioImages?.[0]?.storage_path) {
    const urlMap = await getSignedUrlsBatch([profile.portfolioImages[0].storage_path], 86400, 'PREVIEW')
    ogImageUrl = urlMap.get(profile.portfolioImages[0].storage_path)
  }

  // SEO-optimized description
  const description = profile.bio 
    ? profile.bio 
    : `${photographerName}'s photography portfolio — ${galleryCount} ${galleryCount === 1 ? 'gallery' : 'galleries'}`

  return {
    title: `${photographerName} — Photography Portfolio`,
    description,
    openGraph: {
      title: `${photographerName} — Photography Portfolio`,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${photographerName} — Photography Portfolio`,
      description: `${photographerName}'s portfolio — made by 12img`,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
    alternates: {
      canonical: `${siteUrl}/profile/${slug}`,
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
  
  // Get signed URLs for all images in batch (using PORTFOLIO size for highest quality)
  const signedUrlMap = allPaths.length > 0 
    ? await getSignedUrlsBatch(allPaths, 3600, 'PORTFOLIO')
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

  // Get hero image URL for Person schema
  const heroImageUrl = portfolioImagesWithUrls[0]?.imageUrl || galleriesWithUrls[0]?.coverImageUrl || undefined

  return (
    <>
      {/* Structured Data for SEO */}
      <PersonJsonLd
        name={result.display_name || 'Photographer'}
        url={`${siteUrl}/profile/${slug}`}
        image={heroImageUrl}
        jobTitle="Photographer"
        description={result.bio || undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Photographers', url: `${siteUrl}/profiles` },
          { name: result.display_name || 'Photographer', url: `${siteUrl}/profile/${slug}` },
        ]}
      />
      
      <ProfilePageClient 
        profile={{
          ...result,
          portfolioImages: portfolioImagesWithUrls,
          galleries: galleriesWithUrls,
        }} 
      />
    </>
  )
}
