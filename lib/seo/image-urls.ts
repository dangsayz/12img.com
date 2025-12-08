/**
 * SEO-optimized image URL generation
 * 
 * Generates URLs that result in branded, keyword-rich filenames
 * when users right-click → Save As
 * 
 * IMPORTANT: For SEO filenames to work on "Save As", images must be served
 * from the same origin (our domain). Cross-origin images (like Supabase signed URLs)
 * ignore the download attribute.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'

/**
 * Generate an SEO-friendly image URL
 * 
 * @param galleryId - The gallery UUID
 * @param imageId - The image UUID
 * @param galleryTitle - Gallery title for SEO slug
 * @param position - Image position in gallery
 * @returns SEO-optimized URL like /api/img/{galleryId}/{imageId}/12img-wedding-photo-001.jpg
 */
export function getSeoImageUrl(
  galleryId: string,
  imageId: string,
  galleryTitle: string,
  position: number = 1
): string {
  const slug = slugify(galleryTitle)
  const paddedPosition = String(position).padStart(3, '0')
  const seoFilename = `12img-${slug}-photo-${paddedPosition}.jpg`
  
  return `/api/img/${galleryId}/${imageId}/${seoFilename}`
}

/**
 * Generate absolute SEO image URL (for OG tags, etc.)
 */
export function getAbsoluteSeoImageUrl(
  galleryId: string,
  imageId: string,
  galleryTitle: string,
  position: number = 1
): string {
  return `${siteUrl}${getSeoImageUrl(galleryId, imageId, galleryTitle, position)}`
}

/**
 * Slugify a string for URL-safe usage
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
    .replace(/^-|-$/g, '') || 'gallery'
}

/**
 * Generate SEO alt text for an image
 * 
 * @param galleryTitle - Gallery title
 * @param photographerName - Photographer's name
 * @param position - Image position
 * @returns SEO-optimized alt text
 */
export function getSeoAltText(
  galleryTitle: string,
  photographerName?: string,
  position?: number
): string {
  const parts = [galleryTitle]
  
  if (photographerName) {
    parts.push(`by ${photographerName}`)
  }
  
  if (position) {
    parts.push(`- Photo ${position}`)
  }
  
  parts.push('| 12img')
  
  return parts.join(' ')
}

/**
 * Generate SEO-friendly download filename
 * Used when generating ZIP archives or individual downloads
 */
export function getSeoDownloadFilename(
  galleryTitle: string,
  position: number,
  extension: string = 'jpg'
): string {
  const slug = slugify(galleryTitle)
  const paddedPosition = String(position).padStart(3, '0')
  return `12img-${slug}-photo-${paddedPosition}.${extension}`
}

/**
 * Generate SEO-friendly archive filename
 */
export function getSeoArchiveFilename(galleryTitle: string): string {
  const slug = slugify(galleryTitle)
  const date = new Date().toISOString().split('T')[0]
  return `12img-${slug}-gallery-${date}.zip`
}

/**
 * Generate a proxy URL that serves images with SEO-friendly filenames
 * Use this for public-facing pages where SEO matters
 * 
 * @param galleryId - Gallery UUID
 * @param imageId - Image UUID  
 * @returns URL like /api/img/g/{galleryId}/{imageId}
 */
export function getProxyImageUrl(galleryId: string, imageId: string): string {
  return `/api/img/g/${galleryId}/${imageId}`
}

/**
 * Generate absolute proxy URL
 */
export function getAbsoluteProxyImageUrl(galleryId: string, imageId: string): string {
  return `${siteUrl}/api/img/g/${galleryId}/${imageId}`
}
