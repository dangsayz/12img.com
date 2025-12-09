'use client'

import { useState } from 'react'
import { Download, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ImageDownloadButtonProps {
  imageId: string
  variant?: 'icon' | 'button'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  dark?: boolean
}

export function ImageDownloadButton({
  imageId,
  variant = 'icon',
  size = 'sm',
  className,
  dark = false,
}: ImageDownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done'>('idle')

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (status === 'downloading') return
    
    setStatus('downloading')
    
    try {
      // Detect if mobile (iOS Safari doesn't support blob downloads)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        // Mobile: Open in new tab - user can long-press to save
        // This triggers the native "Save Image" option on iOS/Android
        window.open(`/api/image/${imageId}/download`, '_blank')
        setStatus('done')
        setTimeout(() => setStatus('idle'), 2000)
        return
      }
      
      // Desktop: Use blob download for better filename control
      const response = await fetch(`/api/image/${imageId}/download`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'photo.jpg'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      console.error('Download error:', err)
      setStatus('idle')
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={status === 'downloading'}
        className={cn(
          'rounded-full flex items-center justify-center transition-all',
          sizeClasses[size],
          dark
            ? 'bg-black/40 backdrop-blur-sm text-white hover:bg-black/60'
            : 'bg-white shadow-md text-stone-700 hover:bg-stone-50 hover:scale-105',
          status === 'done' && (dark ? 'bg-emerald-500/80' : 'bg-emerald-500 text-white'),
          className
        )}
        title="Download photo"
      >
        {status === 'downloading' ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : status === 'done' ? (
          <Check className={iconSizes[size]} />
        ) : (
          <Download className={iconSizes[size]} />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'downloading'}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full transition-all font-medium text-sm',
        dark
          ? 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
          : 'bg-stone-900 text-white hover:bg-stone-800',
        status === 'done' && 'bg-emerald-500',
        className
      )}
    >
      {status === 'downloading' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Downloading...
        </>
      ) : status === 'done' ? (
        <>
          <Check className="w-4 h-4" />
          Downloaded
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download
        </>
      )}
    </button>
  )
}

// Dark variant for fullscreen viewers
export function ImageDownloadButtonDark(props: Omit<ImageDownloadButtonProps, 'dark'>) {
  return <ImageDownloadButton {...props} dark />
}
