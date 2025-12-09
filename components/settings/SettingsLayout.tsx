'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════
// CUSTOM ICONS - Minimal, editorial style
// ═══════════════════════════════════════════════════════════════

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  )
}

function PortfolioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function VendorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 19c0-3 3-5 6-5 1.5 0 3 .5 4 1.5" strokeLinecap="round" />
      <path d="M14 19c0-2 2-3.5 3-3.5s3 1.5 3 3.5" strokeLinecap="round" />
    </svg>
  )
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" strokeLinecap="round" />
    </svg>
  )
}

function BrandingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
      <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  )
}

function NotificationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3c-3 0-5 2-5 5v4l-2 2v1h14v-1l-2-2V8c0-3-2-5-5-5z" />
      <path d="M9 17c0 1.5 1.5 3 3 3s3-1.5 3-3" />
    </svg>
  )
}

function GalleryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DangerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION CONFIG
// ═══════════════════════════════════════════════════════════════

export type SettingsSectionId = 
  | 'profile'
  | 'portfolio'
  | 'vendors'
  | 'account'
  | 'branding'
  | 'notifications'
  | 'gallery'
  | 'danger'

interface SectionConfig {
  id: SettingsSectionId
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export const SETTINGS_SECTIONS: SectionConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Your public presence',
    icon: ProfileIcon,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    description: 'Curate your best work',
    icon: PortfolioIcon,
  },
  {
    id: 'vendors',
    label: 'Vendor Network',
    description: 'Grow your referrals',
    icon: VendorsIcon,
    badge: 'New',
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Plan & billing',
    icon: AccountIcon,
  },
  {
    id: 'branding',
    label: 'Branding',
    description: 'Business identity',
    icon: BrandingIcon,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Email preferences',
    icon: NotificationsIcon,
  },
  {
    id: 'gallery',
    label: 'Gallery Defaults',
    description: 'New gallery settings',
    icon: GalleryIcon,
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    description: 'Destructive actions',
    icon: DangerIcon,
  },
]

// ═══════════════════════════════════════════════════════════════
// SETTINGS LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════

interface SettingsLayoutProps {
  children: React.ReactNode
  sections: {
    id: SettingsSectionId
    content: React.ReactNode
  }[]
}

