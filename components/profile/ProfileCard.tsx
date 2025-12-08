'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Image as ImageIcon, Calendar } from 'lucide-react'

// Default showcase image for profiles without uploaded images
const DEFAULT_COVER = '/images/showcase/default-portfolio.jpg'

interface ProfileCardProps {
  profile: {
    id: string
    display_name: string | null
    profile_slug: string
    visibility_mode: string
    created_at: string
    galleryCount: number
    coverImageUrl: string | null
  }
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const [imageError, setImageError] = useState(false)
  
  // Use actual cover image, or fallback to default showcase image
  const imageUrl = (!profile.coverImageUrl || imageError) ? DEFAULT_COVER : profile.coverImageUrl

  return (
    <Link
      href={`/profile/${profile.profile_slug}`}
      className="group block overflow-hidden"
    >
      {/* Tall Cover Image */}
      <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
        <Image
          src={imageUrl}
          alt={profile.display_name || 'Photographer'}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={imageUrl !== DEFAULT_COVER}
          onError={() => setImageError(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        
        {/* Visibility Badge */}
        {profile.visibility_mode === 'PUBLIC_LOCKED' && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-stone-800/80 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" />
            PIN
          </div>
        )}
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-lg font-medium text-white mb-1">
            {profile.display_name || 'Photographer'}
          </h3>
          
          <div className="flex items-center gap-3 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              {profile.galleryCount} {profile.galleryCount === 1 ? 'gallery' : 'galleries'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
