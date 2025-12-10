'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface PromoShareButtonsProps {
  /** The URL to share */
  shareUrl: string
  /** Custom share message (casual, friend-to-friend style) */
  shareMessage?: string
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional class names */
  className?: string
}

/**
 * Promo/Deal share buttons with casual messaging
 * Includes: Copy link, X/Twitter, Facebook, WhatsApp, iMessage
 * 
 * Usage:
 * ```tsx
 * <PromoShareButtons 
 *   shareUrl="https://12img.com/promo/founder100"
 *   shareMessage="found this thing for creatives, looks kinda insane for the price. thought you'd wanna know 👀"
 * />
 * ```
 */
export function PromoShareButtons({
  shareUrl,
  shareMessage = `found this thing for creatives, looks kinda insane for the price. thought you'd wanna know 👀`,
  size = 'md',
  className,
}: PromoShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const fullMessage = `${shareMessage}\n\n${shareUrl}`

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = fullMessage
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [fullMessage])

  const buttonClass = cn(
    'rounded-full transition-all',
    size === 'sm' ? 'p-2' : 'p-2.5',
    'bg-stone-100 text-stone-500',
  )

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className={cn(buttonClass, 'hover:bg-stone-200 hover:text-stone-700')}
        title="Copy link"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.svg
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={cn(iconSize, 'text-stone-700')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          ) : (
            <motion.svg
              key="link"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={iconSize}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      {/* X/Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonClass, 'hover:bg-stone-900 hover:text-white')}
        title="Share on X"
      >
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonClass, 'hover:bg-[#1877F2] hover:text-white')}
        title="Share on Facebook"
      >
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(fullMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonClass, 'hover:bg-[#25D366] hover:text-white')}
        title="Share on WhatsApp"
      >
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* iMessage/SMS */}
      <a
        href={`sms:?&body=${encodeURIComponent(fullMessage)}`}
        className={cn(buttonClass, 'hover:bg-[#34C759] hover:text-white')}
        title="Share via iMessage"
      >
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
        </svg>
      </a>
    </div>
  )
}