export function SettingsLayout({ sections }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('profile')
  const [mounted, setMounted] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const tabScrollRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  
  // Swipe gesture
  const dragX = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check URL hash on mount
    const hash = window.location.hash.replace('#', '') as SettingsSectionId
    if (hash && SETTINGS_SECTIONS.some(s => s.id === hash)) {
      setActiveSection(hash)
    }
  }, [])

  // Auto-scroll active tab into view
  useEffect(() => {
    if (mounted && tabScrollRef.current) {
      const activeTab = tabRefs.current.get(activeSection)
      if (activeTab) {
        const container = tabScrollRef.current
        const tabRect = activeTab.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        // Check if tab is out of view
        if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
          activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        }
      }
    }
  }, [activeSection, mounted])

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const handleSectionClick = useCallback((sectionId: SettingsSectionId) => {
    triggerHaptic()
    setActiveSection(sectionId)
    window.history.replaceState(null, '', `#${sectionId}`)
    
    // Scroll content to top on mobile
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [triggerHaptic])

  // Swipe navigation
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    const threshold = 50
    const velocity = info.velocity.x
    const offset = info.offset.x
    
    // Only trigger on significant swipe
    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      const currentIndex = SETTINGS_SECTIONS.findIndex(s => s.id === activeSection)
      
      if (offset > 0 && currentIndex > 0) {
        // Swipe right - go to previous
        triggerHaptic()
        handleSectionClick(SETTINGS_SECTIONS[currentIndex - 1].id)
      } else if (offset < 0 && currentIndex < SETTINGS_SECTIONS.length - 1) {
        // Swipe left - go to next
        triggerHaptic()
        handleSectionClick(SETTINGS_SECTIONS[currentIndex + 1].id)
      }
    }
  }, [activeSection, handleSectionClick, triggerHaptic])

  const currentSection = SETTINGS_SECTIONS.find(s => s.id === activeSection)
  const currentContent = sections.find(s => s.id === activeSection)?.content
  const currentIndex = SETTINGS_SECTIONS.findIndex(s => s.id === activeSection)

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-xl border-b border-stone-200/50">
        <div className="px-5 py-4">
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight">Settings</h1>
        </div>
        
        {/* Mobile Tab Scroll - Enhanced */}
        <div 
          ref={tabScrollRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex px-5 pb-4 gap-3 min-w-max">
            {SETTINGS_SECTIONS.map((section, index) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              const isDanger = section.id === 'danger'
              
              return (
                <motion.button
                  key={section.id}
                  ref={(el) => {
                    if (el) tabRefs.current.set(section.id, el)
                  }}
                  onClick={() => handleSectionClick(section.id)}
                  whileTap={{ scale: 0.95 }}
                  style={{ scrollSnapAlign: 'center' }}
                  className={`
                    flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-medium
                    transition-all duration-200 whitespace-nowrap min-h-[56px]
                    ${isActive 
                      ? isDanger
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                        : 'bg-stone-900 text-white shadow-lg shadow-stone-900/25' 
                      : isDanger
                        ? 'bg-white text-red-500 border border-red-200 active:bg-red-50'
                        : 'bg-white text-stone-600 border border-stone-200 active:bg-stone-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? '' : 'opacity-70'}`} />
                  <span>{section.label}</span>
                  {section.badge && (
                    <span className={`
                      px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide
                      ${isActive ? 'bg-white/20 text-white' : 'bg-stone-900 text-white'}
                    `}>
                      {section.badge}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {SETTINGS_SECTIONS.map((section, index) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={`
                h-1.5 rounded-full transition-all duration-300
                ${index === currentIndex 
                  ? 'w-6 bg-stone-900' 
                  : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                }
              `}
              aria-label={`Go to ${section.label}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="max-w-6xl mx-auto px-6 pt-8 lg:pt-12 pb-24">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h1 className="text-2xl font-semibold text-stone-900 mb-1">Settings</h1>
              <p className="text-sm text-stone-400 mb-8">Manage your account</p>
              
              <nav className="space-y-1">
                {SETTINGS_SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  const isDanger = section.id === 'danger'
                  
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                        transition-colors duration-150 group relative
                        ${isActive 
                          ? isDanger 
                            ? 'bg-red-50 text-red-900' 
                            : 'bg-stone-100 text-stone-900'
                          : isDanger
                            ? 'text-red-600 hover:bg-red-50/50'
                            : 'text-stone-600 hover:bg-stone-50'
                        }
                      `}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full ${
                            isDanger ? 'bg-red-500' : 'bg-stone-900'
                          }`}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      
                      <Icon className={`w-5 h-5 ${isActive ? '' : 'opacity-60 group-hover:opacity-100'}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{section.label}</span>
                          {section.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-stone-900 text-white rounded-full">
                              {section.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${isActive ? 'text-stone-500' : 'text-stone-400'}`}>
                          {section.description}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <main ref={contentRef} className="min-w-0">
            {/* Section Header - Desktop */}
            <div className="mb-8 hidden lg:block">
              <div className="flex items-center gap-3 mb-2">
                {currentSection && (
                  <>
                    <currentSection.icon className="w-6 h-6 text-stone-400" />
                    <h2 className="text-xl font-semibold text-stone-900">
                      {currentSection.label}
                    </h2>
                    {currentSection.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-stone-900 text-white rounded-full">
                        {currentSection.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm text-stone-400">
                {currentSection?.description}
              </p>
            </div>

            {/* Mobile Section Header */}
            <div className="lg:hidden mb-4 px-1">
              <div className="flex items-center gap-2">
                {currentSection && (
                  <>
                    <currentSection.icon className="w-5 h-5 text-stone-400" />
                    <h2 className="text-lg font-semibold text-stone-900">
                      {currentSection.label}
                    </h2>
                  </>
                )}
              </div>
              <p className="text-sm text-stone-400 mt-1">
                {currentSection?.description}
              </p>
            </div>

            {/* Content with Swipe Gestures (Mobile) */}
            <AnimatePresence mode="wait">
              {mounted && (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  className="touch-pan-y"
                >
                  <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden lg:rounded-2xl rounded-xl">
                    {currentContent}
                  </div>
                  
                  {/* Swipe Hint - Mobile Only */}
                  <div className="lg:hidden flex items-center justify-center gap-4 mt-6 text-stone-400">
                    {currentIndex > 0 && (
                      <button 
                        onClick={() => handleSectionClick(SETTINGS_SECTIONS[currentIndex - 1].id)}
                        className="flex items-center gap-1 text-xs hover:text-stone-600 transition-colors active:scale-95"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {SETTINGS_SECTIONS[currentIndex - 1].label}
                      </button>
                    )}
                    {currentIndex < SETTINGS_SECTIONS.length - 1 && (
                      <button 
                        onClick={() => handleSectionClick(SETTINGS_SECTIONS[currentIndex + 1].id)}
                        className="flex items-center gap-1 text-xs hover:text-stone-600 transition-colors active:scale-95"
                      >
                        {SETTINGS_SECTIONS[currentIndex + 1].label}
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
