'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Image as ImageIcon, Calendar } from 'lucide-react'

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

// Generate a consistent gradient based on profile id
function getGradientColors(id: string): [string, string] {
  const gradients: [string, string][] = [
    ['from-stone-600', 'to-stone-800'],
    ['from-slate-600', 'to-slate-800'],
    ['from-zinc-600', 'to-zinc-800'],
    ['from-neutral-600', 'to-neutral-800'],
    ['from-stone-500', 'to-stone-700'],
    ['from-slate-500', 'to-slate-700'],
  ]
  // Use first char of id to pick a gradient consistently
  const index = id.charCodeAt(0) % gradients.length
  return gradients[index]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const [imageError, setImageError] = useState(false)
  
  const hasImage = profile.coverImageUrl && !imageError
  const [gradientFrom, gradientTo] = getGradientColors(profile.id)

  return (
    <Link
      href={`/profile/${profile.profile_slug}`}
      className="group block overflow-hidden"
    >
      {/* Tall Cover Image */}
      <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
        {hasImage ? (
          <>
            <Image
              src={profile.coverImageUrl!}
              alt={profile.display_name || 'Photographer'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
              onError={() => setImageError(true)}
            />
            {/* Gradient Overlay for images */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
          </>
        ) : (
          /* Placeholder for profiles without images */
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} flex flex-col items-center justify-center transition-all duration-500 group-hover:scale-105`}>
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <span className="text-4xl font-serif text-white/80">
                {getInitials(profile.display_name)}
              </span>
            </div>
          </div>
        )}
        
        {/* Visibility Badge */}
        {profile.visibility_mode === 'PUBLIC_LOCKED' && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-stone-800/80 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" />
            PIN
          </div>
        )}
        
        {/* Content Overlay - only show for cards with images */}
        {hasImage && (
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
        )}
        
        {/* Content for placeholder cards - at bottom */}
        {!hasImage && (
          <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
            <h3 className="text-lg font-medium text-white mb-1">
              {profile.display_name || 'Photographer'}
            </h3>
            <div className="flex items-center justify-center gap-3 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
