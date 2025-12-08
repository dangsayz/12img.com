
'use client'

import React, { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { EditorialImage as IEditorialImage } from '@/lib/editorial/types'
import { PinterestShareButton } from '@/components/ui/PinterestShareButton'

interface Props {
  image: IEditorialImage
  priority?: boolean
  className?: string
  fit?: 'cover' | 'contain'
  galleryTitle?: string
}

export function EditorialImage({ image, priority = false, className, fit = 'cover', galleryTitle }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Use proxy URL if available for SEO-friendly downloads
  // The proxy URL serves images from our domain with Content-Disposition header
  const downloadUrl = image.proxyUrl || image.url
  const downloadFilename = image.seoFilename || '12img-photo.jpg'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={isInView ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative overflow-hidden bg-neutral-100 w-full h-full group", className)}
    >
      {hasError ? (
         <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
           <span className="text-neutral-300 text-sm font-sans tracking-widest uppercase">Image Unavailable</span>
         </div>
      ) : (
        <>
          {/* Wrap in anchor for SEO-friendly right-click save */}
          <a 
            href={downloadUrl}
            download={downloadFilename}
            onClick={(e) => e.preventDefault()} // Prevent navigation on click
            className="block w-full h-full"
            draggable={false}
          >
            <img
              src={image.url}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={cn(
                "w-full h-full transition-transform duration-[2s]",
                fit === 'cover' ? 'object-cover' : 'object-contain',
                isInView ? 'scale-100' : 'scale-105' // Subtle zoom out effect
              )}
              draggable={false}
            />
          </a>
          
          {/* Film Grain */}
          <div 
            className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '100px 100px',
            }}
          />
          
          {/* Subtle Vignette */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/5 pointer-events-none" />
          
          {/* Pinterest share on hover */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <PinterestShareButton
              imageUrl={image.url}
              description={galleryTitle ? `${galleryTitle} | 12img` : '12img'}
              variant="icon"
              size="sm"
            />
          </div>
        </>
      )}
    </motion.div>
  )
}
