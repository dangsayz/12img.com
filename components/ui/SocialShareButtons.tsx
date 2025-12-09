'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

interface SocialShareButtonsProps {
  /** The image URL to share */
  imageUrl: string
  /** The page URL where the image lives (for SEO backlinks) */
  pageUrl?: string
  /** Description/title for the share */
  description?: string
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names for the container */
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 20,
}

// Pinterest "P" icon
const PinterestIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
)

// Facebook "f" icon
const FacebookIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

// X (Twitter) icon
const XIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

/**
 * Social share buttons for images (Pinterest, Facebook, X)
 * All share URLs include the 12img page URL for SEO backlinks
 */
export function SocialShareButtons({
  imageUrl,
  pageUrl,
  description = '',
  size = 'sm',
  className,
}: SocialShareButtonsProps) {
  const getPageUrl = useCallback(() => {
    return pageUrl || (typeof window !== 'undefined' ? window.location.href : '')
  }, [pageUrl])

  const openShareWindow = useCallback((url: string, name: string) => {
    const width = 600
    const height = 400
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    window.open(
      url,
      name,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )
  }, [])

  const handlePinterestShare = useCallback(() => {
    const url = getPageUrl()
    const pinterestUrl = new URL('https://pinterest.com/pin/create/button/')
    pinterestUrl.searchParams.set('url', url)
    pinterestUrl.searchParams.set('media', imageUrl)
    if (description) {
      pinterestUrl.searchParams.set('description', description)
    }
    openShareWindow(pinterestUrl.toString(), 'pinterest-share')
  }, [imageUrl, description, getPageUrl, openShareWindow])

  const handleFacebookShare = useCallback(() => {
    const url = getPageUrl()
    // Facebook share URL - uses the page URL which has OG tags for the image
    const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php')
    facebookUrl.searchParams.set('u', url)
    openShareWindow(facebookUrl.toString(), 'facebook-share')
  }, [getPageUrl, openShareWindow])

  const handleXShare = useCallback(() => {
    const url = getPageUrl()
    // X (Twitter) share URL with text and URL
    const xUrl = new URL('https://twitter.com/intent/tweet')
    xUrl.searchParams.set('url', url)
    if (description) {
      xUrl.searchParams.set('text', description)
    }
    openShareWindow(xUrl.toString(), 'x-share')
  }, [description, getPageUrl, openShareWindow])

  const buttonClass = cn(
    sizeClasses[size],
    'flex items-center justify-center rounded-full',
    'bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-200',
    'hover:scale-110 active:scale-95'
  )

  return (
    <div className={cn('flex gap-1.5', className)}>
      {/* Pinterest */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handlePinterestShare()
        }}
        className={cn(buttonClass, 'text-stone-600 hover:bg-[#E60023] hover:text-white')}
        aria-label="Pin to Pinterest"
        title="Pin to Pinterest"
      >
        <PinterestIcon size={iconSizes[size]} />
      </button>

      {/* Facebook */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleFacebookShare()
        }}
        className={cn(buttonClass, 'text-stone-600 hover:bg-[#1877F2] hover:text-white')}
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <FacebookIcon size={iconSizes[size]} />
      </button>

      {/* X (Twitter) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleXShare()
        }}
        className={cn(buttonClass, 'text-stone-600 hover:bg-black hover:text-white')}
        aria-label="Share on X"
        title="Share on X"
      >
        <XIcon size={iconSizes[size]} />
      </button>
    </div>
  )
}

/**
 * Dark theme variant for fullscreen viewers
 */
export function SocialShareButtonsDark({
  imageUrl,
  pageUrl,
  description = '',
  className,
}: Omit<SocialShareButtonsProps, 'size'>) {
  const getPageUrl = useCallback(() => {
    return pageUrl || (typeof window !== 'undefined' ? window.location.href : '')
  }, [pageUrl])

  const openShareWindow = useCallback((url: string, name: string) => {
    const width = 600
    const height = 400
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    window.open(
      url,
      name,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )
  }, [])

  const handlePinterestShare = useCallback(() => {
    const url = getPageUrl()
    const pinterestUrl = new URL('https://pinterest.com/pin/create/button/')
    pinterestUrl.searchParams.set('url', url)
    pinterestUrl.searchParams.set('media', imageUrl)
    if (description) {
      pinterestUrl.searchParams.set('description', description)
    }
    openShareWindow(pinterestUrl.toString(), 'pinterest-share')
  }, [imageUrl, description, getPageUrl, openShareWindow])

  const handleFacebookShare = useCallback(() => {
    const url = getPageUrl()
    const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php')
    facebookUrl.searchParams.set('u', url)
    openShareWindow(facebookUrl.toString(), 'facebook-share')
  }, [getPageUrl, openShareWindow])

  const handleXShare = useCallback(() => {
    const url = getPageUrl()
    const xUrl = new URL('https://twitter.com/intent/tweet')
    xUrl.searchParams.set('url', url)
    if (description) {
      xUrl.searchParams.set('text', description)
    }
    openShareWindow(xUrl.toString(), 'x-share')
  }, [description, getPageUrl, openShareWindow])

  const buttonClass = cn(
    'p-3 rounded-full transition-all duration-200',
    'bg-white/10 backdrop-blur-xl border border-white/10',
    'text-white/70 hover:text-white'
  )

  return (
    <div className={cn('flex gap-2', className)}>
      {/* Pinterest */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handlePinterestShare()
        }}
        className={cn(buttonClass, 'hover:bg-[#E60023]')}
        aria-label="Pin to Pinterest"
        title="Pin to Pinterest"
      >
        <PinterestIcon size={20} />
      </button>

      {/* Facebook */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleFacebookShare()
        }}
        className={cn(buttonClass, 'hover:bg-[#1877F2]')}
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <FacebookIcon size={20} />
      </button>

      {/* X (Twitter) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleXShare()
        }}
        className={cn(buttonClass, 'hover:bg-black')}
        aria-label="Share on X"
        title="Share on X"
      >
        <XIcon size={20} />
      </button>
    </div>
  )
}
