'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

interface PinterestShareButtonProps {
  /** The image URL to pin */
  imageUrl: string
  /** The page URL where the image lives */
  pageUrl?: string
  /** Description for the pin */
  description?: string
  /** Visual variant */
  variant?: 'icon' | 'button' | 'minimal'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
  /** Show label text */
  showLabel?: boolean
}

/**
 * Pinterest share button component
 * Opens Pinterest's share dialog with the image pre-filled
 */
export function PinterestShareButton({
  imageUrl,
  pageUrl,
  description = '',
  variant = 'icon',
  size = 'md',
  className,
  showLabel = false,
}: PinterestShareButtonProps) {
  const handlePinterestShare = useCallback(() => {
    // Use current page URL if not provided
    const url = pageUrl || (typeof window !== 'undefined' ? window.location.href : '')
    
    // Pinterest share URL format
    const pinterestUrl = new URL('https://pinterest.com/pin/create/button/')
    pinterestUrl.searchParams.set('url', url)
    pinterestUrl.searchParams.set('media', imageUrl)
    if (description) {
      pinterestUrl.searchParams.set('description', description)
    }
    
    // Open in popup window (Pinterest's recommended approach)
    const width = 750
    const height = 550
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    
    window.open(
      pinterestUrl.toString(),
      'pinterest-share',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )
  }, [imageUrl, pageUrl, description])

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

  // Pinterest "P" icon (simplified, clean version)
  const PinterestIcon = ({ size: iconSize }: { size: number }) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  )

  if (variant === 'minimal') {
    return (
      <button
        onClick={handlePinterestShare}
        className={cn(
          'text-neutral-400 hover:text-[#E60023] transition-colors duration-200',
          className
        )}
        aria-label="Pin to Pinterest"
        title="Pin to Pinterest"
      >
        <PinterestIcon size={iconSizes[size]} />
      </button>
    )
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handlePinterestShare}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-[#E60023] hover:bg-[#ad081b] text-white',
          'text-sm font-medium transition-all duration-200',
          'hover:scale-105 active:scale-95',
          className
        )}
        aria-label="Pin to Pinterest"
      >
        <PinterestIcon size={iconSizes[size]} />
        {showLabel && <span>Pin it</span>}
      </button>
    )
  }

  // Default: icon variant (for toolbars, hover overlays)
  return (
    <button
      onClick={handlePinterestShare}
      className={cn(
        sizeClasses[size],
        'flex items-center justify-center rounded-full',
        'bg-white/90 hover:bg-[#E60023] text-neutral-600 hover:text-white',
        'backdrop-blur-sm shadow-lg transition-all duration-200',
        'hover:scale-110 active:scale-95',
        className
      )}
      aria-label="Pin to Pinterest"
      title="Pin to Pinterest"
    >
      <PinterestIcon size={iconSizes[size]} />
    </button>
  )
}

/**
 * Pinterest share button styled for fullscreen viewer (dark theme)
 */
export function PinterestShareButtonDark({
  imageUrl,
  pageUrl,
  description,
  className,
}: Omit<PinterestShareButtonProps, 'variant' | 'size'>) {
  const handlePinterestShare = useCallback(() => {
    const url = pageUrl || (typeof window !== 'undefined' ? window.location.href : '')
    
    const pinterestUrl = new URL('https://pinterest.com/pin/create/button/')
    pinterestUrl.searchParams.set('url', url)
    pinterestUrl.searchParams.set('media', imageUrl)
    if (description) {
      pinterestUrl.searchParams.set('description', description)
    }
    
    const width = 750
    const height = 550
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    
    window.open(
      pinterestUrl.toString(),
      'pinterest-share',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )
  }, [imageUrl, pageUrl, description])

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        handlePinterestShare()
      }}
      className={cn(
        'p-3 text-white/70 hover:text-white',
        'bg-white/10 hover:bg-[#E60023] backdrop-blur-xl',
        'rounded-full transition-all duration-200 border border-white/10',
        className
      )}
      aria-label="Pin to Pinterest"
      title="Pin to Pinterest"
    >
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    </button>
  )
}
