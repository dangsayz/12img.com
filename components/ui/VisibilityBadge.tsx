'use client'

import { Lock, Eye, EyeOff, Shield } from 'lucide-react'

export type VisibilityState = 'public' | 'private' | 'protected' | 'unlocked'

interface VisibilityBadgeProps {
  /** Whether the gallery is publicly visible */
  isPublic: boolean
  /** Whether the gallery has PIN protection (only relevant if public) */
  hasPassword?: boolean
  /** Whether the gallery has been unlocked by the viewer */
  isUnlocked?: boolean
  /** Visual variant */
  variant?: 'badge' | 'icon' | 'overlay' | 'minimal'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional classes */
  className?: string
  /** Show label text */
  showLabel?: boolean
}

/**
 * Reusable visibility indicator component
 * 
 * States:
 * - public: No badge shown (default state)
 * - private: Lock icon with "Private" label (is_public = false)
 * - protected: Lock icon with "Protected" label (is_public = true, has PIN)
 * - unlocked: Unlocked icon (was protected, now unlocked)
 */
export function VisibilityBadge({
  isPublic,
  hasPassword = false,
  isUnlocked = false,
  variant = 'badge',
  size = 'md',
  className = '',
  showLabel = true,
}: VisibilityBadgeProps) {
  // Determine visibility state
  const state: VisibilityState = !isPublic 
    ? 'private' 
    : hasPassword 
      ? (isUnlocked ? 'unlocked' : 'protected')
      : 'public'

  // Don't render anything for public galleries
  if (state === 'public') return null

  // Size mappings
  const sizes = {
    sm: { icon: 'w-3 h-3', text: 'text-[9px]', padding: 'px-2 py-1', circle: 'w-6 h-6' },
    md: { icon: 'w-3.5 h-3.5', text: 'text-[10px]', padding: 'px-2.5 py-1.5', circle: 'w-8 h-8' },
    lg: { icon: 'w-4 h-4', text: 'text-xs', padding: 'px-3 py-2', circle: 'w-10 h-10' },
  }

  // State-specific styling
  const stateStyles = {
    private: {
      bg: 'bg-black/70 backdrop-blur-md',
      text: 'text-white',
      border: '',
      label: 'Private',
      Icon: Lock,
    },
    protected: {
      bg: 'bg-white/90 backdrop-blur-md',
      text: 'text-stone-700',
      border: 'border border-stone-200/50',
      label: 'Protected',
      Icon: Shield,
    },
    unlocked: {
      bg: 'bg-emerald-50/90 backdrop-blur-md',
      text: 'text-emerald-700',
      border: 'border border-emerald-200/50',
      label: 'Unlocked',
      Icon: Eye,
    },
  }

  const style = stateStyles[state]
  const sizeStyle = sizes[size]
  const Icon = style.Icon

  // Render based on variant
  switch (variant) {
    case 'icon':
      // Just the icon, no background
      return (
        <Icon className={`${sizeStyle.icon} ${style.text} ${className}`} />
      )

    case 'overlay':
      // Full overlay with centered icon (for gallery cards)
      return (
        <div className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center ${className}`}>
          <div className={`${sizeStyle.circle} rounded-full bg-white/95 flex items-center justify-center shadow-lg`}>
            <Icon className={`${sizeStyle.icon} text-stone-700`} />
          </div>
        </div>
      )

    case 'minimal':
      // Text only, no background
      return (
        <span className={`${sizeStyle.text} tracking-[0.15em] text-stone-400 uppercase flex items-center gap-1 ${className}`}>
          <Icon className={sizeStyle.icon} />
          {showLabel && style.label}
        </span>
      )

    case 'badge':
    default:
      // Pill badge (default)
      return (
        <div className={`
          ${sizeStyle.padding} ${style.bg} ${style.text} ${style.border}
          rounded-full ${sizeStyle.text} font-medium tracking-wide 
          flex items-center gap-1.5 shadow-lg
          ${className}
        `}>
          <Icon className={sizeStyle.icon} />
          {showLabel && style.label}
        </div>
      )
  }
}

/**
 * Positioned badge for use in image/card overlays
 * Pre-positioned in top-left corner
 */
export function VisibilityBadgeOverlay({
  isPublic,
  hasPassword,
  isUnlocked,
  position = 'top-left',
  size = 'md',
}: Omit<VisibilityBadgeProps, 'variant' | 'className'> & {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}) {
  const positionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-10`}>
      <VisibilityBadge
        isPublic={isPublic}
        hasPassword={hasPassword}
        isUnlocked={isUnlocked}
        variant="badge"
        size={size}
      />
    </div>
  )
}

/**
 * Lock icon indicator for use in image corners
 * Circular white background with lock icon
 */
export function LockIndicator({
  isLocked,
  size = 'md',
  className = '',
}: {
  isLocked: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  if (!isLocked) return null

  const sizes = {
    sm: { circle: 'w-8 h-8', icon: 'w-3 h-3' },
    md: { circle: 'w-10 h-10', icon: 'w-4 h-4' },
    lg: { circle: 'w-12 h-12', icon: 'w-5 h-5' },
  }

  const sizeStyle = sizes[size]

  return (
    <div className={`${sizeStyle.circle} rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm ${className}`}>
      <Lock className={`${sizeStyle.icon} text-stone-600`} />
    </div>
  )
}

/**
 * Full overlay for locked/private galleries
 * Shows blurred overlay with centered lock
 */
export function PrivateOverlay({
  type = 'private',
  size = 'md',
  className = '',
}: {
  type?: 'private' | 'protected'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: { circle: 'w-10 h-10', icon: 'w-4 h-4' },
    md: { circle: 'w-12 h-12', icon: 'w-5 h-5' },
    lg: { circle: 'w-14 h-14', icon: 'w-6 h-6' },
  }

  const sizeStyle = sizes[size]
  const Icon = type === 'private' ? Lock : Shield

  return (
    <div className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center ${className}`}>
      <div className={`${sizeStyle.circle} rounded-full bg-white/95 flex items-center justify-center shadow-lg`}>
        <Icon className={`${sizeStyle.icon} text-stone-700`} />
      </div>
    </div>
  )
}
